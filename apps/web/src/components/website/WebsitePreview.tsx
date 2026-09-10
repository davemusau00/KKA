import { useEffect, useRef, useState } from 'react';
import { websiteApi } from '../../lib/websiteApi';
const origin=(import.meta.env.VITE_SITE_PREVIEW_ORIGIN||'http://127.0.0.1:5174').replace(/\/$/,'');
export function WebsitePreview({slug}:{slug:string}){
 const frame=useRef<HTMLIFrameElement>(null);const [session,setSession]=useState<{token:string;expiresAt:number}|null>(null);const [width,setWidth]=useState(390);const [error,setError]=useState('');
 useEffect(()=>{const receive=(e:MessageEvent)=>{if(e.origin===origin&&e.source===frame.current?.contentWindow&&e.data?.type==='website.preview.ready'&&session)frame.current?.contentWindow?.postMessage({type:'website.preview.session',token:session.token,slug},origin);};addEventListener('message',receive);return()=>removeEventListener('message',receive);},[session,slug]);
 async function open(){setError('');try{setSession(await websiteApi.preview());}catch(e){setError(e instanceof Error?e.message:'Preview unavailable');}}
 return <section className="space-y-3"><button type="button" className="admin-btn-secondary" onClick={open}>Preview saved draft</button>{error&&<p role="alert">{error}</p>}{session&&<><label className="block text-xs">Viewport <select value={width} onChange={e=>setWidth(Number(e.target.value))}>{[360,390,430,768,1024,1440].map(w=><option key={w} value={w}>{w}px</option>)}</select></label><div className="overflow-auto max-w-full"><iframe key={session.token} ref={frame} title="Public website draft preview" src={origin+'/preview'} sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer" style={{width,height:720,border:'1px solid #cbd5e1'}}/></div><p className="text-xs text-slate-500">Preview shows saved content and expires after ten minutes.</p></>}</section>;
}
