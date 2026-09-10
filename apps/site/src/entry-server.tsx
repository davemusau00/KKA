import React from 'react';
import { renderToString } from 'react-dom/server';
import { RouterProvider } from '@tanstack/react-router';
import { createSiteRouter } from './router';
import type { SiteSnapshot } from './types';
export async function render(url:string,snapshot:SiteSnapshot){
 const router=createSiteRouter(snapshot,url);
 await router.load();
 return renderToString(<RouterProvider router={router}/>);
}
