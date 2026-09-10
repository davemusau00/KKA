import React,{useEffect,useState} from 'react';
import { FileText, Images, Newspaper, Users, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { websiteApi } from '../../lib/websiteApi';

type Tab='overview'|'pages'|'content'|'media'|'leads'|'publishing'|'settings';
export const WebsiteDashboard:React.FC<{onNavigate:(tab:Tab)=>void}>=({onNavigate})=>{
 const [data,setData]=useState<any>(null);const[error,setError]=useState('');
 useEffect(()=>{websiteApi.dashboard().then(setData).catch(e=>setError(e.message||String(e)))},[]);
 if(error)return <div className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900 p-5 text-sm text-rose-800 dark:text-rose-300 flex gap-3"><AlertTriangle className="w-5 h-5"/>{error}</div>;
 if(!data)return <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-500"/></div>;
 const cards=[['Pages',data.pages,FileText,'pages'],['Publications',data.publications,Newspaper,'content'],['Media assets',data.media,Images,'media'],['Open leads',data.openLeads,Users,'leads']];
 return <div className="grid lg:grid-cols-4 gap-4">{cards.map(([label,value,Icon,tab]:any)=><button key={label} onClick={()=>onNavigate(tab)} className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-amber-300 dark:hover:border-amber-700 transition group"><div className="flex justify-between"><span className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 grid place-items-center"><Icon className="w-4 h-4"/></span><ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition"/></div><strong className="block mt-5 text-3xl text-slate-950 dark:text-white">{value}</strong><span className="text-xs text-slate-500 dark:text-slate-400">{label}</span></button>)}<div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 grid sm:grid-cols-3 gap-5"><div><span className="text-xs text-slate-500">Last 30 days</span><strong className="block text-xl mt-1">{data.submissions30d} enquiries</strong></div><div><span className="text-xs text-slate-500">Content review</span><strong className="block text-xl mt-1">{data.pendingReview} pending</strong></div><div><span className="text-xs text-slate-500">Scheduled</span><strong className="block text-xl mt-1">{data.scheduled} publications</strong></div></div></div>;
};
