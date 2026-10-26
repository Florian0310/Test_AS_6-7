import js from '@eslint/js';
import globals from 'globals';
export default [
  {ignores:['**/node_modules/**','**/.next/**','backend/src/**','backend/data/**','backend/media/**','backend/*.mjs','artifacts/**','test-results/**','docs/**','frontend/public/assets/**','dist/**']},
  js.configs.recommended,
  {files:['*.js','frontend/**/*.js'],languageOptions:{globals:{...globals.browser}},rules:{'no-unused-vars':['warn',{argsIgnorePattern:'^_',caughtErrors:'none'}],'no-empty':['error',{allowEmptyCatch:true}]}},
  {files:['scripts/**/*.mjs','backend/scripts/**/*.mjs','frontend/templates/**/*.mjs','tests/**/*.js','playwright.config.js','eslint.config.js'],languageOptions:{globals:{...globals.node,...globals.browser}},rules:{'no-unused-vars':['warn',{caughtErrors:'none'}]}},
];
