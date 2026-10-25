import {
  createSpikeStream,
  parseStreamCount,
} from '../../../../src/spike-stream';

export function GET(request: Request) {
  const count = parseStreamCount(new URL(request.url));
  if (count === null) {
    return Response.json(
      {
        error: {
          code: 'INVALID_COUNT',
          message: 'Provide one count from 1 to 5.',
        },
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  return new Response(createSpikeStream(request.signal, count), {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
