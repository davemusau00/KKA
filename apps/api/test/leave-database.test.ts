import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { createPrismaClient } from '@kka/database';
import { LeaveService } from '../src/modules/operations/leave.service';
import { AuditService } from '../src/platform/audit/audit.service';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

// Opt in explicitly; every row and migration belongs to a new disposable database.
test('leave persists, isolates firms, handles concurrent submissions/decisions, audits and restores availability', { skip: process.env.RUN_LEAVE_DATABASE_TESTS !== '1', timeout: 180_000 }, async () => {
  const url = new URL(process.env.DATABASE_URL!);
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname), 'Only local PostgreSQL is allowed');
  const name = `kka_leave_test_${randomUUID().replaceAll('-', '')}`;
  assert.match(name, /^kka_leave_test_[a-f0-9]{32}$/);
  const admin = createPrismaClient(url.toString());
  let created = false;
  url.pathname = `/${name}`;
  const db = createPrismaClient(url.toString());
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`); created = true;
    const root = resolve(__dirname, '../../..');
    const requireRoot = createRequire(resolve(root, 'package.json'));
    const migration = spawnSync(process.execPath, [requireRoot.resolve('prisma/build/index.js'), 'migrate', 'deploy'], { cwd: root, env: { ...process.env, DATABASE_URL: url.toString() }, encoding: 'utf8', timeout: 90_000 });
    assert.equal(migration.status, 0, `Isolated migrations failed: ${migration.stdout}\n${migration.stderr}`);
    await db.firm.createMany({ data: [{ id: 'firm', name: 'Leave test' }, { id: 'other', name: 'Other firm' }] });
    for (const [id, firmId] of [['staff', 'firm'], ['hr', 'firm'], ['outsider', 'other'], ['suspended', 'firm']]) {
      await db.user.create({ data: { id, firmId, fullName: id, email: `${id}@leave.test`, status: id === 'suspended' ? 'SUSPENDED' : 'ACTIVE' } });
    }
    const user = (id: string, firmId = 'firm', permissions: string[] = []) => ({ id, firmId, permissions, roleKeys: [], email: `${id}@leave.test`, fullName: id, homeBranchId: null });
    const staff = user('staff'), hr = user('hr', 'firm', ['hr.manage']);
    await db.employeeProfile.create({ data: { userId: 'staff', employeeNumber: 'TEST-1', employmentType: 'FULL_TIME', startDate: new Date('2020-01-01'), leavePolicyKey: 'ANNUAL' } });
    await db.leavePolicy.create({ data: { firmId: 'firm', key: 'ANNUAL', name: 'Annual', annualEntitlementDays: 3 } });
    const prisma = { client: db } as any;
    const service = new LeaveService(prisma, new AuditService(prisma));
    const year = new Date().getUTCFullYear();
    // Use a known Monday in the current year, keeping accrual deterministic.
    const monday = new Date(Date.UTC(year, 0, 1));
    while (monday.getUTCDay() !== 1) monday.setUTCDate(monday.getUTCDate() + 1);
    const date = (offset: number) => new Date(monday.getTime() + offset * 86_400_000).toISOString().slice(0, 10);
    const input = { policyKey: 'ANNUAL', startsOn: date(0), endsOn: date(1), idempotencyKey: randomUUID() };
    const concurrent = await Promise.allSettled([
      service.request(staff, input),
      service.request(staff, { ...input, startsOn: date(7), endsOn: date(8), idempotencyKey: randomUUID() }),
    ]);
    assert.equal(concurrent.filter(r => r.status === 'fulfilled').length, 1, 'Only one two-day request fits the three-day allowance');
    const saved = (concurrent.find(r => r.status === 'fulfilled') as PromiseFulfilledResult<any>).value;
    const replayInput = { ...input, startsOn: saved.startsOn.toISOString().slice(0, 10), endsOn: saved.endsOn.toISOString().slice(0, 10), idempotencyKey: saved.idempotencyKey };
    assert.equal((await service.request(staff, replayInput)).auditRef, saved.auditRef);
    await assert.rejects(() => service.request(staff, { ...replayInput, reason: 'different payload' }), ConflictException);
    assert.equal(await db.leaveRequest.count(), 1);
    await assert.rejects(() => service.transition(user('outsider', 'other', ['hr.manage']), saved.id, 'APPROVED', 0), NotFoundException);
    await assert.rejects(() => service.transition(staff, saved.id, 'APPROVED', 0), ForbiddenException);
    await assert.rejects(() => service.preview(user('suspended'), { policyKey: input.policyKey, startsOn: input.startsOn, endsOn: input.endsOn }), ForbiddenException);
    const decisions = await Promise.allSettled([service.transition(hr, saved.id, 'APPROVED', 0), service.transition(hr, saved.id, 'REJECTED', 0)]);
    assert.equal(decisions.filter(r => r.status === 'fulfilled').length, 1);
    const decided = await db.leaveRequest.findUniqueOrThrow({ where: { id: saved.id } });
    assert.equal(decided.revision, 1);
    if (decided.status === 'APPROVED') await service.transition(staff, saved.id, 'CANCELLED', 1);
    const freshService = new LeaveService({ client: db } as any, new AuditService(prisma));
    const preview = await freshService.preview(staff, { policyKey: 'ANNUAL', startsOn: date(14), endsOn: date(15) });
    assert.equal(preview.position.usedDays, 0); assert.equal(preview.position.pendingDays, 0); assert.equal(preview.position.availableDays, 3);
    assert.ok(await db.auditEvent.findUnique({ where: { id: saved.auditRef } }));
    assert.equal(await db.auditEvent.count({ where: { action: { in: ['hr.leave_approved', 'hr.leave_rejected'] } } }), 1);
    await assert.rejects(() => service.balance(user('outsider', 'other', ['hr.manage']), 'staff', 'ANNUAL', year), BadRequestException);
    await assert.rejects(() => service.balance(staff, 'hr', 'ANNUAL', year), ForbiddenException);
    const repeated = { policyKey: 'ANNUAL', startsOn: date(14), endsOn: date(15), idempotencyKey: randomUUID() };
    const [one, two] = await Promise.all([service.request(staff, repeated), service.request(staff, repeated)]);
    assert.equal(one.id, two.id); assert.equal(one.auditRef, two.auditRef);
    await db.leavePolicy.update({ where: { firmId_key: { firmId: 'firm', key: 'ANNUAL' } }, data: { annualEntitlementDays: 1 } });
    await assert.rejects(() => service.transition(hr, one.id, 'APPROVED', 0), BadRequestException);
    assert.equal((await db.leaveRequest.findUniqueOrThrow({ where: { id: one.id } })).status, 'SUBMITTED');
    await service.transition(staff, one.id, 'CANCELLED', 0);
    await assert.rejects(() => service.transition(staff, one.id, 'CANCELLED', 0), ConflictException);
    const legacy = await db.leaveRequest.create({ data: { userId: 'staff', type: 'Historical', startsOn: new Date(date(21)), endsOn: new Date(date(21)), days: 0.5, status: 'APPROVED' } });
    assert.deepEqual((await service.balance(hr, 'staff', 'ANNUAL', year)).unclassifiedRequestIds, [legacy.id]);
    await service.reconcileHistorical(hr, legacy.id, { policyKey: 'ANNUAL', revision: 0, reason: 'Reviewed legacy record against HR source' });
    const reconciled = await service.balance(hr, 'staff', 'ANNUAL', year);
    assert.equal(reconciled.usedDays, 0.5); assert.deepEqual(reconciled.unclassifiedRequestIds, []);
    await db.leavePolicy.update({ where: { firmId_key: { firmId: 'firm', key: 'ANNUAL' } }, data: { annualEntitlementDays: 10 } });
    const failingAuditService = new LeaveService(prisma, { record: async () => { throw new Error('Simulated audit failure'); } } as any);
    const beforeCount = await db.leaveRequest.count();
    await assert.rejects(() => failingAuditService.request(staff, { ...input, startsOn: date(28), endsOn: date(28), idempotencyKey: randomUUID() }), /Simulated audit failure/);
    assert.equal(await db.leaveRequest.count(), beforeCount, 'Audit failure rolls back the leave write');
  } finally {
    await db.$disconnect();
    if (created) {
      assert.match(name, /^kka_leave_test_[a-f0-9]{32}$/);
      await admin.$executeRawUnsafe(`DROP DATABASE "${name}"`);
    }
    await admin.$disconnect();
  }
});
