import { createAuthClient } from '@neon/auth/next';

// Neon owns the OAuth verifier exchange; browser requests stay same-origin.
export const authClient = createAuthClient();
