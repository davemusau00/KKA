import React, { useId, useState } from 'react';
/** Preserve color; compensate only for nearly invisible source artwork in branding displays. */
export function BrandImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [dark,setDark]=useState(true),[failed,setFailed]=useState(''),[gain,setGain]=useState(1);
  const filterId=useId().replaceAll(':','');
  const url=failed===src?'/firm-logo.png':src;
  return <span className={`inline-flex items-center justify-center rounded-lg ${className}`} style={{backgroundColor:dark?'#142333':'#ffffff'}}>
    <svg width="0" height="0" aria-hidden="true" className="absolute"><filter id={filterId} colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncA type="linear" slope={gain} /></feComponentTransfer></filter></svg>
    <img src={url} alt={alt} className="w-full h-full object-contain" style={{filter:gain>1?`url(#${filterId})`:undefined}} onError={()=>setFailed(src)} onLoad={e=>{
      try {
        const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;
        const ctx=canvas.getContext('2d')!;ctx.drawImage(e.currentTarget,0,0,32,32);const pixels=ctx.getImageData(0,0,32,32).data;
        let brightness=0,weight=0,maxAlpha=0;
        for(let i=0;i<pixels.length;i+=4){const a=pixels[i+3]/255;maxAlpha=Math.max(maxAlpha,pixels[i+3]);brightness+=(0.2126*pixels[i]+0.7152*pixels[i+1]+0.0722*pixels[i+2])*a;weight+=a;}
        setDark(weight>0&&brightness/weight>125);
        setGain(maxAlpha>0&&maxAlpha<64?255/maxAlpha:1);
      } catch { setDark(true); }
    }} />
  </span>;
}
