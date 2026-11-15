import {
  catalogSubjects,
  isCatalogEntry,
} from '@polymatik/domain-types/catalog-v2';
import type { components } from './api.generated';

export type AccountLibraryItem = components['schemas']['AccountLibraryItem'];
export type AccountLibraryPage = components['schemas']['AccountLibraryPage'];
export type AccountLibraryChange =
  components['schemas']['AccountLibraryChange'];
export type InterestsV2 = components['schemas']['InterestsV2'];
export type InterestUpdateV2 = components['schemas']['InterestUpdateV2'];
export type LibraryPosition = { saved_at: string; id: string };
export type LibraryQuery = { limit: number; after: LibraryPosition | null };
export type LibraryPageInput = { limit?: number; cursor?: string };
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const id = (v: unknown): v is string =>
  typeof v === 'string' && /^[a-z][a-z0-9-]{0,47}$/.test(v);
const position = (v: unknown): v is LibraryPosition =>
  object(v) &&
  Object.keys(v).length === 2 &&
  id(v.id) &&
  typeof v.saved_at === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(v.saved_at) &&
  Number.isFinite(Date.parse(v.saved_at)) &&
  new Date(v.saved_at).toISOString().slice(0, 19) === v.saved_at.slice(0, 19);
export function encodeLibraryCursor(v: LibraryPosition) {
  if (!position(v)) throw new TypeError('Invalid Library position.');
  return btoa(JSON.stringify({ v: 1, after: v }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}
function decodeCursor(token: string): LibraryPosition {
  if (!/^[A-Za-z0-9_-]{1,512}$/.test(token))
    throw new TypeError('Invalid Library cursor.');
  const value: unknown = JSON.parse(
    atob(token.replaceAll('-', '+').replaceAll('_', '/')),
  );
  if (
    !object(value) ||
    Object.keys(value).length !== 2 ||
    value.v !== 1 ||
    !position(value.after) ||
    encodeLibraryCursor(value.after) !== token
  )
    throw new TypeError('Invalid Library cursor.');
  return value.after;
}
export function librarySearch(input: LibraryPageInput = {}) {
  const params = new URLSearchParams();
  for (const key of Object.keys(input))
    if (!['limit', 'cursor'].includes(key))
      throw new TypeError('Invalid Library query.');
  if (input.limit !== undefined) params.set('limit', String(input.limit));
  if (input.cursor !== undefined) params.set('cursor', input.cursor);
  libraryQuery(params);
  return params;
}
export function libraryQuery(params: URLSearchParams): LibraryQuery {
  params.forEach((_value, key) => {
    if (!['limit', 'cursor'].includes(key) || params.getAll(key).length !== 1)
      throw new TypeError('Invalid Library query.');
  });
  const limit = params.get('limit') ?? '5';
  if (!/^[1-5]$/.test(limit)) throw new TypeError('Invalid Library page size.');
  return {
    limit: Number(limit),
    after: params.has('cursor')
      ? decodeCursor(params.get('cursor') ?? '')
      : null,
  };
}
export function isLibraryPage(value: unknown): value is AccountLibraryPage {
  if (
    !object(value) ||
    Object.keys(value).length !== 2 ||
    !Array.isArray(value.items) ||
    value.items.length > 5 ||
    !('next_cursor' in value)
  )
    return false;
  if (
    !value.items.every(
      (item) =>
        object(item) &&
        Object.keys(item).length === 2 &&
        id(item.id) &&
        (item.resource === null ||
          (isCatalogEntry(item.resource) && item.id === item.resource.id)),
    )
  )
    return false;
  if (new Set(value.items.map((item) => item.id)).size !== value.items.length)
    return false;
  if (value.next_cursor === null) return true;
  try {
    return (
      typeof value.next_cursor === 'string' &&
      decodeCursor(value.next_cursor).id === value.items.at(-1)?.id
    );
  } catch {
    return false;
  }
}
export function isLibraryChange(value: unknown): value is AccountLibraryChange {
  return (
    object(value) &&
    Object.keys(value).length === 2 &&
    id(value.id) &&
    typeof value.saved === 'boolean'
  );
}
export function interestUpdateV2(value: unknown): InterestUpdateV2 | null {
  if (
    !object(value) ||
    Object.keys(value).length !== 2 ||
    !Array.isArray(value.subjects) ||
    value.subjects.length > 3 ||
    new Set(value.subjects).size !== value.subjects.length ||
    !value.subjects.every((subject) =>
      catalogSubjects.some((item) => item === subject),
    )
  )
    return null;
  if (
    !(
      (value.status === 'selected' && value.subjects.length > 0) ||
      (value.status === 'skipped' && value.subjects.length === 0)
    )
  )
    return null;
  const subjects = value.subjects;
  return {
    status: value.status,
    subjects: catalogSubjects.filter((subject) => subjects.includes(subject)),
  };
}
export function isInterestsV2(value: unknown): value is InterestsV2 {
  return (
    (object(value) &&
      Object.keys(value).length === 2 &&
      value.status === 'not_started' &&
      Array.isArray(value.subjects) &&
      value.subjects.length === 0) ||
    interestUpdateV2(value) !== null
  );
}
