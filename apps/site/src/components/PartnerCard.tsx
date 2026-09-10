import { Link } from '@tanstack/react-router';
import type { Partner } from '../types';
import { SafeImage } from './SafeImage';
export function PartnerCard({partner,variant='standard'}:{partner:Partner;variant?:'standard'|'featured'|'compact'}){const fallback='';return <article className={`partner-card partner-${variant}`}><Link to="/team/$slug" params={{slug:partner.slug}} className="partner-image"><SafeImage asset={partner.image} fallback={fallback} alt={`${partner.name}, ${partner.title}`}/><span className="partner-image-glow"/></Link><div className="partner-meta"><div><h3>{partner.name}</h3><p>{partner.title}</p></div><Link to="/team/$slug" params={{slug:partner.slug}} aria-label={`View ${partner.name}`}>→</Link></div></article>}
