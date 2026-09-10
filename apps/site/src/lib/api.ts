import type { LeadInput, Page, Partner, PracticeArea, Publication, SiteBootstrap } from '../types';
import { fallback } from '../data/fallback';
const base=((import.meta.env.VITE_PUBLIC_API_URL as string|undefined)||'/api/v1').replace(/\/+$/,'');
async function request<T>(path:string,init?:RequestInit):Promise<T>{
 const headers:Record<string,string>={Accept:'application/json',...(init?.headers as Record<string,string>||{})};
 if(init?.body && !(init.body instanceof FormData))headers['content-type']='application/json';
 const r=await fetch(`${base}${path}`,{...init,headers,credentials:'omit'});
 if(!r.ok){const body=await r.json().catch(()=>({message:r.statusText}));throw new Error(Array.isArray(body.message)?body.message.join(', '):body.message||r.statusText)}
 return r.status===204?undefined as T:await r.json() as T;
}
function imageFallback(partner:Partner,index=0):Partner{return partner.image?partner:{...partner,image:{id:'bundled',url:index===1?'/assets/partner-wanjiru.png':'/assets/partner-kariuki.png',alt:partner.name}}}
function normalize(data:SiteBootstrap):SiteBootstrap{return{...data,partners:data.partners.map((p,i)=>imageFallback(p,i)),publications:data.publications.map((p,i)=>p.cover?p:{...p,cover:{id:'bundled',url:i===0?'/assets/media-feature.png':i===1?'/assets/media-ip.png':'/assets/media-employment.png',alt:p.title}})}}
export async function bootstrap(){try{return normalize(await request<SiteBootstrap>('/website/public/bootstrap'))}catch{return fallback}}
export async function page(slug:string){return request<Page>(`/website/public/pages/${encodeURIComponent(slug)}`)}
export async function practice(slug:string){try{return await request<PracticeArea>(`/website/public/practice-areas/${encodeURIComponent(slug)}`)}catch{const x=fallback.practiceAreas.find(x=>x.slug===slug);if(!x)throw new Error('Not found');return x}}
export async function partner(slug:string){try{return imageFallback(await request<Partner>(`/website/public/partners/${encodeURIComponent(slug)}`))}catch{const x=fallback.partners.find(x=>x.slug===slug);if(!x)throw new Error('Not found');return x}}
export async function publication(slug:string){try{const p=await request<Publication>(`/website/public/publications/${encodeURIComponent(slug)}`);if(!p.cover)p.cover={id:'bundled',url:'/assets/media-feature.png',alt:p.title};return p}catch{const x=fallback.publications.find(x=>x.slug===slug);if(!x)throw new Error('Not found');return x}}
export async function searchSite(q:string){return request<{type:string;title:string;url:string;excerpt:string}[]>(`/website/public/search?q=${encodeURIComponent(q)}`)}
export async function submitLead(input:LeadInput){return request<{id?:string;reference:string;status:string}>('/website/public/leads',{method:'POST',body:JSON.stringify(input)})}
