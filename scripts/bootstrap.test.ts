import test from 'node:test';
import assert from 'node:assert/strict';
import { createPrismaClient } from '../packages/database/src';
import { bootstrapProduction } from '../prisma/bootstrap';

test('clean bootstrap is atomic and repeatable without business fixtures or password resets', async () => {
  const url = process.env.TEST_BOOTSTRAP_DATABASE_URL;
  assert.ok(url && /^kka_bootstrap_/.test(new URL(url).pathname.slice(1)), 'Provide a fresh isolated kka_bootstrap_ database');
  const db = createPrismaClient(url);
  try {
    assert.equal(await db.firm.count(), 0, 'This test requires an empty migrated database');
    const config = { firmId: 'bootstrap-acceptance', firmName: 'Synthetic Bootstrap Firm', shortName: 'SYN', adminName: 'Bootstrap Administrator',
      adminEmail: 'bootstrap@example.test', adminPassword: 'Synthetic-bootstrap-password!', branches: [{ code: 'HQ', name: 'Reviewed Head Office' }] };
    const results = await Promise.all([bootstrapProduction(db, config), bootstrapProduction(db, config)]);
    assert.equal(results.filter(result => result.created).length, 1);
    assert.equal(await db.user.count(), 1); assert.equal(await db.branch.count(), 1);
    const user = await db.user.findUniqueOrThrow({ where: { email: config.adminEmail } });
    await bootstrapProduction(db, { ...config, adminPassword: 'A-different-password-not-to-apply!' });
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).passwordHash, user.passwordHash);
    assert.equal(await db.auditEvent.count({ where: { action: 'firm.bootstrapped' } }), 1);
    for (const count of [await db.client.count(), await db.matter.count(), await db.document.count(), await db.workflowTemplate.count(), await db.ledgerAccount.count(), await db.settingValue.count(), await db.integrationConnection.count()]) assert.equal(count, 0);
    await assert.rejects(bootstrapProduction(db, { ...config, firmId: 'another-firm', adminEmail: 'another@example.test' }), /clean database/);
    await assert.rejects(bootstrapProduction(db, { ...config, adminEmail: 'replace@example.test' }), /configuration differs/);
    assert.equal(await db.firm.count(), 1); assert.equal(await db.user.count(), 1);
  } finally { await db.$disconnect(); }
});
