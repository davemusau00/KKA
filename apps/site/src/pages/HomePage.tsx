import type { SiteBootstrap } from '../types';
import { Consultation, Hero, MediaInsights, Metrics, Services, TeamPreview, Testimonials, WhoWeAre } from '../components/HomeSections';
import { Seo } from '../components/Seo';
export function HomePage({data}:{data:SiteBootstrap}){return <><Seo settings={data.settings} title={data.settings.firmName} description={data.settings.tagline} image="/assets/hero-justice.png"/><Hero/><WhoWeAre data={data}/><Metrics data={data}/><Services data={data}/><MediaInsights data={data}/><TeamPreview data={data}/><Testimonials data={data}/><Consultation data={data}/></>}
