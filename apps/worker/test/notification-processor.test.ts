import test from "node:test";
import assert from "node:assert/strict";
import { processNotification, recipientCanReceiveNotification } from "../src/processors/notification.processor";

const job = { name: "notification.deliver", data: { deliveryId: "delivery-1" } } as any;

function userRecord() {
  return {
    id: "user-1", firmId: "firm-1", status: "ACTIVE", email: "user@example.test",
    roles: [{ role: { firmId: "firm-1", active: true, permissions: [{ permission: { key: "matter.view" } }] } }]
  };
}

test("worker recipient policy excludes a restricted matter", async () => {
  const prisma = {
    user: { findUnique: async () => userRecord() },
    userTeam: { findMany: async () => [] },
    matter: { findFirst: async () => null }
  } as any;
  assert.equal(await recipientCanReceiveNotification(prisma, "user-1", "matter-restricted"), false);
});

test("worker cancels queued external delivery after matter access is revoked", async () => {
  let mailCreates = 0;
  let updates: any[] = [];
  const prisma = {
    notificationDelivery: {
      findUnique: async () => ({
        id: "delivery-1", channel: "EMAIL", notification: {
          recipientUserId: "user-1", matterId: "matter-restricted", title: "Restricted", message: "Do not send"
        }
      }),
      update: async (args: any) => { updates.push(args); return args; }
    },
    user: { findUnique: async () => userRecord() },
    userTeam: { findMany: async () => [] },
    matter: { findFirst: async () => null },
    senderIdentity: { findFirst: async () => ({ id: "sender-1" }) },
    mailMessage: { create: async () => { mailCreates += 1; return { id: "mail-1" }; } }
  } as any;

  const result = await processNotification(job, prisma);
  assert.deepEqual(result, { cancelled: true, reason: "recipient_access_revoked" });
  assert.equal(mailCreates, 0);
  assert.equal(updates[0].data.status, "CANCELLED");
});
