import { env } from 'cloudflare:workers';

export function GET() {
  if (env.SPIKE_FIXTURE !== 'local-only-fixture') {
    return Response.json(
      { error: { code: 'FIXTURE_NOT_CONFIGURED' } },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  return Response.json(
    { fixture: env.SPIKE_FIXTURE },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
