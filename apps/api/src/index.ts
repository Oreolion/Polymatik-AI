import type {
  ApiError,
  Health,
  Me,
  PreviewResource,
} from '@polymatik/domain-types';
import type { CatalogRepository } from './catalog';
import type { CatalogV2Repository } from './catalog-v2';
import {
  catalogQuery,
  isCatalogEntry,
  isCatalogPageForQuery,
  type CatalogPage,
  type CatalogEntry,
} from '@polymatik/domain-types/catalog-v2';
import type { LibraryRepository } from './library';
import type { InterestsRepository, InterestsV2Repository } from './interests';
import type { LibraryV2Repository } from './library-v2';
import {
  libraryQuery,
  isLibraryPage,
  isLibraryChange,
  isInterestsV2,
  type AccountLibraryPage,
  type AccountLibraryChange,
  type InterestsV2,
} from '@polymatik/domain-types/account-v2';
import {
  interestsInput,
  isInterests,
  type Interests,
} from '@polymatik/domain-types/interests';
import {
  libraryTarget,
  libraryBodyError,
} from '@polymatik/domain-types/library-request';
import {
  getResource,
  resources,
} from '@polymatik/domain-types/discovery-preview';

export type Principal = Readonly<{ userId: string; scopes: readonly string[] }>;
type RequestLog = {
  request_id: string;
  route: string;
  status: number;
  duration_ms: number;
};
type Options = {
  allowedOrigins?: readonly string[];
  // Server-only dependency. Never selected through an HTTP header or environment flag.
  verifyBearer?: (token: string) => Promise<Principal | null>;
  verifySession?: (headers: Headers) => Promise<Principal | null>;
  catalog?: CatalogRepository;
  catalogV2?: CatalogV2Repository;
  library?: LibraryRepository;
  libraryV2?: LibraryV2Repository;
  interests?: InterestsRepository;
  interestsV2?: InterestsV2Repository;
  log?: (entry: RequestLog) => void;
};

export function createApi(options: Options = {}) {
  return {
    async fetch(request: Request): Promise<Response> {
      const started = Date.now();
      const requestId = crypto.randomUUID();
      const url = new URL(request.url);
      const resourceMatch = /^\/v1\/resources\/([^/]+)$/.exec(url.pathname);
      const resourceV2Match = /^\/v2\/resources\/([^/]+)$/.exec(url.pathname);
      const catalogV2Route =
        url.pathname === '/v2/resources' || resourceV2Match !== null;
      const expandedLibrary = libraryTarget(url.pathname, '/v2/library');
      const libraryV2Route = expandedLibrary.kind !== 'missing';
      const library = libraryV2Route
        ? expandedLibrary
        : libraryTarget(url.pathname, '/v1/library');
      const libraryRoute = library.kind !== 'missing';
      const interestsV2Route = url.pathname === '/v2/interests';
      const interestsRoute =
        url.pathname === '/v1/interests' || interestsV2Route;
      const privateRoute = libraryRoute || interestsRoute;
      const methods = interestsRoute
        ? ['GET', 'PUT', 'DELETE']
        : library.kind === 'item' || library.kind === 'invalid'
          ? ['PUT', 'DELETE']
          : ['GET'];
      const knownRoute =
        ['/v1/health', '/v1/me', '/v1/resources'].includes(url.pathname) ||
        resourceMatch !== null ||
        catalogV2Route ||
        privateRoute;
      const origin = request.headers.get('origin');
      const originAllowed =
        origin !== null && (options.allowedOrigins ?? []).includes(origin);
      const headers = new Headers({
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
        'x-request-id': requestId,
        vary: 'Origin',
      });
      if (originAllowed) {
        headers.set('access-control-allow-origin', origin);
        headers.set('access-control-expose-headers', 'x-request-id');
      }
      const json = (
        body:
          | Health
          | Me
          | ApiError
          | Interests
          | PreviewResource
          | CatalogEntry
          | CatalogPage
          | AccountLibraryPage
          | AccountLibraryChange
          | InterestsV2
          | { items: readonly PreviewResource[] },
        status = 200,
      ) => Response.json(body, { status, headers });
      const error = (
        status: number,
        code: string,
        message: string,
        retryable = false,
      ) =>
        json(
          { error: { code, message, request_id: requestId, retryable } },
          status,
        );

      const dispatch = async (): Promise<Response> => {
        if (origin && !originAllowed)
          return error(403, 'origin_forbidden', 'Origin is not allowed.');
        if (!knownRoute) return error(404, 'not_found', 'Route not found.');
        if (request.method === 'OPTIONS') {
          const requestedHeaders = (
            request.headers.get('access-control-request-headers') ?? ''
          )
            .split(',')
            .map((name) => name.trim().toLowerCase())
            .filter(Boolean);
          if (
            !originAllowed ||
            !methods.includes(
              request.headers.get('access-control-request-method') ?? '',
            ) ||
            requestedHeaders.some(
              (name) => !['authorization', 'content-type'].includes(name),
            )
          ) {
            return error(
              403,
              'preflight_forbidden',
              'Preflight is not allowed.',
            );
          }
          headers.set('access-control-allow-methods', methods.join(', '));
          headers.set(
            'access-control-allow-headers',
            'authorization, content-type',
          );
          return new Response(null, { status: 204, headers });
        }
        if (!methods.includes(request.method)) {
          headers.set('allow', [...methods, 'OPTIONS'].join(', '));
          return error(405, 'method_not_allowed', 'Method not allowed.');
        }
        let principal: Principal | null = null;
        if (privateRoute && request.method !== 'GET' && !originAllowed)
          return error(403, 'origin_forbidden', 'Origin is not allowed.');
        if (url.pathname === '/v1/me' || privateRoute) {
          const authorization = request.headers.get('authorization');
          const token = /^Bearer ([^\s]{1,4096})$/i.exec(
            authorization ?? '',
          )?.[1];
          try {
            if (token && options.verifyBearer) {
              principal = await options.verifyBearer(token);
            } else if (authorization === null && options.verifySession) {
              principal = await options.verifySession(request.headers);
            }
          } catch {
            return error(
              503,
              'identity_unavailable',
              'Identity verification is unavailable.',
              true,
            );
          }
          if (!principal) {
            headers.set('www-authenticate', 'Bearer');
            return error(
              401,
              'unauthorized',
              'A verified identity is required.',
            );
          }
          const scope = interestsRoute
            ? request.method === 'GET'
              ? 'interests:read'
              : 'interests:write'
            : !libraryRoute
              ? 'profile:read'
              : request.method === 'GET'
                ? 'library:read'
                : 'library:write';
          if (!principal.scopes.includes(scope)) {
            return error(403, 'forbidden', 'Required permission is missing.');
          }
          if (
            privateRoute &&
            request.headers.has('x-polymatik-account') &&
            request.headers.get('x-polymatik-account') !== principal.userId
          )
            return error(
              409,
              'account_changed',
              'The signed-in account changed. Reload before continuing.',
            );
        }
        if (catalogV2Route) {
          let query;
          let id: string | undefined;
          try {
            if (resourceV2Match) {
              id = decodeURIComponent(resourceV2Match[1] ?? '');
              if (!/^[a-z][a-z0-9-]{0,47}$/.test(id) || url.searchParams.size)
                throw new TypeError();
            } else query = catalogQuery(url.searchParams);
          } catch {
            return error(
              422,
              'validation_error',
              'Invalid catalog query or resource ID.',
            );
          }
          if (!options.catalogV2)
            return error(
              503,
              'catalog_unavailable',
              'The resource collection is unavailable.',
              true,
            );
          try {
            const result =
              id !== undefined
                ? await options.catalogV2.get(id)
                : query
                  ? await options.catalogV2.page(query)
                  : undefined;
            if (result === undefined && id !== undefined)
              return error(404, 'not_found', 'Resource not found.');
            if (
              !(id !== undefined
                ? isCatalogEntry(result)
                : query && isCatalogPageForQuery(result, query)) ||
              new TextEncoder().encode(JSON.stringify(result)).byteLength >
                64 * 1024
            )
              throw new TypeError('Invalid catalog response.');
            return json(result as CatalogEntry | CatalogPage);
          } catch {
            return error(
              503,
              'catalog_unavailable',
              'The resource collection is unavailable.',
              true,
            );
          }
        }
        if (libraryV2Route && principal) {
          let query;
          try {
            if (library.kind === 'invalid') throw new TypeError();
            if (library.kind === 'list') query = libraryQuery(url.searchParams);
            else if (url.searchParams.size) throw new TypeError();
          } catch {
            return error(
              422,
              'validation_error',
              'Invalid Library query or identity.',
            );
          }
          const bodyError = await libraryBodyError(request);
          if (bodyError)
            return error(
              bodyError,
              'validation_error',
              'Library requests require an empty body.',
            );
          if (!options.libraryV2)
            return error(
              503,
              'library_unavailable',
              'Account Library is unavailable.',
              true,
            );
          try {
            const result = query
              ? await options.libraryV2.page(principal.userId, query)
              : library.kind === 'item'
                ? await options.libraryV2.setSaved(
                    principal.userId,
                    library.id,
                    request.method === 'PUT',
                  )
                : undefined;
            if (result === undefined)
              return error(404, 'not_found', 'Resource not found.');
            if (
              !(query
                ? isLibraryPage(result) && result.items.length <= query.limit
                : isLibraryChange(result) &&
                  result.saved === (request.method === 'PUT')) ||
              new TextEncoder().encode(JSON.stringify(result)).byteLength >
                65536
            )
              throw new Error('Invalid Library response.');
            return json(result);
          } catch {
            return error(
              503,
              'library_unavailable',
              'Account Library is unavailable.',
              true,
            );
          }
        }
        if (url.searchParams.size > 0) {
          return error(
            422,
            'validation_error',
            'Query parameters are not supported.',
          );
        }
        if (interestsRoute && principal) {
          const input = interestsV2Route
            ? await interestsInput(request, true)
            : await interestsInput(request);
          if (input.error)
            return error(
              input.error,
              'validation_error',
              'Use the supported subject choices and request format.',
            );
          const repository: InterestsV2Repository | undefined = interestsV2Route
            ? options.interestsV2
            : options.interests;
          if (!repository)
            return error(
              503,
              'interests_unavailable',
              'Account interests are unavailable.',
              true,
            );
          try {
            const value =
              request.method === 'GET'
                ? await repository.read(principal.userId)
                : request.method === 'DELETE'
                  ? await repository.reset(principal.userId)
                  : input.value
                    ? await repository.write(principal.userId, input.value)
                    : undefined;
            if (!value)
              return error(422, 'validation_error', 'Invalid subject choices.');
            if (!(interestsV2Route ? isInterestsV2(value) : isInterests(value)))
              throw new Error('Invalid interests result.');
            return json(value);
          } catch {
            return error(
              503,
              'interests_unavailable',
              'Account interests are unavailable.',
              true,
            );
          }
        }
        if (libraryRoute && principal) {
          if (library.kind === 'invalid')
            return error(422, 'validation_error', 'Invalid resource ID.');
          const bodyError = await libraryBodyError(request);
          if (bodyError)
            return error(
              bodyError,
              'validation_error',
              'Library requests require an empty body.',
            );
          if (!options.library)
            return error(
              503,
              'library_unavailable',
              'Account Library is unavailable.',
              true,
            );
          try {
            const items =
              library.kind === 'list'
                ? await options.library.list(principal.userId)
                : library.kind === 'item'
                  ? await options.library.setSaved(
                      principal.userId,
                      library.id,
                      request.method === 'PUT',
                    )
                  : undefined;
            if (!items) return error(404, 'not_found', 'Resource not found.');
            return json({ items });
          } catch {
            return error(
              503,
              'library_unavailable',
              'Account Library is unavailable.',
              true,
            );
          }
        }
        if (principal) return json({ user_id: principal.userId });
        if (url.pathname === '/v1/resources') {
          try {
            return json({
              items: options.catalog ? await options.catalog.list() : resources,
            });
          } catch {
            return error(
              503,
              'catalog_unavailable',
              'The resource collection is unavailable.',
              true,
            );
          }
        }
        if (resourceMatch) {
          let id: string;
          try {
            id = decodeURIComponent(resourceMatch[1] ?? '');
          } catch {
            return error(422, 'validation_error', 'Invalid resource ID.');
          }
          if (!/^[a-z][a-z0-9-]{0,47}$/.test(id))
            return error(422, 'validation_error', 'Invalid resource ID.');
          let resource: PreviewResource | undefined;
          try {
            resource = options.catalog
              ? await options.catalog.get(id)
              : getResource(id);
          } catch {
            return error(
              503,
              'catalog_unavailable',
              'The resource is unavailable.',
              true,
            );
          }
          if (!resource) return error(404, 'not_found', 'Resource not found.');
          return json(resource);
        }
        return json({
          status: 'ok',
          service: 'polymatik-api',
          version: '0.0.0',
        });
      };
      let response: Response;
      try {
        response = await dispatch();
      } catch {
        response = error(
          500,
          'internal_error',
          'An unexpected error occurred.',
        );
      }
      const entry: RequestLog = {
        request_id: requestId,
        route: libraryRoute
          ? library.kind === 'list'
            ? libraryV2Route
              ? '/v2/library'
              : '/v1/library'
            : libraryV2Route
              ? '/v2/library/{id}'
              : '/v1/library/{id}'
          : resourceV2Match
            ? '/v2/resources/{id}'
            : resourceMatch
              ? '/v1/resources/{id}'
              : knownRoute
                ? url.pathname
                : 'unmatched',
        status: response.status,
        duration_ms: Date.now() - started,
      };
      (options.log ?? ((record) => console.log(JSON.stringify(record))))(entry);
      return response;
    },
  };
}
