import type { SiteBootstrap } from '../types';
import { ContentPage } from './DynamicPage';
export function HomePage({data}:{data:SiteBootstrap}){return <ContentPage slug="home" data={data}/>;}
