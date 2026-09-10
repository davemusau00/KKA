import type { HTMLAttributes, ReactNode } from 'react';
export function Container({children,className='',...rest}:HTMLAttributes<HTMLDivElement>){return <div className={`ui-container ${className}`} {...rest}>{children}</div>}
export function ReadingContainer({children,className=''}:{children:ReactNode;className?:string}){return <div className={`ui-reading ${className}`}>{children}</div>}
export function Section({children,className='',tone='light',id}:{children:ReactNode;className?:string;tone?:'light'|'dark'|'ivory'|'gold';id?:string}){return <section id={id} className={`ui-section ui-section-${tone} ${className}`}>{children}</section>}
export function Stack({children,className='',gap='md'}:{children:ReactNode;className?:string;gap?:'sm'|'md'|'lg'}){return <div className={`ui-stack ui-stack-${gap} ${className}`}>{children}</div>}
export function Cluster({children,className=''}:{children:ReactNode;className?:string}){return <div className={`ui-cluster ${className}`}>{children}</div>}
