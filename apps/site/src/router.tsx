import { createRootRoute, createRoute, createRouter, Outlet, useRouterState } from '@tanstack/react-router';
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
import type { SiteBootstrap } from './types';

const rootRoute=createRootRoute({loader:()=>bootstrap(),component:Root,notFoundComponent:NotFoundPage});
function Root(){const data=rootRoute.useLoaderData() as SiteBootstrap;const path=useRouterState({select:s=>s.location.pathname});return <><Seo settings={data.settings}/><a className="skip-link" href="#main">Skip to content</a><SiteHeader settings={data.settings}/><main id="main" data-path={path}><Outlet/></main><SiteFooter settings={data.settings} areas={data.practiceAreas}/></>}
const indexRoute=createRoute({getParentRoute:()=>rootRoute,path:'/',component:()=>{const data=rootRoute.useLoaderData() as SiteBootstrap;return <HomePage data={data}/>}});
const aboutRoute=createRoute({getParentRoute:()=>rootRoute,path:'/about',component:()=>{const data=rootRoute.useLoaderData() as SiteBootstrap;return <AboutPage data={data}/>}});
const practiceIndex=createRoute({getParentRoute:()=>rootRoute,path:'/practice-areas',component:()=>{const data=rootRoute.useLoaderData() as SiteBootstrap;return <PracticeAreasPage data={data}/>}});
const practiceDetail=createRoute({getParentRoute:()=>rootRoute,path:'/practice-areas/$slug',loader:({params})=>practice(params.slug),component:()=>{const area=practiceDetail.useLoaderData();const data=rootRoute.useLoaderData() as SiteBootstrap;return <PracticeDetailPage area={area} data={data}/>}});
const teamIndex=createRoute({getParentRoute:()=>rootRoute,path:'/team',component:()=>{const data=rootRoute.useLoaderData() as SiteBootstrap;return <TeamPage data={data}/>}});
const partnerDetail=createRoute({getParentRoute:()=>rootRoute,path:'/team/$slug',loader:({params})=>partner(params.slug),component:()=>{const p=partnerDetail.useLoaderData();const data=rootRoute.useLoaderData() as SiteBootstrap;return <PartnerPage partner={p} data={data}/>}});
const insightsIndex=createRoute({getParentRoute:()=>rootRoute,path:'/insights',component:()=>{const data=rootRoute.useLoaderData() as SiteBootstrap;return <InsightsPage data={data}/>}});
const insightDetail=createRoute({getParentRoute:()=>rootRoute,path:'/insights/$slug',loader:({params})=>publication(params.slug),component:()=>{const p=insightDetail.useLoaderData();const data=rootRoute.useLoaderData() as SiteBootstrap;return <InsightPage publication={p} data={data}/>}});
const contactRoute=createRoute({getParentRoute:()=>rootRoute,path:'/contact',component:()=>{const data=rootRoute.useLoaderData() as SiteBootstrap;return <ContactPage data={data}/>}});
const searchRoute=createRoute({getParentRoute:()=>rootRoute,path:'/search',component:SearchPage});
const cmsPageRoute=createRoute({getParentRoute:()=>rootRoute,path:'/$slug',component:()=>{const {slug}=cmsPageRoute.useParams();const data=rootRoute.useLoaderData() as SiteBootstrap;return <DynamicPage slug={slug} data={data}/>}});
const routeTree=rootRoute.addChildren([indexRoute,aboutRoute,practiceIndex,practiceDetail,teamIndex,partnerDetail,insightsIndex,insightDetail,contactRoute,searchRoute,cmsPageRoute]);
export const router=createRouter({routeTree,defaultPreload:'intent',defaultPreloadStaleTime:30_000,scrollRestoration:true});
declare module '@tanstack/react-router' {interface Register {router: typeof router}}
