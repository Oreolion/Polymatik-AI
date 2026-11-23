import type { components } from './api.generated';

/** The expanded public domain. PreviewResource remains a legacy wire contract. */
export type CatalogEntry = components['schemas']['CatalogEntry'];
export type CatalogPage = components['schemas']['CatalogPage'];
// Existing persisted preferences retain this order until a separately reviewed
// database taxonomy migration. Browse filters can safely return empty pages.
export const establishedSubjects = [
  'Physics',
  'Mathematics',
  'Computing',
  'Biology',
  'Psychology',
  'Philosophy',
  'Sociology',
] as const;
export const catalogSubjects = [
  ...establishedSubjects,
  'Chemistry',
  'Art',
  'Metaphysics',
  'Politics',
  'History',
  'Literature',
  'Economics',
] as const;
export const catalogKinds = [
  'Chapter',
  'Interactive',
  'Article',
  'Course',
  'Video',
  'Book',
] as const;
export const catalogPageLimit = 5;
export type CatalogSubject = (typeof catalogSubjects)[number];
export type CatalogKind = (typeof catalogKinds)[number];
export type CatalogPageInput = {
  limit?: number;
  cursor?: string;
  subject?: CatalogSubject;
  kind?: CatalogKind;
  q?: string;
};
export type CatalogPosition = { sort_order: number; id: string };
export type CatalogQuery = {
  limit: number;
  subject: CatalogSubject | null;
  kind: CatalogKind | null;
  q: string | null;
  after: CatalogPosition | null;
};

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const id = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z][a-z0-9-]{0,47}$/.test(value);
const text = (value: unknown, max: number): value is string =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.length <= max &&
  !/[\u0000-\u001f\u007f]/u.test(value);
const integer = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= min &&
  value <= max;
const member = <T extends string>(
  value: unknown,
  choices: readonly T[],
): value is T =>
  typeof value === 'string' && choices.some((choice) => choice === value);
const https = (value: unknown) => {
  if (!text(value, 2048) || !/^[\x21-\x7e]+$/.test(value)) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      url.href === value
    );
  } catch {
    return false;
  }
};

export function isCatalogEntry(value: unknown): value is CatalogEntry {
  if (
    !object(value) ||
    Object.keys(value).length !== 11 ||
    !id(value.id) ||
    !member(value.topic, catalogSubjects) ||
    !member(value.kind, catalogKinds) ||
    !https(value.url)
  )
    return false;
  for (const [key, max] of Object.entries({
    title: 240,
    source: 200,
    publisher: 200,
    description: 1000,
    note: 200,
  }))
    if (!text(value[key], max)) return false;
  const secondary = value.secondary_subjects;
  if (
    !Array.isArray(secondary) ||
    secondary.length > 2 ||
    secondary.includes(value.topic) ||
    secondary.some((subject) => !member(subject, catalogSubjects)) ||
    JSON.stringify(secondary) !==
      JSON.stringify(
        catalogSubjects.filter((subject) => secondary.includes(subject)),
      )
  )
    return false;
  if (value.cover === null)
    return ['atoms', 'theory', 'browser', 'semester'].includes(value.id);
  const cover = value.cover;
  return (
    object(cover) &&
    Object.keys(cover).length === 6 &&
    integer(cover.version, 1, 999999) &&
    cover.key === `resource-covers/${value.id}/cover-v${cover.version}.webp` &&
    text(cover.alt, 300) &&
    integer(cover.width, 1, 8192) &&
    integer(cover.height, 1, 8192) &&
    cover.width * 2 === cover.height * 3 &&
    cover.media_type === 'image/webp'
  );
}

function encode(value: unknown) {
  return btoa(
    Array.from(new TextEncoder().encode(JSON.stringify(value)), (byte) =>
      String.fromCharCode(byte),
    ).join(''),
  )
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}
function decode(token: unknown): {
  v: 1;
  sort_order: number;
  id: string;
  subject: CatalogSubject | null;
  kind: CatalogKind | null;
  q: string | null;
} {
  if (
    typeof token !== 'string' ||
    token.length > 1024 ||
    !/^[A-Za-z0-9_-]+$/.test(token)
  )
    throw new TypeError('Invalid catalog cursor.');
  try {
    const raw: unknown = JSON.parse(
      new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(
        Uint8Array.from(
          atob(token.replaceAll('-', '+').replaceAll('_', '/')),
          (char) => char.charCodeAt(0),
        ),
      ),
    );
    if (
      !object(raw) ||
      Object.keys(raw).length !== 6 ||
      raw.v !== 1 ||
      !integer(raw.sort_order, 0, 2147483647) ||
      !id(raw.id) ||
      !(raw.subject === null || member(raw.subject, catalogSubjects)) ||
      !(raw.kind === null || member(raw.kind, catalogKinds)) ||
      !(raw.q === null || (text(raw.q, 100) && raw.q === raw.q.trim())) ||
      encode(raw) !== token
    )
      throw new TypeError();
    return {
      v: 1,
      sort_order: raw.sort_order,
      id: raw.id,
      subject: raw.subject,
      kind: raw.kind,
      q: raw.q,
    };
  } catch {
    throw new TypeError('Invalid catalog cursor.');
  }
}
export function encodeCatalogCursor(
  position: CatalogPosition,
  query: CatalogQuery,
) {
  const token = encode({
    v: 1,
    sort_order: position.sort_order,
    id: position.id,
    subject: query.subject,
    kind: query.kind,
    q: query.q,
  });
  decode(token);
  return token;
}
export function catalogQuery(params: URLSearchParams): CatalogQuery {
  let invalid = params.toString().length > 2048;
  params.forEach((_value, key) => {
    if (
      !['limit', 'cursor', 'subject', 'kind', 'q'].includes(key) ||
      params.getAll(key).length !== 1
    )
      invalid = true;
  });
  if (invalid) throw new TypeError('Invalid catalog query.');
  const size = params.get('limit');
  if (size !== null && !/^[1-5]$/.test(size))
    throw new TypeError('Invalid page limit.');
  const subject = params.get('subject'),
    kind = params.get('kind'),
    q = params.get('q')?.trim() ?? null;
  if (
    !(subject === null || member(subject, catalogSubjects)) ||
    !(kind === null || member(kind, catalogKinds)) ||
    !(q === null || text(q, 100))
  )
    throw new TypeError('Invalid catalog filter.');
  const query: CatalogQuery = {
    limit: size === null ? catalogPageLimit : Number(size),
    subject,
    kind,
    q,
    after: null,
  };
  if (params.has('cursor')) {
    const token = decode(params.get('cursor'));
    if (token.subject !== subject || token.kind !== kind || token.q !== q)
      throw new TypeError('Cursor filters changed.');
    query.after = { sort_order: token.sort_order, id: token.id };
  }
  return query;
}
export function catalogSearch(input: CatalogPageInput = {}) {
  if (
    !object(input) ||
    Object.keys(input).some(
      (key) => !['limit', 'cursor', 'subject', 'kind', 'q'].includes(key),
    )
  )
    throw new TypeError('Invalid catalog request.');
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (
      typeof value !== 'string' &&
      !(key === 'limit' && typeof value === 'number' && Number.isInteger(value))
    )
      throw new TypeError('Invalid catalog request.');
    params.set(key, String(value));
  }
  catalogQuery(params);
  return params;
}
export function isCatalogPage(value: unknown): value is CatalogPage {
  if (
    !object(value) ||
    Object.keys(value).length !== 2 ||
    !Array.isArray(value.items) ||
    value.items.length > catalogPageLimit ||
    !value.items.every(isCatalogEntry) ||
    new Set(value.items.map((item: CatalogEntry) => item.id)).size !==
      value.items.length
  )
    return false;
  if (value.next_cursor === null) return true;
  try {
    return decode(value.next_cursor).id === value.items.at(-1)?.id;
  } catch {
    return false;
  }
}

export function isCatalogPageForQuery(
  value: unknown,
  query: CatalogQuery,
): value is CatalogPage {
  if (!isCatalogPage(value) || value.items.length > query.limit) return false;
  if (value.next_cursor === null) return true;
  const token = decode(value.next_cursor);
  return (
    value.items.length === query.limit &&
    token.subject === query.subject &&
    token.kind === query.kind &&
    token.q === query.q &&
    (!query.after ||
      token.sort_order > query.after.sort_order ||
      (token.sort_order === query.after.sort_order &&
        token.id > query.after.id))
  );
}
