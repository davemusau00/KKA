import type { KkaPrismaClient, Prisma } from '@kka/database';
import { StructuredTemplateSchema, TemplateConfigurationSchema } from '@kka/contracts';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { documentStorage } from './storage';
import { mergeDocx, convertDocx, renderStructured } from './templates';
import { renderMarks, visibleBranding } from './index';
import { appendAudit } from './audit';
const hash = (b: Buffer) => createHash('sha256').update(b).digest('hex');
interface Payload { templateVersionId: string; values: Record<string,string>; configuration: unknown; logoVersionId: string | null; logoChecksum: string | null; preview: boolean; previewPath?: string }
export async function processGeneration(prisma: KkaPrismaClient, id: string) {
  const op = await prisma.documentOperation.findUniqueOrThrow({ where: { id } });
  if (op.status === 'COMPLETED') return { id, status: op.status };
  const claimed = await prisma.documentOperation.updateMany({ where: { id, OR: [{ status: { in: ['QUEUED','FAILED'] } }, { status: 'PROCESSING', updatedAt: { lt: new Date(Date.now()-5*60*1000) } }] }, data: { status: 'PROCESSING', attempts: { increment: 1 }, error: null } });
  if (!claimed.count) return { id, status: 'PROCESSING' };
  const attempt = (await prisma.documentOperation.findUniqueOrThrow({where:{id}})).attempts;
  const store = documentStorage(process.env.LOCAL_STORAGE_ROOT || '/srv/kklaw/data/documents');
  const markStore = documentStorage(process.env.MARK_STORAGE_ROOT || '/srv/kklaw/data/marks');
  const cleanup: string[] = [];
  try {
    const user = await prisma.user.findFirst({ where: { id: op.actorId, firmId: op.firmId, status: 'ACTIVE' }, include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } }, branches: true } });
    if (!user || !user.roles.some(r => r.role.permissions.some(p => p.permission.key === 'document.upload'))) throw new Error('Generation permission is no longer available');
    const doc = await prisma.document.findFirst({ where: { id: op.documentId, matter: { firmId: op.firmId } }, include: { matter: true } });
    if (!doc) throw new Error('Document is no longer available');
    const privileged = user.roles.some(r => ['managing_partner','technical_admin'].includes(r.role.key));
    if (!privileged && !user.branches.some(b => b.branchId === doc.matter.responsibleBranchId)) throw new Error('Matter branch access is no longer available');
    if (!privileged && ['PARTNER_ONLY','SEALED'].includes(doc.confidentialityLevel)) throw new Error('Document is restricted');
    if (!privileged && doc.confidentialityLevel === 'RESTRICTED' && doc.ownerUserId !== user.id && !await prisma.matterAssignment.findFirst({ where: { matterId: doc.matterId, userId: user.id, startsAt: { lte: new Date() }, OR: [{endsAt:null},{endsAt:{gt:new Date()}}] } })) throw new Error('Document assignment required');
    const payload = op.payload as unknown as Payload;
    const configuration = TemplateConfigurationSchema.parse(payload.configuration);
    const template = await prisma.documentTemplateVersion.findFirst({ where: { id: payload.templateVersionId, template: { firmId: op.firmId, active: true }, ...(payload.preview ? {} : { status: 'PUBLISHED' }) } });
    if (!template) throw new Error('Template is no longer available');
    let logo: Buffer | undefined;
    if (configuration.logo === 'active') {
      if (payload.logoVersionId) {
        const v = await prisma.firmMarkAssetVersion.findFirst({ where: { id: payload.logoVersionId, asset: { firmId: op.firmId, type: 'LOGO', active: true } } });
        if (!v || v.checksumSha256 !== payload.logoChecksum) throw new Error('Pinned logo is no longer available');
        logo = await markStore.readBuffer(v.storagePath); if (hash(logo) !== payload.logoChecksum) throw new Error('Logo checksum mismatch');
      } else logo = await fs.readFile(join(__dirname,'../assets/firm-logo.png'));
      logo = await visibleBranding(logo);
    }
    let pdf: Buffer, docx: Buffer | undefined;
    if (template.sourceStoragePath) {
      const source = await store.readBuffer(template.sourceStoragePath);
      const checksum = (template.mergeSchema as { checksum?: string })?.checksum;
      if (checksum && hash(source) !== checksum) throw new Error('Template checksum mismatch');
      docx = mergeDocx(source,payload.values,logo);
      pdf = await convertDocx(docx);
      if (logo && configuration.logoPlacement) pdf = await renderMarks(pdf,[{buffer:logo,placement:configuration.logoPlacement}]);
    } else pdf = await renderStructured(StructuredTemplateSchema.parse(JSON.parse(template.content || '{}')),payload.values,logo);
    const pdfStored = await store.put({ namespace:'documents', filename:payload.preview?'template-preview.pdf':'generated.pdf',mimeType:'application/pdf',buffer:pdf }); cleanup.push(pdfStored.path);
    if (payload.preview) {
      const saved = await prisma.documentOperation.updateMany({where:{id,status:'PROCESSING',attempts:attempt},data:{status:'COMPLETED',payload:{...payload,previewPath:pdfStored.path} as unknown as Prisma.InputJsonValue}});
      if (!saved.count) throw new Error('Generation lease was superseded');
      return { id,status:'COMPLETED' };
    }
    const docxStored = docx ? await store.put({ namespace:'documents',filename:'generated.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:docx }) : null;
    if (docxStored) cleanup.push(docxStored.path);
    await prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${doc.id}))`;
      const owned = await tx.documentOperation.findFirst({where:{id,status:'PROCESSING',attempts:attempt}});
      if (!owned) throw new Error('Generation lease was superseded');
      const latest = await tx.documentVersion.findFirst({where:{documentId:doc.id},orderBy:{versionNumber:'desc'}});
      let number = latest?.versionNumber ?? 0;
      const create = (s: typeof pdfStored) => tx.documentVersion.create({data:{documentId:doc.id,versionNumber:++number,storageDriver:s.driver,storagePath:s.path,originalFilename:s.originalFilename,mimeType:s.mimeType,fileSizeBytes:BigInt(s.sizeBytes),checksumSha256:s.checksumSha256,uploadedById:op.actorId,status:'DRAFT',changeSummary:`Generated from template version ${template.version}`}});
      const word = docxStored ? await create(docxStored) : null;
      const result = await create(pdfStored);
      await tx.document.update({where:{id:doc.id},data:{currentVersionId:result.id}});
      await tx.documentOperation.update({where:{id},data:{status:'COMPLETED',outputVersionId:result.id,outputDocxVersionId:word?.id}});
      const metadata = { templateVersionId:template.id,operationId:id,outputVersionId:result.id,logoVersionId:payload.logoVersionId,checksum:pdfStored.checksumSha256 };
      await appendAudit(tx,{firmId:op.firmId,actorUserId:op.actorId,action:'document.generated',entityType:'document_operation',entityId:id,matterId:doc.matterId,metadata});
    });
    return { id,status:'COMPLETED' };
  } catch (e) {
    await Promise.all(cleanup.map(path=>store.delete(path).catch(()=>undefined)));
    await prisma.documentOperation.updateMany({where:{id,status:'PROCESSING',attempts:attempt},data:{status:'FAILED',error:e instanceof Error?e.message:'Generation failed'}});
    throw e;
  }
}
