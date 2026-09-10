import { useRef, useState } from 'react';
import { Rating } from '@kka/site-ui';
import type { Testimonial } from '../types';
export function TestimonialCarousel({items}:{items:Testimonial[]}){
 const [active,setActive]=useState(0);const touch=useRef<number|null>(null);if(!items.length)return null;
 const move=(step:number)=>setActive(i=>(i+step+items.length)%items.length);
 const ordered=items.map((_,i)=>items[(active+i)%items.length]!);
 return <div className="testimonial-shell" role="region" aria-roledescription="carousel" aria-label="Client testimonials" tabIndex={0} onKeyDown={e=>{if(e.key==='ArrowRight')move(1);if(e.key==='ArrowLeft')move(-1);}} onTouchStart={e=>{touch.current=e.touches[0]?.clientX??null;}} onTouchEnd={e=>{const end=e.changedTouches[0]?.clientX;if(touch.current!==null&&end!==undefined&&Math.abs(end-touch.current)>40)move(end<touch.current?1:-1);touch.current=null;}}>
 <div className="testimonial-track">{ordered.map((item,index)=><article key={item.id} data-offset={index}><Rating value={item.rating}/><h3>?{item.title}?</h3><p>?{item.quote}?</p><small>? {item.source}</small></article>)}</div>
 {items.length>1&&<div className="carousel-controls"><button onClick={()=>move(-1)} aria-label="Previous testimonial">?</button><div className="carousel-dots">{items.map((_,i)=><button key={i} className={i===active?'active':''} onClick={()=>setActive(i)} aria-label={`Show testimonial ${i+1}`} aria-pressed={i===active}/>)}</div><button onClick={()=>move(1)} aria-label="Next testimonial">?</button></div>}<span className="sr-only" role="status">Testimonial {active+1} of {items.length}</span></div>;
}
