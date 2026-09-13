import { z } from 'zod';

export const LeaveDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Use a valid calendar date (YYYY-MM-DD)');

export const CalculatedLeavePolicySchema = z.object({
  key: z.string().trim().min(2).max(80), name: z.string().trim().min(2).max(200),
  annualEntitlementDays: z.number().nonnegative().max(366),
  carryoverLimitDays: z.number().nonnegative().max(366).nullable().optional(),
  active: z.boolean().optional(),
  accrualMode: z.enum(['FRONT_LOADED', 'MONTHLY']).default('FRONT_LOADED'),
  prorateNewEmployees: z.boolean().default(true),
  allowNegative: z.boolean().default(false), maximumNegativeDays: z.number().nonnegative().max(366).default(0),
  workingDays: z.array(z.number().int().min(0).max(6)).min(1).max(7).default([1, 2, 3, 4, 5]),
  excludedDates: z.array(LeaveDateSchema).max(2000).default([]),
}).strict();

export const LeavePreviewSchema = z.object({
  policyKey: z.string().min(2).max(80), startsOn: LeaveDateSchema, endsOn: LeaveDateSchema,
}).strict().refine(v => v.endsOn >= v.startsOn, 'End date must be on or after start date')
  .refine(v => v.startsOn.slice(0, 4) === v.endsOn.slice(0, 4), 'Submit a separate request for each leave year');
export const CalculatedLeaveRequestSchema = LeavePreviewSchema.safeExtend({
  reason: z.string().max(5000).optional(), idempotencyKey: z.string().uuid(),
});
export const LeaveDecisionSchema = z.object({ decision: z.enum(['APPROVED', 'REJECTED']), revision: z.number().int().nonnegative(), reason: z.string().max(3000).optional() }).strict();
export const LeaveCancelSchema = z.object({ revision: z.number().int().nonnegative() }).strict();
export type CalculatedLeaveRequest = z.infer<typeof CalculatedLeaveRequestSchema>;
export type CalculatedLeavePolicyInput = z.input<typeof CalculatedLeavePolicySchema>;
export type LeavePreviewInput = z.infer<typeof LeavePreviewSchema>;
export type LeavePosition = {
  policyKey: string; year: number; asOf: string; openingDays: number; accruedDays: number;
  adjustmentDays: number; usedDays: number; pendingDays: number; availableDays: number;
  projectedAvailableDays: number; minimumBalance: number; unclassifiedRequestIds: string[];
};
export type LeavePreview = { days: number; chargeableDates: string[]; position: LeavePosition; sufficient: boolean };
