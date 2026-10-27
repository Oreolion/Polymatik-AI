import { createAuthClient } from 'better-auth/react';

// Same-origin BFF only. Provider credentials and database access stay in the API.
export const authClient = createAuthClient({ basePath: '/api/auth' });
