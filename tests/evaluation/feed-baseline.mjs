import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { rankFeed, feedPage } from '../../apps/api/src/feed.ts';
import { feedInput } from '../../packages/domain-types/src/feed.ts';

export async function evaluateFeed() {
  /** @type {{groups:import('../../packages/domain-types/src/catalog-v2.ts').CatalogSubject[],profiles:{id:string,subjects:import('../../packages/domain-types/src/catalog-v2.ts').CatalogSubject[]}[]}} */
  const fixture = JSON.parse(
    await readFile(new URL('./feed-fixtures.json', import.meta.url), 'utf8'),
  );
  /** @type {import('../../packages/domain-types/src/catalog-v2.ts').CatalogKind[]} */
  const kinds = ['Video', 'Book', 'Interactive', 'Course'];
  /** @type {import('../../packages/domain-types/src/catalog-v2.ts').CatalogEntry[]} */
  const resources = fixture.groups.flatMap((topic, group) =>
    Array.from({ length: 10 }, (_, i) => {
      const id = `eval-${group}-${i}`;
      return {
        id,
        title: `Synthetic learning resource ${group}-${i}`,
        source: 'Synthetic evaluation only',
        publisher: 'No real publisher',
        kind: i < 6 ? 'Article' : (kinds[i - 6] ?? 'Article'),
        topic,
        url: `https://example.org/${id}`,
        description:
          'Synthetic metadata; never published or retrieved from a provider.',
        note: 'Evaluation fixture',
        secondary_subjects: [],
        cover: {
          key: `resource-covers/${id}/cover-v1.webp`,
          version: 1,
          alt: 'Synthetic evaluation placeholder.',
          width: 1200,
          height: 800,
          media_type: 'image/webp',
        },
      };
    }),
  );
  /** @param {number[]} values */
  const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;
  /** @param {readonly import('../../packages/domain-types/src/catalog-v2.ts').CatalogEntry[]} items @param {readonly string[]} subjects */
  const metrics = (items, subjects) => {
    const first = items.slice(0, 5);
    /** @param {import('../../packages/domain-types/src/catalog-v2.ts').CatalogEntry} item */
    const relevant = (item) => (subjects.includes(item.topic) ? 1 : 0);
    const dcg = first.reduce(
      (sum, item, index) => sum + relevant(item) / Math.log2(index + 2),
      0,
    );
    const ideal = Array.from(
      {
        length: Math.min(5, resources.filter((item) => relevant(item)).length),
      },
      (_, i) => 1 / Math.log2(i + 2),
    ).reduce((a, b) => a + b, 0);
    return {
      precision_at_5: mean(first.map(relevant)),
      ndcg_at_5: ideal ? dcg / ideal : 0,
      subjects_at_5: new Set(first.map((x) => x.topic)).size,
      formats_at_5: new Set(first.map((x) => x.kind)).size,
    };
  };
  const profiles = fixture.profiles.map((profile) => {
    const ranked = rankFeed(resources, {
      status: 'selected',
      subjects: profile.subjects,
    });
    return {
      id: profile.id,
      baseline: metrics(resources, profile.subjects),
      ranked: metrics(
        ranked.map((x) => x.resource),
        profile.subjects,
      ),
      reasons_valid: ranked.every(
        (x) =>
          x.reason.kind === 'explore' ||
          profile.subjects.includes(x.reason.subject),
      ),
    };
  });
  const cold = await feedPage(
    resources,
    { status: 'skipped', subjects: [] },
    'evaluation',
    feedInput({}),
    'synthetic-offline-evaluation-session',
  );
  const missing = await feedPage(
    resources,
    { status: 'selected', subjects: ['Chemistry'] },
    'evaluation',
    feedInput({}),
    'synthetic-offline-evaluation-session',
  );
  const timings = [];
  for (let i = 0; i < 40; i++) {
    const start = performance.now();
    rankFeed(resources, { status: 'selected', subjects: ['Physics'] });
    timings.push(performance.now() - start);
  }
  timings.sort((a, b) => a - b);
  const report = {
    policy: 'subjects-v1',
    synthetic: true,
    resources: resources.length,
    runtime: process.version,
    profiles,
    baseline: {
      precision_at_5: mean(profiles.map((p) => p.baseline.precision_at_5)),
      ndcg_at_5: mean(profiles.map((p) => p.baseline.ndcg_at_5)),
    },
    ranked: {
      precision_at_5: mean(profiles.map((p) => p.ranked.precision_at_5)),
      ndcg_at_5: mean(profiles.map((p) => p.ranked.ndcg_at_5)),
    },
    cold_start: {
      basis: cold.basis,
      subjects: new Set(cold.items.map((x) => x.resource.topic)).size,
    },
    no_matches: {
      basis: missing.basis,
      only_exploration: missing.items.every((x) => x.reason.kind === 'explore'),
    },
    node_wall_time_ms: {
      median: timings[20],
      p95: timings[38],
      note: 'Local Node wall time, not deployed Workers CPU or user relevance evidence.',
    },
  };
  await mkdir(new URL('../../.cache/', import.meta.url), { recursive: true });
  await writeFile(
    new URL('../../.cache/feed-evaluation.json', import.meta.url),
    JSON.stringify(report, null, 2) + '\n',
  );
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(JSON.stringify(await evaluateFeed(), null, 2));
