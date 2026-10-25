import type { ApiError, Health, Me } from '@polymatik/domain-types';

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
  log?: (entry: RequestLog) => void;
};

export function createApi(options: Options = {}) {
  return {
    async fetch(request: Request): Promise<Response> {
      const started = Date.now();
      const requestId = crypto.randomUUID();
      const url = new URL(request.url);
      const knownRoute = ['/v1/health', '/v1/me'].includes(url.pathname);
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
      const json = (body: Health | Me | ApiError, status = 200) =>
        Response.json(body, { status, headers });
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
            request.headers.get('access-control-request-method') !== 'GET' ||
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
          headers.set('access-control-allow-methods', 'GET');
          headers.set(
            'access-control-allow-headers',
            'authorization, content-type',
          );
          return new Response(null, { status: 204, headers });
        }
        if (request.method !== 'GET') {
          headers.set('allow', 'GET, OPTIONS');
          return error(405, 'method_not_allowed', 'Method not allowed.');
        }
        let principal: Principal | null = null;
        if (url.pathname === '/v1/me') {
          const authorization = request.headers.get('authorization') ?? '';
          const token = /^Bearer ([^\s]{1,4096})$/i.exec(authorization)?.[1];
          if (token && options.verifyBearer) {
            try {
              principal = await options.verifyBearer(token);
            } catch {
              return error(
                503,
                'identity_unavailable',
                'Identity verification is unavailable.',
                true,
              );
            }
          }
          if (!principal) {
            headers.set('www-authenticate', 'Bearer');
            return error(
              401,
              'unauthorized',
              'A verified identity is required.',
            );
          }
          if (!principal.scopes.includes('profile:read')) {
            return error(403, 'forbidden', 'Required permission is missing.');
          }
        }
        if (url.searchParams.size > 0) {
          return error(
            422,
            'validation_error',
            'Query parameters are not supported.',
          );
        }
        if (principal) return json({ user_id: principal.userId });
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
        route: knownRoute ? url.pathname : 'unmatched',
        status: response.status,
        duration_ms: Date.now() - started,
      };
      (options.log ?? ((record) => console.log(JSON.stringify(record))))(entry);
      return response;
    },
  };
}
