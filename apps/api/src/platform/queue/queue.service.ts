import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import { RedisService } from "../redis/redis.service";

export const QUEUES = {
  notifications: "notifications",
  mail: "mail",
  calendar: "calendar",
  documents: "documents",
  automation: "automation",
  integrations: "integrations",
  webhooks: "webhooks"
} as const;

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly queues = new Map<string, Queue>();

  constructor(private readonly redis: RedisService) {}

  get(name: string): Queue {
    const existing = this.queues.get(name);
    if (existing) return existing;
    const queue = new Queue(name, {
      connection: this.redis.duplicate(),
      defaultJobOptions: {
        removeOnComplete: 500,
        removeOnFail: 2000,
        attempts: 5,
        backoff: { type: "exponential", delay: 3000 }
      }
    });
    this.queues.set(name, queue);
    return queue;
  }

  async add(
    queueName: string,
    jobName: string,
    data: Record<string, unknown>,
    options: Record<string, unknown> = {}
  ) {
    return this.get(queueName).add(jobName, data, options);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(Array.from(this.queues.values()).map((queue) => queue.close()));
  }
}
