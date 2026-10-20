import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('node_modules/pyodide');
const destination = resolve('public/pyodide');
if (!existsSync(resolve(source, 'pyodide.mjs'))) {
  throw new Error('Pyodide package is missing. Run npm install before building FreeCompile.');
}
rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
console.log('Bundled local Pyodide runtime assets into public/pyodide.');
