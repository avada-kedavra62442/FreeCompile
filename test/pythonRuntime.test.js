import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('embedded Python runtime loads its WebAssembly runtime from the deployed site', () => {
  const source = readFileSync(new URL('../src/runtime/pythonRuntime.js', import.meta.url), 'utf8');
  assert.ok(source.includes("new URL('pyodide/',document.baseURI)"));
  assert.ok(source.includes('loadPyodide({indexURL:base.href})'));
  assert.ok(!source.includes('https://'));
});

test('production build bundles Pyodide assets locally', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.ok(packageJson.scripts.build.includes('copy-pyodide.mjs'));
  assert.ok(packageJson.dependencies.pyodide);
});
