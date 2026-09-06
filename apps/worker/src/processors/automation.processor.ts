import type { Job } from "bullmq";
import type { KkaPrismaClient } from "@kka/database";

export async function processAutomation(job: Job, prisma: KkaPrismaClient) {
  if (job.name !== "automation.run") return;
  const runId = String(job.data.runId);
  const run = await prisma.automationRun.findUnique({ where: { id: runId }, include: { rule: true } });
  if (!run) throw new Error("Automation run not found");

  await prisma.automationRun.update({
    where: { id: runId },
    data: { status: "RUNNING", startedAt: new Date() }
  });

  // The rule engine intentionally supports only declarative, whitelisted actions.
  // Arbitrary user-provided code is never executed.
  const actions = Array.isArray(run.rule.actions) ? run.rule.actions as any[] : [];
  const results: any[] = [];
  for (const action of actions) {
    if (action.type === "CREATE_NOTIFICATION") {
      const notification = await prisma.notification.create({
        data: {
          recipientUserId: String(action.recipientUserId),
          matterId: action.matterId ? String(action.matterId) : undefined,
          category: String(action.category ?? "automation"),
          title: String(action.title),
          message: String(action.message),
          urgency: String(action.urgency ?? "NORMAL")
        }
      });
      results.push({ action: action.type, notificationId: notification.id });
    } else {
      results.push({ action: action.type, skipped: true, reason: "Action is not in the worker whitelist" });
    }
  }

  await prisma.automationRun.update({
    where: { id: runId },
    data: { status: "SUCCEEDED", finishedAt: new Date(), result: results }
  });
  return results;
}
