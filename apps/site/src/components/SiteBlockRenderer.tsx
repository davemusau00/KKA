import { Hero, WhoWeAre, PartnerLeadership, MediaInsights, TeamPreview, Testimonials, Consultation, Services, Metrics } from './HomeSections';
import { Link } from '@tanstack/react-router';
import { Container, Eyebrow, Heading, ReadingContainer, Section } from '@kka/site-ui';
import type { SiteBlock, SiteBootstrap } from '../types';
import { PracticeCard } from './PracticeCard';
import { PartnerCard } from './PartnerCard';
import { LeadForm } from './LeadForm';
import { SafeImage } from './SafeImage';
import { TestimonialCarousel } from './TestimonialCarousel';

const allowedTones=new Set(['light','ivory','dark','gold']);
function tone(v:string){return allowedTones.has(v)?v as 'light'|'ivory'|'dark'|'gold':'light'}
function text(v:unknown,fallback=''){return typeof v==='string'?v:fallback}
function strings(v:unknown){return Array.isArray(v)?v.filter(x=>typeof x==='string') as string[]:[]}

export function SiteBlockRenderer({block,data}:{block:SiteBlock;data:SiteBootstrap}){
 const c=block.content||{}; const sectionTone=tone(block.theme);
 switch(block.blockType){
  case 'HERO_JUSTICE': return <Hero content={c}/>;
  case 'FIRM_INTRODUCTION': return <WhoWeAre data={data} content={c}/>;
  case 'PARTNER_LEADERSHIP': return <PartnerLeadership data={data} content={c}/>;
  case 'MEDIA_FEATURE': return <MediaInsights data={data} content={c}/>;
  case 'TEAM_FEATURE': return <TeamPreview data={data} content={c}/>;
  case 'TESTIMONIALS': return <Testimonials data={data} content={c}/>;
  case 'CONSULTATION': return <Consultation data={data} content={c}/>;
  case 'HERO': return <section className={`page-hero cms-hero hero-${block.variant||'default'}`}><Container><Eyebrow>{text(c.eyebrow,'Kariuki Kagunda & Co. Advocates')}</Eyebrow><Heading as="h1">{text(c.title,'Practical legal counsel.')}</Heading>{c.description&&<p>{text(c.description)}</p>}{c.ctaUrl&&<Link to={text(c.ctaUrl) as any} className="ui-button ui-button-gold"><span>{text(c.ctaLabel,'Contact Us')}</span><span>→</span></Link>}</Container></section>;
  case 'RICH_TEXT': return <Section tone={sectionTone}><ReadingContainer className="prose cms-rich"><Eyebrow>{text(c.eyebrow)}</Eyebrow>{c.title&&<Heading>{text(c.title)}</Heading>}{text(c.body).split(/\n\n+/).filter(Boolean).map((p,i)=><p key={i}>{p}</p>)}</ReadingContainer></Section>;
  case 'QUOTE': return <Section tone={sectionTone} className="cms-quote"><ReadingContainer><blockquote>{text(c.quote)}</blockquote>{c.attribution&&<cite>{text(c.attribution)}</cite>}</ReadingContainer></Section>;
  case 'IMAGE_TEXT': return <Section tone={sectionTone}><Container className={`cms-image-text ${block.variant||''}`}><div><SafeImage asset={c.asset||null} fallback={text(c.fallbackImage,'/assets/partner-kariuki.png')} alt={text(c.alt,c.title||'')}/></div><div><Eyebrow>{text(c.eyebrow)}</Eyebrow><Heading>{text(c.title)}</Heading>{text(c.body).split(/\n\n+/).filter(Boolean).map((p,i)=><p key={i}>{p}</p>)}{c.ctaUrl&&<a className="ui-button ui-button-outline" href={text(c.ctaUrl)}><span>{text(c.ctaLabel,'Learn More')}</span><span>→</span></a>}</div></Container></Section>;
  case 'PRACTICE_GRID': {if(block.variant==='home')return <Services data={data} content={c}/>;const requested=strings(c.slugs);const items=requested.length?data.practiceAreas.filter(a=>requested.includes(a.slug)):data.practiceAreas;return <Section tone={sectionTone}><Container><Eyebrow>{text(c.eyebrow,'Our Services')}</Eyebrow><Heading>{text(c.title,'AREAS OF PRACTICE')}</Heading>{c.description&&<p className="cms-section-copy">{text(c.description)}</p>}<div className="practice-index-grid">{items.map(a=><PracticeCard key={a.id} area={a}/>)}</div></Container></Section>}
  case 'PROFESSIONAL_GRID': {const requested=strings(c.slugs);const items=requested.length?data.partners.filter(p=>requested.includes(p.slug)):data.partners;return <Section tone={sectionTone}><Container><Eyebrow>{text(c.eyebrow,'Our Team')}</Eyebrow><Heading>{text(c.title,'MEET THE TEAM')}</Heading><div className="partner-grid-large">{items.map(p=><PartnerCard key={p.id} partner={p} variant="featured"/>)}</div></Container></Section>}
  case 'INSIGHTS_GRID': {const requested=strings(c.slugs);const items=requested.length?data.publications.filter(p=>requested.includes(p.slug)):data.publications;return <Section tone={sectionTone}><Container><Eyebrow>{text(c.eyebrow,'Insights')}</Eyebrow><Heading>{text(c.title,'LEGAL INSIGHTS & UPDATES')}</Heading><div className="article-grid">{items.slice(0,Number(c.limit)||12).map(p=><Link className="article-card" key={p.id} to="/insights/$slug" params={{slug:p.slug}}><SafeImage asset={p.cover} fallback="/assets/media-feature.png" alt={p.title}/><div><small>{p.kind}</small><h3>{p.title}</h3><p>{p.excerpt}</p><span>{p.kind==='VIDEO'?'Watch':'Read'} →</span></div></Link>)}</div></Container></Section>}
  case 'METRICS': return <Metrics data={data}/>;
  case 'FAQ': {const faqs=Array.isArray(c.items)?c.items:[];return <Section tone={sectionTone}><ReadingContainer className="faq-list"><Eyebrow>{text(c.eyebrow,'Questions')}</Eyebrow><Heading>{text(c.title,'FREQUENTLY ASKED QUESTIONS')}</Heading>{faqs.map((f:any,i:number)=><details key={i}><summary>{text(f.q)}</summary><p>{text(f.a)}</p></details>)}</ReadingContainer></Section>}
  case 'CTA': return <Section tone={sectionTone}><Container className="cms-cta"><div><Eyebrow>{text(c.eyebrow,"Let's Talk")}</Eyebrow><Heading>{text(c.title,"LET'S START A CONVERSATION.")}</Heading>{c.description&&<p>{text(c.description)}</p>}</div>{c.form===false?<a href={text(c.ctaUrl,'/contact')} className="ui-button ui-button-gold"><span>{text(c.ctaLabel,'Contact Us')}</span><span>→</span></a>:<div className="cms-cta-form"><LeadForm areas={data.practiceAreas} compact/></div>}</Container></Section>;
  case 'SPACER': return <div aria-hidden style={{height:`clamp(1rem, ${Math.min(Math.max(Number(c.size)||4,1),12)}vw, 8rem)`}}/>;
  default: throw new Error(`Unsupported public block: ${block.blockType}`);
 }
}
