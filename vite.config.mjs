import { defineConfig } from 'vite';
import { sites } from '@openai/sites-vite-plugin';
import { resolve } from 'node:path';
import { loadAssets, PUBLIC_FILES } from './hosting/asset-manifest.mjs';
import { loadPrelaunchAssets, PRELAUNCH_FILES } from './hosting/prelaunch-assets.mjs';

const virtualId = '\0virtual:brand-review-assets';
export default defineConfig(({ mode }) => {
  const prelaunch = mode === 'prelaunch';
  const files = prelaunch ? PRELAUNCH_FILES : PUBLIC_FILES;
  const readAssets = prelaunch ? loadPrelaunchAssets : loadAssets;
  return {
  publicDir: false,
  plugins: [sites(), {
    name: 'brand-private-review',
    resolveId(id) { return id === 'virtual:brand-review-assets' ? virtualId : null; },
    async load(id) {
      if (id !== virtualId) return;
      for (const file of files) this.addWatchFile(resolve(file));
      return 'export default ' + JSON.stringify(await readAssets(process.cwd()));
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/@')) return next();
        try {
          const { default: worker } = await server.ssrLoadModule('/hosting/worker.mjs');
          // Preserve cookies, Origin and request bodies during local validation.
          // This adapter intentionally has no production secrets or live DB.
          const host = req.headers.host || '127.0.0.1:8790';
          const url = new URL(req.url ?? '/', 'http://' + host);
          if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
            res.statusCode = 403; res.end(); return;
          }
          const chunks = []; let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 128 * 1024) { res.statusCode = 413; res.end(); return; }
            chunks.push(chunk);
          }
          const headers = new Headers();
          for (const [name, value] of Object.entries(req.headers)) {
            if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
          }
          const init = { method: req.method, headers };
          if (!['GET', 'HEAD'].includes(req.method)) init.body = Buffer.concat(chunks);
          const response = await worker.fetch(new Request(url, init));
          res.statusCode = response.status;
          response.headers.forEach((value, name) => res.setHeader(name, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) { next(error); }
      });
    },
  }],
  build: {
    ssr: 'hosting/worker.mjs', outDir: 'dist/server', emptyOutDir: true,
    rolldownOptions: { output: { entryFileNames: 'index.js' } },
  },
  };
});
