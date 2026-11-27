import {
  evidenceInput,
  isEvidenceResponse,
  type EvidenceInput,
} from '@polymatik/domain-types/evidence';
import { readBoundedBody } from '@polymatik/domain-types/bounded-body';
export class EvidenceError extends Error {
  readonly status: number;
  constructor(status: number) {
    super('Evidence lookup could not be completed.');
    this.status = status;
  }
}
/** Questions are POST bodies, never URL/storage/analytics values. */
export async function readEvidence(
  input: EvidenceInput,
  accountId: string,
  options: { fetch?: typeof fetch; signal?: AbortSignal } = {},
) {
  const value = evidenceInput(input);
  if (!value || !/^[A-Za-z0-9_-]{1,128}$/.test(accountId))
    throw new EvidenceError(422);
  const signal = AbortSignal.any([
    ...(options.signal ? [options.signal] : []),
    AbortSignal.timeout(15000),
  ]);
  try {
    signal.throwIfAborted();
    const response = await (options.fetch ?? fetch)('/api/account/evidence', {
      method: 'POST',
      credentials: 'same-origin',
      redirect: 'manual',
      cache: 'no-store',
      signal,
      headers: {
        'content-type': 'application/json',
        'x-polymatik-account': accountId,
      },
      body: JSON.stringify(value),
    });
    if (response.status !== 200 || !response.body) {
      await response.body?.cancel();
      throw new EvidenceError(response.status);
    }
    const bytes = await readBoundedBody(response.body, 32768, signal);
    const page: unknown = JSON.parse(
      new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes),
    );
    if (!isEvidenceResponse(page, value.resource_id))
      throw new EvidenceError(502);
    return page;
  } catch (error) {
    if (options.signal?.aborted) throw error;
    if (signal.aborted) throw new EvidenceError(504);
    throw error instanceof EvidenceError ? error : new EvidenceError(503);
  }
}
