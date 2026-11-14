import { readBoundedBody } from '@polymatik/domain-types/bounded-body';
import { managedSessionCookie } from '@polymatik/domain-types/managed-session-cookie';
import type { Principal } from './index';

type Options = { fetch?: typeof fetch; timeoutMs?: number };
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function settings(env: object) {
  try {
    const baseValue: unknown = Reflect.get(env, 'NEON_AUTH_BASE_URL');
    const originValue: unknown = Reflect.get(env, 'AUTH_PUBLIC_ORIGIN');
    if (typeof baseValue !== 'string' || typeof originValue !== 'string')
      return null;
    const base = new URL(baseValue);
    const origin = new URL(originValue);
    if (
      base.protocol !== 'https:' ||
      !base.hostname.endsWith('.neon.tech') ||
      !base.hostname.includes('.neonauth.') ||
      base.port ||
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      !/^\/[a-zA-Z0-9_-]+\/auth$/.test(base.pathname) ||
      origin.username ||
      origin.password ||
      origin.search ||
      origin.hash ||
      origin.pathname !== '/' ||
      (origin.protocol !== 'https:' &&
        !(
          origin.protocol === 'http:' &&
          ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)
        ))
    )
      return null;
    return {
      url: `${base.href}/get-session?disableCookieCache=true`,
      origin: origin.origin,
    };
  } catch {
    return null;
  }
}

/** Revalidate with the branch's Auth service; never consume a browser cache or user header. */
export function createManagedSessionVerifier(
  env: object,
  options: Options = {},
) {
  const config = settings(env);
  const timeoutMs = options.timeoutMs ?? 5000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 10000)
    throw new TypeError('Invalid identity deadline.');
  return async (headers: Headers): Promise<Principal | null> => {
    const cookie = managedSessionCookie(headers);
    if (!cookie) return null;
    if (!config) throw new Error('Managed identity is not configured.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await (options.fetch ?? fetch)(config.url, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          accept: 'application/json',
          cookie,
          origin: config.origin,
          'x-neon-auth-middleware': 'true',
        },
      });
      if (response.status === 401) {
        await response.body?.cancel();
        return null;
      }
      if (!response.ok || response.status !== 200 || !response.body) {
        await response.body?.cancel();
        throw new Error('Managed identity unavailable.');
      }
      const bytes = await readBoundedBody(
        response.body,
        65536,
        controller.signal,
      );
      const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
      if (
        data === null ||
        (object(data) && data.session === null && data.user === null)
      )
        return null;
      if (!object(data) || !object(data.user) || !object(data.session))
        throw new Error('Invalid identity response.');
      const id = data.user.id;
      const expiry =
        typeof data.session.expiresAt === 'string'
          ? Date.parse(data.session.expiresAt)
          : NaN;
      if (
        typeof id !== 'string' ||
        !/^[A-Za-z0-9_-]{1,128}$/.test(id) ||
        data.session.userId !== id ||
        !Number.isFinite(expiry)
      )
        throw new Error('Invalid identity response.');
      if (expiry <= Date.now()) return null;
      return {
        userId: id,
        scopes: [
          'profile:read',
          'library:read',
          'library:write',
          'interests:read',
          'interests:write',
        ],
      };
    } finally {
      clearTimeout(timer);
    }
  };
}
