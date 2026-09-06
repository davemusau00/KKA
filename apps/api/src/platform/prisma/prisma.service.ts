import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { createPrismaClient, KkaPrismaClient } from "@kka/database";
import { env } from "../env";

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client: KkaPrismaClient = createPrismaClient(env().DATABASE_URL);

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
