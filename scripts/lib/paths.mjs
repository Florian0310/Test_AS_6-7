import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
export const frontendRoot = path.join(projectRoot, 'frontend');
export const sourceDir = path.join(frontendRoot, 'src');
export const publicDir = path.join(frontendRoot, 'public');
export const templatesDir = path.join(frontendRoot, 'templates');
export const localesDir = path.join(frontendRoot, 'locales');
export const stylesDir = path.join(frontendRoot, 'styles');
export const outputDir = path.join(projectRoot, 'dist');
export const backendDir = path.join(projectRoot, 'backend');
export const artifactsDir = path.join(projectRoot, 'artifacts');
export const routeFile = (route, root = outputDir) => path.join(root, (route.endsWith('/') ? route + 'index.html' : route).slice(1));

export function assertBuildOutput(target) {
  if (path.resolve(target) !== path.resolve(projectRoot, 'dist')) throw new Error('Refusing to clear a directory other than the generated dist output.');
}
