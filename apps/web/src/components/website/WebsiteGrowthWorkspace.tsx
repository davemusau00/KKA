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
  const {users}=useApp();
  return <div className="space-y-5 pb-16">
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-5 sm:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs uppercase tracking-[.16em] font-semibold mb-2"><Workflow className="w-4 h-4"/> Website & Growth</div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-950 dark:text-white">Public Site, Media & Lead Operations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">Manage the premium public website without importing its visual identity into the LawFirm OS. Published content, media and enquiries remain connected to firm data and intake workflows.</p>
        </div>
        <a href="https://kariukikagunda.co.ke" target="_blank" rel="noreferrer" className="admin-btn-secondary inline-flex items-center gap-2 shrink-0">Open public site <ExternalLink className="w-4 h-4"/></a>
      </div>
      <div className="px-3 sm:px-5 overflow-x-auto"><nav className="flex min-w-max gap-1 py-2" aria-label="Website workspace">{tabs.map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition ${tab===id?'bg-amber-50 dark:bg-amber-950/35 text-amber-800 dark:text-amber-300':'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><Icon className="w-4 h-4"/>{label}</button>)}</nav></div>
    </div>
    {tab==='overview'&&<WebsiteDashboard onNavigate={setTab}/>} 
    {tab==='pages'&&<WebsitePagesPanel/>}
    {tab==='content'&&<WebsiteContentPanel/>}
    {tab==='media'&&<WebsiteMediaPanel/>}
    {tab==='leads'&&<WebsiteLeadsPanel users={users}/>} 
    {tab==='publishing'&&<WebsitePublishingPanel/>}
    {tab==='settings'&&<WebsiteSettingsPanel/>}
  </div>;
};
