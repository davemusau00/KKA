import { Eyebrow, Heading } from '@kka/site-ui';
import type { ReactNode } from 'react';
export function SectionIntro({eyebrow,title,description,action,align='left'}:{eyebrow:string;title:ReactNode;description?:string;action?:ReactNode;align?:'left'|'center'}){return <div className={`section-intro align-${align}`}><Eyebrow>{eyebrow}</Eyebrow><Heading>{title}</Heading>{description&&<p>{description}</p>}{action}</div>}
