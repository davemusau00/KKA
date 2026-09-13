import { BadRequestException } from '@nestjs/common';
import type { LeavePosition } from '@kka/contracts';

const DAY = 86_400_000;
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export type CalculationPolicy = {
  key: string; annualEntitlementDays: unknown; carryoverLimitDays: unknown;
  accrualMode: string; prorateNewEmployees: boolean; allowNegative: boolean;
  maximumNegativeDays: unknown; workingDays: number[]; excludedDates: string[];
};

export function leaveDates(startsOn: string, endsOn: string, policy: CalculationPolicy) {
  const start = Date.parse(`${startsOn}T00:00:00Z`), end = Date.parse(`${endsOn}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || end - start > 366 * DAY) throw new BadRequestException('Invalid leave date range');
  const excluded = new Set(policy.excludedDates), dates: string[] = [];
  for (let time = start; time <= end; time += DAY) {
    const date = new Date(time), key = date.toISOString().slice(0, 10);
    if (policy.workingDays.includes(date.getUTCDay()) && !excluded.has(key)) dates.push(key);
  }
  return dates;
}

// Monthly entitlement accrues at each completed calendar month end. New starters
// receive a calendar-day proportion of their first month when proration is enabled.
export function accruedEntitlement(policy: CalculationPolicy, year: number, employmentStart: string, asOf: string) {
  const yearStart = Date.UTC(year, 0, 1), nextYear = Date.UTC(year + 1, 0, 1);
  const employed = Date.parse(`${employmentStart}T00:00:00Z`), today = Date.parse(`${asOf}T00:00:00Z`);
  if (today < yearStart || employed >= nextYear || employed > today) return 0;
  const entitlement = Number(policy.annualEntitlementDays);
  if (policy.accrualMode === 'FRONT_LOADED') {
    const fraction = policy.prorateNewEmployees ? (nextYear - Math.max(employed, yearStart)) / (nextYear - yearStart) : 1;
    return round(entitlement * fraction);
  }
  if (policy.accrualMode !== 'MONTHLY') throw new BadRequestException('Unsupported leave accrual mode');
  let months = 0;
  for (let month = 0; month < 12; month++) {
    const from = Date.UTC(year, month, 1), until = Date.UTC(year, month + 1, 1);
    if (until - DAY > today || employed >= until) continue;
    months += policy.prorateNewEmployees ? (until - Math.max(from, employed)) / (until - from) : 1;
  }
  return round(entitlement * months / 12);
}

export function leavePosition(input: {
  policy: CalculationPolicy; year: number; employmentStart: string; asOf: string;
  balance: { openingDays: unknown; adjustmentDays: unknown } | null;
  requests: Array<{ id: string; policyKey: string | null; status: string; days: unknown }>;
}): LeavePosition {
  const { policy, year, employmentStart, asOf, balance, requests } = input;
  const opening = Number(balance?.openingDays ?? 0);
  const openingDays = round(policy.carryoverLimitDays == null ? opening : Math.min(opening, Number(policy.carryoverLimitDays)));
  const accruedDays = accruedEntitlement(policy, year, employmentStart, asOf);
  const adjustmentDays = Number(balance?.adjustmentDays ?? 0);
  const sum = (status: string) => round(requests.filter(r => r.policyKey === policy.key && r.status === status).reduce((total, r) => total + Number(r.days), 0));
  const usedDays = sum('APPROVED'), pendingDays = sum('SUBMITTED');
  const availableDays = round(openingDays + accruedDays + adjustmentDays - usedDays);
  return { policyKey: policy.key, year, asOf, openingDays, accruedDays, adjustmentDays, usedDays, pendingDays, availableDays,
    projectedAvailableDays: round(availableDays - pendingDays), minimumBalance: policy.allowNegative ? -Number(policy.maximumNegativeDays) : 0,
    unclassifiedRequestIds: requests.filter(r => !r.policyKey && ['SUBMITTED', 'APPROVED'].includes(r.status)).map(r => r.id) };
}
