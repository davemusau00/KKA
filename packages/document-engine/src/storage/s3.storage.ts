import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { createHash, randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import type { PrivateStorageDriver, PutObjectInput, StoredObject } from "./storage.types";

export interface S3StorageConfig {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
}

export class S3StorageDriver implements PrivateStorageDriver {
  readonly name = "s3";
  private readonly client: S3Client;

  constructor(private readonly config: S3StorageConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint || undefined,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });
  }

  async put(input: PutObjectInput): Promise<StoredObject> {
    const day = new Date().toISOString().slice(0, 10);
    const key = `${input.namespace}/${day}/${randomUUID()}-${input.filename.replace(/[^A-Za-z0-9._-]/g, "_")}`;
    const checksumSha256 = createHash("sha256").update(input.buffer).digest("hex");
    await this.client.send(new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: input.buffer,
      ContentType: input.mimeType,
      Metadata: { sha256: checksumSha256 }
    }));
    return {
      driver: this.name,
      path: key,
      sizeBytes: input.buffer.length,
      checksumSha256,
      mimeType: input.mimeType,
      originalFilename: input.filename
    };
  }

  async open(path: string): Promise<Readable> {
    const response = await this.client.send(new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: path
    }));
    if (!response.Body) throw new Error("S3 object has no body");
    return response.Body as Readable;
  }

  async readBuffer(path: string): Promise<Buffer> {
    const stream = await this.open(path);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.config.bucket, Key: path }));
      return true;
    } catch {
      return false;
    }
  }

  async delete(path: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: path }));
  }
}
