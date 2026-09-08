import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";

export interface NextSequenceOptions {
  firmId: string;
  branchId?: string;
  entityType: string;
  year?: number;
  pattern?: string;
  tokens?: Record<string, string | number>;
}

@Injectable()
export class NumberingService {
  constructor(private readonly prisma: PrismaService) {}

  async next(options: NextSequenceOptions, client: any = this.prisma.client): Promise<string> {
    const branchId = options.branchId ?? "__GLOBAL__";
    const year = options.year ?? 0;
    const row = await client.numberSequence.upsert({
      where: {
        firmId_branchId_entityType_year: {
          firmId: options.firmId,
          branchId,
          entityType: options.entityType,
          year
        }
      },
      create: {
        firmId: options.firmId,
        branchId,
        entityType: options.entityType,
        year,
        lastValue: 1,
        pattern: options.pattern ?? "{firm}/{practice}/{year}/{seq:5}"
      },
      update: { lastValue: { increment: 1 } }
    });

    return this.format(options.pattern ?? row.pattern, {
      firm: "KKA",
      year: options.year ?? new Date().getFullYear(),
      seq: row.lastValue,
      ...(options.tokens ?? {})
    });
  }

  format(pattern: string, tokens: Record<string, string | number>): string {
    return pattern.replace(/\{([A-Za-z0-9_]+)(?::(\d+))?\}/g, (_match, key: string, pad: string | undefined) => {
      const value = tokens[key];
      if (value === undefined) return `{${key}${pad ? `:${pad}` : ""}}`;
      const text = String(value);
      return pad ? text.padStart(Number(pad), "0") : text;
    });
  }
}
