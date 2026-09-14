import test from "node:test";
import assert from "node:assert/strict";
import { calculateRRuleOccurrences, OperationsService } from "../src/modules/operations/operations.service";
import type { RequestUser } from "../src/platform/auth/auth.types";

const mockUser: RequestUser = {
  id: "user-1",
  firmId: "firm-1",
  email: "admin@example.test",
  fullName: "Operations Admin",
  homeBranchId: "branch-1",
  roleKeys: ["managing_partner"],
  permissions: ["operations.manage", "module.operations"]
};

test("calculateRRuleOccurrences calculates daily occurrences within horizon", () => {
  const start = new Date("2026-09-01T10:00:00.000Z");
  const dates = calculateRRuleOccurrences("FREQ=DAILY;INTERVAL=1;COUNT=5", start, 30);
  assert.equal(dates.length, 5);
  assert.equal(dates[0].toISOString(), "2026-09-01T10:00:00.000Z");
  assert.equal(dates[1].toISOString(), "2026-09-02T10:00:00.000Z");
  assert.equal(dates[4].toISOString(), "2026-09-05T10:00:00.000Z");
});

test("calculateRRuleOccurrences calculates weekly occurrences on specified days", () => {
  // 2026-09-07 is Monday
  const start = new Date("2026-09-07T09:00:00.000Z");
  const dates = calculateRRuleOccurrences("FREQ=WEEKLY;INTERVAL=1;COUNT=4", start, 30);
  assert.equal(dates.length, 4);
  assert.equal(dates[0].toISOString(), "2026-09-07T09:00:00.000Z");
  assert.equal(dates[1].toISOString(), "2026-09-14T09:00:00.000Z");
  assert.equal(dates[2].toISOString(), "2026-09-21T09:00:00.000Z");
  assert.equal(dates[3].toISOString(), "2026-09-28T09:00:00.000Z");
});

test("calculateRRuleOccurrences respects UNTIL limit", () => {
  const start = new Date("2026-09-01T08:00:00.000Z");
  const until = new Date("2026-09-15T08:00:00.000Z");
  const dates = calculateRRuleOccurrences(`FREQ=WEEKLY;INTERVAL=1`, start, 60, until);
  assert.equal(dates.length, 3); // Sep 1, Sep 8, Sep 15
});

test("getProjectFinancials accurately derives committed, actual, and health status", async () => {
  const prisma = {
    client: {
      internalProject: {
        findFirst: async () => ({
          id: "proj-1",
          firmId: "firm-1",
          name: "ERP Implementation",
          budget: 1000000,
          milestones: [],
          spend: [
            { id: "sp-1", amount: 200000, source: "FINANCE_POSTED", occurredAt: new Date() },
            { id: "sp-2", amount: 50000, source: "MANUAL", occurredAt: new Date() }
          ]
        })
      },
      expenseRequest: {
        findMany: async ({ where }: any) => {
          if (where.status === "APPROVED") {
            return [{ id: "exp-1", amount: 150000 }];
          }
          if (where.status?.in) {
            return [{ id: "exp-2", amount: 100000 }];
          }
          return [];
        }
      },
      purchaseRequisition: {
        findMany: async () => [{ id: "req-1", amount: 50000 }]
      },
      purchaseOrder: {
        findMany: async () => [{ id: "po-1", amount: 200000 }]
      }
    }
  };

  const ops = new OperationsService(
    prisma as any,
    { record: async () => ({ id: "audit-1" }) } as any,
    {} as any,
    {} as any
  );

  const financials = await ops.getProjectFinancials(mockUser, "proj-1");

  assert.equal(financials.budget, 1000000);
  // Committed = approved expenses (150k) + approved requisitions (50k) + approved orders (200k) = 400k
  assert.equal(financials.committed, 400000);
  // Actual = disbursed/paid expenses (100k) + posted spend (200k) = 300k
  assert.equal(financials.actual, 300000);
  // Manual unverified = 50k
  assert.equal(financials.manualUnverified, 50000);
  // Forecast = actual (300k) + committed (400k) + manual (50k) = 750k
  assert.equal(financials.forecast, 750000);
  // Utilization = (300k + 400k) / 1M = 70%
  assert.equal(financials.utilizationPercent, 70);
  assert.equal(financials.healthStatus, "on_track");
});

test("getProjectFinancials marks healthStatus at_risk when utilization exceeds 85%", async () => {
  const prisma = {
    client: {
      internalProject: {
        findFirst: async () => ({
          id: "proj-2",
          firmId: "firm-1",
          name: "Court Relocation",
          budget: 100000,
          milestones: [],
          spend: [{ id: "sp-1", amount: 50000, source: "FINANCE_POSTED", occurredAt: new Date() }]
        })
      },
      expenseRequest: {
        findMany: async ({ where }: any) => {
          if (where.status === "APPROVED") return [{ id: "exp-1", amount: 40000 }];
          return [];
        }
      },
      purchaseRequisition: { findMany: async () => [] },
      purchaseOrder: { findMany: async () => [] }
    }
  };

  const ops = new OperationsService(
    prisma as any,
    { record: async () => ({ id: "audit-1" }) } as any,
    {} as any,
    {} as any
  );

  const financials = await ops.getProjectFinancials(mockUser, "proj-2");
  // Total actual + committed = 50k + 40k = 90k (90% > 85%)
  assert.equal(financials.utilizationPercent, 90);
  assert.equal(financials.healthStatus, "at_risk");
});
