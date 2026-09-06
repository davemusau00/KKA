import type { Job } from "bullmq";
import nodemailer from "nodemailer";
import type { KkaPrismaClient } from "@kka/database";
import { decryptSecret } from "../crypto";

export async function processMail(job: Job, prisma: KkaPrismaClient) {
  if (job.name !== "mail.send") return;

  const messageId = String(job.data.messageId);
  const integrationConnectionId = String(job.data.integrationConnectionId);
  const message = await prisma.mailMessage.findUnique({
    where: { id: messageId },
    include: {
      senderIdentity: true,
      recipients: true,
      deliveries: true
    }
  });
  if (!message || !message.senderIdentity) throw new Error("Mail message or sender identity not found");

  const integration = await prisma.integrationConnection.findUnique({
    where: { id: integrationConnectionId },
    include: { secret: true }
  });
  if (!integration || integration.kind !== "SMTP" || !integration.enabled || !integration.secret) {
    throw new Error("Live SMTP integration is not configured/enabled");
  }

  const cfg = integration.publicConfig as any;
  const secret = decryptSecret<{ username?: string; password?: string }>(integration.secret);
  const transporter = nodemailer.createTransport({
    host: String(cfg.host),
    port: Number(cfg.port ?? 587),
    secure: Boolean(cfg.secure ?? false),
    auth: secret.username || secret.password ? { user: secret.username, pass: secret.password } : undefined,
    pool: true,
    maxConnections: Number(cfg.maxConnections ?? 3),
    maxMessages: Number(cfg.maxMessagesPerConnection ?? 100)
  });

  const to = message.recipients.filter((r) => r.type === "TO").map((r) => r.address);
  const cc = message.recipients.filter((r) => r.type === "CC").map((r) => r.address);
  const bcc = message.recipients.filter((r) => r.type === "BCC").map((r) => r.address);

  const info = await transporter.sendMail({
    from: `${message.senderIdentity.displayName} <${message.senderIdentity.email}>`,
    replyTo: message.senderIdentity.replyTo ?? undefined,
    to, cc, bcc,
    subject: message.subject,
    text: message.bodyText ?? undefined,
    html: message.bodyHtml ?? undefined
  });

  await prisma.$transaction([
    prisma.mailMessage.update({
      where: { id: message.id },
      data: {
        providerMessageId: String(info.messageId),
        internetMessageId: String(info.messageId),
        sentAt: new Date()
      }
    }),
    prisma.mailDeliveryEvent.create({
      data: {
        messageId: message.id,
        status: "PROVIDER_ACCEPTED",
        providerEventId: String(info.messageId),
        detail: `SMTP server accepted message for ${info.accepted.length} recipient(s)`
      }
    })
  ]);

  return { providerMessageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
}
