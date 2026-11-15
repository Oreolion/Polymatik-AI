import type {
  ApiError,
  Health,
  Me,
  paths,
  PreviewResource,
  ResourceList,
} from '@polymatik/domain-types';
import { resources } from '@polymatik/domain-types/discovery-preview';
import { isCatalogResource } from '@polymatik/domain-types/catalog-resource';
import { readBoundedBody } from '@polymatik/domain-types/bounded-body';
import {
  catalogSearch,
  catalogQuery,
  isCatalogEntry,
  isCatalogPageForQuery,
  type CatalogPage,
  type CatalogPageInput,
} from '@polymatik/domain-types/catalog-v2';
import {
  isInterests,
  interestUpdate,
  type InterestUpdate,
} from '@polymatik/domain-types/interests';
import {
  librarySearch,
  isLibraryPage,
  isLibraryChange,
  interestUpdateV2,
  isInterestsV2,
  type LibraryPageInput,
  type InterestUpdateV2,
  type AccountLibraryPage,
  type AccountLibraryChange,
} from '@polymatik/domain-types/account-v2';

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
const isResource = isCatalogResource;
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
    path:
      | Extract<keyof paths, string>
      | `/v1/resources/${string}`
      | `/v2/resources?${string}`
      | `/v2/resources/${string}`
      | '/v1/library'
      | '/v1/interests'
      | `/v1/library/${string}`
      | `/v2/library?${string}`
      | `/v2/library/${string}`,
    validate: (value: unknown) => value is T,
    signal?: AbortSignal,
    token?: string,
    method: 'GET' | 'PUT' | 'DELETE' = 'GET',
    body?: InterestUpdate | InterestUpdateV2,
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
          method,
          headers: {
            accept: 'application/json',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
            ...(body ? { 'content-type': 'application/json' } : {}),
          },
          credentials: 'omit',
          ...(body ? { body: JSON.stringify(body) } : {}),
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
      if (!response.body) throw new TypeError('Missing API response body.');
      const value: unknown = JSON.parse(
        new TextDecoder().decode(
          await readBoundedBody(response.body, 64 * 1024, controller.signal),
        ),
      );
      if (response.ok && validate(value)) return { data: value };
      if (!response.ok && isError(value)) return { error: value };
      throw new TypeError('API response does not match its contract.');
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  }
  function setSaved(
    id: string,
    method: 'PUT' | 'DELETE',
    token?: string,
    signal?: AbortSignal,
  ) {
    if (!/^[a-z][a-z0-9-]{0,47}$/.test(id))
      throw new TypeError('Invalid resource ID.');
    return get(
      `/v1/library/${encodeURIComponent(id)}`,
      isResourceList,
      signal,
      token,
      method,
    );
  }
  return {
    libraryPage: (
      input: LibraryPageInput = {},
      token?: string,
      signal?: AbortSignal,
    ) => {
      const params = librarySearch(input);
      return get(
        `/v2/library?${params}`,
        (value): value is AccountLibraryPage =>
          isLibraryPage(value) &&
          value.items.length <= Number(params.get('limit') ?? 5),
        signal,
        token,
      );
    },
    changeLibrary: async (
      id: string,
      saved: boolean,
      token?: string,
      signal?: AbortSignal,
    ) => {
      if (!/^[a-z][a-z0-9-]{0,47}$/.test(id))
        throw new TypeError('Invalid resource ID.');
      return get(
        `/v2/library/${encodeURIComponent(id)}`,
        (value): value is AccountLibraryChange =>
          isLibraryChange(value) && value.saved === saved,
        signal,
        token,
        saved ? 'PUT' : 'DELETE',
      );
    },
    interestsV2: (token?: string, signal?: AbortSignal) =>
      get('/v2/interests', isInterestsV2, signal, token),
    updateInterestsV2: (
      value: InterestUpdateV2,
      token?: string,
      signal?: AbortSignal,
    ) => {
      const parsed = interestUpdateV2(value);
      if (!parsed) throw new TypeError('Invalid subject choices.');
      return get('/v2/interests', isInterestsV2, signal, token, 'PUT', parsed);
    },
    resetInterestsV2: (token?: string, signal?: AbortSignal) =>
      get('/v2/interests', isInterestsV2, signal, token, 'DELETE'),
    health: (signal?: AbortSignal) => get('/v1/health', isHealth, signal),
    // Server adapters may supply the session cookie through their trusted fetch.
    me: (token?: string, signal?: AbortSignal) =>
      get('/v1/me', isMe, signal, token),
    resources: (signal?: AbortSignal) =>
      get('/v1/resources', isResourceList, signal),
    catalogPage: (input: CatalogPageInput = {}, signal?: AbortSignal) => {
      const search = catalogSearch(input);
      const query = catalogQuery(search);
      return get(
        `/v2/resources?${search.toString()}`,
        (value): value is CatalogPage => isCatalogPageForQuery(value, query),
        signal,
      );
    },
    catalogResource: async (id: string, signal?: AbortSignal) => {
      if (!/^[a-z][a-z0-9-]{0,47}$/.test(id))
        throw new TypeError('Invalid resource ID.');
      // Public aliases intentionally resolve to the canonical ID in the body.
      return get(
        `/v2/resources/${encodeURIComponent(id)}`,
        isCatalogEntry,
        signal,
      );
    },
    library: (token?: string, signal?: AbortSignal) =>
      get('/v1/library', isResourceList, signal, token),
    interests: (token?: string, signal?: AbortSignal) =>
      get('/v1/interests', isInterests, signal, token),
    updateInterests: (
      value: InterestUpdate,
      token?: string,
      signal?: AbortSignal,
    ) => {
      const parsed = interestUpdate(value);
      if (!parsed) throw new TypeError('Invalid subject choices.');
      return get('/v1/interests', isInterests, signal, token, 'PUT', parsed);
    },
    resetInterests: (token?: string, signal?: AbortSignal) =>
      get('/v1/interests', isInterests, signal, token, 'DELETE'),
    saveResource: async (id: string, token?: string, signal?: AbortSignal) =>
      setSaved(id, 'PUT', token, signal),
    removeResource: async (id: string, token?: string, signal?: AbortSignal) =>
      setSaved(id, 'DELETE', token, signal),
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
