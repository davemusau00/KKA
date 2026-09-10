import { useEffect } from 'react';
import type { SiteSettings } from '../types';

type SeoProps={title?:string;description?:string;canonical?:string;image?:string;noindex?:boolean;settings:SiteSettings};
function upsert(name:string,value:string,property=false){
  const key=property?'property':'name';
  let node=document.head.querySelector(`meta[${key}="${name}"]`) as HTMLMetaElement|null;
  if(!node){node=document.createElement('meta');node.setAttribute(key,name);document.head.appendChild(node)}
  node.content=value;
}
export function Seo({title,description,canonical,image,noindex,settings}:SeoProps){
  useEffect(()=>{
    const defaults=(settings.defaultSeo||{}) as Record<string,any>;
    const finalTitle=title||defaults.title||settings.firmName;
    const finalDescription=description||defaults.description||settings.tagline;
    document.title=finalTitle.includes(settings.firmName)?finalTitle:`${finalTitle} | ${settings.firmName}`;
    upsert('description',finalDescription);
    const privateOrSearch=['/preview','/search'].includes(location.pathname);
    upsert('robots',noindex||privateOrSearch?'noindex,nofollow':'index,follow,max-image-preview:large');
    upsert('og:title',document.title,true);upsert('og:description',finalDescription,true);upsert('og:type','website',true);
    upsert('twitter:card','summary_large_image');upsert('twitter:title',document.title);upsert('twitter:description',finalDescription);
    if(image){upsert('og:image',new URL(image,location.origin).toString(),true);upsert('twitter:image',new URL(image,location.origin).toString())}
    const href=canonical?new URL(canonical,location.origin).toString():location.href.replace(/#.*$/, '');
    let link=document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement|null;
    if(!link){link=document.createElement('link');link.rel='canonical';document.head.appendChild(link)}link.href=href;
  },[title,description,canonical,image,noindex,settings]);
  return null;
}
