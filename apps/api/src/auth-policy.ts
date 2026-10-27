export type AuthSettings = {
  baseURL: string;
  secret: string;
  googleClientId: string;
  googleClientSecret: string;
  databaseURL: string;
  secureCookies: boolean;
};
const local = (host: string) =>
  ['localhost', '127.0.0.1', '[::1]'].includes(host);

/** Validate only server bindings; never infer origins from request headers. */
export function authSettings(env: object): AuthSettings | null {
  const text = (name: string): string => {
    const value: unknown = Reflect.get(env, name);
    return typeof value === 'string' ? value : '';
  };
  try {
    const base = new URL(text('BETTER_AUTH_URL'));
    const secret = text('BETTER_AUTH_SECRET');
    const googleClientId = text('GOOGLE_CLIENT_ID');
    const googleClientSecret = text('GOOGLE_CLIENT_SECRET');
    const hyperdrive: unknown = Reflect.get(env, 'HYPERDRIVE');
    const hyperdriveURL: unknown =
      typeof hyperdrive === 'object' && hyperdrive !== null
        ? Reflect.get(hyperdrive, 'connectionString')
        : undefined;
    // Wrangler supplies a simulated binding locally and the real Hyperdrive
    // connection in Workers. There is no independent DATABASE_URL fallback.
    if (typeof hyperdriveURL !== 'string') return null;
    const databaseURL = hyperdriveURL;
    const database = new URL(databaseURL);
    if (
      (base.protocol !== 'https:' &&
        !(base.protocol === 'http:' && local(base.hostname))) ||
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      base.pathname !== '/' ||
      secret.length < 32 ||
      !secret.trim() ||
      !googleClientId.endsWith('.apps.googleusercontent.com') ||
      !googleClientSecret.trim() ||
      !['postgres:', 'postgresql:'].includes(database.protocol)
    )
      return null;
    return {
      baseURL: base.origin,
      secret,
      googleClientId,
      googleClientSecret,
      databaseURL,
      secureCookies: base.protocol === 'https:',
    };
  } catch {
    return null;
  }
}
