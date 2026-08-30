import { defineConfig } from 'vite';
import { sites } from '@openai/sites-vite-plugin';
import { resolve } from 'node:path';
import { loadAssets, PUBLIC_FILES } from './hosting/asset-manifest.mjs';

const virtualId = '\0virtual:brand-review-assets';
export default defineConfig({
  publicDir: false,
  plugins: [sites(), {
    name: 'brand-private-review',
    resolveId(id) { return id === 'virtual:brand-review-assets' ? virtualId : null; },
    async load(id) {
      if (id !== virtualId) return;
      for (const file of PUBLIC_FILES) this.addWatchFile(resolve(file));
      return 'export default ' + JSON.stringify(await loadAssets(process.cwd()));
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/@')) return next();
        try {
          const { default: worker } = await server.ssrLoadModule('/hosting/worker.mjs');
          const response = await worker.fetch(new Request(new URL(req.url ?? '/', 'http://127.0.0.1:8790'), { method: req.method }));
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
});
