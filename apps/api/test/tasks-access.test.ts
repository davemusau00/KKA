import test from "node:test";
import assert from "node:assert/strict";
import { NotFoundException } from "@nestjs/common";
import { TasksService } from "../src/modules/tasks/tasks.service";

const actor = { id: "actor-1", firmId: "firm-1", status: "ACTIVE", email: "actor@example.test", fullName: "Actor", homeBranchId: null, roles: [] };
const restrictedTask = { id: "task-1", matterId: "matter-restricted", status: "TODO", dependencies: [] };

function service(canViewMatter: boolean, client: Record<string, unknown>) {
  return new TasksService({ client: { user: { findFirst: async () => actor }, ...client } } as any, {} as any, {
    canViewMatter: async () => canViewMatter,
    matterWhere: async () => ({ firmId: "firm-1" })
  } as any);
}

test("task creation rejects a restricted matter before assignee or task persistence", async () => {
  let assigneeReads = 0;
  let creates = 0;
  const tasks = service(false, {
    user: { findFirst: async () => { assigneeReads += 1; return actor; } },
    task: { create: async () => { creates += 1; return {}; } }
  });

  await assert.rejects(
    () => tasks.create("firm-1", "actor-1", { matterId: "matter-restricted", title: "Restricted task", assignedToId: "actor-1", dueAt: "2026-09-30T10:00:00.000Z" }),
    (error: unknown) => error instanceof NotFoundException
  );
  assert.equal(assigneeReads, 1);
  assert.equal(creates, 0);
});

test("task status, update, and archive reject restricted matter tasks before mutation", async () => {
  let updates = 0;
  const tasks = service(false, {
    task: {
      findFirst: async () => restrictedTask,
      update: async () => { updates += 1; return restrictedTask; }
    }
  });

  for (const operation of [
    () => tasks.setStatus("firm-1", "actor-1", "task-1", { status: "COMPLETED" }),
    () => tasks.update("firm-1", "actor-1", "task-1", { title: "Changed" }),
    () => tasks.archive("firm-1", "actor-1", "task-1")
  ]) {
    await assert.rejects(operation, (error: unknown) => error instanceof NotFoundException);
  }
  assert.equal(updates, 0);
});

test("task creation rejects dependencies outside the accessible matter before creating a task", async () => {
  let creates = 0;
  const tasks = service(true, {
    task: {
      findMany: async () => [{ id: "dependency-visible" }],
      create: async () => { creates += 1; return {}; }
    }
  });

  await assert.rejects(
    () => tasks.create("firm-1", "actor-1", {
      matterId: "matter-visible", title: "Task with inaccessible dependency", assignedToId: "actor-1",
      dueAt: "2026-09-30T10:00:00.000Z", dependencyIds: ["dependency-visible", "dependency-restricted"]
    }),
    /dependencies are inaccessible/
  );
  assert.equal(creates, 0);
});
