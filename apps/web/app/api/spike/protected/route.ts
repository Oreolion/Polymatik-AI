export function GET() {
  return Response.json(
    {
      error: {
        code: 'UNAUTHENTICATED',
        message:
          'Authentication is not configured for this compatibility fixture.',
      },
    },
    {
      status: 401,
      headers: { 'Cache-Control': 'no-store', 'WWW-Authenticate': 'Bearer' },
    },
  );
}
