/** Local synthetic UI harness. Never imported by the app or deployed. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { themes } from '../../packages/ui-tokens/src/index.ts';
import { isEvidenceResponse } from '../../packages/domain-types/src/evidence.ts';

const webRequire = createRequire(
  new URL('../../apps/web/package.json', import.meta.url),
);
const { build } = await import(pathToFileURL(webRequire.resolve('vite')).href);
const tailwind = webRequire('@tailwindcss/postcss');
await mkdir('.cache', { recursive: true });
const directory = await mkdtemp(resolve('.cache/evidence-browser-'));
const response = JSON.parse(
  await readFile('tests/fixtures/evidence/response.json', 'utf8'),
);
if (!isEvidenceResponse(response, 'atoms')) throw new Error('Invalid fixture');
const component = resolve('apps/web/app/resource-research.tsx').replaceAll(
  '\\',
  '/',
);
const css = resolve('apps/web/app/globals.css').replaceAll('\\', '/');
await writeFile(
  resolve(directory, 'main.tsx'),
  `
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ResearchForm } from ${JSON.stringify(component)};
import ${JSON.stringify(css)};
const nativeFetch = window.fetch.bind(window);
function Harness() {
  const [account, setAccount] = useState('alice');
  const [mode, setMode] = useState('evidence');
  useEffect(() => {
    window.fetch = (url, init) => nativeFetch(url, {...init, headers: {...Object.fromEntries(new Headers(init?.headers)), 'x-fixture-mode':mode}});
    return () => { window.fetch = nativeFetch; };
  }, [mode]);
  return <main style={{maxWidth:960,margin:'0 auto',padding:'32px 24px'}}>
    <p className="eyebrow">LOCAL SYNTHETIC UI CHECK — NO LIVE ACCOUNTS OR CORPUS</p>
    <h1 style={{fontFamily:'var(--serif)',margin:'24px 0'}}>Look closer.</h1>
    <nav aria-label="Fixture controls" style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:32}}>
      <button onClick={()=>document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark'}>Toggle appearance</button>
      <label>Response <select value={mode} onChange={e=>setMode(e.target.value)}>
        {['evidence','empty','rights','unavailable','slow','changed','malformed'].map(x=><option key={x}>{x}</option>)}
      </select></label>
      <button onClick={()=>setAccount(account==='alice'?'bob':'alice')}>Change synthetic account</button>
    </nav>
    <section className="resource-research"><ResearchForm key={account} id="atoms" accountId={account}/></section>
  </main>;
}
createRoot(document.getElementById('root')).render(<Harness/>);
`,
);
await build({
  configFile: false,
  root: directory,
  logLevel: 'warn',
  css: { postcss: { plugins: [tailwind()] } },
  resolve: {
    alias: [
      { find: /^react$/, replacement: webRequire.resolve('react') },
      {
        find: /^react\/jsx-runtime$/,
        replacement: webRequire.resolve('react/jsx-runtime'),
      },
      {
        find: /^react-dom\/client$/,
        replacement: webRequire.resolve('react-dom/client'),
      },
    ],
  },
  build: {
    outDir: resolve(directory, 'dist'),
    minify: true,
    lib: {
      entry: resolve(directory, 'main.tsx'),
      formats: ['es'],
      fileName: () => 'ui.js',
      cssFileName: 'style',
    },
  },
});
const declarations = (theme) =>
  Object.entries(theme)
    .map(([k, v]) => `--${k}:${v}`)
    .join(';');
const html = `<!doctype html><html lang="en" data-theme="light"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Polymatik AI — synthetic research check</title><link rel="stylesheet" href="/style.css"><style>:root{${declarations(themes.light)}}html[data-theme=dark]{${declarations(themes.dark)}}</style></head><body><div id="root"></div><script type="module" src="/ui.js"></script></body></html>`;
const server = createServer(async (request, outgoing) => {
  try {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    outgoing.setHeader('cache-control', 'no-store');
    if (url.pathname === '/api/account/evidence' && request.method === 'POST') {
      let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 16384) throw new Error('fixture body');
      }
      const mode = request.headers['x-fixture-mode'];
      if (mode === 'slow') await new Promise((done) => setTimeout(done, 4000));
      const status =
        mode === 'unavailable' ? 503 : mode === 'changed' ? 409 : 200;
      const body =
        mode === 'empty' || mode === 'rights'
          ? {
              ...response,
              status:
                mode === 'empty' ? 'no_evidence' : 'quotation_unavailable',
              citations: [],
            }
          : mode === 'malformed'
            ? {
                ...response,
                citations: [
                  { ...response.citations[0], url: 'javascript:alert(1)' },
                ],
              }
            : response;
      outgoing.writeHead(status, { 'content-type': 'application/json' });
      outgoing.end(JSON.stringify(body));
      return;
    }
    if (!['/', '/ui.js', '/style.css'].includes(url.pathname)) {
      outgoing.writeHead(404);
      outgoing.end();
      return;
    }
    outgoing.setHeader(
      'content-type',
      url.pathname === '/'
        ? 'text/html'
        : url.pathname.endsWith('.js')
          ? 'text/javascript'
          : 'text/css',
    );
    outgoing.end(
      url.pathname === '/'
        ? html
        : await readFile(resolve(directory, 'dist', url.pathname.slice(1))),
    );
  } catch {
    outgoing.writeHead(500);
    outgoing.end();
  }
});
if (process.argv.includes('--build-only')) {
  console.log('Synthetic research form build passed; no server started.');
} else {
  server.listen(5191, '127.0.0.1', () =>
    console.log(
      'Synthetic research UI: http://127.0.0.1:5191/ — fixture data only. Ctrl+C to stop.',
    ),
  );
}
