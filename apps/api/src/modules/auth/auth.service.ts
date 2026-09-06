import {
  Injectable,
  UnauthorizedException,
  BadRequestException
} from "@nestjs/common";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { RedisService } from "../../platform/redis/redis.service";
import { env } from "../../platform/env";
import type { LoginInput } from "@kka/contracts";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  private sessionKey(sid: string) {
    return `session:${sid}`;
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
        roleKeys: user.roles.map((ur) => ur.role.key),
        permissions: Array.from(new Set(user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.key))))
      }
    };
  }

  async logout(sid: string | undefined) {
    if (sid) await this.redis.client.del(this.sessionKey(sid));
    return { ok: true };
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
    const invite = await this.prisma.client.userInvite.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new BadRequestException("Invite token is invalid or expired");
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: env().ARGON2_MEMORY_COST,
      timeCost: env().ARGON2_TIME_COST,
      parallelism: env().ARGON2_PARALLELISM
    });

    await this.prisma.client.$transaction([
      this.prisma.client.user.update({
        where: { id: invite.userId },
        data: { passwordHash, status: "ACTIVE" }
      }),
      this.prisma.client.userInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() }
      })
    ]);

    return { ok: true };
  }
}
