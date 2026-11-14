import { createServer } from 'node:http';
import { createApi } from '../../apps/api/src/index.ts';
import {
  catalogSubjects,
  catalogKinds,
  encodeCatalogCursor,
} from '../../packages/domain-types/src/catalog-v2.ts';

/** Synthetic local-only resources; never staging/publication or database writes. */
export async function startExpandedCatalog() {
  let available = true;
  /** @type {import('../../packages/domain-types/src/catalog-v2.ts').CatalogEntry[]} */
  const items = Array.from({ length: 11 }, (_, index) => ({
    id: `fixture-${index}`,
    title: `Fixture learning resource ${index}`,
    source: 'Local acceptance fixture',
    publisher: 'Test publisher',
    kind: catalogKinds[index % catalogKinds.length] ?? 'Article',
    topic: catalogSubjects[index % catalogSubjects.length] ?? 'Physics',
    url: `https://example.org/fixture-${index}`,
    description: `Synthetic source metadata for resource ${index}.`,
    note: 'Not a published catalog resource',
    secondary_subjects: [],
    cover: {
      key: `resource-covers/fixture-${index}/cover-v1.webp`,
      version: 1,
      alt: `Synthetic concept illustration ${index}.`,
      width: 1200,
      height: 800,
      media_type: 'image/webp',
    },
  }));
  const api = createApi({
    log: () => {},
    catalogV2: {
      async page(query) {
        if (!available) throw new Error('fixture outage');
        const filtered = items
          .map((item, index) => ({ item, index }))
          .filter(
            ({ item, index }) =>
              (!query.after || index > query.after.sort_order) &&
              (!query.subject || query.subject === item.topic) &&
              (!query.kind || query.kind === item.kind) &&
              (!query.q ||
                `${item.title} ${item.source} ${item.publisher} ${item.description}`
                  .toLowerCase()
                  .includes(query.q.toLowerCase())),
          );
        const page = filtered.slice(0, query.limit);
        const last = page.at(-1);
        return {
          items: page.map(({ item }) => item),
          next_cursor:
            filtered.length > query.limit && last
              ? encodeCatalogCursor(
                  { id: last.item.id, sort_order: last.index },
                  query,
                )
              : null,
        };
      },
      async get(id) {
        if (!available) throw new Error('fixture outage');
        return items.find(
          (item) => item.id === (id === 'fixture-alias' ? 'fixture-5' : id),
        );
      },
    },
  });
  const server = createServer(async (incoming, outgoing) => {
    try {
      const response = await api.fetch(
        new Request(`http://127.0.0.1${incoming.url}`, {
          method: incoming.method ?? 'GET',
        }),
      );
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(await response.text());
    } catch {
      outgoing.writeHead(500);
      outgoing.end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(undefined));
  });
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Fixture did not bind.');
  return {
    origin: `http://127.0.0.1:${address.port}`,
    items,
    setAvailable: (/** @type {boolean} */ value) => {
      available = value;
    },
    stop: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve(undefined))),
      ),
  };
}
