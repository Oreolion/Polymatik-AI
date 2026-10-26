// Generated from openapi/v1.json by openapi-typescript. Do not edit.
// Schema SHA-256: e8643b43527979989c57f8d58bac7f9e4680df7f0406653124d920b58a017090
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
  '/v1/resources': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Public finite preview catalog */
    get: operations['listResources'];
    put?: never;
    post?: never;
    delete?: never;
    /** Exact-origin CORS preflight; GET with authorization/content-type only. */
    options: operations['listResourcesPreflight'];
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/resources/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    /** Public preview resource metadata */
    get: operations['getResource'];
    put?: never;
    post?: never;
    delete?: never;
    /** Exact-origin CORS preflight; GET with authorization/content-type only. */
    options: operations['getResourcePreflight'];
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
    PreviewResource: {
      id: string;
      title: string;
      source: string;
      publisher: string;
      /** @enum {string} */
      kind: 'Chapter' | 'Interactive' | 'Article' | 'Course';
      /** @enum {string} */
      topic: 'Physics' | 'Mathematics' | 'Computing';
      /**
       * Format: uri
       * @description Fixed reviewed original HTTPS URL from the preview catalog.
       */
      url: string;
      description: string;
      note: string;
    };
    ResourceList: {
      items: components['schemas']['PreviewResource'][];
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
  listResources: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Reviewed metadata only; no article body or private user data. */
      200: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ResourceList'];
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
  listResourcesPreflight: {
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
  getResource: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Reviewed metadata only; no article body or private user data. */
      200: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PreviewResource'];
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
      /** @description Resource not found. */
      404: {
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
  getResourcePreflight: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
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
