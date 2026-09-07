import 'dotenv/config';
import { createPrismaClient } from '../packages/database/src';
import { bootstrapProduction } from '../prisma/bootstrap';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const db = createPrismaClient(process.env.DATABASE_URL);
  try {
    const result = await bootstrapProduction(db, {
      firmId: process.env.PUBLIC_BRANDING_FIRM_ID, firmName: process.env.BOOTSTRAP_FIRM_NAME,
      shortName: process.env.BOOTSTRAP_FIRM_SHORT_NAME, adminName: process.env.BOOTSTRAP_ADMIN_NAME,
      adminEmail: process.env.BOOTSTRAP_ADMIN_EMAIL, adminPassword: process.env.BOOTSTRAP_ADMIN_PASSWORD,
      branches: JSON.parse(process.env.BOOTSTRAP_BRANCHES_JSON || 'null'),
    });
    console.log(result.created ? 'Clean firm configuration and initial administrator created.' : 'Installation already bootstrapped; no data changed.');
  } finally { await db.$disconnect(); }
}
void main().catch(error => { console.error(error instanceof Error ? error.message : 'Bootstrap failed'); process.exitCode = 1; });
