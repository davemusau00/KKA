import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import nodemailer from "nodemailer";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { CryptoService } from "../../platform/crypto/crypto.service";
import { AuditService } from "../../platform/audit/audit.service";

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService
  ) {}

  list(firmId: string) {
    return this.prisma.client.integrationConnection.findMany({
      where: { firmId },
      select: {
        id: true, kind: true, name: true, scopeType: true, scopeId: true,
        publicConfig: true, status: true, enabled: true,
        lastTestAt: true, lastHealthyAt: true, lastError: true,
        secretRefId: true, createdAt: true, updatedAt: true
      },
      orderBy: [{ kind: "asc" }, { name: "asc" }]
    }).then((rows) => rows.map((row) => ({
      ...row,
      secretConfigured: Boolean(row.secretRefId),
      secretRefId: undefined
    })));
  }

  async createOrUpdate(firmId: string, actorId: string, input: any) {
    let secretRefId: string | undefined;
    if (input.secret) {
      const encrypted = this.crypto.encryptObject(input.secret);
      const secret = await this.prisma.client.secretRecord.create({
        data: {
          purpose: `integration:${input.kind}:${input.name}`,
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          keyVersion: encrypted.keyVersion
        } as any
      });
      secretRefId = secret.id;
    }

    const existing = await this.prisma.client.integrationConnection.findFirst({
      where: { firmId, name: input.name }
    });
    const connection = existing
      ? await this.prisma.client.integrationConnection.update({
          where: { id: existing.id },
          data: {
            kind: input.kind,
            scopeType: input.scopeType,
            scopeId: input.scopeId,
            publicConfig: input.publicConfig,
            secretRefId: secretRefId ?? existing.secretRefId,
            enabled: input.enabled,
            status: input.enabled ? "CONFIGURED" : "DISABLED",
            updatedById: actorId
          }
        })
      : await this.prisma.client.integrationConnection.create({
          data: {
            firmId,
            kind: input.kind,
            name: input.name,
            scopeType: input.scopeType,
            scopeId: input.scopeId,
            publicConfig: input.publicConfig,
            secretRefId,
            enabled: input.enabled,
            status: input.enabled ? "CONFIGURED" : "DISABLED",
            createdById: actorId,
            updatedById: actorId
          }
        });

    await this.audit.record({
      firmId, actorUserId: actorId, action: existing ? "integration.updated" : "integration.created",
      entityType: "integration_connection", entityId: connection.id,
      metadata: { kind: connection.kind, name: connection.name, enabled: connection.enabled }
    });
    return { ...connection, secretRefId: undefined, secretConfigured: Boolean(connection.secretRefId) };
  }

  private async secret<T>(connection: any): Promise<T> {
    if (!connection.secret) throw new BadRequestException("Connection secret is not configured");
    return this.crypto.decryptObject<T>({
      ciphertext: Buffer.from(connection.secret.ciphertext),
      iv: Buffer.from(connection.secret.iv),
      authTag: Buffer.from(connection.secret.authTag)
    });
  }

  async test(firmId: string, actorId: string, id: string) {
    const connection = await this.prisma.client.integrationConnection.findFirst({
      where: { id, firmId },
      include: { secret: true }
    });
    if (!connection) throw new NotFoundException("Integration connection not found");

    const started = Date.now();
    let result: { status: string; detail: string; capabilities?: string[] };

    try {
      if (connection.kind === "SMTP") {
        const cfg = connection.publicConfig as any;
        const secret = await this.secret<{ username?: string; password?: string }>(connection);
        const transporter = nodemailer.createTransport({
          host: String(cfg.host),
          port: Number(cfg.port ?? 587),
          secure: Boolean(cfg.secure ?? false),
          auth: secret.username || secret.password ? {
            user: secret.username,
            pass: secret.password
          } : undefined,
          connectionTimeout: Number(cfg.connectionTimeoutMs ?? 10000),
          greetingTimeout: Number(cfg.greetingTimeoutMs ?? 10000)
        });
        await transporter.verify();
        result = { status: "HEALTHY", detail: "SMTP network/TLS/authentication verification succeeded. This does not prove recipient delivery.", capabilities: ["verify", "send"] };
      } else if (connection.kind === "S3_STORAGE") {
        const cfg = connection.publicConfig as any;
        const secret = await this.secret<{ accessKeyId: string; secretAccessKey: string }>(connection);
        const client = new S3Client({
          endpoint: cfg.endpoint || undefined,
          region: String(cfg.region ?? "auto"),
          forcePathStyle: Boolean(cfg.forcePathStyle ?? true),
          credentials: secret
        });
        await client.send(new HeadBucketCommand({ Bucket: String(cfg.bucket) }));
        result = { status: "HEALTHY", detail: "S3 bucket is reachable with configured credentials.", capabilities: ["head-bucket"] };
      } else {
        result = {
          status: "NOT_IMPLEMENTED",
          detail: `${connection.kind} adapter is configured in the backend contract but no live adapter ships in this backend package. The UI must not display it as connected until implemented and tested.`,
          capabilities: []
        };
      }
    } catch (error) {
      result = {
        status: "FAILED",
        detail: error instanceof Error ? error.message : "Integration test failed"
      };
    }

    await this.prisma.client.integrationConnection.update({
      where: { id },
      data: {
        status: result.status as any,
        lastTestAt: new Date(),
        lastHealthyAt: result.status === "HEALTHY" ? new Date() : connection.lastHealthyAt,
        lastError: result.status === "FAILED" ? result.detail : null
      }
    });

    await this.audit.record({
      firmId, actorUserId: actorId, action: "integration.tested",
      entityType: "integration_connection", entityId: id,
      metadata: { kind: connection.kind, result: result.status, durationMs: Date.now() - started }
    });

    return { ...result, durationMs: Date.now() - started };
  }

  async getConnectionWithSecret(firmId: string, id: string) {
    const connection = await this.prisma.client.integrationConnection.findFirst({
      where: { id, firmId, enabled: true },
      include: { secret: true }
    });
    if (!connection) throw new NotFoundException("Enabled integration connection not found");
    return {
      connection,
      secret: connection.secret ? this.crypto.decryptObject<any>({
        ciphertext: Buffer.from(connection.secret.ciphertext),
        iv: Buffer.from(connection.secret.iv),
        authTag: Buffer.from(connection.secret.authTag)
      }) : {}
    };
  }
}
