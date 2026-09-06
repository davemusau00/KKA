import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { SettingScope } from "@kka/database";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { CryptoService } from "../../platform/crypto/crypto.service";
import { AuditService } from "../../platform/audit/audit.service";

export interface SettingContext {
  systemId?: string;
  firmId: string;
  legalEntityId?: string;
  branchId?: string;
  departmentId?: string;
  practiceAreaId?: string;
  matterTypeId?: string;
  workflowTemplateId?: string;
  roleIds?: string[];
  teamId?: string;
  userId?: string;
  clientId?: string;
  matterId?: string;
  documentTemplateId?: string;
  integrationConnectionId?: string;
  portalProfileId?: string;
}

const ORDER: SettingScope[] = [
  "SYSTEM", "FIRM", "LEGAL_ENTITY", "BRANCH", "DEPARTMENT", "PRACTICE_AREA",
  "MATTER_TYPE", "WORKFLOW_TEMPLATE", "ROLE", "TEAM", "USER", "CLIENT",
  "MATTER", "DOCUMENT_TEMPLATE", "INTEGRATION_CONNECTION", "PORTAL_PROFILE"
];

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService
  ) {}

  definitions() {
    return this.prisma.client.settingDefinition.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }]
    });
  }

  private contextScopes(context: SettingContext) {
    const pairs: Array<{ scopeType: SettingScope; scopeId: string }> = [
      { scopeType: "SYSTEM", scopeId: context.systemId ?? "system" },
      { scopeType: "FIRM", scopeId: context.firmId }
    ];
    if (context.legalEntityId) pairs.push({ scopeType: "LEGAL_ENTITY", scopeId: context.legalEntityId });
    if (context.branchId) pairs.push({ scopeType: "BRANCH", scopeId: context.branchId });
    if (context.departmentId) pairs.push({ scopeType: "DEPARTMENT", scopeId: context.departmentId });
    if (context.practiceAreaId) pairs.push({ scopeType: "PRACTICE_AREA", scopeId: context.practiceAreaId });
    if (context.matterTypeId) pairs.push({ scopeType: "MATTER_TYPE", scopeId: context.matterTypeId });
    if (context.workflowTemplateId) pairs.push({ scopeType: "WORKFLOW_TEMPLATE", scopeId: context.workflowTemplateId });
    for (const roleId of context.roleIds ?? []) pairs.push({ scopeType: "ROLE", scopeId: roleId });
    if (context.teamId) pairs.push({ scopeType: "TEAM", scopeId: context.teamId });
    if (context.userId) pairs.push({ scopeType: "USER", scopeId: context.userId });
    if (context.clientId) pairs.push({ scopeType: "CLIENT", scopeId: context.clientId });
    if (context.matterId) pairs.push({ scopeType: "MATTER", scopeId: context.matterId });
    if (context.documentTemplateId) pairs.push({ scopeType: "DOCUMENT_TEMPLATE", scopeId: context.documentTemplateId });
    if (context.integrationConnectionId) pairs.push({ scopeType: "INTEGRATION_CONNECTION", scopeId: context.integrationConnectionId });
    if (context.portalProfileId) pairs.push({ scopeType: "PORTAL_PROFILE", scopeId: context.portalProfileId });
    return pairs;
  }

  async resolve(key: string, context: SettingContext) {
    const definition = await this.prisma.client.settingDefinition.findUnique({ where: { key } });
    if (!definition) throw new NotFoundException(`Setting definition ${key} not found`);

    const scopes = this.contextScopes(context).filter((pair) => definition.allowedScopes.includes(pair.scopeType));
    const now = new Date();

    const values = await this.prisma.client.settingValue.findMany({
      where: {
        definitionId: definition.id,
        lifecycle: "ACTIVE",
        OR: scopes.map((scope) => ({ scopeType: scope.scopeType, scopeId: scope.scopeId })),
        AND: [
          { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }] },
          { OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] }
        ]
      },
      include: { secret: true },
      orderBy: [{ version: "desc" }, { createdAt: "desc" }]
    });

    const rank = new Map(ORDER.map((scope, index) => [scope, index]));
    const selected = values
      .slice()
      .sort((a, b) => (rank.get(b.scopeType) ?? -1) - (rank.get(a.scopeType) ?? -1))[0];

    let effectiveValue: unknown = definition.defaultValue;
    if (selected) {
      if (definition.valueType === "SECRET") {
        effectiveValue = selected.secret ? { configured: true, secretRefId: selected.secret.id } : { configured: false };
      } else {
        effectiveValue = selected.value;
      }
    }

    return {
      key,
      effectiveValue,
      source: selected ? { scopeType: selected.scopeType, scopeId: selected.scopeId, version: selected.version } : { scopeType: "DEFAULT" },
      defaultValue: definition.valueType === "SECRET" ? undefined : definition.defaultValue,
      definition
    };
  }

  async write(
    firmId: string,
    actorId: string,
    key: string,
    input: {
      scopeType: SettingScope;
      scopeId: string;
      value?: unknown;
      secretValue?: string;
      effectiveFrom?: string;
      effectiveTo?: string;
      changeReason?: string;
    }
  ) {
    const definition = await this.prisma.client.settingDefinition.findUnique({ where: { key } });
    if (!definition) throw new NotFoundException(`Setting ${key} is not registered`);
    if (!definition.allowedScopes.includes(input.scopeType)) {
      throw new BadRequestException(`${key} cannot be set at ${input.scopeType} scope`);
    }
    if (definition.requiresReason && !input.changeReason?.trim()) {
      throw new BadRequestException("A change reason is required");
    }
    if (definition.valueType === "SECRET" && !input.secretValue) {
      throw new BadRequestException("secretValue is required for secret settings");
    }

    const latest = await this.prisma.client.settingValue.findFirst({
      where: { definitionId: definition.id, scopeType: input.scopeType, scopeId: input.scopeId },
      orderBy: { version: "desc" }
    });
    const version = (latest?.version ?? 0) + 1;

    let secretRefId: string | undefined;
    if (definition.valueType === "SECRET") {
      const encrypted = this.crypto.encryptObject({ value: input.secretValue });
      const secret = await this.prisma.client.secretRecord.create({
        data: {
          purpose: `setting:${key}:${input.scopeType}:${input.scopeId}`,
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          keyVersion: encrypted.keyVersion
        }
      });
      secretRefId = secret.id;
    }

    const lifecycle = definition.requiresApproval ? "PENDING_APPROVAL" : "ACTIVE";
    const scopeLinks: Record<string, string> = {};
    if (input.scopeType === "FIRM") scopeLinks.firmId = input.scopeId;
    if (input.scopeType === "BRANCH") scopeLinks.branchId = input.scopeId;
    if (input.scopeType === "ROLE") scopeLinks.roleId = input.scopeId;
    if (input.scopeType === "USER") scopeLinks.userId = input.scopeId;
    if (input.scopeType === "DEPARTMENT") scopeLinks.departmentId = input.scopeId;
    if (input.scopeType === "TEAM") scopeLinks.teamId = input.scopeId;

    const value = await this.prisma.client.settingValue.create({
      data: {
        definitionId: definition.id,
        firmId,
        scopeType: input.scopeType,
        scopeId: input.scopeId,
        value: definition.valueType === "SECRET" ? undefined : (input.value as any),
        secretRefId,
        lifecycle,
        version,
        effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : undefined,
        effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : undefined,
        changeReason: input.changeReason,
        createdById: actorId,
        ...scopeLinks
      }
    });

    if (definition.requiresApproval) {
      await this.prisma.client.approvalRequest.create({
        data: {
          firmId,
          type: "SETTING_CHANGE",
          entityType: "SettingValue",
          entityId: value.id,
          requestedById: actorId,
          requiredRoleKeys: ["technical_admin", "managing_partner"],
          assignedUserIds: [],
          payload: { key, scopeType: input.scopeType, scopeId: input.scopeId, version },
          reason: input.changeReason
        }
      });
    } else if (latest?.lifecycle === "ACTIVE") {
      await this.prisma.client.settingValue.update({
        where: { id: latest.id },
        data: { lifecycle: "SUPERSEDED" }
      });
    }

    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: definition.requiresApproval ? "setting.change_requested" : "setting.changed",
      entityType: "setting",
      entityId: value.id,
      metadata: { key, scopeType: input.scopeType, scopeId: input.scopeId, version }
    });

    return value;
  }

  history(key: string, scopeType?: SettingScope, scopeId?: string) {
    return this.prisma.client.settingValue.findMany({
      where: {
        definition: { key },
        scopeType,
        scopeId
      },
      orderBy: { createdAt: "desc" }
    });
  }
}
