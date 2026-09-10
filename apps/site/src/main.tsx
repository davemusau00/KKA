import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import '@kka/site-tokens';
import './styles/site.css';
import { createSiteRouter } from './router';
import type { SiteSnapshot } from './types';
async function mount(snapshot?:SiteSnapshot,url?:string){
 const router=createSiteRouter(snapshot,url);const queryClient=new QueryClient();
 await router.load();
 const application=<React.StrictMode><QueryClientProvider client={queryClient}><RouterProvider router={router}/></QueryClientProvider></React.StrictMode>;
 const root=document.getElementById('root')!;
 if(root.hasChildNodes()&&!snapshot)ReactDOM.hydrateRoot(root,application);else ReactDOM.createRoot(root).render(application);
}
if(location.pathname==='/preview'){
 document.title='Private website preview';const meta=document.createElement('meta');meta.name='robots';meta.content='noindex,nofollow';document.head.appendChild(meta);
 const allowed=(import.meta.env.VITE_OS_PREVIEW_ORIGINS||'http://127.0.0.1:5173,http://localhost:5173').split(',');
 const receive=async(e:MessageEvent)=>{
  if(e.source!==parent||!allowed.includes(e.origin)||e.data?.type!=='website.preview.session')return;
  removeEventListener('message',receive);clearInterval(ready);
  try{
   const headers={'X-Website-Preview':e.data.token};
   const response=await fetch('/api/v1/website/public/preview',{headers,credentials:'omit'});if(!response.ok)throw new Error('Preview expired or unavailable.');
   const snapshot:SiteSnapshot=await response.json();
   const urls=new Map<string,string>();
   for(const id of snapshot.mediaIds){const r=await fetch('/api/v1/website/public/preview/media/'+encodeURIComponent(id),{headers,credentials:'omit'});if(r.ok)urls.set(id,URL.createObjectURL(await r.blob()));}
   function replace(value:any){if(!value||typeof value!=='object')return;if(value.id&&urls.has(value.id)&&value.url)value.url=urls.get(value.id);for(const v of Object.values(value))replace(v);}replace(snapshot);
   await mount(snapshot,e.data.slug||'/');
  }catch(error){document.getElementById('root')!.textContent=error instanceof Error?error.message:'Preview failed';}
 };
 addEventListener('message',receive);const ready=setInterval(()=>allowed.forEach(origin=>parent.postMessage({type:'website.preview.ready'},origin)),500);
}else void mount();
