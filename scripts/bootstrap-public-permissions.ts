import 'dotenv/config';
import { createPrismaClient } from '../packages/database/src';
import { permissionKeys } from '../packages/contracts/src/permissions';
const prisma=createPrismaClient(process.env.DATABASE_URL!);
async function main(){
 const keys=permissionKeys.filter(key=>key.startsWith('website.'));
 for(const key of keys)await prisma.permission.upsert({where:{key},create:{key,category:'website',description:key},update:{}});
 const roles=await prisma.role.findMany({include:{permissions:{include:{permission:true}}}});
 for(const role of roles){const existing=new Set(role.permissions.map(p=>p.permission.key));const allowed=existing.has('admin.settings_manage')?keys:existing.has('module.clients')?['website.view','website.leads.view','website.leads.manage']:[];
  const permissions=await prisma.permission.findMany({where:{key:{in:allowed}}});for(const permission of permissions)await prisma.rolePermission.upsert({where:{roleId_permissionId:{roleId:role.id,permissionId:permission.id}},create:{roleId:role.id,permissionId:permission.id},update:{}});
 }
 console.log('Website permissions registered; existing role grants preserved.');
}
main().finally(()=>prisma.$disconnect());
