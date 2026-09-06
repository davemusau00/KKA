import { createDecipheriv } from "node:crypto";
import { workerEnv } from "./env";

const key = Buffer.from(workerEnv.APP_ENCRYPTION_KEY_BASE64, "base64");
if (key.length !== 32) throw new Error("APP_ENCRYPTION_KEY_BASE64 must decode to 32 bytes");

export function decryptSecret<T>(secret: { ciphertext: Uint8Array; iv: Uint8Array; authTag: Uint8Array }): T {
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(secret.iv));
  decipher.setAuthTag(Buffer.from(secret.authTag));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(secret.ciphertext)),
    decipher.final()
  ]);
  return JSON.parse(plain.toString("utf8")) as T;
}
