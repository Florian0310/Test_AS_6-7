import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  testDir:'.',testMatch:'*.spec.js',workers:1,timeout:45000,retries:0,
  outputDir:'../../test-results/cms',
  reporter:[['list'],['json',{outputFile:fileURLToPath(new URL('../../artifacts/cms-e2e-results.json',import.meta.url))}]],
  use:{baseURL:process.env.CMS_BASE_URL || 'http://localhost:3002',channel:'chrome',headless:true,locale:'de-AT',screenshot:'only-on-failure',trace:'retain-on-failure'},
});
