import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
export function Eyebrow({children,className=''}:{children:ReactNode;className?:string}){return <div className={`ui-eyebrow ${className}`}>{children}</div>}
export function Heading({as='h2',children,className=''}:{as?:'h1'|'h2'|'h3'|'h4';children:ReactNode;className?:string}){const T=as;return <T className={`ui-heading ${className}`}>{children}</T>}
export function Button({children,variant='gold',className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'gold'|'outline'|'ghost'|'text'}){return <button className={`ui-button ui-button-${variant} ${className}`} {...props}><span>{children}</span><ArrowRight aria-hidden size={17}/></button>}
export function TextLink({children,href,className=''}:{children:ReactNode;href:string;className?:string}){return <a className={`ui-text-link ${className}`} href={href}><span>{children}</span><ArrowRight aria-hidden size={15}/></a>}
export function Surface({children,className='',...rest}:HTMLAttributes<HTMLDivElement>){return <div className={`ui-surface ${className}`} {...rest}>{children}</div>}
export function Divider({className=''}:{className?:string}){return <div className={`ui-divider ${className}`} aria-hidden/>}
export function Rating({value=5}:{value?:number}){return <div className="ui-rating" aria-label={`${value} out of 5 stars`}>{Array.from({length:5},(_,i)=><span aria-hidden key={i}>{i<value?'★':'☆'}</span>)}</div>}
