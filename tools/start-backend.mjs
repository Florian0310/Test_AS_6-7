import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const backend=fileURLToPath(new URL('../backend/',import.meta.url));
try {process.loadEnvFile(path.join(backend,'.env'));} catch(error) {if(error.code!=='ENOENT')throw error;}
if (!process.env.DATABASE_URI) throw new Error('DATABASE_URI must explicitly point to persistent storage.');
if(process.env.DATABASE_URI.startsWith('file:./')) process.env.DATABASE_URI='file:'+path.resolve(backend,process.env.DATABASE_URI.slice(5)).replaceAll('\\','/');
process.env.MEDIA_DIR ||= path.join(backend,'media');
process.env.PORT ||= '3001';
process.env.HOSTNAME ||= '127.0.0.1';
await import(pathToFileURL(path.join(backend,'.next/standalone/server.js')));
