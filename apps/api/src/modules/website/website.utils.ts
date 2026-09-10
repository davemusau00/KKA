import { createHash } from 'node:crypto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { env } from '../../platform/env';
import type { PrismaService } from '../../platform/prisma/prisma.service';

export function publicFirmId(): string {
  const id = env().PUBLIC_BRANDING_FIRM_ID;
  if (!id) throw new BadRequestException('PUBLIC_BRANDING_FIRM_ID is required for the public website');
  return id;
}

export function slugify(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
  if (!slug) throw new BadRequestException('A valid slug could not be generated');
  return slug;
}

export function hashSensitive(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function normalizeKenyanPhone(value: string): string {
  const digits = value.replace(/[^0-9+]/g, '');
  if (/^0[17]\d{8}$/.test(digits)) return `+254${digits.slice(1)}`;
  if (/^254[17]\d{8}$/.test(digits)) return `+${digits}`;
  return digits;
}

export function publicAssetUrl(id: string, checksum?: string | null): string {
  const q = checksum ? `?v=${encodeURIComponent(checksum.slice(0, 16))}` : '';
  return `${env().API_PUBLIC_URL}${env().API_PREFIX}/website/public/media/${encodeURIComponent(id)}${q}`;
}

export async function assertFirmUser(prisma: PrismaService, firmId: string, userId: string) {
  const user = await prisma.client.user.findFirst({ where: { id: userId, firmId, status: 'ACTIVE' } });
  if (!user) throw new NotFoundException('Active firm user not found');
  return user;
}

export function contentPublished(status: string, publishedAt?: Date | null, scheduledFor?: Date | null) {
  if (status !== 'PUBLISHED') return false;
  const now = Date.now();
  if (scheduledFor && scheduledFor.getTime() > now) return false;
  if (publishedAt && publishedAt.getTime() > now) return false;
  return true;
}
