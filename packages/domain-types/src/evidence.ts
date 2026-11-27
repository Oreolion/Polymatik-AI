import type { components } from './api.generated';
import {
  readBoundedBody,
  BodyLimitError,
} from '@polymatik/domain-types/bounded-body';

export type EvidenceInput = components['schemas']['EvidenceInput'];
export type EvidenceResponse = components['schemas']['EvidenceResponse'];
export type EvidenceCitation = components['schemas']['EvidenceCitation'];
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const exact = (v: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(v).length === keys.length &&
  keys.every((k) => Object.hasOwn(v, k));
const text = (v: unknown, max: number): v is string =>
  typeof v === 'string' &&
  v.trim().length > 0 &&
  [...v].length <= max &&
  !/[\p{Cc}]/u.test(v);
const digest = (v: unknown): v is string =>
  typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const identifier = (v: unknown): v is string =>
  typeof v === 'string' && /^[a-z0-9][a-z0-9_-]{0,79}$/.test(v);
const integer = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
const uuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(v);
function publicUrl(v: unknown): v is string {
  if (!text(v, 2000)) return false;
  try {
    const u = new URL(v);
    return (
      u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      !u.search &&
      !u.hash &&
      !u.port &&
      !v.includes('\\') &&
      u.hostname.includes('.') &&
      !u.hostname.endsWith('.') &&
      !/^\d+(?:\.\d+){3}$/.test(u.hostname) &&
      !u.hostname.startsWith('[') &&
      !/(?:^|\.)(?:localhost|local|internal)$/.test(u.hostname)
    );
  } catch {
    return false;
  }
}
export function evidenceInput(v: unknown): EvidenceInput | null {
  if (
    !object(v) ||
    !exact(v, ['resource_id', 'query']) ||
    typeof v.resource_id !== 'string' ||
    !/^[a-z][a-z0-9-]{0,47}$/.test(v.resource_id) ||
    typeof v.query !== 'string'
  )
    return null;
  const query = v.query.trim();
  const terms = new Set(query.toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? []);
  return text(query, 500) && terms.size > 0 && terms.size <= 32
    ? { resource_id: v.resource_id, query }
    : null;
}
export async function evidenceBody(
  request: Request,
): Promise<
  { value: EvidenceInput; error?: never } | { value?: never; error: number }
> {
  if (new URL(request.url).search) return { error: 422 };
  if (
    request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !==
    'application/json'
  )
    return { error: 415 };
  if (!request.body) return { error: 422 };
  try {
    const bytes = await readBoundedBody(
      request.body,
      16384,
      AbortSignal.any([request.signal, AbortSignal.timeout(1000)]),
    );
    const value = evidenceInput(
      JSON.parse(
        new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(
          bytes,
        ),
      ),
    );
    return value ? { value } : { error: 422 };
  } catch (error) {
    return { error: error instanceof BodyLimitError ? 413 : 422 };
  }
}
export function isEvidenceResponse(
  v: unknown,
  resourceId: string,
): v is EvidenceResponse {
  if (
    !object(v) ||
    !exact(v, [
      'protocol_version',
      'resource_id',
      'status',
      'citations',
      'retriever_version',
      'limitations',
      'request_id',
    ]) ||
    v.protocol_version !== 'evidence-read-v1' ||
    v.resource_id !== resourceId ||
    v.retriever_version !== 'lexical-overlap-v1' ||
    !uuid(v.request_id) ||
    !['evidence', 'no_evidence', 'quotation_unavailable'].includes(
      String(v.status),
    ) ||
    !Array.isArray(v.citations) ||
    v.citations.length > 5 ||
    v.citations.length > 0 !== (v.status === 'evidence') ||
    !Array.isArray(v.limitations) ||
    v.limitations.length < 1 ||
    v.limitations.length > 5 ||
    !v.limitations.every((x) => text(x, 500))
  )
    return false;
  const seen = new Set<string>();
  const sources = new Map<
    string,
    { count: number; quoted: number; fingerprint: string }
  >();
  for (const c of v.citations) {
    if (
      !object(c) ||
      !exact(c, [
        'passage_id',
        'source_id',
        'title',
        'author',
        'url',
        'license_label',
        'license_url',
        'attribution_notice',
        'changes_notice',
        'version',
        'checksum',
        'normalization_version',
        'start',
        'end',
        'line_start',
        'line_end',
        'quote',
      ]) ||
      !digest(c.passage_id) ||
      !identifier(c.source_id) ||
      !identifier(c.version) ||
      !digest(c.checksum) ||
      !text(c.title, 300) ||
      !text(c.author, 300) ||
      !publicUrl(c.url) ||
      !text(c.license_label, 300) ||
      !(c.license_url === null || publicUrl(c.license_url)) ||
      !text(c.attribution_notice, 2000) ||
      !text(c.changes_notice, 1200) ||
      c.normalization_version !== 'nfc-lf-v1' ||
      !integer(c.start, 0, 100000) ||
      !integer(c.end, 1, 100000) ||
      c.end <= c.start ||
      c.end - c.start > 1600 ||
      !integer(c.line_start, 1, 100001) ||
      !integer(c.line_end, 1, 100001) ||
      c.line_end < c.line_start ||
      typeof c.quote !== 'string' ||
      !c.quote.trim() ||
      [...c.quote].length > 240 ||
      [...c.quote].length > c.end - c.start ||
      /[\p{Cc}]/u.test(c.quote.replaceAll('\n', '').replaceAll('\t', '')) ||
      seen.has(c.passage_id)
    )
      return false;
    seen.add(c.passage_id);
    const fingerprint = JSON.stringify([
      c.title,
      c.author,
      c.url,
      c.version,
      c.checksum,
      c.license_label,
      c.license_url,
      c.attribution_notice,
      c.changes_notice,
    ]);
    const previous = sources.get(c.source_id) ?? {
      count: 0,
      quoted: 0,
      fingerprint,
    };
    if (
      ++previous.count > 2 ||
      (previous.quoted += [...c.quote].length) > 1000 ||
      previous.fingerprint !== fingerprint
    )
      return false;
    sources.set(c.source_id, previous);
  }
  return true;
}
