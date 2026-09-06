import type { Job } from "bullmq";
import type { KkaPrismaClient } from "@kka/database";

export async function processCalendar(job: Job, prisma: KkaPrismaClient) {
  if (job.name !== "calendar.sync") return;
  const eventId = String(job.data.eventId);
  const event = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Calendar event not found");

  const connection = await prisma.integrationConnection.findFirst({
    where: {
      firmId: event.firmId,
      kind: { in: ["GOOGLE_WORKSPACE", "MICROSOFT_365"] },
      enabled: true
    }
  });
  if (!connection) {
    await prisma.calendarEvent.update({ where: { id: eventId }, data: { syncState: "NOT_CONFIGURED" } });
    return { synced: false, reason: "No calendar integration configured" };
  }

  await prisma.calendarEvent.update({ where: { id: eventId }, data: { syncState: "ADAPTER_NOT_IMPLEMENTED" } });
  return {
    synced: false,
    reason: `${connection.kind} calendar adapter is intentionally not faked in this package`
  };
}
