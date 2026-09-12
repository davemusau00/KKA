import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { RedisService } from "../../platform/redis/redis.service";
import { env } from "../../platform/env";
import type { LoginInput } from "@kka/contracts";
import { roleContext } from '../../platform/auth/role-context';
import { AuditService } from '../../platform/audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly audit: AuditService
  ) {}

  private sessionKey(sid: string) {
    return `session:${sid}`;
  }

  private userSessionsKey(userId: string) {
    return `user-sessions:${userId}`;
  }

  private async rateLimit(key: string, maximum: number, windowSeconds: number) {
    const attempts = await this.redis.client.incr(key);
    if (attempts === 1) await this.redis.client.expire(key, windowSeconds);
    if (attempts > maximum) throw new HttpException("Try again later", HttpStatus.TOO_MANY_REQUESTS);
  }

  async login(input: LoginInput) {
    const user = await this.prisma.client.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } }
        }
      }
    });
    if (!user || !user.passwordHash || user.status !== "ACTIVE") {
      throw new UnauthorizedException("Invalid email or password");
    }

    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) throw new UnauthorizedException("Invalid email or password");

    const sid = randomBytes(32).toString("base64url");
    const now = new Date().toISOString();
    await this.redis.client.set(
      this.sessionKey(sid),
      JSON.stringify({
        userId: user.id,
        firmId: user.firmId,
        createdAt: now,
        lastSeenAt: now
      }),
      "EX",
      env().SESSION_TTL_SECONDS
    );
    await this.redis.client.sadd(this.userSessionsKey(user.id), sid);
    await this.redis.client.expire(this.userSessionsKey(user.id), env().SESSION_TTL_SECONDS);

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return {
      sid,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        firmId: user.firmId,
        homeBranchId: user.homeBranchId,
        ...roleContext(user.firmId, user.roles)
      }
    };
  }

  async logout(sid: string | undefined) {
    if (sid) {
      const raw = await this.redis.client.get(this.sessionKey(sid));
      if (raw) {
        const session = JSON.parse(raw) as { userId?: string };
        if (session.userId) await this.redis.client.srem(this.userSessionsKey(session.userId), sid);
      }
      await this.redis.client.del(this.sessionKey(sid));
    }
    return { ok: true };
  }

  async logoutAll(userId: string, firmId: string, currentSid?: string) {
    const sessions = await this.redis.client.smembers(this.userSessionsKey(userId));
    const revoke = sessions.filter(sid => sid !== currentSid);
    if (revoke.length) await this.redis.client.del(...revoke.map(sid => this.sessionKey(sid)));
    if (currentSid) {
      await this.redis.client.srem(this.userSessionsKey(userId), ...revoke);
      await this.redis.client.sadd(this.userSessionsKey(userId), currentSid);
    } else {
      await this.redis.client.del(this.userSessionsKey(userId));
    }
    await this.audit.record({
      firmId,
      actorUserId: userId,
      action: "auth.sessions_revoked",
      entityType: "user",
      entityId: userId,
      metadata: { revokedSessions: revoke.length, retainedCurrentSession: Boolean(currentSid) }
    });
    return { ok: true, revokedSessions: revoke.length };
  }

  async inspectUserSessions(firmId: string, actorId: string, userId: string) {
    const user = await this.prisma.client.user.findFirst({ where: { id: userId, firmId }, select: { id: true } });
    if (!user) throw new BadRequestException("User not found");
    const sessionIds = await this.redis.client.smembers(this.userSessionsKey(userId));
    const records = sessionIds.length ? await Promise.all(sessionIds.map((sid) => this.redis.client.get(this.sessionKey(sid)))) : [];
    const stale = sessionIds.filter((_sid, index) => !records[index]);
    if (stale.length) await this.redis.client.srem(this.userSessionsKey(userId), ...stale);
    await this.audit.record({
      firmId, actorUserId: actorId, action: "auth.sessions_inspected", entityType: "user", entityId: userId,
      metadata: { activeSessionCount: records.length - stale.length }
    });
    return { userId, activeSessionCount: records.length - stale.length, checkedAt: new Date().toISOString() };
  }

  async revokeUserSessions(firmId: string, actorId: string, userId: string) {
    const user = await this.prisma.client.user.findFirst({ where: { id: userId, firmId }, select: { id: true } });
    if (!user) throw new BadRequestException("User not found");
    const sessionIds = await this.redis.client.smembers(this.userSessionsKey(userId));
    if (sessionIds.length) await this.redis.client.del(...sessionIds.map((sid) => this.sessionKey(sid)));
    await this.redis.client.del(this.userSessionsKey(userId));
    await this.audit.record({
      firmId, actorUserId: actorId, action: "auth.sessions_admin_revoked", entityType: "user", entityId: userId,
      metadata: { revokedSessions: sessionIds.length }
    });
    return { ok: true, userId, revokedSessions: sessionIds.length };
  }

  async elevate(userId: string, password: string) {
    const user = await this.prisma.client.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash || user.status !== "ACTIVE" || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException("Password confirmation failed");
    }
    const token = randomBytes(32).toString("base64url");
    await this.redis.client.set(`elevation:${token}`, JSON.stringify({ userId, createdAt: new Date().toISOString() }), "EX", 300);
    return { elevationToken: token, expiresInSeconds: 300 };
  }

  async acceptInvite(token: string, password: string) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await this.rateLimit(`invite-accept:${tokenHash}`, 10, 900);
    const invite = await this.prisma.client.userInvite.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!invite || invite.acceptedAt || invite.revokedAt || invite.supersededAt || invite.expiresAt <= new Date() || invite.user.status !== "INVITED") {
      throw new BadRequestException("Invite token is invalid or expired");
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: env().ARGON2_MEMORY_COST,
      timeCost: env().ARGON2_TIME_COST,
      parallelism: env().ARGON2_PARALLELISM
    });

    const accepted = await this.prisma.client.$transaction(async (tx) => {
      const now = new Date();
      const claimed = await tx.userInvite.updateMany({
        where: { id: invite.id, acceptedAt: null, revokedAt: null, supersededAt: null, expiresAt: { gt: now } },
        data: { acceptedAt: now }
      });
      if (claimed.count !== 1) throw new BadRequestException("Invite token is invalid or expired");
      const activated = await tx.user.updateMany({
        where: { id: invite.userId, status: "INVITED", passwordHash: null },
        data: { passwordHash, status: "ACTIVE" }
      });
      if (activated.count !== 1) throw new BadRequestException("Invite token is invalid or expired");
      await tx.userInvite.updateMany({
        where: { userId: invite.userId, id: { not: invite.id }, acceptedAt: null, revokedAt: null, supersededAt: null },
        data: { revokedAt: now }
      });
      const user = await tx.user.findUniqueOrThrow({
        where: { id: invite.userId },
        include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
      });
      const audit = await this.audit.record({
        firmId: user.firmId,
        actorUserId: user.id,
        action: "auth.invite_accepted",
        entityType: "user_invite",
        entityId: invite.id,
        metadata: { userId: user.id, authenticated: false, sessionsCreated: false }
      }, tx);
      return { user, auditId: audit.id };
    });

    return {
      ok: true,
      auditId: accepted.auditId,
      user: {
        id: accepted.user.id,
        email: accepted.user.email,
        fullName: accepted.user.fullName,
        firmId: accepted.user.firmId,
        homeBranchId: accepted.user.homeBranchId,
        ...roleContext(accepted.user.firmId, accepted.user.roles)
      }
    };
  }

  async inspectInvite(token: string) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const invite = await this.prisma.client.userInvite.findUnique({ where: { tokenHash }, include: { user: { select: { status: true } } } });
    const valid = Boolean(invite && !invite.acceptedAt && !invite.revokedAt && !invite.supersededAt && invite.expiresAt > new Date() && invite.user.status === "INVITED");
    return { valid };
  }

  async requestPasswordReset(email: string) {
    const normalizedEmail = email.toLowerCase();
    const rateKey = `password-reset-request:${createHash("sha256").update(normalizedEmail).digest("hex")}`;
    await this.rateLimit(rateKey, 5, 3600);

    const user = await this.prisma.client.user.findUnique({ where: { email: normalizedEmail } });
    let localToken: string | undefined;
    if (user?.status === "ACTIVE" && user.passwordHash) {
      localToken = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256").update(localToken).digest("hex");
      await this.prisma.client.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() }
      });
      await this.prisma.client.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + env().PASSWORD_RESET_TOKEN_TTL_MINUTES * 60_000)
        }
      });
      await this.audit.record({
        firmId: user.firmId,
        action: "auth.password_reset_requested",
        entityType: "user",
        entityId: user.id,
        metadata: { deliveryStatus: "UNCONFIGURED", authenticated: false }
      });
    }

    return {
      ok: true,
      deliveryStatus: "UNCONFIGURED" as const,
      ...(env().EXPOSE_LOCAL_RESET_TOKEN && env().NODE_ENV !== "production" && localToken ? { localToken } : {})
    };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const reset = await this.prisma.client.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!reset || reset.usedAt || reset.expiresAt <= new Date()) {
      throw new BadRequestException("Reset token is invalid or expired");
    }
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: env().ARGON2_MEMORY_COST,
      timeCost: env().ARGON2_TIME_COST,
      parallelism: env().ARGON2_PARALLELISM
    });
    await this.prisma.client.$transaction(async tx => {
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: reset.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() }
      });
      if (claimed.count !== 1) throw new BadRequestException("Reset token is invalid or expired");
      await tx.user.update({ where: { id: reset.userId }, data: { passwordHash } });
      await tx.passwordResetToken.updateMany({ where: { userId: reset.userId, usedAt: null, id: { not: reset.id } }, data: { usedAt: new Date() } });
    });
    const resetUser = await this.prisma.client.user.findUnique({ where: { id: reset.userId }, select: { firmId: true } });
    if (resetUser) await this.audit.record({
      firmId: resetUser.firmId,
      action: "auth.password_reset_completed",
      entityType: "user",
      entityId: reset.userId,
      metadata: { sessionsRevoked: true, authenticated: false }
    });
    const sessions = await this.redis.client.smembers(this.userSessionsKey(reset.userId));
    if (sessions.length) await this.redis.client.del(...sessions.map(sid => this.sessionKey(sid)));
    await this.redis.client.del(this.userSessionsKey(reset.userId));
    return { ok: true };
  }
}
