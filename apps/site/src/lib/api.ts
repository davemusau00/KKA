import type { LeadInput, Page, Partner, PracticeArea, Publication, SiteBootstrap, SiteSnapshot } from '../types';
const base=((import.meta.env.VITE_PUBLIC_API_URL as string|undefined)||'/api/v1').replace(/\/+$/,'');
export class PublicApiError extends Error { constructor(message:string,public status:number,public fields:Record<string,string[]>={}){super(message);} }
export async function request<T>(path:string,init?:RequestInit):Promise<T>{
 const r=await fetch(`${base}${path}`,{...init,headers:{Accept:'application/json',...(init?.body?{'content-type':'application/json'}:{}),...init?.headers},credentials:'omit'});
 if(!r.ok){const b=await r.json().catch(()=>({message:r.statusText}));throw new PublicApiError(typeof b.message==='string'?b.message:'Please review your information and try again.',r.status,b.fieldErrors||b.message?.fieldErrors||{});}
 return r.status===204?undefined as T:await r.json() as T;
}
export function embeddedSnapshot():SiteSnapshot|undefined {
 if(typeof document==='undefined')return undefined;
 const node=document.getElementById('site-snapshot');return node?.textContent?JSON.parse(node.textContent):undefined;
}
export async function bootstrap():Promise<SiteBootstrap>{
 const s=embeddedSnapshot();if(s)return {...s.bootstrap,pages:s.pages};
 if(import.meta.env.DEV && import.meta.env.VITE_SITE_FIXTURES==='true')return (await import('../data/fallback')).fallback;
 return request<SiteBootstrap>('/website/public/bootstrap');
}
export async function page(slug:string){const s=embeddedSnapshot();if(s){const p=s.pages.find(x=>x.slug===slug);if(!p)throw new PublicApiError('Page not found',404);return p;}return request<Page>(`/website/public/pages/${encodeURIComponent(slug)}`);}
export async function practice(slug:string){return request<PracticeArea>(`/website/public/practice-areas/${encodeURIComponent(slug)}`);}
export async function partner(slug:string){return request<Partner>(`/website/public/partners/${encodeURIComponent(slug)}`);}
export async function publication(slug:string){return request<Publication>(`/website/public/publications/${encodeURIComponent(slug)}`);}
export async function searchSite(q:string){return request<{type:string;title:string;url:string;excerpt:string}[]>(`/website/public/search?q=${encodeURIComponent(q)}`);}
export async function submitLead(input:LeadInput & {idempotencyKey?:string;formVersion?:number}){return request<{reference:string;status:string}>('/website/public/leads',{method:'POST',body:JSON.stringify(input)});}
