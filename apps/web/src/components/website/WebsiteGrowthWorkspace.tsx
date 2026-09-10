import React, { useState } from 'react';
import { BarChart3, FileText, Images, Megaphone, Newspaper, Settings2, Users, Workflow, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WebsiteDashboard } from './WebsiteDashboard';
import { WebsitePagesPanel } from './WebsitePagesPanel';
import { WebsiteContentPanel } from './WebsiteContentPanel';
import { WebsiteMediaPanel } from './WebsiteMediaPanel';
import { WebsiteLeadsPanel } from './WebsiteLeadsPanel';
import { WebsitePublishingPanel } from './WebsitePublishingPanel';
import { WebsiteSettingsPanel } from './WebsiteSettingsPanel';

type Tab='overview'|'pages'|'content'|'media'|'leads'|'publishing'|'settings';
const tabs=[
  ['overview','Overview',BarChart3],['pages','Pages',FileText],['content','Content',Newspaper],['media','Media',Images],
  ['leads','Leads',Users],['publishing','Publishing',Megaphone],['settings','Settings',Settings2]
] as const;

export const WebsiteGrowthWorkspace:React.FC=()=>{
  const [tab,setTab]=useState<Tab>('overview');
  const {users,hasUserPermission}=useApp();
  const permission:Record<Tab,string>={overview:'website.view',pages:'website.edit',content:'website.edit',media:'website.media',leads:'website.leads.view',publishing:'website.publish',settings:'website.settings'};
  const allowed=(id:Tab)=>hasUserPermission(permission[id] as any);
  return <div className="w-full max-w-[1680px] mx-auto min-w-0 px-3 py-4 sm:px-5 sm:py-6 lg:px-7 lg:py-8 space-y-5 pb-20 overflow-x-hidden">
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <div className="p-5 sm:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs uppercase tracking-[.16em] font-semibold mb-2"><Workflow className="w-4 h-4"/> Website & Growth</div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-950 dark:text-white">Public Site, Media & Lead Operations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">Manage the premium public website without importing its visual identity into the LawFirm OS. Published content, media and enquiries remain connected to firm data and intake workflows.</p>
        </div>
        <a href={import.meta.env.VITE_PUBLIC_SITE_ORIGIN||'http://127.0.0.1:5175'} target="_blank" rel="noreferrer" className="admin-btn-secondary inline-flex items-center gap-2 shrink-0">Open public site <ExternalLink className="w-4 h-4"/></a>
      </div>
      <div className="px-2 sm:px-4 overflow-x-auto border-t border-slate-200 dark:border-slate-800"><nav className="flex min-w-max gap-1 py-2" aria-label="Website workspace">{tabs.filter(([id])=>allowed(id)).map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} className={`min-h-11 flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${tab===id?'bg-amber-50 dark:bg-amber-950/35 text-amber-800 dark:text-amber-300':'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><Icon className="w-4 h-4"/>{label}</button>)}</nav></div>
    </div>
    {tab==='overview'&&allowed('overview')&&<WebsiteDashboard onNavigate={setTab}/>} 
    {tab==='pages'&&allowed('pages')&&<WebsitePagesPanel/>}
    {tab==='content'&&allowed('content')&&<WebsiteContentPanel/>}
    {tab==='media'&&allowed('media')&&<WebsiteMediaPanel/>}
    {tab==='leads'&&allowed('leads')&&<WebsiteLeadsPanel users={users}/>} 
    {tab==='publishing'&&allowed('publishing')&&<WebsitePublishingPanel/>}
    {tab==='settings'&&allowed('settings')&&<WebsiteSettingsPanel/>}
  </div>;
};
