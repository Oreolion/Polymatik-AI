/** Forward only one opaque session token. Cached claims never establish identity. */
export function managedSessionCookie(headers: Headers): string | null {
  const raw = headers.get('cookie') ?? '';
  if (raw.length > 16384) return null;
  const matches = raw
    .split(';')
    .map((value) => value.trim())
    .filter((value) => /^(?:__Secure-)?neon-auth\.session_token=/.test(value));
  if (matches.length !== 1) return null;
  const cookie = matches[0]!;
  const value = cookie.slice(cookie.indexOf('=') + 1);
  return /^[A-Za-z0-9._~%+\/=-]{1,8192}$/.test(value) ? cookie : null;
}
