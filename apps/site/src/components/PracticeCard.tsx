import { Building2, BriefcaseBusiness, Copyright, Gavel, Scale } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { PracticeArea } from '../types';
const icons={building:Building2,briefcase:BriefcaseBusiness,copyright:Copyright,gavel:Gavel,scale:Scale};
export function PracticeCard({area,compact=false}:{area:PracticeArea;compact?:boolean}){const I=icons[area.icon as keyof typeof icons]||Scale;return <article className={`practice-card ${compact?'compact':''}`}><div className="practice-icon"><I/></div><h3>{area.title}</h3><p>{area.summary}</p><Link to="/practice-areas/$slug" params={{slug:area.slug}} aria-label={`Read about ${area.title}`}>→</Link><span className="practice-watermark" aria-hidden><I/></span></article>}
