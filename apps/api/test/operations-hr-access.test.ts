import test from "node:test";
import assert from "node:assert/strict";
import { BadRequestException } from "@nestjs/common";
import { OperationsService } from "../src/modules/operations/operations.service";

test("HR records reject a user outside the active firm before reading restricted personnel data", async () => {
  let restrictedReads = 0;
  const service = new OperationsService({ client: {
    user: { count: async () => 0 },
    employeeProfile: { findUnique: async () => { restrictedReads += 1; } },
    hrLifecycleChecklistItem: { findMany: async () => { restrictedReads += 1; } },
    employeeAppraisal: { findMany: async () => { restrictedReads += 1; } },
    cpdRecord: { findMany: async () => { restrictedReads += 1; } },
    advocateCredential: { findMany: async () => { restrictedReads += 1; } },
    leaveBalance: { findMany: async () => { restrictedReads += 1; } },
    hrRestrictedNote: { findMany: async () => { restrictedReads += 1; } },
    staffDocument: { findMany: async () => { restrictedReads += 1; } }
  } } as any, {} as any, {} as any, {} as any);

  await assert.rejects(() => service.hrRecords("firm-1", "outside-user"), (error: unknown) => error instanceof BadRequestException);
  assert.equal(restrictedReads, 0);
});

test("staff-document records are explicitly manual metadata and include an audit reference", async () => {
  let createData: any;
  const service = new OperationsService({ client: {
    user: { count: async () => 1 },
    staffDocument: { create: async ({ data }: any) => { createData = data; return { id: "staff-document-1", ...data }; } }
  } } as any, { record: async () => ({ id: "audit-1" }) } as any, {} as any, {} as any);

  const result = await service.recordStaffDocument("firm-1", "hr-1", "employee-1", {
    category: "ID", title: "National ID checked", externalReference: "HR cabinet 4"
  });
  assert.equal(createData.storageState, "MANUAL");
  assert.equal(result.document.storageState, "MANUAL");
  assert.equal(result.auditRef, "audit-1");
});

test("leave balances require an active firm policy before they can be persisted", async () => {
  let writes = 0;
  const service = new OperationsService({ client: {
    user: { count: async () => 1 },
    leavePolicy: { findFirst: async () => null },
    leaveBalance: { upsert: async () => { writes += 1; } }
  } } as any, {} as any, {} as any, {} as any);

  await assert.rejects(() => service.upsertLeaveBalance("firm-1", "hr-1", "employee-1", { policyKey: "ANNUAL", year: 2026 }), BadRequestException);
  assert.equal(writes, 0);
});
