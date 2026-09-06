import sharp from 'sharp';
export * from './templates';
export * from './storage';
export * from './generation';
export * from './examples';
export * from './audit';
import { PDFDocument, degrees } from 'pdf-lib';
import { z } from 'zod';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export async function visibleBranding(buffer: Buffer) {
  const decoded = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let maximum = 0;
  for (let i = 3; i < decoded.data.length; i += 4) maximum = Math.max(maximum, decoded.data[i]!);
  if (maximum > 0 && maximum < 64) {
    for (let i = 3; i < decoded.data.length; i += 4) decoded.data[i] = Math.round(decoded.data[i]! * 255 / maximum);
    return sharp(decoded.data, { raw: { width: decoded.info.width, height: decoded.info.height, channels: 4 } }).png().toBuffer();
  }
  return buffer;
}
export async function validateImage(buffer: Buffer, mimeType: string) {
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw new Error('Images must be between 1 byte and 5 MiB');
  const image = sharp(buffer, { limitInputPixels: 4096 * 4096, failOn: 'warning', animated: false });
  const meta = await image.metadata();
  if (!['png', 'jpeg'].includes(meta.format ?? '') || mimeType !== (meta.format === 'png' ? 'image/png' : 'image/jpeg')) throw new Error('Upload a PNG or JPEG with the correct content type');
  if (!meta.width || !meta.height || meta.width > 4096 || meta.height > 4096 || (meta.pages ?? 1) > 1) throw new Error('Image dimensions must not exceed 4096 pixels');
  // Fully decode rather than trusting the header, and strip metadata.
  const normalized = await image.rotate().png().toBuffer({ resolveWithObject: true });
  return { buffer: normalized.data, width: normalized.info.width, height: normalized.info.height, transparent: meta.hasAlpha === true, mimeType: 'image/png' as const };
}

export const PlacementSchema = z.object({
  page: z.number().int().positive(), x: z.number().finite().nonnegative(), y: z.number().finite().nonnegative(),
  width: z.number().finite().positive(), height: z.number().finite().positive(),
  rotation: z.number().finite().min(-180).max(180).default(0), opacity: z.number().min(0.1).max(1).default(1)
});
export type Placement = z.infer<typeof PlacementSchema>;
export function validatePlacement(p: Placement, width: number, height: number) {
  const angle = p.rotation * Math.PI / 180;
  const points = [[0, 0], [p.width, 0], [0, p.height], [p.width, p.height]].map(([x, y]) => [p.x + x! * Math.cos(angle) - y! * Math.sin(angle), p.y + x! * Math.sin(angle) + y! * Math.cos(angle)]);
  if (points.some(([x, y]) => x! < -0.001 || y! < -0.001 || x! > width + 0.001 || y! > height + 0.001)) throw new Error('Placement extends outside the PDF page');
}
export async function renderMarks(input: Buffer, marks: Array<{ buffer: Buffer; placement: Placement }>) {
  const pdf = await PDFDocument.load(input);
  for (const mark of marks) {
    const p = PlacementSchema.parse(mark.placement);
    const page = pdf.getPage(p.page - 1);
    if (!page) throw new Error('Page does not exist');
    validatePlacement(p, page.getWidth(), page.getHeight());
    const img = await pdf.embedPng(mark.buffer);
    page.drawImage(img, { x: p.x, y: p.y, width: p.width, height: p.height, rotate: degrees(p.rotation), opacity: p.opacity });
  }
  return Buffer.from(await pdf.save());
}
