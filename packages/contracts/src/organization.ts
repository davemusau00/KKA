import { z } from 'zod';

const name = z.string().trim().min(2).max(200);
const text = (max: number) => z.string().trim().max(max);
const expectedUpdatedAt = z.string().datetime();
export const FirmIdentityWriteSchema = z.object({
  expectedUpdatedAt, name, shortName: text(100),
}).strict();
export const LegalEntityWriteSchema = z.object({
  expectedUpdatedAt, name, registrationNo: text(100), kraPin: text(50), vatRegistration: text(100),
}).strict();
export const BranchContactWriteSchema = z.object({
  expectedUpdatedAt, address: text(500), postalAddress: text(300), phone: text(50),
  email: z.union([z.literal(''), z.string().trim().email().max(254)]),
}).strict();
export type FirmIdentityWrite = z.infer<typeof FirmIdentityWriteSchema>;
export type LegalEntityWrite = z.infer<typeof LegalEntityWriteSchema>;
export type BranchContactWrite = z.infer<typeof BranchContactWriteSchema>;

export interface OrganizationProfile {
  id: string; name: string; shortName: string | null; timezone: string; locale: string; currency: string; updatedAt: string;
  legalEntities: Array<{
    id: string; name: string; registrationNo: string | null; kraPin: string | null; vatRegistration: string | null;
    active: boolean; updatedAt: string;
  }>;
  branches: Array<{
    id: string; name: string; code: string; address: string | null; postalAddress: string | null;
    phone: string | null; email: string | null; active: boolean; updatedAt: string;
  }>;
}
