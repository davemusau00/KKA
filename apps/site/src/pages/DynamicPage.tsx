import type { ReactNode } from 'react';
import type { SiteBootstrap } from '../types';
import { SiteBlockRenderer } from '../components/SiteBlockRenderer';
import { Seo } from '../components/Seo';
import { NotFoundPage } from './NotFoundPage';
export function ContentPage({slug,data,fallback}:{slug:string;data:SiteBootstrap;fallback?:ReactNode}){
 const record=data.pages?.find(p=>p.slug===slug);
 if(!record?.blocks.length)return <>{fallback??<NotFoundPage/>}</>;
 const seo=record.seo||{};
 return <><Seo settings={data.settings} title={seo.title||record.title} description={seo.description||record.description} canonical={seo.canonical} noindex={seo.noindex}/>{record.blocks.map((b,i)=><SiteBlockRenderer key={b.id||`${b.blockType}-${i}`} block={b} data={data}/>)}</>;
}
export const DynamicPage=ContentPage;
