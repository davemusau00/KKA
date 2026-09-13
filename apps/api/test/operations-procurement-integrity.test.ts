import test from "node:test";
import assert from "node:assert/strict";
import { BadRequestException } from "@nestjs/common";
import { OperationsService } from "../src/modules/operations/operations.service";
import type { RequestUser } from "../src/platform/auth/auth.types";

const operationsUser: RequestUser = { id: "user-1", firmId: "firm-1", email: "user@example.test", fullName: "User", homeBranchId: null, roleKeys: ["administrator"], permissions: ["module.operations", "operations.manage"] };

test("a receipt retry returns the original order and does not write another receipt", async () => {
  let orderReads = 0;
  const order = { id: "order-1", firmId: "firm-1", vendor: { id: "vendor-1" } };
  const service = new OperationsService({ client: {
    purchaseReceipt: { findUnique: async () => ({ id: "receipt-1", purchaseOrderId: "order-1", purchaseOrder: order }) },
    purchaseOrder: { findFirst: async () => { orderReads += 1; return order; } }
  } } as any, {} as any, {} as any, {} as any);

  const result = await service.receivePurchaseOrder("firm-1", "user-1", "order-1", {
    partial: false, deliveryReference: "GRN-001", idempotencyKey: "2a8326bc-6b61-4c79-a86d-c5db39694d55"
  });
  assert.equal(result.order.id, "order-1");
  assert.equal(result.receipt.id, "receipt-1");
  assert.equal(orderReads, 0);
});

test("asset status cannot be changed while a custody assignment remains open", async () => {
  let updates = 0;
  const service = new OperationsService({ client: {
    asset: { findFirst: async () => ({ id: "asset-1", firmId: "firm-1", status: "ASSIGNED", notes: null }), update: async () => { updates += 1; } },
    assetAssignment: { findFirst: async () => ({ id: "assignment-1" }) }
  } } as any, {} as any, {} as any, {} as any);

  await assert.rejects(() => service.updateAssetStatus("firm-1", "user-1", "asset-1", { status: "REPAIR" }), BadRequestException);
  assert.equal(updates, 0);
});

test("vendor compliance metadata cannot be written against a vendor outside the firm", async () => {
  let creates = 0;
  const service = new OperationsService({ client: {
    vendor: { findFirst: async () => null },
    vendorDocument: { create: async () => { creates += 1; } }
  } } as any, {} as any, {} as any, {} as any);

  await assert.rejects(() => service.recordVendorDocument("firm-1", "user-1", "outside-vendor", { category: "KRA", title: "Tax certificate" }), /Vendor not found/);
  assert.equal(creates, 0);
});

test("meeting action completion rejects an action outside the firm before mutation", async () => {
  let updates = 0;
  const service = new OperationsService({ client: {
    meetingAction: { findFirst: async () => null, update: async () => { updates += 1; } }
  } } as any, {} as any, {} as any, {} as any);

  await assert.rejects(() => service.completeMeetingAction("firm-1", "user-1", "outside-action"), /Meeting action not found/);
  assert.equal(updates, 0);
});

test("meeting attendance accepts only an existing firm participant", async () => {
  let updates = 0;
  const service = new OperationsService({ client: {
    meeting: { findFirst: async () => ({ id: "meeting-1", firmId: "firm-1", matterId: null }) },
    user: { count: async () => 1 },
    meetingParticipant: { findUnique: async () => null, update: async () => { updates += 1; } }
  } } as any, {} as any, {} as any, {} as any);

  await assert.rejects(() => service.setMeetingAttendance("firm-1", "user-1", "meeting-1", "user-2", "PRESENT"), /not a meeting participant/);
  assert.equal(updates, 0);
});

test("project matter links reject a restricted matter before creating the link", async () => {
  let writes = 0;
  const service = new OperationsService({ client: {
    internalProject: { findFirst: async () => ({ id: "project-1", firmId: "firm-1" }) },
    matter: { findFirst: async () => null },
    projectMatterLink: { upsert: async () => { writes += 1; } }
  } } as any, {} as any, {} as any, {} as any, { matterWhere: async () => ({ firmId: "firm-1", accesses: { some: { userId: "user-1" } } }) } as any);

  await assert.rejects(() => service.linkProjectMatter(operationsUser, operationsUser.id, "project-1", "restricted-matter"), /Matter not found/);
  assert.equal(writes, 0);
});

test("creating an asset from a receipt reuses the asset already linked to that receipt", async () => {
  let creates = 0;
  const existingAsset = { id: "asset-1", purchaseReceiptId: "receipt-1" };
  const service = new OperationsService({ client: {
    purchaseReceipt: { findFirst: async () => ({ id: "receipt-1", firmId: "firm-1", asset: existingAsset, purchaseOrder: { id: "order-1", branchId: "branch-1", amount: 100 } }) },
    asset: { create: async () => { creates += 1; } }
  } } as any, {} as any, {} as any, {} as any);

  const result = await service.createAssetFromReceipt("firm-1", "user-1", "receipt-1", { category: "ICT", name: "Laptop" });
  assert.equal(result.asset.id, "asset-1");
  assert.equal(creates, 0);
});

test("receipt expense creation requires the separate finance-expense permission", async () => {
  let receiptReads = 0;
  const noFinanceUser = { ...operationsUser, permissions: ["procurement.manage"] };
  const service = new OperationsService({ client: {
    purchaseReceipt: { findFirst: async () => { receiptReads += 1; return null; } }
  } } as any, {} as any, {} as any, {} as any);

  await assert.rejects(() => service.createExpenseFromReceipt(noFinanceUser, noFinanceUser.id, "receipt-1", { category: "Office", paymentSource: "OFFICE_FUNDS" }), /Finance expense permission/);
  assert.equal(receiptReads, 0);
});
