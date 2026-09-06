import type { Readable } from "node:stream";

export interface StoredObject {
  driver: string;
  path: string;
  sizeBytes: number;
  checksumSha256: string;
  mimeType: string;
  originalFilename: string;
}

export interface PutObjectInput {
  namespace: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface PrivateStorageDriver {
  readonly name: string;
  put(input: PutObjectInput): Promise<StoredObject>;
  open(path: string): Promise<Readable>;
  readBuffer(path: string): Promise<Buffer>;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<void>;
}
