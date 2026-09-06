import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
export interface Placement { page: number; x: number; y: number; width: number; height: number; rotation: number; opacity: number }
export interface PlacedAsset { kind: 'mark'|'signature'; versionId: string; placement: Placement }
export function PdfPlacementEditor({ url, items, onChange }: { url: string; items: PlacedAsset[]; onChange: (items: PlacedAsset[])=>void }) {
  const canvas = useRef<HTMLCanvasElement>(null), container = useRef<HTMLDivElement>(null);
  const [pdf,setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null), [page,setPage] = useState(1), [error,setError]=useState('');
  const [size,setSize] = useState({width:595,height:842}), [displayWidth,setDisplayWidth]=useState(400);
  const drag = useRef<{index:number;x:number;y:number;original:Placement;resize:boolean} | null>(null);
  useEffect(()=>{ setError('');setPdf(null);setPage(1); const task=pdfjs.getDocument({url,withCredentials:true});let live=true; task.promise.then(p=>{if(live)setPdf(p);}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;void task.destroy();}; },[url]);
  useEffect(()=>{ const obs=new ResizeObserver(entries=>setDisplayWidth(Math.min(700,entries[0]?.contentRect.width || 400)));if(container.current)obs.observe(container.current);return()=>obs.disconnect();},[]);
  useEffect(()=>{ if(!pdf||!canvas.current)return; let cancelled=false;let render:pdfjs.RenderTask|undefined;
    pdf.getPage(page).then(p=>{if(cancelled)return;const natural=p.getViewport({scale:1,rotation:0});setSize({width:natural.width,height:natural.height});const viewport=p.getViewport({scale:displayWidth/natural.width,rotation:0});const c=canvas.current!;c.width=viewport.width;c.height=viewport.height;render=p.render({canvas:c,canvasContext:c.getContext('2d')!,viewport});return render.promise;}).catch(e=>{if(!cancelled)setError(e.message);});return()=>{cancelled=true;render?.cancel();};
  },[pdf,page,displayWidth]);
  const update=(index:number,patch:Partial<Placement>)=>onChange(items.map((a,i)=>i===index?{...a,placement:{...a.placement,...patch}}:a));
  const begin=(e:React.PointerEvent,index:number,resize=false)=>{e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);drag.current={index,x:e.clientX,y:e.clientY,original:{...items[index].placement},resize};};
  const move=(e:React.PointerEvent)=>{const d=drag.current;if(!d)return;const dx=(e.clientX-d.x)*size.width/displayWidth,dy=(e.clientY-d.y)*size.width/displayWidth;update(d.index,d.resize?{width:Math.max(5,d.original.width+dx),height:Math.max(5,d.original.height+dy)}:{x:Math.max(0,d.original.x+dx),y:Math.max(0,d.original.y-dy)});};
  return <section className="space-y-3"><p role="status">{error || (!pdf?'Loading PDF…':'Drag a mark to move it. Use its lower-right handle to resize. Coordinates are PDF points from the lower-left corner.')}</p>
    {pdf&&<label>Page <select value={page} onChange={e=>setPage(Number(e.target.value))} className="admin-input max-w-32">{Array.from({length:pdf.numPages},(_,i)=><option key={i} value={i+1}>{i+1} of {pdf.numPages}</option>)}</select></label>}
    <div ref={container} className="w-full"><div className="relative bg-white" style={{width:displayWidth,maxWidth:'100%'}}><canvas ref={canvas} className="w-full" />{items.map((a,i)=>a.placement.page===page&&<div key={`${a.versionId}-${i}`} className="absolute border-2 border-amber-500 touch-none cursor-move" style={{left:`${a.placement.x/size.width*100}%`,bottom:`${a.placement.y/size.height*100}%`,width:`${a.placement.width/size.width*100}%`,height:`${a.placement.height/size.height*100}%`,transform:`rotate(${-a.placement.rotation}deg)`,transformOrigin:'bottom left',opacity:a.placement.opacity}} onPointerDown={e=>begin(e,i)} onPointerMove={move} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
      {a.kind==='signature'?<span className="flex h-full items-center justify-center border border-dashed text-xs bg-white/80 text-slate-900">Signature {i+1}</span>:<img draggable={false} alt={`Mark placement ${i+1}`} className="w-full h-full" src={`/api/v1/marks/versions/${a.versionId}/preview`} />}
      <button type="button" aria-label={`Resize placement ${i+1}`} className="absolute -right-1 -bottom-1 w-4 h-4 bg-amber-500 touch-none" onPointerDown={e=>begin(e,i,true)} />
    </div>)}</div></div>
    {items.map((a,i)=><fieldset key={i} className="border border-slate-500/30 rounded p-3"><legend>Placement {i+1}</legend><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{(['page','x','y','width','height','rotation','opacity'] as const).map(key=><label className="text-sm" key={key}>{key}<input className="admin-input" type="number" step={key==='opacity'?0.1:1} value={a.placement[key]} onChange={e=>update(i,{[key]:Number(e.target.value)})} /></label>)}</div><button className="admin-btn-secondary mt-2" onClick={()=>onChange(items.filter((_,j)=>i!==j))}>Remove placement</button><button className="admin-btn-secondary mt-2" disabled={!pdf} onClick={()=>onChange([...items,...Array.from({length:pdf?.numPages??0},(_,j)=>j+1).filter(p=>p!==a.placement.page).map(page=>({...a,placement:{...a.placement,page}}))])}>Repeat on all pages</button></fieldset>)}
  </section>;
}
