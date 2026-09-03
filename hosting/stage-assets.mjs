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
for (const [url, asset] of Object.entries(assets)) {
  if (url === '/') continue;
  const target = resolve(output, '.' + url);
  if (!target.startsWith(output + sep)) {
    throw new Error('Asset outside build output');
  }
  await mkdir(resolve(target, '..'), { recursive: true });
  await writeFile(target, Buffer.from(asset.data, asset.encoding === 'base64' ? 'base64' : 'utf8'));
}
console.log(`Staged ${Object.keys(assets).length - 1} allowlisted ${sales ? 'sales' : prelaunch ? 'prelaunch' : 'private review'} assets.`);
