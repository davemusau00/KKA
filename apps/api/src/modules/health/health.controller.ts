import { Controller, Get } from "@nestjs/common";
import { Public } from "../../platform/auth/decorators";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { RedisService } from "../../platform/redis/redis.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  @Public()
  @Get("live")
  live() {
    return { status: "ok", service: "kka-api", time: new Date().toISOString() };
  }

  @Public()
  @Get("ready")
  async ready() {
    await this.prisma.client.$queryRaw`SELECT 1`;
    await this.redis.client.ping();
    return { status: "ready", database: "ok", redis: "ok", time: new Date().toISOString() };
  }
}
