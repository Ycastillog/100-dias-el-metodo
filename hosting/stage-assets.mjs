import { lstat, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { loadAssets } from './asset-manifest.mjs';
import { loadPrelaunchAssets } from './prelaunch-assets.mjs';
import { loadSalesAssets } from './sales-assets.mjs';

// Build output only; application sources are never copied as an unrestricted tree.
const root = await realpath(process.cwd());
const dist = resolve(root, 'dist');
const output = resolve(dist, 'client');
await mkdir(dist, { recursive: true });
if (await realpath(dist) !== dist || (await lstat(dist)).isSymbolicLink()) throw new Error('Refusing linked build directory');
if (relative(root, output) !== ['dist', 'client'].join(sep)) throw new Error('Unsafe build output');
const prior = await lstat(output).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
if (prior && (!prior.isDirectory() || prior.isSymbolicLink() || await realpath(output) !== output)) throw new Error('Unsafe existing client output');
// Only this validated, generated output is recreated; never the source checkout.
if (prior) await rm(output, { recursive: true });
await mkdir(output, { recursive: true });
const prelaunch = process.argv.includes('--prelaunch');
const sales = process.argv.includes('--sales');
const assets = await (sales ? loadSalesAssets : prelaunch ? loadPrelaunchAssets : loadAssets)(root);
let staged = 0;
for (const [url, asset] of Object.entries(assets)) {
  // Sites serves matching static assets before the Worker. Keep these routes
  // Worker-only: the home page needs the current sales state and /mi-metodo
  // needs an explicit HTML MIME type, not an extensionless static download.
  // The hosting static layer does not identify WebP reliably. Let the Worker
  // serve this image with its explicit image/webp MIME type as well.
  if (url === '/' || sales && ['/index.html', '/mi-metodo', '/assets/practice-editorial-v2.webp'].includes(url)) continue;
  const target = resolve(output, '.' + url);
  if (!target.startsWith(output + sep)) {
    throw new Error('Asset outside build output');
  }
  await mkdir(resolve(target, '..'), { recursive: true });
  await writeFile(target, Buffer.from(asset.data, asset.encoding === 'base64' ? 'base64' : 'utf8'));
  staged++;
}
console.log(`Staged ${staged} allowlisted ${sales ? 'sales' : prelaunch ? 'prelaunch' : 'private review'} assets.`);
