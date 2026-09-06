import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateImage, renderMarks, validatePlacement, merge, templateHtml, validateDocx } from './index';
import { LocalPrivateStorageDriver } from './storage/local.storage';
import { demonstrationDocx, mergeDocx, MERGE_FIELDS } from './index';
test('decodes images, preserves dimensions and rejects false MIME and corrupt content',async()=>{
  const image=await sharp({create:{width:320,height:80,channels:4,background:'#b9a48c'}}).png().toBuffer();
  const result=await validateImage(image,'image/png');assert.equal(result.width,320);assert.equal(result.height,80);assert.equal(result.transparent,true);
  await assert.rejects(validateImage(image,'image/jpeg'));await assert.rejects(validateImage(Buffer.from('not an image'),'image/png'));await assert.rejects(validateImage(Buffer.alloc(5*1024*1024+1),'image/png'));
});
test('rejects dimension limits even when compressed file is small',async()=>{const image=await sharp({create:{width:4097,height:1,channels:3,background:'#fff'}}).png().toBuffer();await assert.rejects(validateImage(image,'image/png'));});
test('multi-page PDF application preserves original bytes and rejects rotated overflow',async()=>{
  const pdf=await PDFDocument.create();pdf.addPage([595,842]);pdf.addPage([595,842]);const input=Buffer.from(await pdf.save()),original=Buffer.from(input);
  const buffer=await sharp({create:{width:100,height:50,channels:4,background:'#b9a48c'}}).png().toBuffer();
  const output=await renderMarks(input,[1,2].map(page=>({buffer,placement:{page,x:50,y:50,width:100,height:50,rotation:0,opacity:1}})));
  assert.deepEqual(input,original);assert.notDeepEqual(input,output);assert.equal((await PDFDocument.load(output)).getPageCount(),2);
  assert.throws(()=>validatePlacement({page:1,x:0,y:0,width:100,height:100,rotation:45,opacity:1},595,842));
  await assert.rejects(renderMarks(input,[{buffer,placement:{page:3,x:50,y:50,width:100,height:50,rotation:0,opacity:1}}]));
});
test('merge fields are allowlisted, missing values fail, and content is escaped',()=>{
  assert.equal(merge('Dear {client.name}',{'client.name':'Test Client'}),'Dear Test Client');assert.throws(()=>merge('{process.env}',{}));assert.throws(()=>merge('{client.name}',{}));
  assert.match(templateHtml({header:'',footer:'',blocks:[{type:'paragraph',text:'{input.body}'}]},{'input.body':'<script>alert(1)</script>'}),/&lt;script&gt;/);
  assert.throws(()=>validateDocx(Buffer.from('fake docx')));
});
test('private local storage works on Windows and denies traversal',async()=>{
  const root=await fs.mkdtemp(join(tmpdir(),'kka-storage-test-'));const driver=new LocalPrivateStorageDriver(root);
  const v=await driver.put({namespace:'marks',filename:'test.png',mimeType:'image/png',buffer:Buffer.from('test')});assert.equal((await driver.readBuffer(v.path)).toString(),'test');assert.ok(!v.path.includes('\\'));assert.equal((await driver.readBuffer(v.path.replaceAll('/','\\'))).toString(),'test');
  await assert.rejects(driver.readBuffer('../outside'));await driver.delete(v.path);assert.equal(await driver.exists(v.path),false);
});
test('Word templates merge values and embed branding without signature assets',async()=>{
  const image=await sharp({create:{width:100,height:50,channels:4,background:'#b9a48c'}}).png().toBuffer();
  const output=mergeDocx(demonstrationDocx(),Object.fromEntries(MERGE_FIELDS.map(k=>[k,'Synthetic example'])),image);
  const zip=validateDocx(output);assert.ok(zip.file('word/media/kka-branding.png'));assert.match(zip.file('word/document.xml')!.asText(), /cx="914400" cy="457200"/);assert.ok(!zip.file('word/document.xml')!.asText().includes('{input.body}'));
  assert.throws(()=>mergeDocx(demonstrationDocx(),{},image));
});
