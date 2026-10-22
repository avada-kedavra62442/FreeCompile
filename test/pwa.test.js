import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('PWA manifest is valid and points to real app icons', () => {
  const manifest = JSON.parse(read('../public/manifest.webmanifest'));
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.some(icon => icon.sizes === '192x192'));
  assert.ok(manifest.icons.some(icon => icon.sizes === '512x512'));
  for (const icon of manifest.icons) {
    assert.ok(existsSync(new URL('../public' + icon.src, import.meta.url)), 'missing icon: ' + icon.src);
  }
});

test('HTML declares the manifest and Apple touch icons', () => {
  const html = read('../index.html');
  assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
  for (const size of ['120', '152', '167', '180']) {
    assert.match(html, new RegExp('apple-touch-icon[^>]*sizes="' + size + 'x' + size + '"'));
    assert.ok(existsSync(new URL('../public/apple-touch-icon-' + size + '.png', import.meta.url)));
  }
  assert.ok(existsSync(new URL('../public/apple-touch-icon.png', import.meta.url)));
});

test('app registers the service worker and exposes installation help', () => {
  const app = read('../src/main.jsx');
  assert.match(app, /serviceWorker\.register\('\/sw\.js'/);
  assert.match(app, /beforeinstallprompt/);
  assert.match(app, /Add to Home Screen/);
  assert.match(app, /JavaScript completed without console output/);
});

test('footer has responsive layout rules and keeps its columns separate', () => {
  const app = read('../src/main.jsx');
  const css = read('../src/style.css');
  assert.match(app, /className="site-footer"/);
  assert.match(app, /FreeToolz/);
  assert.match(css, /\.footer-top\{[^}]*grid-template-columns/);
  assert.match(css, /@media\(max-width:520px\)/);
});
