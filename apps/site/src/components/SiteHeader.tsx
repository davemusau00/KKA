import { useEffect, useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { SiteSettings } from '../types';
const defaults=[['Home','/'],['About Us','/about'],['Area of Practice','/practice-areas'],['Our Team','/team'],['Insights','/insights'],['Contact Us','/contact']];
export function SiteHeader({settings}:{settings:SiteSettings}){
 const [open,setOpen]=useState(false),[compact,setCompact]=useState(false);
 const nav=(settings.navigation?.length?settings.navigation.map(x=>[x.label,x.url]):defaults) as [string,string][];
 useEffect(()=>{const fn=()=>setCompact(scrollY>24);addEventListener('scroll',fn,{passive:true});fn();return()=>removeEventListener('scroll',fn)},[]);
 useEffect(()=>{document.body.style.overflow=open?'hidden':'';return()=>{document.body.style.overflow=''}},[open]);
 useEffect(()=>{const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};addEventListener('keydown',esc);return()=>removeEventListener('keydown',esc)},[]);
 const tel=settings.phone.replace(/[^+\d]/g,'');
 return <header className={`site-header ${compact?'is-compact':''}`}><div className="site-header-inner"><Link className="brand" to="/" aria-label={`${settings.firmName} home`}><span className="brand-seal" aria-hidden>Ⅱ</span><span><b>{settings.firmName.replace(/ Advocates$/,'')}</b><small>Advocates</small></span></Link><nav aria-label="Primary navigation">{nav.map(([label,to])=><a key={to} href={to}>{label}</a>)}</nav><div className="header-actions"><Link className="search-button" to="/search" aria-label="Search"><Search size={17}/></Link><Link className="header-cta" to="/contact">Contact Us <span>→</span></Link><button className="menu-button" onClick={()=>setOpen(true)} aria-label="Open menu" aria-expanded={open}><Menu/></button></div></div><div className={`mobile-menu ${open?'open':''}`} aria-hidden={!open}><div className="mobile-menu-head"><div className="brand"><span className="brand-seal" aria-hidden>Ⅱ</span><span><b>{settings.firmName}</b><small>Advocates</small></span></div><button onClick={()=>setOpen(false)} aria-label="Close menu"><X/></button></div><nav>{nav.map(([label,to],i)=><a key={to} href={to} onClick={()=>setOpen(false)} style={{transitionDelay:`${i*30}ms`}}>{label}</a>)}</nav><div className="mobile-contact"><span>Talk to the firm</span><a href={`tel:${tel}`}>{settings.phone}</a><a href={`mailto:${settings.email}`}>{settings.email}</a></div></div></header>
}
