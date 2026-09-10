import React from 'react';
import ReactDOM, { type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import '@kka/site-tokens';
import './styles/site.css';
import { createSiteRouter } from './router';
import type { SiteSnapshot } from './types';
let mountedRoot:Root|null=null;
async function mount(snapshot?:SiteSnapshot,url?:string){
 const router=createSiteRouter(snapshot,url);const queryClient=new QueryClient();
 // Static releases already contain the complete route data. Preserve the
 // server boundary shape while the browser attaches to that rendered tree.
 if(!snapshot&&document.getElementById('site-snapshot'))router.ssr={manifest:undefined};
 await router.load();
 const application=<React.StrictMode><QueryClientProvider client={queryClient}><RouterProvider router={router}/></QueryClientProvider></React.StrictMode>;
 const root=document.getElementById('root')!;
 if(mountedRoot)mountedRoot.unmount();
 if(root.hasChildNodes()&&!snapshot)mountedRoot=ReactDOM.hydrateRoot(root,application);else {mountedRoot=ReactDOM.createRoot(root);mountedRoot.render(application);}
}
if(location.pathname==='/preview'){
 document.title='Private website preview';const meta=document.createElement('meta');meta.name='robots';meta.content='noindex,nofollow';document.head.appendChild(meta);
 const allowed:string[]=(import.meta.env.VITE_OS_PREVIEW_ORIGINS||'http://127.0.0.1:5173,http://localhost:5173').split(',');
 let token='';let activeSlug='/';let initialLoaded=false;let requestVersion=0;
 const validSnapshot=(value:unknown):value is SiteSnapshot=>{if(!value||typeof value!=='object')return false;const s=value as any;return s.schemaVersion===1&&Array.isArray(s.pages)&&Array.isArray(s.mediaIds)&&s.bootstrap&&typeof s.bootstrap==='object'&&s.bootstrap.settings&&Array.isArray(s.bootstrap.partners)&&Array.isArray(s.bootstrap.practiceAreas)&&Array.isArray(s.bootstrap.publications)&&Array.isArray(s.bootstrap.testimonials)&&Array.isArray(s.bootstrap.metrics)&&(s.bootstrap.forms===undefined||Array.isArray(s.bootstrap.forms));};
 const receive=async(e:MessageEvent)=>{
  if(e.source!==parent||!allowed.includes(e.origin)||!['website.preview.session','website.preview.snapshot'].includes(e.data?.type))return;
  if(e.data.token)token=e.data.token;if(e.data.slug)activeSlug=e.data.slug;if(!token)return;
  const version=++requestVersion;
  try{
   const headers={'X-Website-Preview':token};
   const candidate=e.data.snapshot||await (async()=>{const response=await fetch('/api/v1/website/public/preview',{headers,credentials:'omit'});if(!response.ok)throw new Error('Preview expired or unavailable.');return response.json();})();
   if(!validSnapshot(candidate))throw new Error('Preview data is invalid.');
   const snapshot:SiteSnapshot=candidate;
   const urls=new Map<string,string>();
   for(const id of snapshot.mediaIds){const r=await fetch('/api/v1/website/public/preview/media/'+encodeURIComponent(id),{headers,credentials:'omit'});if(r.ok)urls.set(id,URL.createObjectURL(await r.blob()));}
   function replace(value:any){if(!value||typeof value!=='object')return;if(value.id&&urls.has(value.id)&&value.url){value.url=urls.get(value.id);value.variants={};}for(const v of Object.values(value))replace(v);}replace(snapshot);
   if(version!==requestVersion)return;
   await mount(snapshot,activeSlug);if(!initialLoaded)clearInterval(ready);initialLoaded=true;
  }catch(error){if(initialLoaded)return;document.getElementById('root')!.textContent=error instanceof Error?error.message:'Preview failed';}
 };
 addEventListener('message',receive);const ready=setInterval(()=>allowed.forEach(origin=>parent.postMessage({type:'website.preview.ready'},origin)),500);
}else void mount();
