import { chromium } from 'playwright';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const execute = promisify(execFile);
export const MERGE_FIELDS = ['firm.name','client.name','matter.reference','matter.title','court.name','date.today','signatory.name','input.recipient','input.subject','input.body'] as const;
export type MergeValues = Record<string, string>;
export interface TemplateContent { header: string; footer: string; blocks: Array<{ type: 'heading'|'paragraph'|'table'; text: string; rows?: string[][] }> }
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function merge(text: string, values: MergeValues) {
  return text.replace(/\{([\w.]+)\}/g, (_, key: string) => {
    if (!(MERGE_FIELDS as readonly string[]).includes(key)) throw new Error(`Unsupported merge field: ${key}`);
    if (!values[key]?.trim()) throw new Error(`Missing required field: ${key}`);
    return values[key]!;
  });
}
export function templateHtml(template: TemplateContent, values: MergeValues, logo?: Buffer) {
  const t = (v: string) => escape(merge(v, values)).replaceAll('\n','<br>');
  return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:24mm 20mm}body{font:12pt Georgia,serif;color:#17212f;line-height:1.55}header{border-bottom:1px solid #baa68a;padding-bottom:12px;margin-bottom:24px}header img{width:65px;height:65px;object-fit:contain;float:right}h1{font-size:18pt}p{white-space:normal}table{border-collapse:collapse;width:100%;break-inside:avoid}td{border:1px solid #aaa;padding:6px}footer{margin-top:24px;font-size:9pt;border-top:1px solid #aaa}tr{break-inside:avoid}</style></head><body><header>${logo?`<img alt="Firm logo" src="data:image/png;base64,${logo.toString('base64')}">`:''}${t(template.header)}</header>${template.blocks.map(b=>b.type==='heading'?`<h1>${t(b.text)}</h1>`:b.type==='table'?`<table>${(b.rows??[]).map(r=>`<tr>${r.map(c=>`<td>${t(c)}</td>`).join('')}</tr>`).join('')}</table>`:`<p>${t(b.text)}</p>`).join('')}<footer>${t(template.footer)}</footer></body></html>`;
}
export async function renderStructured(template: TemplateContent, values: MergeValues, logo?: Buffer) {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
  try {
    const page = await browser.newPage({ javaScriptEnabled: false });
    await page.route('**/*', route => route.abort());
    await page.setContent(templateHtml(template, values, logo), { waitUntil: 'load', timeout: 30000 });
    return await page.pdf({ format: 'A4', printBackground: true });
  } finally { await browser.close(); }
}
export function validateDocx(source: Buffer) {
  if (source.length > 20 * 1024 * 1024) throw new Error('Word templates must not exceed 20 MiB');
  const zip = new PizZip(source);
  if (!zip.file('word/document.xml') || !zip.file('[Content_Types].xml')) throw new Error('Upload a valid DOCX template');
  let expanded = 0;
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const data = entry.asUint8Array(); expanded += data.length;
    if (expanded > 80 * 1024 * 1024) throw new Error('Expanded Word template is too large');
    if (/vbaProject|embeddings\//i.test(name)) throw new Error('Macros and embedded executable objects are not supported');
    if (name.endsWith('.rels') && /TargetMode\s*=\s*["']External/i.test(entry.asText())) throw new Error('External document relationships are not supported');
  }
  return zip;
}
export function mergeDocx(source: Buffer, values: MergeValues, logo?: Buffer) {
  const zip = validateDocx(source);
  // A dedicated {firm.logo} paragraph is a stable image anchor in Word templates.
  let xml = zip.file('word/document.xml')!.asText();
  if (xml.includes('{firm.logo}')) {
    const image = logo ? '<w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="914400" cy="914400"/><wp:docPr id="99001" name="Firm logo"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="99001" name="Firm logo"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rIdKkaBranding"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="914400" cy="914400"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>' : '';
    let found = false;
    xml = xml.replace(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g, paragraph => {
      if (!paragraph.includes('{firm.logo}')) return paragraph;
      const text = [...paragraph.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(m=>m[1]).join('');
      if (text.trim() !== '{firm.logo}') throw new Error('Place {firm.logo} in its own Word paragraph');
      found = true; return `<w:p>${image}</w:p>`;
    });
    if (!found) throw new Error('Invalid firm logo anchor');
    if (logo) {
      zip.file('word/media/kka-branding.png', logo);
      const relPath='word/_rels/document.xml.rels';
      const rels=zip.file(relPath)?.asText()??'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
      zip.file(relPath,rels.replace('</Relationships>','<Relationship Id="rIdKkaBranding" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/kka-branding.png"/></Relationships>'));
      const content=zip.file('[Content_Types].xml')!.asText();
      if (!/Extension="png"/.test(content)) zip.file('[Content_Types].xml',content.replace('</Types>','<Default Extension="png" ContentType="image/png"/></Types>'));
    }
    zip.file('word/document.xml',xml);
  }
  const doc = new Docxtemplater(zip, { errorLogging: false, paragraphLoop: true, linebreaks: true, parser: tag => ({ get: () => merge(`{${tag.trim()}}`, values) }) });
  doc.render(values);
  return doc.getZip().generate({ type: 'nodebuffer' });
}
export async function convertDocx(source: Buffer) {
  const directory = await fs.mkdtemp(join(tmpdir(),'kka-docx-'));
  try {
    const path = join(directory,'document.docx'); await fs.writeFile(path,source);
    await execute(process.env.LIBREOFFICE_PATH || 'soffice', [`-env:UserInstallation=${pathToFileURL(join(directory,'profile')).href}`,'--headless','--convert-to','pdf:writer_pdf_Export','--outdir',directory,path], { timeout: 90000, maxBuffer: 1024 * 1024, windowsHide: true });
    return await fs.readFile(join(directory,'document.pdf'));
  } finally { await fs.rm(directory,{recursive:true,force:true}); }
}
