import test from "node:test";
import assert from "node:assert/strict";
import { NotFoundException } from "@nestjs/common";
import { PersonalInjuryService } from "../src/modules/personal-injury/personal-injury.service";

function fixture(canView: boolean) {
  const calls: any[] = [];
  const prisma = {
    client: {
      matter: { findFirst: async () => ({ id: "matter-1", firmId: "firm-1", practiceArea: "Personal Injury" }) },
      user: {
        findFirst: async () => ({
          id: "user-1", firmId: "firm-1", email: "user@example.test", fullName: "User One", homeBranchId: null,
          roles: [{ role: { firmId: "firm-1", key: "advocate", active: true, permissions: [{ permission: { key: "matter.view" } }] } }]
        })
      },
      personalInjuryCase: {
        upsert: async () => ({ id: "pi-1", matterId: "matter-1" }),
        findUnique: async () => ({ id: "pi-1", matterId: "matter-1", judgment: null, liability: null })
      },
      piJudgmentAward: {
        upsert: async (args: any) => { calls.push(args); return { id: "judgment-1", totalAward: 1250 }; }
      }
    }
  };
  const audit = { record: async (event: any) => calls.push({ audit: event }) };
  const access = { canViewMatter: async () => canView };
  return { service: new PersonalInjuryService(prisma as any, audit as any, access as any), calls };
}

test("PI reads reject a matter outside the shared record-access policy", async () => {
  const { service } = fixture(false);
  await assert.rejects(
    service.get("firm-1", "user-1", "matter-1"),
    (error: unknown) => error instanceof NotFoundException && error.message === "Matter not found"
  );
});

test("PI reads are allowed only after shared record access succeeds", async () => {
  const { service } = fixture(true);
  const record = await service.get("firm-1", "user-1", "matter-1");
  assert.equal(record.matterId, "matter-1");
});

test("judgment writes preserve the persisted field contract and audit the mutation", async () => {
  const { service, calls } = fixture(true);
  const row = await service.updateJudgment("firm-1", "user-1", "matter-1", {
    judgmentDate: "2026-09-11",
    liabilityClaimantPercent: 20,
    liabilityDefendantPercent: 80,
    costsAwarded: 1000,
    interestRatePercent: 12,
    recoveryTriggered: false,
    totalAward: 1250
  });
  assert.equal(row.totalAward, 1250);
  const write = calls.find((call) => call.where?.personalInjuryId === "pi-1");
  assert.equal(write.create.liabilityPercent, 80);
  assert.equal(write.create.liabilityClaimantPercent, 20);
  assert.equal(write.create.liabilityDefendantPercent, 80);
  assert.equal(write.create.costsAmount, 1000);
  assert.equal(write.create.interestRatePercent, 12);
  assert.equal(write.create.recoveryTriggered, false);
  assert.equal(calls.some((call) => call.audit?.action === "pi.judgment_updated"), true);
});
