import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('all declared runtime/build dependencies resolve in CI', async () => {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  for (const dependency of Object.keys(packageJson.dependencies || {})) {
    await assert.doesNotReject(() => import(dependency), dependency + ' must be importable');
  }
});

test('build script bundles the Python runtime before Vite builds', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.match(packageJson.scripts.build, /copy-pyodide\.mjs.*vite build/);
  assert.ok(packageJson.dependencies.pyodide, 'Pyodide dependency must be declared');
});
