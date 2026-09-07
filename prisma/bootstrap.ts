import argon2 from 'argon2';
import type { KkaPrismaClient } from '../packages/database/src';
import { BootstrapConfigSchema } from '../packages/contracts/src/bootstrap';
import { permissionKeys } from '../packages/contracts/src/permissions';
import { appendAudit } from '../packages/document-engine/src/audit';

/** One-time clean installation. Never resets an existing password, roles or policies. */
export async function bootstrapProduction(db: KkaPrismaClient, input: unknown) {
  const config = BootstrapConfigSchema.parse(input);
  const passwordHash = await argon2.hash(config.adminPassword, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 });
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('kka:production-bootstrap'))`;
    const previous = await tx.auditEvent.findFirst({ where: { firmId: config.firmId, action: 'firm.bootstrapped' } });
    if (previous) {
      const firm = await tx.firm.findUniqueOrThrow({ where: { id: config.firmId } });
      const admin = await tx.user.findUnique({ where: { email: config.adminEmail } });
      if (firm.name !== config.firmName || firm.shortName !== config.shortName || admin?.id !== previous.actorUserId) throw new Error('Bootstrap configuration differs from the existing installation. Use audited administration.');
      return { firmId: firm.id, adminId: admin.id, created: false };
    }
    if (await tx.firm.count() || await tx.user.count() || await tx.client.count() || await tx.matter.count()) {
      throw new Error('Production bootstrap requires a clean database. Existing/demo records cannot be promoted.');
    }
    const firm = await tx.firm.create({ data: { id: config.firmId, name: config.firmName, shortName: config.shortName } });
    const entity = await tx.legalEntity.create({ data: { firmId: firm.id, name: firm.name } });
    const branches = [];
    for (const branch of config.branches) branches.push(await tx.branch.create({ data: { ...branch, firmId: firm.id, legalEntityId: entity.id } }));
    const role = await tx.role.create({ data: { firmId: firm.id, key: 'technical_admin', name: 'Technical Administrator', system: true } });
    for (const key of permissionKeys) {
      const permission = await tx.permission.upsert({ where: { key }, update: {}, create: { key, category: key.split('.')[0]!, description: key } });
      await tx.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } });
    }
    const admin = await tx.user.create({ data: { firmId: firm.id, email: config.adminEmail, fullName: config.adminName, passwordHash,
      status: 'ACTIVE', jobTitle: 'Technical Administrator', homeBranchId: branches[0]!.id,
      roles: { create: { roleId: role.id } }, branches: { create: branches.map(branch => ({ branchId: branch.id })) } } });
    await appendAudit(tx, { firmId: firm.id, actorUserId: admin.id, action: 'firm.bootstrapped', entityType: 'firm', entityId: firm.id,
      metadata: { branchCodes: config.branches.map(branch => branch.code), source: 'reviewed-production-bootstrap' } });
    return { firmId: firm.id, adminId: admin.id, created: true };
  }, { timeout: 30000 });
}
