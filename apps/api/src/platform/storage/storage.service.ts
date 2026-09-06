import { Injectable } from "@nestjs/common";
import { env } from "../env";
import { LocalPrivateStorageDriver } from "./local.storage";
import { S3StorageDriver } from "./s3.storage";
import type { PrivateStorageDriver, PutObjectInput } from "./storage.types";

@Injectable()
export class StorageService {
  private readonly documentDriver: PrivateStorageDriver;
  private readonly markDriver: PrivateStorageDriver;

  constructor() {
    const cfg = env();
    if (cfg.STORAGE_DRIVER === "s3") {
      if (!cfg.S3_BUCKET || !cfg.S3_ACCESS_KEY_ID || !cfg.S3_SECRET_ACCESS_KEY) {
        throw new Error("S3 storage selected but S3 configuration is incomplete");
      }
      const s3 = new S3StorageDriver({
        endpoint: cfg.S3_ENDPOINT,
        region: cfg.S3_REGION,
        bucket: cfg.S3_BUCKET,
        accessKeyId: cfg.S3_ACCESS_KEY_ID,
        secretAccessKey: cfg.S3_SECRET_ACCESS_KEY,
        forcePathStyle: cfg.S3_FORCE_PATH_STYLE
      });
      this.documentDriver = s3;
      this.markDriver = s3;
    } else {
      this.documentDriver = new LocalPrivateStorageDriver(cfg.LOCAL_STORAGE_ROOT);
      this.markDriver = new LocalPrivateStorageDriver(cfg.MARK_STORAGE_ROOT);
    }
  }

  putDocument(input: Omit<PutObjectInput, "namespace">) {
    return this.documentDriver.put({ ...input, namespace: "documents" });
  }

  putMark(input: Omit<PutObjectInput, "namespace">) {
    return this.markDriver.put({ ...input, namespace: "marks" });
  }

  openDocument(path: string) {
    return this.documentDriver.open(path);
  }

  readDocument(path: string) {
    return this.documentDriver.readBuffer(path);
  }

  openMark(path: string) {
    return this.markDriver.open(path);
  }

  readMark(path: string) {
    return this.markDriver.readBuffer(path);
  }
}
