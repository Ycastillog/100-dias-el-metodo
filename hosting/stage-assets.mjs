import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadAssets } from './asset-manifest.mjs';

// Build output only; application sources are never copied as an unrestricted tree.
const output = resolve('dist/client');
const assets = await loadAssets(process.cwd());
for (const [url, asset] of Object.entries(assets)) {
  if (url === '/') continue;
  const target = resolve(output, '.' + url);
  if (!target.startsWith(output + '/'.replace('/', process.platform === 'win32' ? '\\' : '/'))) {
    throw new Error('Asset outside build output');
  }
  await mkdir(resolve(target, '..'), { recursive: true });
  await writeFile(target, Buffer.from(asset.data, asset.encoding === 'base64' ? 'base64' : 'utf8'));
}
console.log(`Staged ${Object.keys(assets).length - 1} allowlisted review assets.`);
