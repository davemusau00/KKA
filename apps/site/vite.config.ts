import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({plugins:[react()],resolve:{alias:{'@kka/contracts':fileURLToPath(new URL('../../packages/contracts/src/index.ts',import.meta.url))}},server:{port:5174,host:'127.0.0.1',proxy:{'/api':{target:process.env.SITE_API_ORIGIN||'http://127.0.0.1:3015',changeOrigin:true}}},ssr:{noExternal:['@kka/site-ui','@kka/contracts']},build:{target:'es2022',sourcemap:true}});
