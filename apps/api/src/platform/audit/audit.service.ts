import { Injectable } from '@nestjs/common';
import type { Prisma } from '@kka/database';
import { appendAudit, type AuditInput } from '@kka/document-engine';
import { PrismaService } from '../prisma/prisma.service';
export type { AuditInput } from '@kka/document-engine';
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  record(input: AuditInput, transaction?: Prisma.TransactionClient) {
    return transaction ? appendAudit(transaction,input) : this.prisma.client.$transaction(tx=>appendAudit(tx,input));
  }
}
