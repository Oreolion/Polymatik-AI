// Temporary fetch instrumentation for the existing Neon CLI, not an auth client.
// Enable only for the docs/39 command. Never logs headers, bodies or credentials.
export const authEndpoint =
  'https://console.neon.tech/api/v2/projects/gentle-shadow-65971019/branches/br-calm-firefly-zak4igb7/auth';

/**
 * @param {typeof fetch} fetchImpl
 * @param {(record: Record<string, string | number | null>) => void} emit
 * @returns {typeof fetch}
 */
export function createAuthTrace(fetchImpl, emit) {
  let attempted = false;
  return async function tracedFetch(input, init) {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = (
      init?.method ?? (input instanceof Request ? input.method : 'GET')
    ).toUpperCase();
    const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    if (url.origin !== 'https://console.neon.tech' || !mutation) {
      return fetchImpl(input, init);
    }
    if (url.href !== authEndpoint || method !== 'POST') {
      throw new Error(
        'Trace blocked a Neon mutation outside the rehearsal Auth endpoint.',
      );
    }
    const request = new Request(input, init);
    const body = await request.clone().json();
    if (
      body?.auth_provider !== 'better_auth' ||
      body?.database_name !== 'polymatik_rehearsal' ||
      Object.keys(body).some(
        (key) => !['auth_provider', 'database_name'].includes(key),
      )
    ) {
      throw new Error('Trace blocked an unexpected Auth provisioning payload.');
    }
    if (attempted) {
      throw new Error(
        'Trace blocked an automatic retry; inspect the first result.',
      );
    }
    attempted = true;
    const started = Date.now();
    emit({ event: 'neon_auth_attempt', at: new Date(started).toISOString() });
    let response;
    try {
      response = await fetchImpl(request, { redirect: 'error' });
    } catch {
      emit({
        event: 'neon_auth_transport_failure',
        elapsed_ms: Date.now() - started,
        outcome: 'unknown; check Auth status before any retry',
      });
      throw new Error(
        'Auth request failed at transport; inspect status before retrying.',
      );
    }
    const id = response.headers.get('x-neon-ret-request-id');
    emit({
      event: 'neon_auth_response',
      status: response.status,
      request_id: id && /^[A-Za-z0-9._:-]{1,160}$/.test(id) ? id : null,
      elapsed_ms: Date.now() - started,
    });
    return response;
  };
}

if (process.env.POLYMATIK_NEON_AUTH_TRACE === '1') {
  globalThis.fetch = createAuthTrace(globalThis.fetch, (record) => {
    process.stderr.write(`POLYMATIK_TRACE ${JSON.stringify(record)}\n`);
  });
}
