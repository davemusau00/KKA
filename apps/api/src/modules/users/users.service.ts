import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import { env } from "../../platform/env";

type InviteDeliveryStatus = "UNCONFIGURED";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async list(firmId: string) {
    const users = await this.prisma.client.user.findMany({
      where: { firmId },
      include: {
        roles: { include: { role: true } },
        homeBranch: true,
        branches: { include: { branch: true } },
        teams: { include: { team: true } }
      },
      orderBy: { fullName: "asc" }
    });
    return users.map((user) => this.userDto(user));
  }

  private userDto(user: any) {
    return {
      id: user.id,
      firmId: user.firmId,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      jobTitle: user.jobTitle,
      homeBranchId: user.homeBranchId,
      status: user.status,
      roleKeys: user.roles?.map((assignment: any) => assignment.role.key) ?? [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private localInviteToken(rawToken: string) {
    return env().EXPOSE_LOCAL_INVITE_TOKEN && env().NODE_ENV !== "production" ? { localInviteToken: rawToken } : {};
  }

  private async issueInvite(firmId: string, actorId: string, user: { id: string; email: string }, action: "user.invited" | "user.invite_resent", transaction?: any) {
    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + env().INVITE_TOKEN_TTL_HOURS * 3600_000);
    const now = new Date();
    const persist = async (tx: any) => {
      await tx.userInvite.updateMany({
        where: { userId: user.id, acceptedAt: null, revokedAt: null, supersededAt: null },
        data: { supersededAt: now }
      });
      const invite = await tx.userInvite.create({
        data: { userId: user.id, tokenHash, expiresAt, createdById: actorId, deliveryStatus: "UNCONFIGURED" }
      });
      const audit = await this.audit.record({
        firmId,
        actorUserId: actorId,
        action,
        entityType: "user_invite",
        entityId: invite.id,
        metadata: { userId: user.id, email: user.email, expiresAt: expiresAt.toISOString(), deliveryStatus: "UNCONFIGURED", providerConfigured: false }
      }, tx);
      return { invite, audit };
    };
    const result = transaction ? await persist(transaction) : await this.prisma.client.$transaction(persist);
    return {
      invite: { id: result.invite.id, expiresAt: result.invite.expiresAt, deliveryStatus: result.invite.deliveryStatus as InviteDeliveryStatus },
      auditId: result.audit.id,
      ...this.localInviteToken(rawToken)
    };
  }

  async invite(
    firmId: string,
    actorId: string,
    input: {
      email: string;
      fullName: string;
      phone?: string;
      jobTitle?: string;
      homeBranchId?: string;
      roleKeys: string[];
    }
  ) {
    const existing = await this.prisma.client.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });
    if (existing) throw new BadRequestException("A user with this email already exists");

    const roleKeys = [...new Set(input.roleKeys)];
    const roles = await this.prisma.client.role.findMany({
      where: { firmId, key: { in: roleKeys }, active: true }
    });
    if (roles.length !== roleKeys.length) {
      throw new BadRequestException("One or more role keys are invalid");
    }

    if (input.homeBranchId) {
      const branch = await this.prisma.client.branch.findFirst({ where: { id: input.homeBranchId, firmId, active: true }, select: { id: true } });
      if (!branch) throw new BadRequestException("Home branch is invalid or inactive");
    }

    const created = await this.prisma.client.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firmId,
          email: input.email.toLowerCase(),
          fullName: input.fullName,
          phone: input.phone,
          jobTitle: input.jobTitle,
          homeBranchId: input.homeBranchId,
          status: "INVITED",
          roles: { create: roles.map((role) => ({ roleId: role.id })) }
        },
        include: { roles: { include: { role: true } } }
      });
      const issued = await this.issueInvite(firmId, actorId, user, "user.invited", tx);
      return { user, issued };
    });
    return { user: this.userDto(created.user), ...created.issued };
  }

  async resendInvite(firmId: string, actorId: string, userId: string) {
    const user = await this.prisma.client.user.findFirst({ where: { id: userId, firmId }, include: { roles: { include: { role: true } } } });
    if (!user) throw new NotFoundException("User not found");
    if (user.status !== "INVITED") throw new BadRequestException("Only pending invitations can be resent");
    const issued = await this.issueInvite(firmId, actorId, user, "user.invite_resent");
    return { user: this.userDto(user), ...issued };
  }

  async setStatus(firmId: string, actorId: string, userId: string, status: "ACTIVE" | "SUSPENDED" | "DISABLED") {
    const existing = await this.prisma.client.user.findFirst({ where: { id: userId, firmId } });
    if (!existing) throw new NotFoundException("User not found");
    if (existing.status === "INVITED" && status === "ACTIVE") {
      throw new BadRequestException("Pending invitations can only be activated by accepting their invitation");
    }
    const user = await this.prisma.client.user.update({ where: { id: userId }, data: { status } });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "user.status_changed",
      entityType: "user",
      entityId: userId,
      metadata: { from: existing.status, to: status }
    });
    return user;
  }

  async replaceRoles(firmId: string, actorId: string, userId: string, roleKeys: string[]) {
    const roles = await this.prisma.client.role.findMany({ where: { firmId, key: { in: roleKeys } } });
    if (roles.length !== roleKeys.length) throw new BadRequestException("One or more roles are invalid");
    await this.prisma.client.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId } });
      await tx.userRole.createMany({ data: roles.map((role) => ({ userId, roleId: role.id })) });
    });
    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "user.roles_replaced",
      entityType: "user",
      entityId: userId,
      metadata: { roleKeys }
    });
    return this.prisma.client.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } }
    });
  }

  async setHomeBranch(firmId: string, actorId: string, userId: string, homeBranchId: string | null) {
    const user = await this.prisma.client.user.findFirst({ where: { id: userId, firmId }, select: { id: true, homeBranchId: true } });
    if (!user) throw new NotFoundException("User not found");
    if (homeBranchId) {
      const branch = await this.prisma.client.branch.findFirst({ where: { id: homeBranchId, firmId, active: true }, select: { id: true } });
      if (!branch) throw new BadRequestException("Home branch is invalid or inactive");
    }
    const updated = await this.prisma.client.$transaction(async (tx) => {
      const account = await tx.user.update({ where: { id: userId }, data: { homeBranchId }, include: { roles: { include: { role: true } } } });
      if (homeBranchId) await tx.userBranch.upsert({
        where: { userId_branchId: { userId, branchId: homeBranchId } },
        create: { userId, branchId: homeBranchId }, update: {}
      });
      const audit = await this.audit.record({
        firmId, actorUserId: actorId, action: "user.home_branch_changed", entityType: "user", entityId: userId,
        metadata: { previousHomeBranchId: user.homeBranchId, homeBranchId }
      }, tx);
      return { account, auditId: audit.id };
    });
    return { user: this.userDto(updated.account), auditId: updated.auditId };
  }
}
