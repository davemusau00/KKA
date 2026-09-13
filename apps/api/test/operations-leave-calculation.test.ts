import test from "node:test";
import assert from "node:assert/strict";
import { BadRequestException } from "@nestjs/common";
import { OperationsService } from "../src/modules/operations/operations.service";

function leaveService() {
  const writes: any[] = [];
  const service = new OperationsService({ client: {
    user: { findFirst: async () => ({ id: "user-1" }) },
    leaveRequest: {
      findFirst: async () => null,
      create: async (input: any) => { writes.push(input); return { id: "leave-1", ...input.data, startsOn: input.data.startsOn, endsOn: input.data.endsOn }; }
    }
  } } as any, { record: async () => ({ id: "audit-1" }) } as any, {} as any, {} as any);
  return { service, writes };
}

test("leave requests calculate inclusive weekdays on the server instead of accepting caller days", async () => {
  const { service, writes } = leaveService();
  await service.requestLeave("firm-1", "user-1", {
    type: "Annual Leave",
    startsOn: "2026-09-11T00:00:00.000Z",
    endsOn: "2026-09-15T23:59:59.000Z"
  });
  assert.equal(writes[0].data.days, 3);
});

test("leave requests consisting only of a weekend are rejected before persistence", async () => {
  const { service, writes } = leaveService();
  await assert.rejects(() => service.requestLeave("firm-1", "user-1", {
    type: "Annual Leave",
    startsOn: "2026-09-12T00:00:00.000Z",
    endsOn: "2026-09-13T23:59:59.000Z"
  }), BadRequestException);
  assert.equal(writes.length, 0);
});
