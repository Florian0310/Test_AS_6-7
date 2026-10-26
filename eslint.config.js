import js from '@eslint/js';
import globals from 'globals';
export default [
  {ignores:['backend/**','node_modules/**','artifacts/**','test-results/**','docs/**','assets/**','dist/**']},
  js.configs.recommended,
  {files:['*.js'],languageOptions:{globals:{...globals.browser,ASI18n:'readonly',ASTheme:'readonly'}},rules:{'no-unused-vars':['warn',{argsIgnorePattern:'^_',caughtErrors:'none'}],'no-empty':['error',{allowEmptyCatch:true}]}},
  {files:['tools/**/*.mjs','tests/**/*.js','playwright.config.js','eslint.config.js'],languageOptions:{globals:{...globals.node,...globals.browser}},rules:{'no-unused-vars':['warn',{caughtErrors:'none'}]}},
];
