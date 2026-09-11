import type { Job } from "bullmq";
import type { KkaPrismaClient } from "@kka/database";

export async function recipientCanReceiveNotification(
  prisma: KkaPrismaClient,
  recipientUserId: string,
  matterId?: string | null
) {
  const recipient = await prisma.user.findUnique({
    where: { id: recipientUserId },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
  });
  if (!recipient || recipient.status !== "ACTIVE") return false;
  if (!matterId) return true;

  const permissionKeys = new Set(recipient.roles.flatMap((membership) =>
    membership.role.active && membership.role.firmId === recipient.firmId
      ? membership.role.permissions.map(({ permission }) => permission.key)
      : []
  ));
  if (permissionKeys.has("matter.access_manage")) return true;

  const memberships = await prisma.userTeam.findMany({ where: { userId: recipient.id }, select: { teamId: true } });
  const matter = await prisma.matter.findFirst({
    where: {
      id: matterId,
      firmId: recipient.firmId,
      OR: [
        { accesses: { none: {} } },
        { accesses: { some: { userId: recipient.id } } },
        ...(memberships.length ? [{ accesses: { some: { teamId: { in: memberships.map(({ teamId }) => teamId) } } } }] : [])
      ]
    },
    select: { id: true }
  });
  return Boolean(matter);
}

export async function processNotification(job: Job, prisma: KkaPrismaClient) {
  if (job.name !== "notification.deliver") return;
  const deliveryId = String(job.data.deliveryId);
  const delivery = await prisma.notificationDelivery.findUnique({
    where: { id: deliveryId },
    include: { notification: true }
  });
  if (!delivery) throw new Error("Notification delivery not found");

  if (!await recipientCanReceiveNotification(prisma, delivery.notification.recipientUserId, delivery.notification.matterId)) {
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { status: "CANCELLED", lastError: "Recipient no longer has access to this matter or is inactive" }
    });
    return { cancelled: true, reason: "recipient_access_revoked" };
  }

  if (delivery.channel === "EMAIL") {
    const recipient = await prisma.user.findUnique({
      where: { id: delivery.notification.recipientUserId }
    });
    if (!recipient) throw new Error("Notification recipient user not found");
    const sender = await prisma.senderIdentity.findFirst({
      where: {
        integration: {
          firmId: recipient.firmId,
          kind: "SMTP",
          enabled: true,
          status: { in: ["CONFIGURED", "HEALTHY"] }
        },
        active: true
      },
      include: { integration: true }
    });
    if (!sender) throw new Error("No active SMTP sender identity configured");

    const mail = await prisma.mailMessage.create({
      data: {
        firmId: recipient.firmId,
        senderIdentityId: sender.id,
        direction: "OUTBOUND",
        subject: delivery.notification.title,
        bodyText: delivery.notification.message,
        fromAddress: sender.email,
        matterId: delivery.notification.matterId,
        queuedAt: new Date(),
        recipients: { create: [{ type: "TO", address: recipient.email }] },
        deliveries: { create: [{ status: "QUEUED" }] }
      }
    });

    // Notification worker does not recursively enqueue. A repeat/scheduler can enqueue this
    // MailMessage, or deployments can route EMAIL notification creation directly to mail queue.
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "DEFERRED",
        attempts: { increment: 1 },
        lastError: `Email converted to MailMessage ${mail.id}; queue handoff required`
      }
    });
    return { mailMessageId: mail.id, deferred: true };
  }

  if (delivery.channel === "SMS" || delivery.channel === "WHATSAPP" || delivery.channel === "PUSH") {
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "FAILED",
        attempts: { increment: 1 },
        lastError: `${delivery.channel} live adapter is not implemented in this backend package`
      }
    });
    return { implemented: false, channel: delivery.channel };
  }

  return;
}
