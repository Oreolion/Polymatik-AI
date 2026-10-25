import { createApi } from './index';

// Fail closed until the separate OIDC integration supplies a verified principal.
export default {
  fetch(request, env) {
    return createApi({
      allowedOrigins: env.ALLOWED_ORIGINS.split(',').filter(Boolean),
    }).fetch(request);
  },
} satisfies ExportedHandler<Env>;
