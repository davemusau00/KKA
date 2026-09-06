import { Injectable } from "@nestjs/common";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "../env";

export interface EncryptedPayload {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
  keyVersion: number;
}

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor() {
    this.key = Buffer.from(env().APP_ENCRYPTION_KEY_BASE64, "base64");
    if (this.key.length !== 32) {
      throw new Error("APP_ENCRYPTION_KEY_BASE64 must decode to exactly 32 bytes");
    }
  }

  encryptObject(value: unknown): EncryptedPayload {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const plaintext = Buffer.from(JSON.stringify(value), "utf8");
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return {
      ciphertext,
      iv,
      authTag: cipher.getAuthTag(),
      keyVersion: env().ENCRYPTION_KEY_VERSION
    };
  }

  decryptObject<T>(payload: Pick<EncryptedPayload, "ciphertext" | "iv" | "authTag">): T {
    const decipher = createDecipheriv("aes-256-gcm", this.key, payload.iv);
    decipher.setAuthTag(payload.authTag);
    const plaintext = Buffer.concat([decipher.update(payload.ciphertext), decipher.final()]);
    return JSON.parse(plaintext.toString("utf8")) as T;
  }
}
