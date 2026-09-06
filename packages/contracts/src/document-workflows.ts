import { z } from 'zod';
export const PdfPlacementSchema = z.object({ page: z.number().int().positive(), x: z.number().finite().nonnegative(), y: z.number().finite().nonnegative(), width: z.number().finite().positive(), height: z.number().finite().positive(), rotation: z.number().min(-180).max(180).default(0), opacity: z.number().min(0.1).max(1).default(1) });
export const DocumentMarkItemSchema = z.object({ kind: z.enum(['mark', 'signature']), versionId: z.string().min(1), placement: PdfPlacementSchema });
export const ApplyDocumentMarksSchema = z.object({ documentId: z.string().min(1), inputVersionId: z.string().min(1), idempotencyKey: z.string().min(8).max(150), items: z.array(DocumentMarkItemSchema).min(1).max(50), reason: z.string().min(2).max(2000), elevationToken: z.string().optional() });
export type ApplyDocumentMarks = z.infer<typeof ApplyDocumentMarksSchema>;
export const TemplateBlockSchema = z.object({ type: z.enum(['heading','paragraph','table']), text: z.string().max(20000).default(''), rows: z.array(z.array(z.string().max(2000))).max(100).optional() });
export const StructuredTemplateSchema = z.object({ header: z.string().max(5000).default(''), footer: z.string().max(5000).default(''), blocks: z.array(TemplateBlockSchema).min(1).max(200) });
export const TemplateConfigurationSchema = z.object({ logo: z.enum(['active','none']).default('active'), logoPlacement: PdfPlacementSchema.optional(), marks: z.array(DocumentMarkItemSchema).max(50).default([]) });
export const GenerateDocumentSchema = z.object({ documentId: z.string().min(1), templateVersionId: z.string().min(1), idempotencyKey: z.string().min(8).max(150), inputs: z.record(z.string(), z.string().max(10000)).default({}) });
