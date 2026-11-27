import { readBoundedBody } from '@polymatik/domain-types/bounded-body';
import {
  isEvidenceResponse,
  type EvidenceInput,
} from '@polymatik/domain-types/evidence';

const utf8 = new TextEncoder();
const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
export async function signEvidenceRequest(
  secret: string,
  subject: string,
  body: string,
) {
  if (!/^[a-f0-9]{64}$/.test(secret) || !/^[A-Za-z0-9_-]{1,128}$/.test(subject))
    throw new TypeError('Invalid evidence delegation configuration.');
  const iat = Math.floor(Date.now() / 1000);
  const hash = await crypto.subtle.digest('SHA-256', utf8.encode(body));
  const payload = base64url(
    utf8.encode(
      JSON.stringify({
        v: 1,
        iss: 'polymatik-api',
        aud: 'polymatik-evidence',
        sub: subject,
        scope: 'research:read',
        iat,
        exp: iat + 30,
        jti: crypto.randomUUID(),
        body_sha256: Array.from(new Uint8Array(hash), (b) =>
          b.toString(16).padStart(2, '0'),
        ).join(''),
      }),
    ),
  );
  const key = await crypto.subtle.importKey(
    'raw',
    utf8.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    utf8.encode(`polymatik-evidence-v1.${payload}`),
  );
  return `${payload}.${base64url(new Uint8Array(signature))}`;
}
export class EvidenceServiceError extends Error {
  readonly status: 503 | 504;
  constructor(status: 503 | 504) {
    super('Evidence service unavailable.');
    this.status = status;
  }
}
/** External Python service only. Worker-to-Worker traffic still uses PRODUCT_API. */
export function evidenceGateway(
  env: object,
  options: { fetch?: typeof fetch; timeoutMs?: number } = {},
) {
  const origin: unknown = Reflect.get(env, 'EVIDENCE_SERVICE_ORIGIN');
  const secret: unknown = Reflect.get(env, 'EVIDENCE_GATEWAY_SECRET');
  if (origin === undefined && secret === undefined) return undefined;
  if (
    typeof origin !== 'string' ||
    typeof secret !== 'string' ||
    !/^[a-f0-9]{64}$/.test(secret)
  )
    throw new TypeError('Incomplete evidence service configuration.');
  const url = new URL(origin);
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/' ||
    !['https:', 'http:'].includes(url.protocol) ||
    ((url.protocol === 'http:' || loopback) &&
      !(loopback && Reflect.get(env, 'EVIDENCE_ALLOW_LOOPBACK') === 'true'))
  )
    throw new TypeError('Evidence service must use a fixed HTTPS origin.');
  const timeoutMs = options.timeoutMs ?? 4000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 5000)
    throw new TypeError('Invalid evidence deadline.');
  return async (
    subject: string,
    input: EvidenceInput,
    callerSignal: AbortSignal,
  ) => {
    const signal = AbortSignal.any([
      callerSignal,
      AbortSignal.timeout(timeoutMs),
    ]);
    try {
      signal.throwIfAborted();
      const body = JSON.stringify(input);
      const token = await signEvidenceRequest(secret, subject, body);
      const response = await (options.fetch ?? fetch)(
        `${url.origin}/v1/evidence/search`,
        {
          method: 'POST',
          redirect: 'manual',
          signal,
          body,
          headers: {
            'content-type': 'application/json',
            accept: 'application/json',
            authorization: `Bearer ${token}`,
          },
        },
      );
      if (
        response.status !== 200 ||
        !response.body ||
        response.headers.get('content-type')?.split(';')[0] !==
          'application/json'
      ) {
        await response.body?.cancel();
        throw new EvidenceServiceError(response.status === 504 ? 504 : 503);
      }
      const bytes = await readBoundedBody(response.body, 32768, signal);
      const value: unknown = JSON.parse(
        new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(
          bytes,
        ),
      );
      if (!isEvidenceResponse(value, input.resource_id))
        throw new EvidenceServiceError(503);
      return value;
    } catch (error) {
      if (callerSignal.aborted) throw error;
      if (signal.aborted) throw new EvidenceServiceError(504);
      throw new EvidenceServiceError(
        error instanceof EvidenceServiceError ? error.status : 503,
      );
    }
  };
}
