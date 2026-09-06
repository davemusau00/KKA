import type { Prisma } from '@kka/database';
import { createHash } from 'node:crypto';
export interface AuditInput {
  firmId?: string; actorUserId?: string; action: string; entityType: string; entityId: string;
  matterId?: string; clientId?: string; requestId?: string; ipAddress?: string; userAgent?: string; metadata?: Record<string,unknown>;
}
export async function appendAudit(tx: Prisma.TransactionClient, input: AuditInput) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${(input.firmId ?? 'system') + ':audit'}))`;
  const previous=await tx.auditEvent.findFirst({where:{firmId:input.firmId??null},orderBy:{occurredAt:'desc'},select:{eventHash:true,occurredAt:true}});
  const occurredAt=new Date(Math.max(Date.now(),(previous?.occurredAt.getTime()??0)+1));
  const metadata=JSON.parse(JSON.stringify(input.metadata??{})) as Prisma.InputJsonValue;
  const material={previousHash:previous?.eventHash??null,action:input.action,entityType:input.entityType,entityId:input.entityId,matterId:input.matterId??null,actorUserId:input.actorUserId??null,metadata,timestamp:occurredAt.toISOString()};
  return tx.auditEvent.create({data:{...input,metadata,occurredAt,previousHash:previous?.eventHash,eventHash:createHash('sha256').update(JSON.stringify(material)).digest('hex')}});
}
