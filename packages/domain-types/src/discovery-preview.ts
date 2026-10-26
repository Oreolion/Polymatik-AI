/** Curated link metadata only. Provenance and scope: docs/36_WEB_DISCOVER_UI.md. */
export const resources = [
  {
    id: 'atoms',
    title: 'Atoms in Motion',
    source: 'The Feynman Lectures on Physics',
    publisher: 'Caltech',
    kind: 'Chapter',
    topic: 'Physics',
    url: 'https://www.feynmanlectures.caltech.edu/I_01.html',
    description:
      'Start with the smallest things. A classic introduction to the atomic picture of matter, motion, and the practice of asking better questions.',
    note: 'Volume I · Chapter 1',
  },
  {
    id: 'theory',
    title: 'Seeing Theory',
    source: 'Seeing Theory',
    publisher: 'Brown University',
    kind: 'Interactive',
    topic: 'Mathematics',
    url: 'https://seeing-theory.brown.edu/',
    description:
      'Make probability a little less abstract. Explore chance, distributions, and inference through interactive visual explanations.',
    note: 'Archived resource',
  },
  {
    id: 'browser',
    title: 'Populating the page: how browsers work',
    source: 'MDN Web Docs',
    publisher: 'MDN',
    kind: 'Article',
    topic: 'Computing',
    url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work',
    description:
      'Follow a page from its network request through parsing, layout, and painting. Look beneath a familiar everyday interaction.',
    note: 'Web platform',
  },
  {
    id: 'semester',
    title: 'The Missing Semester of Your CS Education',
    source: 'Missing Semester',
    publisher: 'MIT',
    kind: 'Course',
    topic: 'Computing',
    url: 'https://missing.csail.mit.edu/',
    description:
      'Get to know the tools behind the work: the shell, your development environment, version control, and debugging.',
    note: 'Tools for thinking and building',
  },
] as const;

export type Resource = (typeof resources)[number];
export function getResource(id: unknown): Resource | undefined {
  return typeof id === 'string'
    ? resources.find((item) => item.id === id)
    : undefined;
}
export const topics = [
  'All subjects',
  'Physics',
  'Mathematics',
  'Computing',
] as const;
export type Topic = (typeof topics)[number];
export function selectResources({
  topic = 'All subjects',
  query = '',
  savedOnly = false,
  saved = [],
  dismissed = [],
}: {
  topic?: Topic;
  query?: string;
  savedOnly?: boolean;
  saved?: readonly string[];
  dismissed?: readonly string[];
}) {
  const term = query.trim().toLocaleLowerCase('en');
  return resources.filter(
    (r) =>
      (topic === 'All subjects' || r.topic === topic) &&
      (!savedOnly || saved.includes(r.id)) &&
      (savedOnly || !dismissed.includes(r.id)) &&
      `${r.title} ${r.description} ${r.source} ${r.publisher} ${r.topic}`
        .toLocaleLowerCase('en')
        .includes(term),
  );
}
