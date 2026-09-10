import { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import type { MediaAsset } from '../types';
type Props=Omit<ImgHTMLAttributes<HTMLImageElement>,'src'|'alt'>&{asset?:MediaAsset|null;fallback:string;alt?:string};
export function SafeImage({asset,fallback,alt,className='',style,...rest}:Props){
 const [failed,setFailed]=useState(false);const src=asset?.url||fallback;
 if(!src||failed)return <div className={`image-unavailable ${className}`} role="img" aria-label={alt||'Image unavailable'}>Image unavailable</div>;
 const position=asset?`${(asset.focalX??.5)*100}% ${(asset.focalY??.5)*100}%`:undefined;
 const variants=Object.values(asset?.variants||{}) as {url?:string;width?:number;mimeType?:string}[];
 const srcset=(type:string)=>variants.filter(v=>v.mimeType===type&&v.url&&v.width).map(v=>`${v.url} ${v.width}w`).join(', ');
 return <picture>{['image/avif','image/webp'].map(type=>srcset(type)?<source key={type} type={type} srcSet={srcset(type)} sizes={rest.sizes||'(max-width: 767px) 100vw, 50vw'}/>:null)}<img src={src} alt={alt??asset?.alt??''} width={asset?.width??undefined} height={asset?.height??undefined} loading="lazy" decoding="async" className={className} style={{objectPosition:position,...style}} onError={()=>setFailed(true)} {...rest}/></picture>;
}
