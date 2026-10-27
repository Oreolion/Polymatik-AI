const methods = new Map<string, 'GET' | 'POST'>([
  ['/api/auth/get-session', 'GET'],
  ['/api/auth/callback/google', 'GET'],
  ['/api/auth/error', 'GET'],
  ['/api/auth/sign-in/social', 'POST'],
  ['/api/auth/sign-out', 'POST'],
  ['/api/auth/update-user', 'POST'],
]);

export const authRouteMethod = (path: string) => methods.get(path) ?? null;
