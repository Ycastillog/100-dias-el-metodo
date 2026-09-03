import { defineConfig } from 'vite';
import { sites } from '@openai/sites-vite-plugin';
import { resolve } from 'node:path';
import { loadAssets, PUBLIC_FILES } from './hosting/asset-manifest.mjs';
import { loadPrelaunchAssets, PRELAUNCH_FILES } from './hosting/prelaunch-assets.mjs';
import { loadSalesAssets, SALES_FILES } from './hosting/sales-assets.mjs';
import { programModule, PROGRAM_FILES } from './hosting/program-source.mjs';

const virtualId = '\0virtual:brand-review-assets';
const programId = '\0virtual:private-program';
export default defineConfig(({ mode }) => {
  const prelaunch = mode === 'prelaunch';
  const sales = mode === 'sales';
  const files = sales ? SALES_FILES : prelaunch ? PRELAUNCH_FILES : PUBLIC_FILES;
  const readAssets = sales ? loadSalesAssets : prelaunch ? loadPrelaunchAssets : loadAssets;
  return {
  publicDir: false,
  plugins: [sites(), {
    name: 'brand-private-review',
    resolveId(id) { return id === 'virtual:brand-review-assets' ? virtualId : id === 'virtual:private-program' ? programId : null; },
    async load(id) {
      if (id === programId) {
        if (!sales) return 'export default null;';
        for (const file of PROGRAM_FILES) this.addWatchFile(resolve(file));
        return programModule(process.cwd());
      }
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
          response.headers.forEach((value, name) => { if (name !== 'set-cookie') res.setHeader(name, value); });
          const cookies = response.headers.getSetCookie();
          if (cookies.length) res.setHeader('set-cookie', cookies);
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
