import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./test',timeout:60000,workers:1,use:{baseURL:process.env.TEST_WEB_URL||'http://localhost:5173',channel:process.env.CI?undefined:'chrome',trace:'retain-on-failure',screenshot:'only-on-failure'},reporter:'list'});
