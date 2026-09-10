import type { ImgHTMLAttributes } from 'react';
import type { MediaAsset } from '../types';

type Props=Omit<ImgHTMLAttributes<HTMLImageElement>,'src'|'alt'>&{
  asset?:MediaAsset|null;
  fallback:string;
  alt?:string;
};
export function SafeImage({asset,fallback,alt,className='',style,...rest}:Props){
  const src=asset?.url||fallback;
  const objectPosition=asset?`${Math.round((asset.focalX??.5)*100)}% ${Math.round((asset.focalY??.5)*100)}%`:undefined;
  return <img src={src} alt={alt??asset?.alt??''} className={className} style={{objectPosition,...style}} {...rest}/>;
}
