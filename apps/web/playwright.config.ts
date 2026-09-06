import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./test',timeout:60000,workers:1,use:{baseURL:'http://localhost:5173',channel:'chrome',trace:'retain-on-failure',screenshot:'only-on-failure'},reporter:'list'});
