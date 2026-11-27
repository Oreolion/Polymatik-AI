import { createServer } from 'node:http';
import { createApi } from '../../apps/api/src/index.ts';
import {
  catalogSubjects,
  catalogKinds,
  encodeCatalogCursor,
} from '../../packages/domain-types/src/catalog-v2.ts';
import { encodeLibraryCursor } from '../../packages/domain-types/src/account-v2.ts';
import { feedBatchFixture } from './feed-batches.mjs';

/** Deterministic account/catalog doubles, never provider access or a production auth bypass. */
export function expandedAccountFixture(origin = 'https://app.test') {
  /** @type {import('../../packages/domain-types/src/catalog-v2.ts').CatalogEntry[]} */
  const resources = Array.from({ length: 11 }, (_, i) => ({
    id: `fixture-${i}`,
    title: `Fixture learning resource ${i}`,
    source: 'Local acceptance fixture',
    publisher: 'Test publisher',
    kind: catalogKinds[i % 6] ?? 'Article',
    topic: catalogSubjects[i % 7] ?? 'Physics',
    url: `https://example.org/fixture-${i}`,
    description: `Synthetic resource ${i}.`,
    note: 'Not a published catalog resource',
    secondary_subjects: [],
    cover: {
      key: `resource-covers/fixture-${i}/cover-v1.webp`,
      version: 1,
      alt: `Synthetic concept illustration ${i}.`,
      width: 1200,
      height: 800,
      media_type: 'image/webp',
    },
  }));
  const hidden = new Set(['fixture-6']);
  const active = new Set(['alice', 'bob']);
  /** @type {Map<string,Map<string,string>>} */
  const saves = new Map([
    [
      'alice',
      new Map(
        resources
          .slice(0, 7)
          .map((r, i) => [
            r.id,
            `2026-11-15T12:00:${String(59 - i).padStart(2, '0')}.000001Z`,
          ]),
      ),
    ],
    ['bob', new Map([['fixture-8', '2026-11-15T12:00:59.000001Z']])],
  ]);
  /** @type {Map<string,import('../../packages/domain-types/src/account-v2.ts').InterestsV2>} */
  const interests = new Map();
  const feedBatches = feedBatchFixture((id) => get(id));
  let calls = 0;
  /** @param {Headers} headers */
  function identity(headers) {
    const id =
      /(?:^|;\s*)(?:__Secure-)?neon-auth\.session_token=(alice|bob)(?:-rotated)?(?:;|$)/.exec(
        headers.get('cookie') ?? '',
      )?.[1];
    return id && active.has(id) ? id : null;
  }
  /** @param {string} id */
  const get = (id) =>
    resources.find(
      (item) =>
        item.id === (id === 'fixture-alias' ? 'fixture-5' : id) &&
        !hidden.has(item.id),
    );
  const api = createApi({
    allowedOrigins: [origin],
    log: () => {},
    verifySession: async (headers) => {
      const id = identity(headers);
      return id
        ? {
            userId: id,
            scopes: [
              'profile:read',
              'library:read',
              'library:write',
              'interests:read',
              'interests:write',
              'research:read',
            ],
          }
        : null;
    },
    catalogV2: {
      get: async (id) => get(id),
      page: async (query) => {
        const filtered = resources
          .map((resource, index) => ({ resource, index }))
          .filter(
            ({ resource, index }) =>
              !hidden.has(resource.id) &&
              (!query.after || index > query.after.sort_order) &&
              (!query.subject || resource.topic === query.subject) &&
              (!query.kind || resource.kind === query.kind) &&
              (!query.q ||
                `${resource.title} ${resource.description}`
                  .toLowerCase()
                  .includes(query.q.toLowerCase())),
          );
        const rows = filtered.slice(0, query.limit);
        const last = rows.at(-1);
        return {
          items: rows.map((row) => row.resource),
          next_cursor:
            filtered.length > query.limit && last
              ? encodeCatalogCursor(
                  { id: last.resource.id, sort_order: last.index },
                  query,
                )
              : null,
        };
      },
    },
    libraryV2: {
      page: async (subject, query) => {
        calls++;
        const rows = [...(saves.get(subject) ?? new Map()).entries()]
          .map(([id, saved_at]) => ({ id, saved_at }))
          .sort(
            (a, b) =>
              b.saved_at.localeCompare(a.saved_at) || a.id.localeCompare(b.id),
          )
          .filter(
            (row) =>
              !query.after ||
              row.saved_at < query.after.saved_at ||
              (row.saved_at === query.after.saved_at &&
                row.id > query.after.id),
          );
        const selected = rows.slice(0, query.limit);
        const last = selected.at(-1);
        return {
          items: selected.map((row) => ({
            id: row.id,
            resource: get(row.id) ?? null,
          })),
          next_cursor:
            rows.length > query.limit && last
              ? encodeLibraryCursor(last)
              : null,
        };
      },
      setSaved: async (subject, id, saved) => {
        calls++;
        const resource = saved ? get(id) : undefined;
        if (saved && !resource) return undefined;
        const canonical = resource?.id ?? id;
        const own = saves.get(subject) ?? new Map();
        saves.set(subject, own);
        if (saved) {
          if (!own.has(canonical))
            own.set(canonical, '2026-11-15T13:00:00.000001Z');
        } else own.delete(canonical);
        return { id: canonical, saved };
      },
    },
    interestsV2: {
      read: async (subject) => {
        calls++;
        return (
          interests.get(subject) ?? { status: 'not_started', subjects: [] }
        );
      },
      write: async (subject, value) => {
        calls++;
        interests.set(subject, value);
        return value;
      },
      reset: async (subject) => {
        calls++;
        interests.delete(subject);
        return { status: 'not_started', subjects: [] };
      },
    },
    feedCandidates: async (input) => ({
      items: resources.filter(
        (r) =>
          !hidden.has(r.id) &&
          (!input.subject ||
            r.topic === input.subject ||
            r.secondary_subjects.includes(input.subject)) &&
          (!input.kind || r.kind === input.kind) &&
          (!input.q ||
            [r.title, r.source, r.publisher, r.description]
              .join(' ')
              .toLowerCase()
              .includes(input.q.toLowerCase())),
      ),
      limited: false,
    }),
    feedStorage: feedBatches.storage,
    feedDismissals: feedBatches.storage,
  });
  return {
    api,
    resources,
    hidden,
    saves,
    interests,
    active,
    feedBatches,
    identity,
    calls: () => calls,
  };
}

export async function startExpandedAccounts(origin = 'https://app.test') {
  const fixture = expandedAccountFixture(origin);
  const server = createServer(async (incoming, outgoing) => {
    const chunks = [];
    let size = 0;
    for await (const chunk of incoming) {
      size += chunk.length;
      if (size > 1024) {
        outgoing.writeHead(413);
        outgoing.end();
        return;
      }
      chunks.push(chunk);
    }
    const response = await fixture.api.fetch(
      new Request(`http://127.0.0.1${incoming.url}`, {
        method: incoming.method ?? 'GET',
        headers: /** @type {Record<string,string>} */ (incoming.headers),
        ...(size ? { body: Buffer.concat(chunks) } : {}),
      }),
    );
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(await response.text());
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(undefined));
  });
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('No fixture port.');
  return {
    ...fixture,
    origin: `http://127.0.0.1:${address.port}`,
    stop: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve(undefined))),
      ),
  };
}
