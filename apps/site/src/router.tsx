import { createRootRoute, createRoute, createRouter, createMemoryHistory, notFound, Outlet, useRouterState } from '@tanstack/react-router';
import { bootstrap, partner, practice, publication } from './lib/api';
import { SiteHeader } from './components/SiteHeader';
import { SiteFooter } from './components/SiteFooter';
import { Seo } from './components/Seo';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { PracticeAreasPage, PracticeDetailPage } from './pages/PracticePages';
import { TeamPage, PartnerPage } from './pages/TeamPages';
import { InsightsPage, InsightPage } from './pages/InsightPages';
import { ContactPage } from './pages/ContactPage';
import { SearchPage } from './pages/SearchPage';
import { DynamicPage } from './pages/DynamicPage';
import { NotFoundPage } from './pages/NotFoundPage';
import type { SiteBootstrap, SiteSnapshot } from './types';

export function createSiteRouter(snapshot?:SiteSnapshot, url?:string){
const dataPromise=snapshot?Promise.resolve({...snapshot.bootstrap,pages:snapshot.pages}):bootstrap();
const rootRoute=createRootRoute({loader:()=>dataPromise,component:Root,notFoundComponent:NotFoundPage,errorComponent:({error})=><section className="not-found" role="alert"><h1>Website temporarily unavailable</h1><p>Please try again shortly.</p><button onClick={()=>location.reload()}>Retry</button></section>});
const find=async(key:'partners'|'practiceAreas'|'publications',slug:string)=>{const data=await dataPromise;const value=data[key].find(x=>x.slug===slug);if(!value)throw notFound();return value;};
function Root(){const data=rootRoute.useLoaderData() as SiteBootstrap;const path=useRouterState({select:s=>s.location.pathname});return <><Seo settings={data.settings}/><a className="skip-link" href="#main">Skip to content</a><SiteHeader settings={data.settings}/><main id="main" data-path={path}><Outlet/></main><SiteFooter settings={data.settings} areas={data.practiceAreas}/></>}
const indexRoute=createRoute({getParentRoute:()=>rootRoute,path:'/',component:()=>{const data=rootRoute.useLoaderData() as SiteBootstrap;return <ContentPage slug="home" data={data} fallback={<HomePage data={data}/>}/>}});
const aboutRoute=createRoute({getParentRoute:()=>rootRoute,path:'/about',component:()=>{const data=rootRoute.useLoaderData() as SiteBootstrap;return <ContentPage slug="about" data={data} fallback={<AboutPage data={data}/>}/>}});
const practiceIndex=createRoute({getParentRoute:()=>rootRoute,path:'/practice-areas',component:()=>{const data=rootRoute.useLoaderData() as SiteBootstrap;return <PracticeAreasPage data={data}/>}});
const practiceDetail=createRoute({getParentRoute:()=>rootRoute,path:'/practice-areas/$slug',loader:({params})=>find('practiceAreas',params.slug) as Promise<import('./types').PracticeArea>,component:()=>{const area=practiceDetail.useLoaderData();const data=rootRoute.useLoaderData() as SiteBootstrap;return <PracticeDetailPage area={area} data={data}/>}});
const teamIndex=createRoute({getParentRoute:()=>rootRoute,path:'/team',component:()=>{const data=rootRoute.useLoaderData() as SiteBootstrap;return <TeamPage data={data}/>}});
const partnerDetail=createRoute({getParentRoute:()=>rootRoute,path:'/team/$slug',loader:({params})=>find('partners',params.slug) as Promise<import('./types').Partner>,component:()=>{const p=partnerDetail.useLoaderData();const data=rootRoute.useLoaderData() as SiteBootstrap;return <PartnerPage partner={p} data={data}/>}});
const insightsIndex=createRoute({getParentRoute:()=>rootRoute,path:'/insights',component:()=>{const data=rootRoute.useLoaderData() as SiteBootstrap;return <InsightsPage data={data}/>}});
const insightDetail=createRoute({getParentRoute:()=>rootRoute,path:'/insights/$slug',loader:({params})=>find('publications',params.slug) as Promise<import('./types').Publication>,component:()=>{const p=insightDetail.useLoaderData();const data=rootRoute.useLoaderData() as SiteBootstrap;return <InsightPage publication={p} data={data}/>}});
const contactRoute=createRoute({getParentRoute:()=>rootRoute,path:'/contact',component:()=>{const data=rootRoute.useLoaderData() as SiteBootstrap;return <ContentPage slug="contact" data={data} fallback={<ContactPage data={data}/>}/>}});
const searchRoute=createRoute({getParentRoute:()=>rootRoute,path:'/search',component:SearchPage});
const cmsPageRoute=createRoute({getParentRoute:()=>rootRoute,path:'/$slug',loader:async({params})=>{const data=await dataPromise;if(!data.pages?.some(p=>p.slug===params.slug))throw notFound();},component:()=>{const {slug}=cmsPageRoute.useParams();const data=rootRoute.useLoaderData() as SiteBootstrap;return <DynamicPage slug={slug} data={data}/>}});
const routeTree=rootRoute.addChildren([indexRoute,aboutRoute,practiceIndex,practiceDetail,teamIndex,partnerDetail,insightsIndex,insightDetail,contactRoute,searchRoute,cmsPageRoute]);
return createRouter({routeTree,history:url?createMemoryHistory({initialEntries:[url]}):undefined,defaultPreload:'intent',defaultPreloadStaleTime:30_000,scrollRestoration:true});
}
import { ContentPage } from './pages/DynamicPage';
declare module '@tanstack/react-router' {interface Register {router: ReturnType<typeof createSiteRouter>}}
