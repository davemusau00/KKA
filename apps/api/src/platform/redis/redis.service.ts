import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { env } from "../env";

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client = new Redis(env().REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true
  });

  duplicate(): Redis {
    return this.client.duplicate();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
