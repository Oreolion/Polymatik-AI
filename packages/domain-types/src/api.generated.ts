// Generated from openapi/v1.json by openapi-typescript. Do not edit.
// Schema SHA-256: 2751da6dc4a144cc3f782a6ce906697eb0fec72de9279f164b2fc07ffdaae717
export interface paths {
  '/v1/health': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Public liveness */
    get: operations['getHealth'];
    put?: never;
    post?: never;
    delete?: never;
    /** Exact-origin CORS preflight; GET with authorization/content-type only. */
    options: operations['getHealthPreflight'];
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Verified subject boundary */
    get: operations['getMe'];
    put?: never;
    post?: never;
    delete?: never;
    /** Exact-origin CORS preflight; GET with authorization/content-type only. */
    options: operations['getMePreflight'];
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    Health: {
      /** @enum {string} */
      status: 'ok';
      /** @enum {string} */
      service: 'polymatik-api';
      version: string;
    };
    Me: {
      user_id: string;
    };
    ApiError: {
      error: {
        code: string;
        message: string;
        /** Format: uuid */
        request_id: string;
        retryable: boolean;
      };
    };
  };
  responses: {
    /** @description Unknown route. */
    NotFound: {
      headers: {
        /** @description Server-generated correlation ID. */
        'X-Request-Id'?: string;
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiError'];
      };
    };
  };
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  getHealth: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Liveness only; no downstream readiness guarantee. */
      200: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Health'];
        };
      };
      /** @description Origin or permission denied. */
      403: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Unsupported method. */
      405: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Unsupported query parameters. */
      422: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Sanitized internal error. */
      500: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  getHealthPreflight: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Allowed preflight. */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Origin, method or request headers denied. */
      403: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  getMe: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Verified subject only; profile persistence is not implemented. */
      200: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Me'];
        };
      };
      /** @description Missing or invalid verified identity. Default Worker denies all tokens until OIDC integration. */
      401: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Origin or permission denied. */
      403: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Unsupported method. */
      405: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Unsupported query parameters. */
      422: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Sanitized internal error. */
      500: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Identity verifier unavailable; retryable. */
      503: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  getMePreflight: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Allowed preflight. */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Origin, method or request headers denied. */
      403: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
}
