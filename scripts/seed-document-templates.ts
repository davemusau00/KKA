import { createPrismaClient } from '../packages/database/src';
import { demonstrationLetter, demonstrationPleading, demonstrationDocx, documentStorage, MERGE_FIELDS } from '../packages/document-engine/src';
async function main() {
  if (!process.env.DATABASE_URL || !process.env.PUBLIC_BRANDING_FIRM_ID) throw new Error('DATABASE_URL and PUBLIC_BRANDING_FIRM_ID are required');
  const db=createPrismaClient(process.env.DATABASE_URL);
  try {
    const firm=await db.firm.findUniqueOrThrow({where:{id:process.env.PUBLIC_BRANDING_FIRM_ID}});
    const user=await db.user.findFirstOrThrow({where:{firmId:firm.id,email:process.env.SEED_ADMIN_EMAIL,status:'ACTIVE'}});
    const store=documentStorage(process.env.LOCAL_STORAGE_ROOT||'/srv/kklaw/data/documents');
    for(const [key,name,content,word] of [
      ['demo-letter','Demonstration letter',demonstrationLetter,false],
      ['demo-pleading','Demonstration pleading',demonstrationPleading,false],
      ['demo-word-letter','Demonstration Word letter',demonstrationLetter,true],
    ] as const) {
      if(await db.documentTemplate.findUnique({where:{firmId_key:{firmId:firm.id,key}}})) continue;
      const source=word?await store.put({namespace:'templates',filename:'demonstration-letter.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:demonstrationDocx()}):null;
      await db.documentTemplate.create({data:{firmId:firm.id,key,name,category:'Synthetic demonstration',versions:{create:{version:1,status:'DRAFT',createdById:user.id,content:word?null:JSON.stringify(content),sourceStoragePath:source?.path,sourceMimeType:source?.mimeType,mergeSchema:{configuration:{logo:'active',marks:[]},fields:[...MERGE_FIELDS],...(source?{checksum:source.checksumSha256}:{})}}}}});
      console.log(`Created draft: ${name}`);
    }
  } finally {await db.$disconnect();}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
