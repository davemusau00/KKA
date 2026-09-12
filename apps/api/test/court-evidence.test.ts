import test from "node:test";
import assert from "node:assert/strict";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CourtService } from "../src/modules/court/court.service";
import type { RequestUser } from "../src/platform/auth/auth.types";

const user: RequestUser = { id: "user-1", firmId: "firm-1", email: "court@example.test", fullName: "Court User", homeBranchId: null, roleKeys: ["court_clerk"], permissions: ["court.filing_manage", "court.service_manage"] };
const filing = { id: "filing-1", matterId: "matter-1", documentId: null, documentVersionId: null, filingMethod: null, filingReference: null, status: "READY_TO_FILE" };
const serviceRecord = { id: "service-1", matterId: "matter-1", affidavitDocumentId: null, affidavitStatus: "AWAITED", substituteServiceOrderDocumentId: null, returnedService: false, nextAction: null, nextDeadlineId: null, status: "REQUESTED" };

function service(canView = true, client: Record<string, unknown> = {}) {
  return new CourtService({ client } as any, { record: async () => undefined } as any, { canViewMatter: async () => canView, matterWhere: async () => ({ firmId: "firm-1" }) } as any);
}

test("filing submission rejects a status transition without document, version, method, and reference evidence", async () => {
  let updates = 0;
  const court = service(true, { courtFilingPackage: { findFirst: async () => filing, update: async () => { updates += 1; return {}; } } });
  await assert.rejects(() => court.transitionFiling(user, "filing-1", { action: "SUBMIT", submittedAt: "2026-09-30T08:00:00.000Z", filingReference: "CTS-1" }), (error: unknown) => error instanceof BadRequestException);
  assert.equal(updates, 0);
});

test("filing acceptance requires a court receipt document and persists verified acceptance only after evidence checks", async () => {
  let updateData: any;
  const ready = { ...filing, documentId: "document-1", documentVersionId: "version-1", filingMethod: "CTS", filingReference: "CTS-1", status: "SUBMITTED" };
  const court = service(true, {
    courtFilingPackage: { findFirst: async () => ready, update: async ({ data }: any) => { updateData = data; return { ...ready, ...data }; } },
    document: { findFirst: async () => ({ id: "receipt-document" }) }
  });
  const result = await court.transitionFiling(user, "filing-1", { action: "ACCEPT", acceptedAt: "2026-09-30T10:00:00.000Z", courtReceiptDocumentId: "receipt-document" });
  assert.equal(result.status, "ACCEPTED");
  assert.equal(updateData.courtReceiptDocumentId, "receipt-document");
  assert.equal(updateData.verifiedById, user.id);
});

test("service cannot be marked served without an affidavit evidence document", async () => {
  const court = service(true, { serviceRecord: { findUnique: async () => serviceRecord } });
  await assert.rejects(() => court.addServiceAttempt(user, "service-1", { attemptedAt: "2026-09-30T08:00:00.000Z", outcome: "Delivered", served: true }), (error: unknown) => error instanceof BadRequestException);
});

test("restricted matter filing transition is rejected before an evidence or status write", async () => {
  let updates = 0;
  const court = service(false, { courtFilingPackage: { findFirst: async () => filing, update: async () => { updates += 1; return {}; } } });
  await assert.rejects(() => court.transitionFiling(user, "filing-1", { action: "REJECT", rejectedAt: "2026-09-30T08:00:00.000Z", reason: "Rejected" }), (error: unknown) => error instanceof NotFoundException);
  assert.equal(updates, 0);
});
