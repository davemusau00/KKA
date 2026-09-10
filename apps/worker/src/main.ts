import { processWebsiteAcknowledgement } from './processors/website-ack.processor';
import "dotenv/config";
import { Worker } from "bullmq";
import Redis from "ioredis";
import { createPrismaClient } from "@kka/database";
import { workerEnv } from "./env";
import { processMail } from "./processors/mail.processor";
import { processNotification } from "./processors/notification.processor";
import { processDocument } from "./processors/document.processor";
import { processCalendar } from "./processors/calendar.processor";
import { processAutomation } from "./processors/automation.processor";
import { webhookProcessor } from "./processors/webhook.processor";
import { processWebsitePublish } from "./processors/website-publish.processor";

const prisma = createPrismaClient(workerEnv.DATABASE_URL);
const connection = new Redis(workerEnv.REDIS_URL, { maxRetriesPerRequest: null });

async function recordFailure(queue: string, job: any, error: Error) {
  await prisma.systemJobRecord.create({
    data: {
      queue,
      jobName: job?.name ?? "unknown",
      jobId: job?.id ? String(job.id) : undefined,
      status: "FAILED",
      attempts: Number(job?.attemptsMade ?? 0) + 1,
      error: error.message,
      finishedAt: new Date()
    }
  }).catch(() => undefined);
}

const workers = [
  new Worker('website-ack',job=>processWebsiteAcknowledgement(job,prisma),{connection,concurrency:1}),
  new Worker("mail", (job) => processMail(job, prisma), {
    connection,
    concurrency: workerEnv.MAIL_QUEUE_CONCURRENCY
  }),
  new Worker("notifications", (job) => processNotification(job, prisma), {
    connection,
    concurrency: workerEnv.NOTIFICATION_QUEUE_CONCURRENCY
  }),
  new Worker("documents", (job) => processDocument(job, prisma), {
    connection,
    concurrency: workerEnv.DOCUMENT_QUEUE_CONCURRENCY
  }),
  new Worker("calendar", (job) => processCalendar(job, prisma), {
    connection,
    concurrency: 4
  }),
  new Worker("automation", (job) => processAutomation(job, prisma), {
    connection,
    concurrency: workerEnv.AUTOMATION_QUEUE_CONCURRENCY
  }),
  new Worker("webhooks", webhookProcessor(prisma), {
    connection,
    concurrency: workerEnv.WEBHOOK_QUEUE_CONCURRENCY
  }),
  new Worker("website-publish", (job) => processWebsitePublish(job, prisma), {
    connection,
    concurrency: 2
  })
];

for (const worker of workers) {
  worker.on("failed", (job, error) => {
    console.error(`[${worker.name}] job ${job?.id} failed`, error);
    void recordFailure(worker.name, job, error);
  });
  worker.on("completed", (job) => {
    console.log(`[${worker.name}] job ${job.id} completed`);
  });
}

async function shutdown() {
  await Promise.all(workers.map((worker) => worker.close()));
  await prisma.$disconnect();
  await connection.quit();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());

console.log("KKA worker online:", workers.map((worker) => worker.name).join(", "));
