export function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const topic = query.get('topic') ?? '';
  const invalid =
    query.getAll('topic').length !== 1 ||
    [...query.keys()].some((key) => key !== 'topic') ||
    !/^[a-z0-9-]{1,48}$/.test(topic);
  const headers = { 'Cache-Control': 'no-store' };
  if (invalid) {
    return Response.json(
      {
        error: {
          code: 'INVALID_TOPIC',
          message:
            'Provide one topic using 1–48 lowercase letters, digits or hyphens.',
        },
      },
      { status: 400, headers },
    );
  }
  return Response.json({ topic }, { headers });
}
