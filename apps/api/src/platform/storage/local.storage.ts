import { createHash, randomUUID } from "node:crypto";
import { createReadStream, promises as fs } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { Readable } from "node:stream";
import type { PrivateStorageDriver, PutObjectInput, StoredObject } from "./storage.types";

export class LocalPrivateStorageDriver implements PrivateStorageDriver {
  readonly name = "local";

  constructor(private readonly root: string) {}

  private safePath(relative: string): string {
    const absoluteRoot = resolve(this.root);
    const absolute = resolve(absoluteRoot, normalize(relative));
    if (!absolute.startsWith(absoluteRoot + "/") && absolute !== absoluteRoot) {
      throw new Error("Unsafe storage path");
    }
    return absolute;
  }

  async put(input: PutObjectInput): Promise<StoredObject> {
    const extension = extname(input.filename).toLowerCase().slice(0, 16);
    const day = new Date().toISOString().slice(0, 10);
    const relative = join(input.namespace, day, `${randomUUID()}${extension}`);
    const absolute = this.safePath(relative);
    await fs.mkdir(dirname(absolute), { recursive: true, mode: 0o750 });
    await fs.writeFile(absolute, input.buffer, { mode: 0o640 });
    const checksumSha256 = createHash("sha256").update(input.buffer).digest("hex");
    return {
      driver: this.name,
      path: relative,
      sizeBytes: input.buffer.length,
      checksumSha256,
      mimeType: input.mimeType,
      originalFilename: input.filename
    };
  }

  async open(path: string): Promise<Readable> {
    await fs.access(this.safePath(path));
    return createReadStream(this.safePath(path));
  }

  async readBuffer(path: string): Promise<Buffer> {
    return fs.readFile(this.safePath(path));
  }

  async exists(path: string): Promise<boolean> {
    try {
      await fs.access(this.safePath(path));
      return true;
    } catch {
      return false;
    }
  }

  async delete(path: string): Promise<void> {
    await fs.unlink(this.safePath(path));
  }
}
