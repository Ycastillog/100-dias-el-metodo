import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PRACTICE_WISDOM } from './practice-wisdom.js';
import { AREA_ORDER } from './guided-tools.js';
import { loadSalesAssets } from './sales-assets.mjs';

test('public references and participant advice agree for all five supported areas', async () => {
  assert.deepEqual(Object.keys(PRACTICE_WISDOM).sort(), [...AREA_ORDER].sort());
  const html=await readFile(new URL('sales.html',import.meta.url),'utf8');
  for (const wisdom of Object.values(PRACTICE_WISDOM)) {
    for (const key of ['title','idea','exercise','caution']) assert.ok(wisdom[key].length>15);
    assert.ok(html.includes(wisdom.title));
    if (wisdom.source) {
      assert.equal(new URL(wisdom.source).protocol,'https:');
      assert.ok(html.includes(wisdom.source));
    }
  }
  assert.match(html,/no implican colaboración ni respaldo/);
  const assets=await loadSalesAssets(process.cwd());
  assert.equal(assets['/assets/wisdom-hero-v1.webp'].type,'image/webp');
  assert.ok(Buffer.from(assets['/assets/wisdom-hero-v1.webp'].data,'base64').length<150000);
  assert.match(assets['/assets/practice-wisdom.js'].data,/export const PRACTICE_WISDOM/);
});
