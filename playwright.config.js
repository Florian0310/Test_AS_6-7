import {defineConfig} from '@playwright/test';
export default defineConfig({
  globalSetup:'./tests/e2e/setup.js',
  testDir:'tests/e2e', timeout:30000, workers:1, retries:0,
  reporter:[['list'],['json',{outputFile:process.argv.some(arg=>arg.startsWith('--grep')) ? 'artifacts/e2e-targeted-results.json' : 'artifacts/e2e-results.json'}]],
  use:{baseURL:'http://localhost:8000',channel:'chrome',headless:true,locale:'de-AT',screenshot:'only-on-failure',trace:'retain-on-failure'},
});
