import { z } from 'zod';

export const BootstrapConfigSchema = z.object({
  firmId: z.string().min(2).max(100),
  firmName: z.string().min(3).max(200),
  shortName: z.string().min(2).max(30),
  adminEmail: z.string().email().transform(value => value.trim().toLowerCase()),
  adminName: z.string().min(3).max(200),
  adminPassword: z.string().min(14).max(256),
  branches: z.array(z.object({ code: z.string().regex(/^[A-Z0-9_-]{2,12}$/), name: z.string().min(2).max(200) })).min(1).max(100),
}).strict().refine(value => new Set(value.branches.map(branch => branch.code)).size === value.branches.length, 'Branch codes must be unique');
