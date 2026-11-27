import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { startApiWorker, startWebWorker } from '../helpers/local-workers.mjs';
import { readEvidence } from '../../apps/web/src/evidence-client.ts';

test(
  'browser adapter → built web workerd → API workerd → Python HTTP validates signed quotations and withdrawal',
  { timeout: 60000 },
  async () => {
    await mkdir('.cache', { recursive: true });
    const directory = await mkdtemp(resolve('.cache/evidence-journey-'));
    const manifest = JSON.parse(
      await readFile('tests/fixtures/evidence/corpus.json', 'utf8'),
    );
    manifest.sources[0].resource_id = 'atoms';
    await writeFile(
      resolve(directory, 'amber.txt'),
      await readFile('tests/fixtures/evidence/amber.txt'),
    );
    const path = resolve(directory, 'corpus.json');
    await writeFile(path, JSON.stringify(manifest));
    const server = createServer();
    await new Promise((done) => server.listen(0, '127.0.0.1', done));
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const port = address.port;
    await new Promise((done) => server.close(done));
    const webReservation = createServer();
    await new Promise((done) => webReservation.listen(0, '127.0.0.1', done));
    const webAddress = webReservation.address();
    assert.ok(webAddress && typeof webAddress === 'object');
    const webPort = webAddress.port;
    await new Promise((done) => webReservation.close(done));
    const webOrigin = `http://127.0.0.1:${webPort}`;
    const secret = randomBytes(32).toString('hex');
    const python = resolve(
      process.platform === 'win32'
        ? '.venv/Scripts/python.exe'
        : '.venv/bin/python',
    );
    const child = spawn(
      python,
      [
        '-m',
        'polymatik_agent.evidence_runtime',
        '--manifest',
        path,
        '--port',
        String(port),
      ],
      {
        env: {
          ...process.env,
          EVIDENCE_GATEWAY_SECRET: secret,
          LANGSMITH_TRACING: 'false',
          LANGCHAIN_TRACING_V2: 'false',
        },
        stdio: 'ignore',
        windowsHide: true,
      },
    );
    const childClosed = new Promise((done) => child.once('close', done));
    let spawnError = false;
    child.on('error', () => {
      spawnError = true;
    });
    let worker;
    let web;
    try {
      const deadline = Date.now() + 15000;
      let ready = false;
      while (Date.now() < deadline && child.exitCode === null && !spawnError) {
        try {
          ready = (
            await fetch(`http://127.0.0.1:${port}/v1/health`, {
              signal: AbortSignal.timeout(500),
            })
          ).ok;
        } catch {
          /* startup only */
        }
        if (ready) break;
        await new Promise((done) => setTimeout(done, 100));
      }
      assert.ok(
        ready,
        'Python research service must start; no failed startup is skipped',
      );
      let signedIn = true;
      let upstreams = 0;
      worker = await startApiWorker({
        bindings: {
          ALLOWED_ORIGINS: webOrigin,
          AUTH_PUBLIC_ORIGIN: webOrigin,
          NEON_AUTH_BASE_URL:
            'https://ep-test.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth',
          EVIDENCE_SERVICE_ORIGIN: 'https://evidence.test',
          EVIDENCE_GATEWAY_SECRET: secret,
        },
        outboundService: async (request) => {
          if (request.url.startsWith('https://ep-test.neonauth.')) {
            const id =
              request.headers.get('cookie') ===
              '__Secure-neon-auth.session_token=alice'
                ? 'alice'
                : 'bob';
            return Response.json(
              signedIn
                ? {
                    user: { id },
                    session: {
                      userId: id,
                      expiresAt: new Date(Date.now() + 60000).toISOString(),
                    },
                  }
                : null,
            );
          }
          assert.equal(request.url, 'https://evidence.test/v1/evidence/search');
          assert.equal(request.headers.has('cookie'), false);
          assert.equal(request.headers.has('x-user-id'), false);
          upstreams++;
          return fetch(`http://127.0.0.1:${port}/v1/evidence/search`, {
            method: 'POST',
            headers: request.headers,
            body: await request.text(),
            redirect: 'manual',
            signal: AbortSignal.timeout(5000),
          });
        },
      });
      const apiOrigin = `http://127.0.0.1:${worker.port}`;
      web = await startWebWorker(
        apiOrigin,
        {
          AUTH_PUBLIC_ORIGIN: webOrigin,
          PRODUCT_CATALOG_VERSION: 'v2',
          NEON_AUTH_BASE_URL: '',
          NEON_AUTH_COOKIE_SECRET: '',
        },
        { port: webPort },
      );
      /** @type {typeof fetch} */
      const browser = async (url, init) =>
        fetch(new URL(String(url), webOrigin), {
          ...init,
          headers: {
            ...Object.fromEntries(new Headers(init?.headers)),
            origin: webOrigin,
            cookie: '__Secure-neon-auth.session_token=alice',
          },
        });
      const input = { resource_id: 'atoms', query: 'amber' };
      const page = await readEvidence(input, 'alice', { fetch: browser });
      assert.equal(page.status, 'evidence');
      assert.equal(page.citations[0]?.source_id, 'synthetic-amber');
      assert.ok(page.citations[0]?.quote.toLowerCase().includes('amber'));
      assert.equal(JSON.stringify(page).includes('reviewed_by'), false);
      assert.equal(
        (
          await readEvidence({ ...input, query: 'unmatched' }, 'alice', {
            fetch: browser,
          })
        ).status,
        'no_evidence',
      );
      assert.equal(
        (
          await fetch(`http://127.0.0.1:${port}/v1/evidence/search`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              authorization: 'Bearer alice',
            },
            body: JSON.stringify(input),
          })
        ).status,
        401,
        'Python never accepts the synthetic browser identity as its own credential',
      );
      const calls = upstreams;
      signedIn = false;
      await assert.rejects(readEvidence(input, 'alice', { fetch: browser }), {
        status: 401,
      });
      assert.equal(upstreams, calls, 'revoked sessions never reach Python');
      signedIn = true;
      await assert.rejects(readEvidence(input, 'bob', { fetch: browser }), {
        status: 409,
      });
      assert.equal(
        upstreams,
        calls,
        'changed-account requests never reach Python',
      );
      // Revoke the actual package policy, not a mocked search result. No stale corpus survives.
      manifest.sources[0].rights.status = 'withdrawn';
      manifest.artifacts = [];
      await writeFile(path, JSON.stringify(manifest));
      assert.equal(
        (await readEvidence(input, 'alice', { fetch: browser })).status,
        'no_evidence',
      );
      // Invalid storage fails, instead of becoming a successful absence or old quotation.
      await writeFile(path, '{}');
      await assert.rejects(readEvidence(input, 'alice', { fetch: browser }), {
        status: 503,
      });
      assert.equal(
        (await fetch(`http://127.0.0.1:${port}/v1/health`)).status,
        200,
      );
    } finally {
      try {
        await web?.stop();
      } finally {
        try {
          await worker?.stop();
        } finally {
          if (child.exitCode === null) child.kill();
          await childClosed;
        }
      }
    }
  },
);
