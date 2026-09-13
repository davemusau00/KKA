import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { PortalService } from "../src/modules/portal/portal.service";

const grant = {
  id: "grant-1",
  firmId: "firm-1",
  clientId: "client-1",
  matterId: "matter-permitted",
  status: "ACTIVE",
  permissions: ["matter.summary", "calendar.upcoming"],
  expiresAt: null
};

function service(overrides: Record<string, unknown> = {}) {
  const prisma = {
    client: {
      portalAccessGrant: { findUnique: async () => grant },
      client: { findUnique: async () => ({ id: "client-1", displayName: "Client" }) },
      matter: { findMany: async () => [] },
      document: { findFirst: async () => null },
      ...overrides
    }
  };
  return { prisma, portal: new PortalService(prisma as never, {} as never, {} as never, {} as never) };
}

test("matter-specific portal summaries query only the explicitly granted matter and omit ungranted resource types", async () => {
  let where: unknown;
  let select: Record<string, unknown> | undefined;
  const { portal } = service({
    matter: {
      findMany: async (args: { where: unknown; select: Record<string, unknown> }) => {
        where = args.where;
        select = args.select;
        return [];
      }
    }
  });

  await portal.publicSummary("portal-token");

  assert.deepEqual(where, { firmId: "firm-1", clientId: "client-1", id: "matter-permitted" });
  assert.ok(select?.calendarEvents);
  assert.equal(select?.documents, undefined);
});

test("a portal grant without matter-summary permission returns no matter data", async () => {
  const { portal } = service({
    portalAccessGrant: { findUnique: async () => ({ ...grant, permissions: ["documents.portal_visible"] }) },
    matter: { findMany: async () => { throw new Error("must not query matters"); } }
  });

  const result = await portal.publicSummary("portal-token");
  assert.deepEqual(result.matters, []);
});

test("portal document access requires document permission and keeps the granted matter in the storage query", async () => {
  const noDocuments = service();
  await assert.rejects(() => noDocuments.portal.publicDocument("portal-token", "document-other-matter"), ForbiddenException);

  let where: unknown;
  const permitted = service({
    portalAccessGrant: { findUnique: async () => ({ ...grant, permissions: ["documents.portal_visible"] }) },
    document: {
      findFirst: async (args: { where: unknown }) => {
        where = args.where;
        return null;
      }
    }
  });

  await assert.rejects(() => permitted.portal.publicDocument("portal-token", "document-other-matter"), NotFoundException);
  assert.deepEqual(where, {
    id: "document-other-matter",
    portalVisible: true,
    matter: { firmId: "firm-1", clientId: "client-1", id: "matter-permitted" }
  });
});

test("portal grant revocation rejects a grant outside the administrator's matter visibility before mutation", async () => {
  let updated = false;
  const { portal } = service({
    portalAccessGrant: { findFirst: async () => grant, update: async () => { updated = true; } },
    matter: { findFirst: async () => null }
  });
  (portal as unknown as { access: { matterWhere: () => Promise<Record<string, unknown>> } }).access = { matterWhere: async () => ({ firmId: "firm-1", id: "matter-visible" }) };

  await assert.rejects(() => portal.revoke("firm-1", "admin-1", { id: "admin-1" } as never, "grant-1"), NotFoundException);
  assert.equal(updated, false);
});
