import { encodeDismissalCursor } from '../../packages/domain-types/src/feed.ts';
import { DismissalLimitError } from '../../apps/api/src/feed-storage.ts';
/** Account-keyed deterministic storage double. No SQL or provider acceptance.
 * @param {(id:string)=>import('../../packages/domain-types/src/catalog-v2.ts').CatalogEntry|undefined} [get] */
export function feedBatchFixture(get = () => undefined) {
  /** @type {Map<string,import('../../apps/api/src/feed-storage.ts').StoredBatch>} */
  const batches = new Map();
  /** @type {Map<string,Set<string>>} */
  const dismissed = new Map();
  let writes = 0;
  return {
    batches,
    dismissed,
    writes: () => writes,
    storage: {
      /** @param {string} subject */
      async load(subject) {
        const row = batches.get(subject);
        if (!row || Date.parse(row.expires_at) <= Date.now()) return undefined;
        return {
          ...structuredClone(row),
          items: row.items.filter(
            (item) => !dismissed.get(subject)?.has(item.id),
          ),
        };
      },
      /** @param {string} subject @param {import('../../apps/api/src/feed-storage.ts').BatchSeed} seed */
      async batch(subject, seed) {
        let row = await this.load(subject);
        if (!row || row.fingerprint !== seed.fingerprint) {
          writes++;
          row = {
            ...structuredClone(seed),
            id: crypto.randomUUID(),
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            items: seed.items.map((item, position) => ({ ...item, position })),
          };
          batches.set(subject, row);
        }
        return {
          ...structuredClone(row),
          items: row.items.filter(
            (item) => !dismissed.get(subject)?.has(item.id),
          ),
        };
      },
      /** @param {string} subject @param {string|null} [after] */
      async dismissalPage(subject, after = null) {
        const rows = [...(dismissed.get(subject) ?? [])]
          .sort()
          .filter((id) => !after || id > after)
          .slice(0, 11);
        return {
          items: rows.slice(0, 10).map((id) => {
            const resource = get(id);
            return {
              id,
              title: resource?.title ?? null,
              source: resource?.source ?? null,
            };
          }),
          next_cursor:
            rows.length > 10 && rows[9] ? encodeDismissalCursor(rows[9]) : null,
        };
      },
      /** @param {string} subject @param {string} id @param {boolean} value */
      async setDismissed(subject, id, value) {
        if (value && !get(id)) return undefined;
        const own = dismissed.get(subject) ?? new Set();
        dismissed.set(subject, own);
        if (value) {
          if (!own.has(id) && own.size >= 500) throw new DismissalLimitError();
          own.add(id);
        } else own.delete(id);
        return { id, dismissed: value };
      },
    },
  };
}
