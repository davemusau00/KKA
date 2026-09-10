import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { Publication } from '../types';
import { SafeImage } from './SafeImage';
export function PublicationCollection({items,pageSize=12}:{items:Publication[];pageSize?:number}){
 const [kind,setKind]=useState('ALL'),[page,setPage]=useState(1);const filtered=items.filter(p=>kind==='ALL'||p.kind===kind);const size=Math.max(1,Math.min(24,pageSize));const pages=Math.max(1,Math.ceil(filtered.length/size));const current=Math.min(page,pages);
 return <><label className="publication-filter">Content type <select value={kind} onChange={e=>{setKind(e.target.value);setPage(1);}}><option value="ALL">All insights</option><option value="ARTICLE">Articles</option><option value="VIDEO">Videos</option></select></label><div className="article-grid">{filtered.slice((current-1)*size,current*size).map(p=><Link className="article-card" key={p.id} to="/insights/$slug" params={{slug:p.slug}}><SafeImage asset={p.cover} fallback="/assets/media-feature.png" alt={p.title}/><div><small>{p.kind}</small><h3>{p.title}</h3><p>{p.excerpt}</p><span>{p.kind==='VIDEO'?'View video':'Read article'} &rarr;</span></div></Link>)}</div>{!filtered.length&&<p>No published content matches this filter.</p>}{pages>1&&<nav aria-label="Insights pagination" className="pagination"><button disabled={current===1} onClick={()=>setPage(current-1)}>Previous</button><span role="status">Page {current} of {pages}</span><button disabled={current===pages} onClick={()=>setPage(current+1)}>Next</button></nav>}</>;
}
