import { useEffect, useRef, useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { SiteSettings } from '../types';
const defaults=[['Home','/'],['About Us','/about'],['Area of Practice','/practice-areas'],['Our Team','/team'],['Insights','/insights'],['Contact Us','/contact']];
export function SiteHeader({settings}:{settings:SiteSettings}){
 const [open,setOpen]=useState(false),[compact,setCompact]=useState(false);const sheet=useRef<HTMLDivElement>(null);const toggle=useRef<HTMLButtonElement>(null);
 const nav=(settings.navigation?.length?settings.navigation.map(x=>[x.label,x.url]):defaults) as [string,string][];
 useEffect(()=>{const scroll=()=>setCompact(scrollY>24);addEventListener('scroll',scroll,{passive:true});scroll();return()=>removeEventListener('scroll',scroll);},[]);
 useEffect(()=>{
  if(!open)return;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';sheet.current?.querySelector('button')?.focus();
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);return;}if(e.key!=='Tab')return;const nodes=sheet.current?.querySelectorAll<HTMLElement>('a[href],button');if(!nodes?.length)return;const first=nodes[0]!,last=nodes[nodes.length-1]!;if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault();}};
  const resize=()=>{if(innerWidth>1200)setOpen(false);};addEventListener('keydown',key);addEventListener('resize',resize);
  return()=>{document.body.style.overflow=overflow;removeEventListener('keydown',key);removeEventListener('resize',resize);toggle.current?.focus();};
 },[open]);
 const brand=<img className="brand-logo" src="/assets/logo-reference.png" alt={settings.firmName}/>;
 return <><header className={`site-header ${compact?'is-compact':''}`}><div className="site-header-inner"><Link className="brand" to="/" aria-label={`${settings.firmName} home`}>{brand}</Link><nav aria-label="Primary navigation">{nav.map(([label,to])=><a key={to} href={to}>{label}</a>)}</nav><div className="header-actions"><Link className="search-button" to="/search" aria-label="Search"><Search size={17}/></Link><Link className="header-cta" to="/contact">Contact Us &rarr;</Link><button ref={toggle} className="menu-button" onClick={()=>setOpen(true)} aria-label="Open menu" aria-controls="public-menu" aria-expanded={open}><Menu/></button></div></div>
 </header><div ref={sheet} id="public-menu" className={`mobile-menu ${open?'open':''}`} role="dialog" aria-modal={open||undefined} aria-label="Site navigation" aria-hidden={!open} inert={!open}><div className="mobile-menu-head"><div className="brand">{brand}</div><button onClick={()=>setOpen(false)} aria-label="Close menu"><X/></button></div><nav>{nav.map(([label,to],i)=><a key={to} href={to} onClick={()=>setOpen(false)} style={{transitionDelay:`${i*30}ms`}}>{label}</a>)}</nav><div className="mobile-contact"><span>Talk to the firm</span><a href={`tel:${settings.phone.replace(/[^+\d]/g,'')}`}>{settings.phone}</a><a href={`mailto:${settings.email}`}>{settings.email}</a></div></div></>;
}
