import type { PreviewResource } from './index';
import { getResource } from '@polymatik/domain-types/discovery-preview';

/** Bounded editable metadata for the four reviewed source identities. */
export function isCatalogResource(value: unknown): value is PreviewResource {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  if (Object.keys(data).length !== 9) return false;
  const original = getResource(data.id);
  if (
    !original ||
    data.url !== original.url ||
    typeof data.kind !== 'string' ||
    !['Chapter', 'Interactive', 'Article', 'Course'].includes(data.kind) ||
    typeof data.topic !== 'string' ||
    !['Physics', 'Mathematics', 'Computing'].includes(data.topic)
  )
    return false;
  for (const [key, limit] of Object.entries({
    title: 240,
    source: 200,
    publisher: 200,
    description: 1000,
    note: 200,
  })) {
    const field = data[key];
    if (
      typeof field !== 'string' ||
      !field.trim() ||
      field.length > limit ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(field)
    )
      return false;
  }
  return true;
}
