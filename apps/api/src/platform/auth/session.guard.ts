import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { env } from "../env";
import { PUBLIC_ROUTE } from "./decorators";
import type { AuthenticatedRequest, RequestUser } from "./auth.types";

interface StoredSession {
  userId: string;
  firmId: string;
  createdAt: string;
  lastSeenAt: string;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass()
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const sid = request.cookies?.[env().SESSION_COOKIE_NAME];
    if (!sid) throw new UnauthorizedException("Authentication required");

    const raw = await this.redis.client.get(`session:${sid}`);
    if (!raw) throw new UnauthorizedException("Session expired");

    const session = JSON.parse(raw) as StoredSession;
    const user = await this.prisma.client.user.findUnique({
      where: { id: session.userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } }
              }
            }
          }
        }
      }
    });

    if (!user || user.status !== "ACTIVE") {
      await this.redis.client.del(`session:${sid}`);
      throw new UnauthorizedException("User is not active");
    }

    const permissions = Array.from(
      new Set(
        user.roles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.key)
        )
      )
    );
    const authUser: RequestUser = {
      id: user.id,
      firmId: user.firmId,
      email: user.email,
      fullName: user.fullName,
      roleKeys: user.roles.map((ur) => ur.role.key),
      permissions
    };
    request.authUser = authUser;

    await this.redis.client.expire(`session:${sid}`, env().SESSION_TTL_SECONDS);
    return true;
  }
}
