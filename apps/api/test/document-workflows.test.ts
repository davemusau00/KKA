import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createPrismaClient } from '@kka/database';
import { PDFDocument } from 'pdf-lib';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import argon2 from 'argon2';
const base=process.env.TEST_API_URL||'http://localhost:3015/api/v1';
const db=createPrismaClient(process.env.DATABASE_URL!);
const password=process.env.SEED_ADMIN_PASSWORD!;
let cookie='', approverCookie='', limitedCookie='', outsiderCookie='', docId='', inputId='', logoId='', stampId='', signatureId='', adminId='', advocateId='';
let image:Buffer;
async function login(email:string){const r=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});assert.equal(r.status,201);return r.headers.getSetCookie()[0]!.split(';')[0]!;}
async function request(path:string,body?:unknown,method=body===undefined?'GET':'POST',session=cookie){const r=await fetch(base+path,{method,headers:{Cookie:session,...(body instanceof FormData?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body)});return r;}
async function ok<T=Record<string,unknown>>(path:string,body?:unknown,method?:string,session?:string):Promise<T>{const r=await request(path,body,method,session);const data=await r.json();assert.ok(r.ok,`${path} ${r.status}: ${JSON.stringify(data)}`);return data as T;}
const upload=(buffer:Buffer,mime='image/png',filename='test.png')=>{const data=new FormData();data.append('file',new Blob([new Uint8Array(buffer)],{type:mime}),filename);return data;};
const marks=(versionId=logoId)=>({documentId:docId,inputVersionId:inputId,idempotencyKey:randomUUID(),reason:'Synthetic workflow acceptance',items:[{kind:'mark',versionId,placement:{page:1,x:40,y:40,width:100,height:60,rotation:0,opacity:1}}]});
before(async()=>{
  assert.match(process.env.DATABASE_URL||'',/kka_documents_/,'Use the isolated document test database');
  const admin=await db.user.findUniqueOrThrow({where:{email:process.env.SEED_ADMIN_EMAIL!}});adminId=admin.id;
  const branch=await db.branch.findFirstOrThrow({where:{firmId:admin.firmId,code:'NRB'}});
  const hash=await argon2.hash(password);
  for(const [id,email,roleKey] of [['doc-test-approver','documents.approver@example.test','managing_partner'],['doc-test-advocate','documents.advocate@example.test','advocate'],['doc-test-limited','documents.limited@example.test','paralegal']]){
    const role=await db.role.findFirstOrThrow({where:{firmId:admin.firmId,key:roleKey}});
    const u=await db.user.upsert({where:{id},create:{id,email,firmId:admin.firmId,fullName:`Synthetic ${roleKey}`,passwordHash:hash,status:'ACTIVE',homeBranchId:branch.id},update:{passwordHash:hash,status:'ACTIVE'}});
    await db.userRole.upsert({where:{userId_roleId:{userId:u.id,roleId:role.id}},create:{userId:u.id,roleId:role.id},update:{}});
    await db.userBranch.upsert({where:{userId_branchId:{userId:u.id,branchId:branch.id}},create:{userId:u.id,branchId:branch.id},update:{}});
    if(roleKey==='advocate')advocateId=u.id;
  }
  await db.firm.upsert({where:{id:'doc-test-other-firm'},create:{id:'doc-test-other-firm',name:'Synthetic Other Firm'},update:{}});
  await db.user.upsert({where:{id:'doc-test-outsider'},create:{id:'doc-test-outsider',firmId:'doc-test-other-firm',email:'documents.outsider@example.test',fullName:'Synthetic outsider',passwordHash:hash,status:'ACTIVE'},update:{passwordHash:hash}});
  const role=await db.role.findFirstOrThrow({where:{firmId:admin.firmId,key:'technical_admin'}});
  // Test-only outsider gets the same permissions, to exercise firm scoping independently of role denial.
  await db.userRole.upsert({where:{userId_roleId:{userId:'doc-test-outsider',roleId:role.id}},create:{userId:'doc-test-outsider',roleId:role.id},update:{}});
  const client=await db.client.upsert({where:{id:'doc-demo-client'},create:{id:'doc-demo-client',firmId:admin.firmId,displayName:'Synthetic Client - Demonstration Only'},update:{}});
  await db.matter.upsert({where:{id:'doc-demo-matter'},create:{id:'doc-demo-matter',firmId:admin.firmId,clientId:client.id,internalReference:'DEMO/DOCUMENTS/001',title:'Synthetic document demonstration',practiceArea:'Commercial',matterType:'Demonstration',originatingBranchId:branch.id,responsibleBranchId:branch.id,supervisingUserId:admin.id},update:{}});
  cookie=await login(process.env.SEED_ADMIN_EMAIL!);approverCookie=await login('documents.approver@example.test');limitedCookie=await login('documents.limited@example.test');outsiderCookie=await login('documents.outsider@example.test');
  image=await fs.readFile(resolve('../../apps/web/public/firm-logo.png'));
  const doc=await ok<{id:string}>('/documents',{matterId:'doc-demo-matter',title:'Synthetic PDF acceptance '+Date.now(),documentType:'Letter',category:'Test',confidentialityLevel:'STANDARD'});docId=doc.id;
  const pdf=await PDFDocument.create();pdf.addPage([595,842]).drawText('Synthetic acceptance document',{x:40,y:790});pdf.addPage([595,842]);
  inputId=(await ok<{id:string}>(`/documents/${docId}/versions`,upload(Buffer.from(await pdf.save()),'application/pdf','original.pdf'))).id;
  for(const [type,variable] of [['LOGO','logo'],['RECEIVED_STAMP','stamp']]){const asset=await ok<{id:string}>('/marks',{displayName:`Synthetic ${type}`,type});const v=await ok<{id:string}>(`/marks/${asset.id}/versions`,upload(image));if(variable==='logo')logoId=v.id;else stampId=v.id;}
});
after(async()=>db.$disconnect());
test('branding persists, publishes only selected image, and restores default',async()=>{
  const result=await ok<{versionId:string;imageUrl:string}>('/branding/logo',upload(image));assert.ok(result.versionId);
  const current=await ok<{versionId:string}>('/branding');assert.equal(current.versionId,result.versionId);
  const publicMeta=await (await fetch(base+'/branding/public')).json();assert.equal(publicMeta.versionId,result.versionId);
  const publicImage=await fetch(new URL(publicMeta.imageUrl,base));assert.equal(publicImage.status,200);
  assert.equal((await fetch(base+`/marks/versions/${stampId}/preview`)).status,401);
  assert.equal((await request('/branding/logo',upload(image),'POST',limitedCookie)).status,403);
  assert.equal((await request('/branding/logo',upload(image),'POST',outsiderCookie)).status,201);
  assert.equal((await (await fetch(base+'/branding/public')).json()).versionId,result.versionId);
  await ok('/branding/restore-default',{});assert.equal((await ok<{source:string}>('/branding')).source,'default');
});
test('corrupt images, false MIME, and generic setting bypass fail',async()=>{
  assert.equal((await request('/branding/logo',upload(Buffer.from('bad')))).status,400);
  assert.equal((await request('/branding/logo',upload(image,'image/jpeg'))).status,400);
  assert.equal((await request('/settings/firm.branding.logo',{scopeType:'FIRM',scopeId:'kka-firm',value:{versionId:stampId}})).status,400);
});
test('preview and multi-page application preserve original and create one audited draft',async()=>{
  const input=await db.documentVersion.findUniqueOrThrow({where:{id:inputId}});
  const data=marks();data.items.push({...data.items[0]!,placement:{...data.items[0]!.placement,page:2}});
  const preview=await request('/document-operations/preview',data);assert.equal(preview.status,201);assert.match(preview.headers.get('content-type')! ,/application\/pdf/);
  const result=await ok<{id:string;status:string;outputVersionId:string}>('/document-operations/apply',data);assert.equal(result.status,'COMPLETED');
  const repeat=await ok<{id:string}>('/document-operations/apply',data);assert.equal(repeat.id,result.id);
  const output=await db.documentVersion.findUniqueOrThrow({where:{id:result.outputVersionId}});assert.equal(output.status,'DRAFT');assert.notEqual(output.checksumSha256,input.checksumSha256);
  assert.equal((await db.documentVersion.findUniqueOrThrow({where:{id:inputId}})).checksumSha256,input.checksumSha256);
  assert.equal(await db.documentMarkApplication.count({where:{operationId:result.id}}),2);
  assert.equal(await db.auditEvent.count({where:{entityId:result.id,action:'document.marks_applied'}}),1);
  assert.equal((await request('/document-operations/apply',{...data,reason:'Changed content'})).status,409);
});
test('out-of-bounds, cross-firm, and permission denied applications fail',async()=>{
  const data=marks();data.items[0]!.placement.x=590;assert.equal((await request('/document-operations/preview',data)).status,400);
  assert.equal((await request('/document-operations/apply',marks(),'POST',outsiderCookie)).status,404);
  assert.equal((await request('/document-operations/apply',marks(),'POST',limitedCookie)).status,403);
});
test('controlled stamps require password confirmation and retired marks cannot be used',async()=>{
  assert.equal((await request('/document-operations/apply',marks(stampId))).status,403);
  const token=await ok<{elevationToken:string}>('/auth/elevate',{password});
  assert.equal((await ok<{status:string}>('/document-operations/apply',{...marks(stampId),elevationToken:token.elevationToken})).status,'COMPLETED');
  const stamp=await db.firmMarkAssetVersion.findUniqueOrThrow({where:{id:stampId}});await ok(`/marks/${stamp.assetId}`,{active:false},'PATCH');
  assert.equal((await request('/document-operations/apply',{...marks(stampId),elevationToken:token.elevationToken})).status,404);await ok(`/marks/${stamp.assetId}`,{active:true},'PATCH');
});
test('approval remains distinct from execution and requester cannot self-approve',async()=>{
  const asset=await db.firmMarkAssetVersion.findUniqueOrThrow({where:{id:stampId}});await ok(`/marks/${asset.assetId}`,{requiresApproval:true,approvalRoleKeys:['managing_partner']},'PATCH');
  const token=await ok<{elevationToken:string}>('/auth/elevate',{password});const op=await ok<{id:string;status:string;approvalRequestId:string}>('/document-operations/apply',{...marks(stampId),elevationToken:token.elevationToken});assert.equal(op.status,'PENDING_APPROVAL');
  assert.equal((await request(`/approvals/${op.approvalRequestId}/decision`,{decision:'APPROVED'})).status,400);
  await ok(`/approvals/${op.approvalRequestId}/decision`,{decision:'APPROVED'},'POST',approverCookie);
  assert.equal((await db.documentOperation.findUniqueOrThrow({where:{id:op.id}})).status,'COMPLETED');
  const pending=await ok<{id:string;approvalRequestId:string}>('/document-operations/apply',{...marks(stampId),elevationToken:token.elevationToken});
  await ok(`/marks/${asset.assetId}`,{active:false},'PATCH');
  await ok(`/approvals/${pending.approvalRequestId}/decision`,{decision:'APPROVED'},'POST',approverCookie);
  assert.equal((await db.documentOperation.findUniqueOrThrow({where:{id:pending.id}})).status,'FAILED');
  await ok(`/marks/${asset.assetId}`,{active:true,requiresApproval:false},'PATCH');
  const retry=await ok<{status:string}>(`/document-operations/${pending.id}/retry`,{elevationToken:token.elevationToken});assert.equal(retry.status,'COMPLETED');
});
test('signature uploads reset approval, raw assets stay private, and expired delegation fails',async()=>{
  const profile=await ok<{id:string}>('/marks/signature-profiles',{userId:adminId,professionalDisplayName:'SYNTHETIC TEST SIGNATURE',approvalStatus:'PENDING'});
  signatureId=(await ok<{id:string}>(`/marks/signature-profiles/${profile.id}/assets`,upload(image))).id;
  const token=await ok<{elevationToken:string}>('/auth/elevate',{password});const data={...marks(),elevationToken:token.elevationToken,items:[{...marks().items[0],kind:'signature',versionId:signatureId}]};
  assert.equal((await request('/document-operations/apply',data)).status,404);
  await ok('/marks/signature-profiles',{userId:adminId,professionalDisplayName:'SYNTHETIC TEST SIGNATURE',approvalStatus:'APPROVED'});
  const result=await ok<{status:string;id:string}>('/document-operations/apply',data);assert.equal(result.status,'COMPLETED');assert.equal(await db.documentMarkApplication.count({where:{operationId:result.id,signatureAssetVersionId:signatureId}}),1);
  assert.equal((await request(`/marks/signature-versions/${signatureId}/preview`,undefined,'GET',limitedCookie)).status,404);
  const advocateCookie=await login('documents.advocate@example.test');const elevate=await ok<{elevationToken:string}>('/auth/elevate',{password},'POST',advocateCookie);
  await db.signatureDelegation.create({data:{delegatorProfileId:profile.id,delegateUserId:advocateId,allowedActions:['APPLY'],allowedMatterTypes:[],allowedDocumentTypes:[],startsAt:new Date(Date.now()-20000),endsAt:new Date(Date.now()-10000),reason:'Synthetic expired delegation'}});
  assert.equal((await request('/document-operations/apply',{...data,idempotencyKey:randomUUID(),elevationToken:elevate.elevationToken},'POST',advocateCookie)).status,403);
});
test('simultaneous distinct applications allocate unique document versions',async()=>{
  const results=await Promise.all([ok<{status:string;outputVersionId:string}>('/document-operations/apply',marks()),ok<{status:string;outputVersionId:string}>('/document-operations/apply',marks())]);
  assert.ok(results.every(r=>r.status==='COMPLETED'));assert.notEqual(results[0]!.outputVersionId,results[1]!.outputVersionId);
});
