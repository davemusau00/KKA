import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Prisma } from '@kka/database';
import { StructuredTemplateSchema, TemplateConfigurationSchema, GenerateDocumentSchema } from '@kka/contracts';
import { MERGE_FIELDS, validateDocx, merge, templateHtml } from '@kka/document-engine';
import { z } from 'zod';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { StorageService } from '../../platform/storage/storage.service';
import { AuditService } from '../../platform/audit/audit.service';
import { QueueService, QUEUES } from '../../platform/queue/queue.service';
import type { RequestUser } from '../../platform/auth/auth.types';
import { DocumentAccessService } from './document-access.service';
import { BrandingService } from './branding.service';
const json = (v: unknown) => JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
export const SaveTemplateSchema = z.object({ name: z.string().min(2), key: z.string().regex(/^[a-z0-9_-]+$/), category: z.string().min(2), content: StructuredTemplateSchema, configuration: TemplateConfigurationSchema.default({ logo: 'active', marks: [] }) });
@Injectable()
export class TemplateWorkflowService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService, private readonly audit: AuditService, private readonly queues: QueueService, private readonly access: DocumentAccessService, private readonly branding: BrandingService) {}
  async list(user: RequestUser) { return this.prisma.client.documentTemplate.findMany({ where: { firmId: user.firmId }, include: { versions: { orderBy: { version: 'desc' }, select: { id: true, version: true, status: true, content: true, sourceMimeType: true, mergeSchema: true, createdAt: true } } }, orderBy: { name: 'asc' } }); }
  async save(user: RequestUser, body: z.infer<typeof SaveTemplateSchema>, id?: string) {
    let templateId = id;
    if (id && !await this.prisma.client.documentTemplate.findFirst({ where: { id, firmId: user.firmId } })) throw new NotFoundException('Template not found');
    // Catch unsupported placeholders before publication; required values are checked at generation.
    templateHtml(body.content, Object.fromEntries(MERGE_FIELDS.map(k => [k, 'Example'])));
    return this.prisma.client.$transaction(async tx => {
      if (!templateId) templateId = (await tx.documentTemplate.create({ data: { firmId: user.firmId, key: body.key, name: body.name, category: body.category } })).id;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${templateId}))`;
      const latest = await tx.documentTemplateVersion.findFirst({ where: { templateId }, orderBy: { version: 'desc' } });
      const row = await tx.documentTemplateVersion.create({ data: { templateId, version: (latest?.version ?? 0) + 1, content: JSON.stringify(body.content), mergeSchema: json({ configuration: body.configuration, fields: MERGE_FIELDS }), createdById: user.id, status: 'DRAFT' } });
      await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: 'template.version_created', entityType: 'document_template_version', entityId: row.id }, tx);
      return row;
    });
  }
  async upload(user: RequestUser, id: string, source: Buffer, configuration: z.infer<typeof TemplateConfigurationSchema>) {
    const t = await this.prisma.client.documentTemplate.findFirst({ where: { id, firmId: user.firmId } });
    if (!t) throw new NotFoundException('Template not found');
    try { validateDocx(source); } catch (e) { throw new BadRequestException(e instanceof Error ? e.message : 'Invalid Word template'); }
    const stored = await this.storage.putDocument({ filename: 'template.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: source });
    return this.prisma.client.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
      const latest = await tx.documentTemplateVersion.findFirst({ where: { templateId: id }, orderBy: { version: 'desc' } });
      const row = await tx.documentTemplateVersion.create({ data: { templateId: id, version: (latest?.version ?? 0) + 1, sourceStoragePath: stored.path, sourceMimeType: stored.mimeType, mergeSchema: json({ configuration, fields: MERGE_FIELDS, checksum: stored.checksumSha256 }), createdById: user.id } });
      await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: 'template.word_uploaded', entityType: 'document_template_version', entityId: row.id }, tx); return { id: row.id, version: row.version, status: row.status };
    });
  }
  async publish(user: RequestUser, id: string) {
    const v = await this.prisma.client.documentTemplateVersion.findFirst({ where: { id, template: { firmId: user.firmId, active: true } } });
    if (!v) throw new NotFoundException('Active template version not found');
    if (v.sourceStoragePath) validateDocx(await this.storage.readDocument(v.sourceStoragePath)); else StructuredTemplateSchema.parse(JSON.parse(v.content || '{}'));
    return this.prisma.client.$transaction(async tx => { const row = await tx.documentTemplateVersion.update({ where: { id }, data: { status: 'PUBLISHED', publishedAt: new Date() } }); await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: 'template.published', entityType: 'document_template_version', entityId: id }, tx); return { id: row.id, status: row.status }; });
  }
  async retire(user: RequestUser, id: string, active: boolean) {
    if (!await this.prisma.client.documentTemplate.findFirst({ where: { id, firmId: user.firmId } })) throw new NotFoundException('Template not found');
    return this.prisma.client.$transaction(async tx => { const row = await tx.documentTemplate.update({ where: { id }, data: { active } }); await this.audit.record({ firmId: user.firmId, actorUserId: user.id, action: 'template.availability_changed', entityType: 'document_template', entityId: id, metadata: { active } }, tx); return row; });
  }
  async generate(user: RequestUser, input: z.infer<typeof GenerateDocumentSchema>, preview = false) {
    const doc = await this.access.document(user, input.documentId);
    const v = await this.prisma.client.documentTemplateVersion.findFirst({ where: { id: input.templateVersionId, ...(preview ? {} : { status: 'PUBLISHED' }), template: { firmId: user.firmId, active: true } } });
    if (!v) throw new NotFoundException('Published template version not found');
    const matter = await this.prisma.client.matter.findUniqueOrThrow({ where: { id: doc.matterId }, include: { client: true, firm: true, proceedings: true } });
    const values: Record<string,string> = { 'firm.name': matter.firm.name, 'client.name': matter.client.displayName, 'matter.reference': matter.internalReference, 'matter.title': matter.title, 'court.name': matter.proceedings[0]?.courtName ?? '', 'date.today': new Date().toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' }), 'signatory.name': user.fullName };
    for (const [k,value] of Object.entries(input.inputs)) { if (!['input.recipient','input.subject','input.body'].includes(k)) throw new BadRequestException('Unsupported input field'); values[k] = value; }
    if (v.content) templateHtml(StructuredTemplateSchema.parse(JSON.parse(v.content)), values);
    const config = TemplateConfigurationSchema.parse((v.mergeSchema as { configuration?: unknown })?.configuration ?? {});
    const logo = config.logo === 'active' ? await this.branding.current(user.firmId) : null;
    const payload = { templateVersionId: v.id, values, configuration: config, logoVersionId: logo?.id ?? null, logoChecksum: logo?.checksumSha256 ?? null, preview };
    const payloadHash = createHash('sha256').update(JSON.stringify({ ...input, preview })).digest('hex');
    const previous = await this.prisma.client.documentOperation.findUnique({ where: { firmId_idempotencyKey: { firmId: user.firmId, idempotencyKey: input.idempotencyKey } } });
    if (previous) { if (previous.payloadHash !== payloadHash) throw new ConflictException('Request key already used'); return { id: previous.id, status: previous.status }; }
    const op = await this.prisma.client.documentOperation.create({ data: { firmId: user.firmId, actorId: user.id, documentId: doc.id, kind: 'GENERATE', idempotencyKey: input.idempotencyKey, payloadHash, payload: json(payload) } });
    try { await this.queues.add(QUEUES.documents,'document.generate',{operationId:op.id},{jobId:op.id}); } catch { await this.prisma.client.documentOperation.update({ where: { id: op.id }, data: { status: 'FAILED', error: 'Queue unavailable; retry generation' } }); }
    return { id: op.id, status: (await this.prisma.client.documentOperation.findUniqueOrThrow({ where: { id: op.id } })).status };
  }
  async retry(user: RequestUser, id: string) {
    const op = await this.prisma.client.documentOperation.findFirst({ where: { id, firmId: user.firmId, actorId: user.id, kind: 'GENERATE', status: 'FAILED' } });
    if (!op) throw new NotFoundException('Failed generation not found'); await this.access.document(user,op.documentId);
    await this.prisma.client.documentOperation.update({ where:{id},data:{status:'QUEUED',error:null} });
    await this.queues.add(QUEUES.documents,'document.generate',{operationId:id},{jobId:`${id}-retry-${Date.now()}`});
    return { id, status:'QUEUED' };
  }
}
