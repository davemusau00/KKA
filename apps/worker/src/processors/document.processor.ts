import type { Job } from "bullmq";
import type { KkaPrismaClient } from "@kka/database";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import { workerEnv } from "../env";
import { processGeneration, documentStorage } from '@kka/document-engine';

export async function processDocument(job: Job, prisma: KkaPrismaClient) {
  if (job.name === 'document.generate') return processGeneration(prisma, String(job.data.operationId));
  if (job.name !== "document.inspect") return;
  const versionId = String(job.data.versionId);
  const version = await prisma.documentVersion.findUnique({ where: { id: versionId } });
  if (!version) throw new Error("Document version not found");
  if (version.storageDriver !== "local") {
    return { inspected: false, reason: "S3 inspection is handled by storage-specific deployment tooling" };
  }

  const buffer = await documentStorage(workerEnv.LOCAL_STORAGE_ROOT).readBuffer(version.storagePath);
  const checksum = createHash("sha256").update(buffer).digest("hex");
  if (checksum !== version.checksumSha256) {
    throw new Error(`Checksum mismatch for document version ${versionId}`);
  }
  return { inspected: true, checksum };
}
