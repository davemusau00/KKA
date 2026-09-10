import { useEffect, useState } from 'react';
import { Container, Heading } from '@kka/site-ui';
import { page as loadPage } from '../lib/api';
import type { Page, SiteBootstrap } from '../types';
import { SiteBlockRenderer } from '../components/SiteBlockRenderer';
import { Seo } from '../components/Seo';

export function DynamicPage({slug,data}:{slug:string;data:SiteBootstrap}){
 const [record,setRecord]=useState<Page|null>(null);const [error,setError]=useState('');
 useEffect(()=>{let active=true;setError('');loadPage(slug).then(x=>active&&setRecord(x)).catch(e=>active&&setError(e instanceof Error?e.message:'Page not found'));return()=>{active=false}},[slug]);
 if(error)return <section className="not-found"><Container><Heading as="h1">PAGE NOT AVAILABLE.</Heading><p>{error}</p></Container></section>;
 if(!record)return <div className="route-loading" role="status" aria-live="polite"><span/>Loading page…</div>;
 const seo=record.seo||{};
 return <><Seo settings={data.settings} title={seo.title||record.title} description={seo.description||record.description} canonical={seo.canonical} noindex={seo.noindex}/>{record.blocks.map((b,i)=><SiteBlockRenderer key={b.id||`${b.blockType}-${i}`} block={b} data={data}/>)}</>;
}
