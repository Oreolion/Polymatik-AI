import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { smokePreview } from '../../scripts/smoke-cloudflare-preview.mjs';
import { resources } from '../../packages/domain-types/src/discovery-preview.ts';

const require = createRequire(import.meta.url);
const { load } = createRequire(require.resolve('eslint/package.json'))(
  'js-yaml',
);

test('only a checked master push can deploy the isolated Cloudflare development preview', () => {
  const workflow = load(
    readFileSync(
      new URL('../../.github/workflows/ci.yml', import.meta.url),
      'utf8',
    ),
  );
  const job = workflow.jobs['deploy-preview'];
  assert.ok(job, 'preview deployment job exists');
  assert.equal(job.needs, 'checks');
  assert.match(job.if, /github.event_name == 'push'/);
  assert.match(job.if, /github.ref == 'refs\/heads\/master'/);
  assert.equal(job.environment.name, 'development-preview');
  assert.equal(job.concurrency['cancel-in-progress'], false);
  /** @type {{run?: string, uses?: string}[]} */
  const steps = job.steps;
  const commands = steps.map((step) => step.run ?? '').join('\n');
  assert.match(commands, /build:preview:check/);
  assert.match(commands, /prepare-preview-secret.mjs --from-env/);
  assert.match(
    commands,
    /api exec wrangler deploy --config deploy\/preview\/wrangler.json/,
  );
  assert.match(commands, /cloudflare-preview\/web\/server\/wrangler.json/);
  assert.match(
    commands,
    /--secrets-file .*cloudflare-preview\/secrets.web.json/,
  );
  assert.match(commands, /smoke-cloudflare-preview.mjs/);
  assert.doesNotMatch(
    commands,
    /neon.*(deploy|migrate)|catalog-db.*(migrate|setup-role)|vercel deploy|secret put/,
  );
  assert.doesNotMatch(JSON.stringify(job), /continue-on-error/);
  for (const step of job.steps)
    if (step.uses) assert.match(step.uses, /@[a-f0-9]{40}$/);
});

/** @param {Record<string, () => Response>} [overrides] */
function previewTransport(overrides = {}) {
  /** @type {string[]} */
  const paths = [];
  /** @type {typeof fetch} */
  const transport = async (input, options) => {
    const url = new URL(String(input));
    assert.ok(
      [
        'polymatik-api-preview.remyoreo11.workers.dev',
        'polymatik-web-preview.remyoreo11.workers.dev',
      ].includes(url.hostname),
    );
    assert.equal(options?.method, 'GET');
    assert.equal(options?.credentials, 'omit');
    assert.equal(options?.redirect, 'error');
    assert.equal(new Headers(options?.headers).get('cookie'), null);
    assert.equal(new Headers(options?.headers).get('authorization'), null);
    paths.push(url.pathname);
    const override = overrides[url.pathname];
    if (override) return override();
    if (url.pathname === '/v1/health')
      return Response.json({ status: 'ok', service: 'polymatik-api' });
    if (url.pathname === '/v1/resources')
      return Response.json({ items: resources });
    if (url.pathname === '/')
      return new Response('<title>Polymatik AI</title>');
    if (url.pathname === '/resource/atoms')
      return new Response('<h1>Atoms in Motion</h1>');
    return Response.json({ code: 'UNAUTHORIZED' }, { status: 401 });
  };
  return { paths, transport };
}

test('preview smoke uses six bounded credential-free reads and includes unsigned denial', async () => {
  const f = previewTransport();
  await smokePreview(f.transport);
  assert.deepEqual(f.paths, [
    '/v1/health',
    '/v1/resources',
    '/',
    '/resource/atoms',
    '/v1/me',
    '/api/account/me',
  ]);
});

test('preview smoke fails on catalog corruption, redirects, oversized HTML or unsigned access', async () => {
  for (const overrides of [
    { '/v1/resources': () => Response.json({ items: [] }) },
    { '/': () => Response.redirect('https://unexpected.example') },
    { '/': () => new Response('x'.repeat(524289)) },
    { '/v1/me': () => Response.json({ private: 'test-only-user' }) },
    { '/api/account/me': () => Response.json({ private: 'test-only-user' }) },
  ])
    await assert.rejects(smokePreview(previewTransport(overrides).transport));
});

test('preview diagnostics identify HTTP failures without exposing response contents', async () => {
  /** @type {import('../../scripts/smoke-cloudflare-preview.mjs').PreviewSmokeDiagnostic[]} */
  const diagnostics = [];
  const f = previewTransport({
    '/v1/resources': () =>
      new Response('private-response-sentinel', { status: 503 }),
  });
  await assert.rejects(
    smokePreview(f.transport, (event) => diagnostics.push(event)),
    /api-catalog: headers; expected 200, received 503/,
  );
  assert.deepEqual(f.paths, ['/v1/health', '/v1/resources']);
  assert.ok(diagnostics[0]);
  assert.ok(diagnostics[1]);
  assert.equal(diagnostics[0].outcome, 'passed');
  assert.equal(diagnostics[1].check, 'api-catalog');
  assert.equal(diagnostics[1].status, 503);
  assert.equal(diagnostics[1].reason, 'HTTP_STATUS');
  assert.doesNotMatch(JSON.stringify(diagnostics), /private-response-sentinel/);
});

test('preview diagnostics allowlist network codes and never log raw errors or URLs', async () => {
  for (const code of ['ENOTFOUND', 'private-error-code']) {
    /** @type {import('../../scripts/smoke-cloudflare-preview.mjs').PreviewSmokeDiagnostic[]} */
    const diagnostics = [];
    const transport = async () => {
      throw Object.assign(new Error('private-message-sentinel'), {
        cause: { code, message: 'https://private.example/?token=sentinel' },
      });
    };
    await assert.rejects(
      smokePreview(transport, (event) => diagnostics.push(event)),
      /api-health: headers/,
    );
    assert.equal(diagnostics.length, 1);
    assert.ok(diagnostics[0]);
    assert.equal(
      diagnostics[0].reason,
      code === 'ENOTFOUND' ? code : 'NETWORK_ERROR',
    );
    assert.doesNotMatch(
      JSON.stringify(diagnostics),
      /private-|token=|sentinel/,
    );
  }
});

test('preview diagnostics distinguish body limits and invalid successful responses', async () => {
  /** @type {[() => Response, string, string][]} */
  const cases = [
    [() => new Response('x'.repeat(4097)), 'body', 'RESPONSE_TOO_LARGE'],
    [
      () => new Response('private-invalid-json'),
      'validation',
      'INVALID_RESPONSE',
    ],
    [
      () => Response.json({ status: 'wrong' }),
      'validation',
      'INVALID_RESPONSE',
    ],
  ];
  for (const [override, phase, reason] of cases) {
    /** @type {import('../../scripts/smoke-cloudflare-preview.mjs').PreviewSmokeDiagnostic[]} */
    const diagnostics = [];
    const f = previewTransport({ '/v1/health': override });
    await assert.rejects(
      smokePreview(f.transport, (event) => diagnostics.push(event)),
    );
    assert.ok(diagnostics[0]);
    assert.equal(diagnostics[0].phase, phase);
    assert.equal(diagnostics[0].reason, reason);
    assert.equal(diagnostics[0].status, 200);
    assert.doesNotMatch(JSON.stringify(diagnostics), /private-invalid-json/);
  }
});
