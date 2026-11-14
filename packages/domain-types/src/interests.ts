import { topics } from '@polymatik/domain-types/discovery-preview';
import {
  BodyLimitError,
  readBoundedBody,
} from '@polymatik/domain-types/bounded-body';
import { libraryBodyError } from '@polymatik/domain-types/library-request';
import type { components } from './api.generated';

/** Initial taxonomy follows the reviewed collection, not invented catalog coverage. */
export const interestSubjects = topics.slice(1) as readonly Exclude<
  (typeof topics)[number],
  'All subjects'
>[];
export type InterestSubject = (typeof interestSubjects)[number];
export type InterestUpdate = components['schemas']['InterestUpdate'];
export type Interests = components['schemas']['Interests'];

export function interestUpdate(value: unknown): InterestUpdate | null {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length !== 2 ||
    !('status' in value) ||
    !('subjects' in value)
  )
    return null;
  const { status, subjects } = value;
  if (
    !Array.isArray(subjects) ||
    subjects.length > interestSubjects.length ||
    new Set(subjects).size !== subjects.length ||
    subjects.some((subject) => !interestSubjects.includes(subject))
  )
    return null;
  if (
    (status === 'selected' && subjects.length > 0) ||
    (status === 'skipped' && subjects.length === 0)
  )
    return {
      status,
      subjects: interestSubjects.filter((subject) =>
        subjects.includes(subject),
      ),
    };
  return null;
}

export function isInterests(value: unknown): value is Interests {
  if (
    value &&
    typeof value === 'object' &&
    Object.keys(value).length === 2 &&
    'status' in value &&
    value.status === 'not_started' &&
    'subjects' in value &&
    Array.isArray(value.subjects) &&
    value.subjects.length === 0
  )
    return true;
  const parsed = interestUpdate(value);
  return parsed !== null;
}

/** Shared API/BFF policy: strict, small JSON writes; reads/resets carry no body. */
export async function interestsInput(
  request: Request,
): Promise<{ value?: InterestUpdate; error?: number }> {
  if (request.method !== 'PUT') {
    const error = await libraryBodyError(request);
    return error ? { error } : {};
  }
  if (
    request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !==
    'application/json'
  ) {
    await request.body?.cancel().catch(() => {});
    return { error: 415 };
  }
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(3000)]);
  try {
    if (!request.body) return { error: 422 };
    const bytes = await readBoundedBody(request.body, 1024, signal);
    const value = interestUpdate(
      JSON.parse(
        new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(
          bytes,
        ),
      ),
    );
    return value ? { value } : { error: 422 };
  } catch (error) {
    return {
      error: error instanceof BodyLimitError ? 413 : signal.aborted ? 408 : 422,
    };
  }
}
