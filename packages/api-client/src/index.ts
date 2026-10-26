import type {
  ApiError,
  Health,
  Me,
  paths,
  PreviewResource,
  ResourceList,
} from '@polymatik/domain-types';
import {
  getResource,
  resources,
} from '@polymatik/domain-types/discovery-preview';

export type { ApiError, Health, Me } from '@polymatik/domain-types';
type Result<T> = { data: T; error?: never } | { data?: never; error: ApiError };
export type ApiClientOptions = {
  baseUrl: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  allowInsecureHttp?: boolean;
};
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isHealth = (value: unknown): value is Health =>
  object(value) &&
  Object.keys(value).length === 3 &&
  value.status === 'ok' &&
  value.service === 'polymatik-api' &&
  typeof value.version === 'string' &&
  value.version.length > 0;
const isMe = (value: unknown): value is Me =>
  object(value) &&
  Object.keys(value).length === 1 &&
  typeof value.user_id === 'string' &&
  value.user_id.length > 0 &&
  value.user_id.length <= 128;
const isResource = (value: unknown): value is PreviewResource => {
  if (!object(value)) return false;
  const known = getResource(value.id);
  return (
    known !== undefined &&
    Object.keys(value).length === Object.keys(known).length &&
    Object.entries(known).every(([key, expected]) => value[key] === expected)
  );
};
const isResourceList = (value: unknown): value is ResourceList =>
  object(value) &&
  Object.keys(value).length === 1 &&
  Array.isArray(value.items) &&
  value.items.length <= resources.length &&
  value.items.every(isResource) &&
  new Set(value.items.map((item: PreviewResource) => item.id)).size ===
    value.items.length;
const isError = (value: unknown): value is ApiError =>
  object(value) &&
  Object.keys(value).length === 1 &&
  object(value.error) &&
  Object.keys(value.error).length === 4 &&
  typeof value.error.code === 'string' &&
  value.error.code.length > 0 &&
  typeof value.error.message === 'string' &&
  value.error.message.length > 0 &&
  typeof value.error.request_id === 'string' &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
    value.error.request_id,
  ) &&
  typeof value.error.retryable === 'boolean';

// Generated contract types, with native fetch for browser and Expo compatibility.
export function createApiClient(options: ApiClientOptions) {
  const base = new URL(options.baseUrl);
  if (
    !['http:', 'https:'].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    !['', '/'].includes(base.pathname)
  ) {
    throw new TypeError(
      'API base URL must be an HTTP(S) origin without credentials.',
    );
  }
  if (base.protocol === 'http:' && !options.allowInsecureHttp) {
    throw new TypeError('HTTP requires an explicit local-development opt-in.');
  }
  const timeoutMs = options.timeoutMs ?? 10_000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 60_000) {
    throw new TypeError('API timeout must be between 0 and 60000ms.');
  }
  async function get<T>(
    path: Extract<keyof paths, string> | `/v1/resources/${string}`,
    validate: (value: unknown) => value is T,
    signal?: AbortSignal,
    token?: string,
  ): Promise<Result<T>> {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, timeoutMs);
    try {
      const response = await (options.fetch ?? fetch)(
        new URL(path, base).href,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'omit',
          // Workers supports manual/follow, while browsers may return an opaque
          // redirect. Reject both forms below without contacting a destination.
          redirect: 'manual',
          signal: controller.signal,
        },
      );
      if (
        response.type === 'opaqueredirect' ||
        (response.status >= 300 && response.status < 400)
      ) {
        throw new TypeError('API redirects are not allowed.');
      }
      const value: unknown = await response.json();
      if (response.ok && validate(value)) return { data: value };
      if (!response.ok && isError(value)) return { error: value };
      throw new TypeError('API response does not match its contract.');
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  }
  return {
    health: (signal?: AbortSignal) => get('/v1/health', isHealth, signal),
    me: (token: string, signal?: AbortSignal) =>
      get('/v1/me', isMe, signal, token),
    resources: (signal?: AbortSignal) =>
      get('/v1/resources', isResourceList, signal),
    resource: async (id: string, signal?: AbortSignal) => {
      if (!/^[a-z][a-z0-9-]{0,47}$/.test(id))
        throw new TypeError('Invalid resource ID.');
      const result = await get(
        `/v1/resources/${encodeURIComponent(id)}`,
        isResource,
        signal,
      );
      if (result.data && result.data.id !== id)
        throw new TypeError(
          'API resource identity does not match its contract.',
        );
      return result;
    },
  };
}
