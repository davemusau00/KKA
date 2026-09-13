import test from 'node:test';
import assert from 'node:assert/strict';
import { CalculatedLeaveRequestSchema, LeaveDateSchema } from '@kka/contracts';
import { accruedEntitlement, leaveDates, leavePosition, type CalculationPolicy } from '../src/modules/operations/leave-calculation';

const policy: CalculationPolicy = { key: 'ANNUAL', annualEntitlementDays: 24, carryoverLimitDays: 5, accrualMode: 'FRONT_LOADED',
  prorateNewEmployees: true, allowNegative: false, maximumNegativeDays: 0, workingDays: [1, 2, 3, 4, 5], excludedDates: [] };

test('policy calendars preserve selected dates, exclude configured holidays, and support weekend work', () => {
  assert.deepEqual(leaveDates('2026-09-11', '2026-09-15', { ...policy, excludedDates: ['2026-09-14'] }), ['2026-09-11', '2026-09-15']);
  assert.deepEqual(leaveDates('2026-09-12', '2026-09-13', { ...policy, workingDays: [0, 6] }), ['2026-09-12', '2026-09-13']);
  assert.equal(LeaveDateSchema.safeParse('2026-02-30').success, false);
  assert.equal(LeaveDateSchema.safeParse('2026-09-13T21:00:00Z').success, false);
  assert.equal(CalculatedLeaveRequestSchema.safeParse({ policyKey: 'ANNUAL', startsOn: '2026-12-31', endsOn: '2027-01-01', idempotencyKey: crypto.randomUUID() }).success, false);
});

test('front-loaded and month-end accrual respect employment start and leap years', () => {
  assert.equal(accruedEntitlement({ ...policy, annualEntitlementDays: 366 }, 2028, '2028-07-01', '2028-07-01'), 184);
  assert.equal(accruedEntitlement({ ...policy, accrualMode: 'MONTHLY' }, 2026, '2020-01-01', '2026-03-30'), 4);
  assert.equal(accruedEntitlement({ ...policy, accrualMode: 'MONTHLY' }, 2026, '2020-01-01', '2026-03-31'), 6);
  assert.equal(accruedEntitlement({ ...policy, accrualMode: 'MONTHLY' }, 2026, '2026-01-16', '2026-01-31'), 1.03);
  assert.equal(accruedEntitlement(policy, 2027, '2020-01-01', '2026-09-13'), 0);
});

test('balances derive usage and pending requests, restore cancelled leave, and expose historical gaps', () => {
  const requests = [
    { id: 'approved', policyKey: 'ANNUAL', status: 'APPROVED', days: 6 },
    { id: 'pending', policyKey: 'ANNUAL', status: 'SUBMITTED', days: 3 },
    { id: 'cancelled', policyKey: 'ANNUAL', status: 'CANCELLED', days: 50 },
    { id: 'other-policy', policyKey: 'SICK', status: 'APPROVED', days: 8 },
    { id: 'legacy', policyKey: null, status: 'APPROVED', days: 2 },
  ];
  const args = { policy, year: 2026, employmentStart: '2020-01-01', asOf: '2026-09-13', balance: { openingDays: 9, adjustmentDays: 1 }, requests };
  const result = leavePosition(args);
  assert.equal(result.openingDays, 5);
  assert.equal(result.usedDays, 6);
  assert.equal(result.availableDays, 24);
  assert.equal(result.projectedAvailableDays, 21);
  assert.deepEqual(result.unclassifiedRequestIds, ['legacy']);
  const cancelled = leavePosition({ ...args, requests: requests.map(r => r.id === 'approved' ? { ...r, status: 'CANCELLED' } : r) });
  assert.equal(cancelled.availableDays, result.availableDays + 6);
});
