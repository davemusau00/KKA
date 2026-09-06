import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import { env } from "../../platform/env";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  list(firmId: string) {
    return this.prisma.client.user.findMany({
      where: { firmId },
      include: {
        roles: { include: { role: true } },
        homeBranch: true,
        branches: { include: { branch: true } },
        teams: { include: { team: true } }
      },
      orderBy: { fullName: "asc" }
    });
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

    const roles = await this.prisma.client.role.findMany({
      where: { firmId, key: { in: input.roleKeys }, active: true }
    });
    if (roles.length !== input.roleKeys.length) {
      throw new BadRequestException("One or more role keys are invalid");
    }

    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + env().INVITE_TOKEN_TTL_HOURS * 3600_000);

    const user = await this.prisma.client.user.create({
      data: {
        firmId,
        email: input.email.toLowerCase(),
        fullName: input.fullName,
        phone: input.phone,
        jobTitle: input.jobTitle,
        homeBranchId: input.homeBranchId,
        status: "INVITED",
        roles: {
          create: roles.map((role) => ({ roleId: role.id }))
        },
        invites: {
          create: {
            tokenHash,
            expiresAt,
            createdById: actorId
          }
        }
      },
      include: { roles: { include: { role: true } } }
    });

    await this.audit.record({
      firmId,
      actorUserId: actorId,
      action: "user.invited",
      entityType: "user",
      entityId: user.id,
      metadata: { email: user.email, roleKeys: input.roleKeys }
    });

    return { user, inviteToken: rawToken, expiresAt };
  }

  async setStatus(firmId: string, actorId: string, userId: string, status: "ACTIVE" | "SUSPENDED" | "DISABLED") {
    const existing = await this.prisma.client.user.findFirst({ where: { id: userId, firmId } });
    if (!existing) throw new NotFoundException("User not found");
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
}
