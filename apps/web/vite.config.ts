import { defineConfig } from 'vite';
import vinext from 'vinext';
import { cloudflare } from '@cloudflare/vite-plugin';

const preview = process.env.POLYMATIK_PREVIEW_BUILD === '1';

export default defineConfig({
  ...(preview ? { envDir: 'deploy/preview' } : {}),
  // Optional client entry lives in instrumentation-client.ts; see docs/36.
  plugins: [
    vinext(
      preview
        ? {
            rscOutDir: '../../.cache/cloudflare-preview/web/server',
            ssrOutDir: '../../.cache/cloudflare-preview/web/server/ssr',
            clientOutDir: '../../.cache/cloudflare-preview/web/client',
          }
        : {},
    ),
    cloudflare({
      configPath: preview ? 'deploy/preview/wrangler.json' : 'wrangler.jsonc',
      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
    }),
  ],
});
