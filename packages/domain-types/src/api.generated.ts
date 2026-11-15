// Generated from openapi/v1.json by openapi-typescript. Do not edit.
// Schema SHA-256: 0f637f26683e9397a9d012e4d14c8c37e4a0c7ef8685b4fe357245eca8bf9d58
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
  '/v1/library': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read the private account Library
     * @description Returns only the current verified account?s reviewed public saved-resource metadata, newest saves first. Unsigned requests are denied; no device Library fallback.
     */
    get: operations['getLibrary'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/library/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Save a reviewed resource to the account Library
     * @description Idempotent mutation of only the current verified account. Exact allowed Origin and an empty request body are required; the response is the current Library.
     */
    put: operations['saveResource'];
    post?: never;
    /**
     * Remove a resource from the account Library
     * @description Idempotent mutation of only the current verified account. Exact allowed Origin and an empty request body are required; the response is the current Library.
     */
    delete: operations['removeResource'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/interests': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read current private subject choices
     * @description Request body and query parameters are not supported.
     */
    get: operations['getInterests'];
    /**
     * Replace current subject choices or explicitly skip
     * @description Returns only the current verified account?s reviewed public saved-resource metadata, newest saves first. Unsigned requests are denied; no device Library fallback.
     */
    put: operations['updateInterests'];
    post?: never;
    /**
     * Clear current subject choices without changing saved resources
     * @description Request body and query parameters are not supported.
     */
    delete: operations['resetInterests'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/resources': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Bounded expanded public catalog
     * @description Only limit, cursor, subject, kind, q are accepted, once each. Decoded responses are capped at 64 KiB. Requires catalog schema 0003; unconfigured fixture mode returns 503. Queries do not personalize ranking or update preferences.
     */
    get: operations['getCatalogPage'];
    put?: never;
    post?: never;
    delete?: never;
    /** Exact-origin CORS preflight; GET with authorization/content-type only. */
    options: operations['getCatalogPagePreflight'];
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/resources/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Published canonical resource or approved public alias */
    get: operations['getCatalogResource'];
    put?: never;
    post?: never;
    delete?: never;
    /** Exact-origin CORS preflight; GET with authorization/content-type only. */
    options: operations['getCatalogResourcePreflight'];
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/library': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read the private account Library (expanded catalog)
     * @description Private expanded Library; managed identity and exact mutation origin are rechecked. Saved identities remain removable if resource metadata becomes unavailable. No device fallback.
     */
    get: operations['getLibraryV2'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/library/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Save a reviewed resource to the account Library (expanded catalog)
     * @description Private expanded Library; managed identity and exact mutation origin are rechecked. Saved identities remain removable if resource metadata becomes unavailable. No device fallback.
     */
    put: operations['saveResourceV2'];
    post?: never;
    /**
     * Remove a resource from the account Library (expanded catalog)
     * @description Private expanded Library; managed identity and exact mutation origin are rechecked. Saved identities remain removable if resource metadata becomes unavailable. No device fallback.
     */
    delete: operations['removeResourceV2'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/interests': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read current private subject choices (expanded catalog)
     * @description Optional private choices from seven subjects, at most three selected. Managed identity and exact origin are rechecked. No ranking or mastery inference.
     */
    get: operations['getInterestsV2'];
    /**
     * Replace current subject choices or explicitly skip (expanded catalog)
     * @description Optional private choices from seven subjects, at most three selected. Managed identity and exact origin are rechecked. No ranking or mastery inference.
     */
    put: operations['updateInterestsV2'];
    post?: never;
    /**
     * Clear current subject choices without changing saved resources (expanded catalog)
     * @description Optional private choices from seven subjects, at most three selected. Managed identity and exact origin are rechecked. No ranking or mastery inference.
     */
    delete: operations['resetInterestsV2'];
    options?: never;
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
    InterestUpdate:
      | {
          /** @constant */
          status: 'selected';
          subjects: ('Physics' | 'Mathematics' | 'Computing')[];
        }
      | {
          /** @constant */
          status: 'skipped';
          subjects: ('Physics' | 'Mathematics' | 'Computing')[];
        };
    Interests:
      | {
          /** @constant */
          status: 'not_started';
          subjects: ('Physics' | 'Mathematics' | 'Computing')[];
        }
      | {
          /** @constant */
          status: 'selected';
          subjects: ('Physics' | 'Mathematics' | 'Computing')[];
        }
      | {
          /** @constant */
          status: 'skipped';
          subjects: ('Physics' | 'Mathematics' | 'Computing')[];
        };
    /** @description Approved selected cover metadata with exact 3:2 dimensions; no master path or reviewer fields. */
    CatalogCover: {
      /** @description Must match the enclosing canonical ID and version. Delivery is enabled separately after asset review. */
      key: string;
      version: number;
      alt: string;
      width: number;
      height: number;
      /** @constant */
      media_type: 'image/webp';
    };
    /** @description Expanded reviewed public metadata. Editorial scores, rights evidence, reviewers and source-run internals are excluded. Cover is a reviewed storage reference, never an arbitrary remote URL. Only the four historical resources may have null covers. */
    CatalogEntry: {
      id: string;
      title: string;
      source: string;
      publisher: string;
      /** @enum {string} */
      kind: 'Chapter' | 'Interactive' | 'Article' | 'Course' | 'Video' | 'Book';
      /** @enum {string} */
      topic:
        | 'Physics'
        | 'Mathematics'
        | 'Computing'
        | 'Biology'
        | 'Psychology'
        | 'Philosophy'
        | 'Sociology';
      /**
       * Format: uri
       * @description Canonical ASCII HTTPS source URL, with no credentials; publication review is separate from transport validation.
       */
      url: string;
      description: string;
      note: string;
      /** @description Canonical subject order; excludes the primary topic. */
      secondary_subjects: (
        | 'Physics'
        | 'Mathematics'
        | 'Computing'
        | 'Biology'
        | 'Psychology'
        | 'Philosophy'
        | 'Sociology'
      )[];
      cover: components['schemas']['CatalogCover'] | null;
    };
    CatalogPage: {
      items: components['schemas']['CatalogEntry'][];
      /** @description Opaque versioned continuation, bound to subject/kind/q; null at end. Not an authorization token or snapshot guarantee. */
      next_cursor: string | null;
    };
    InterestsV2:
      | {
          /** @constant */
          status: 'not_started';
          subjects: (
            | 'Physics'
            | 'Mathematics'
            | 'Computing'
            | 'Biology'
            | 'Psychology'
            | 'Philosophy'
            | 'Sociology'
          )[];
        }
      | {
          /** @constant */
          status: 'selected';
          subjects: (
            | 'Physics'
            | 'Mathematics'
            | 'Computing'
            | 'Biology'
            | 'Psychology'
            | 'Philosophy'
            | 'Sociology'
          )[];
        }
      | {
          /** @constant */
          status: 'skipped';
          subjects: (
            | 'Physics'
            | 'Mathematics'
            | 'Computing'
            | 'Biology'
            | 'Psychology'
            | 'Philosophy'
            | 'Sociology'
          )[];
        };
    InterestUpdateV2:
      | {
          /** @constant */
          status: 'selected';
          subjects: (
            | 'Physics'
            | 'Mathematics'
            | 'Computing'
            | 'Biology'
            | 'Psychology'
            | 'Philosophy'
            | 'Sociology'
          )[];
        }
      | {
          /** @constant */
          status: 'skipped';
          subjects: (
            | 'Physics'
            | 'Mathematics'
            | 'Computing'
            | 'Biology'
            | 'Psychology'
            | 'Philosophy'
            | 'Sociology'
          )[];
        };
    /** @description Only the verified account owns this save. Null metadata retains an unavailable saved identity without exposing unpublished content. */
    AccountLibraryItem: {
      id: string;
      resource: components['schemas']['CatalogEntry'] | null;
    };
    /** @description Newest saves first, canonical ID breaks timestamp ties. Five-item keyset pages; continuations never confer identity or snapshot guarantees. */
    AccountLibraryPage: {
      items: components['schemas']['AccountLibraryItem'][];
      next_cursor: string | null;
    };
    /** @description Idempotent mutation acknowledgement; refresh paginated reads separately. PUT resolves public aliases to canonical IDs. */
    AccountLibraryChange: {
      id: string;
      saved: boolean;
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
      /** @description Missing, expired or rejected verified identity. */
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
      /** @description Catalog backend unavailable; retryable. No preview fallback in database mode. */
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
      /** @description Catalog backend unavailable; retryable. No preview fallback in database mode. */
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
  getLibrary: {
    parameters: {
      query?: never;
      header?: {
        /** @description Optional expected-account precondition. Compared with the independently verified subject; it never supplies identity. */
        'x-polymatik-account'?: string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Current private Library. Saving does not imply learning or mastery. */
      200: {
        headers: {
          'Cache-Control'?: 'no-store';
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ResourceList'];
        };
      };
      /** @description Verified identity required. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Origin or scope denied. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Resource or route not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Method not allowed. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body deadline exceeded. */
      408: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Signed-in account changed; reload before continuing. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body exceeds byte budget. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Invalid resource ID, query or nonempty request body. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Identity or private Library unavailable; no fallback. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  saveResource: {
    parameters: {
      query?: never;
      header: {
        /** @description Exact configured public web origin. */
        Origin: string;
        /** @description Optional expected-account precondition. Compared with the independently verified subject; it never supplies identity. */
        'x-polymatik-account'?: string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Current private Library. Saving does not imply learning or mastery. */
      200: {
        headers: {
          'Cache-Control'?: 'no-store';
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ResourceList'];
        };
      };
      /** @description Verified identity required. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Origin or scope denied. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Resource or route not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Method not allowed. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body deadline exceeded. */
      408: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Signed-in account changed; reload before continuing. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body exceeds byte budget. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Invalid resource ID, query or nonempty request body. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Identity or private Library unavailable; no fallback. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  removeResource: {
    parameters: {
      query?: never;
      header: {
        /** @description Exact configured public web origin. */
        Origin: string;
        /** @description Optional expected-account precondition. Compared with the independently verified subject; it never supplies identity. */
        'x-polymatik-account'?: string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Current private Library. Saving does not imply learning or mastery. */
      200: {
        headers: {
          'Cache-Control'?: 'no-store';
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ResourceList'];
        };
      };
      /** @description Verified identity required. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Origin or scope denied. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Resource or route not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Method not allowed. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body deadline exceeded. */
      408: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Signed-in account changed; reload before continuing. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body exceeds byte budget. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Invalid resource ID, query or nonempty request body. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Identity or private Library unavailable; no fallback. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  getInterests: {
    parameters: {
      query?: never;
      header?: {
        /** @description Optional precondition matched against the independently verified account; never selects identity. */
        'X-Polymatik-Account'?: string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Current private subject selection. No learning progress or ranking is inferred. */
      200: {
        headers: {
          'Cache-Control'?: 'no-store';
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Interests'];
        };
      };
      /** @description Verified identity required. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Origin or scope denied. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Resource or route not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Method not allowed. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body deadline exceeded. */
      408: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Verified account no longer matches the account precondition. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Body exceeds 1024 bytes. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description PUT requires application/json. */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Invalid query, body, subject or selection status. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Identity or persistence unavailable; no fallback. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  updateInterests: {
    parameters: {
      query?: never;
      header?: {
        /** @description Optional precondition matched against the independently verified account; never selects identity. */
        'X-Polymatik-Account'?: string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['InterestUpdate'];
      };
    };
    responses: {
      /** @description Current private subject selection. No learning progress or ranking is inferred. */
      200: {
        headers: {
          'Cache-Control'?: 'no-store';
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Interests'];
        };
      };
      /** @description Verified identity required. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Origin or scope denied. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Resource or route not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Method not allowed. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body deadline exceeded. */
      408: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Verified account no longer matches the account precondition. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Body exceeds 1024 bytes. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description PUT requires application/json. */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Invalid query, body, subject or selection status. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Identity or persistence unavailable; no fallback. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  resetInterests: {
    parameters: {
      query?: never;
      header?: {
        /** @description Optional precondition matched against the independently verified account; never selects identity. */
        'X-Polymatik-Account'?: string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Current private subject selection. No learning progress or ranking is inferred. */
      200: {
        headers: {
          'Cache-Control'?: 'no-store';
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Interests'];
        };
      };
      /** @description Verified identity required. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Origin or scope denied. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Resource or route not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Method not allowed. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body deadline exceeded. */
      408: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Verified account no longer matches the account precondition. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Body exceeds 1024 bytes. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description PUT requires application/json. */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Invalid query, body, subject or selection status. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Identity or persistence unavailable; no fallback. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  getCatalogPage: {
    parameters: {
      query?: {
        /** @description Canonical decimal 1..5. Fetches at most limit+1 rows for continuation. */
        limit?: number;
        /** @description Unmodified next_cursor from the same filters. Unsigned and non-secret; altered positions never change publication checks. */
        cursor?: string;
        /** @description Matches primary OR secondary subject. */
        subject?:
          | 'Physics'
          | 'Mathematics'
          | 'Computing'
          | 'Biology'
          | 'Psychology'
          | 'Philosophy'
          | 'Sociology';
        /** @description Exact resource format. */
        kind?:
          | 'Chapter'
          | 'Interactive'
          | 'Article'
          | 'Course'
          | 'Video'
          | 'Book';
        /** @description Trimmed nonempty literal case-insensitive substring of title/source/publisher/description. Percent and underscore are literal. No full-text ingestion or semantic ranking. */
        q?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Up to five public resources; unique stable sort_order/id keyset order. No totals or private editorial metadata. Mutations to publication/order between pages may change results; restart to refresh. */
      200: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CatalogPage'];
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
      /** @description Malformed ID, unknown/duplicate query key, invalid bounds or cursor/filter mismatch. */
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
      /** @description Catalog storage/schema unavailable or invalid. No bundled fallback. */
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
  getCatalogPagePreflight: {
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
  getCatalogResource: {
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
      /** @description Published canonical resource. An approved public alias resolves to its canonical ID, without an HTTP redirect. */
      200: {
        headers: {
          /** @description Server-generated correlation ID. */
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CatalogEntry'];
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
      /** @description Malformed ID, unknown/duplicate query key, invalid bounds or cursor/filter mismatch. */
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
      /** @description Catalog storage/schema unavailable or invalid. No bundled fallback. */
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
  getCatalogResourcePreflight: {
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
  getLibraryV2: {
    parameters: {
      query?: {
        limit?: number;
        cursor?: string;
      };
      header?: {
        /** @description Optional expected-account precondition. Compared with the independently verified subject; it never supplies identity. */
        'x-polymatik-account'?: string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description At most five private saves and an opaque continuation. Unavailable public metadata is null; the saved identity remains removable. */
      200: {
        headers: {
          'Cache-Control'?: 'no-store';
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AccountLibraryPage'];
        };
      };
      /** @description Verified identity required. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Origin or scope denied. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Resource or route not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Method not allowed. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body deadline exceeded. */
      408: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Signed-in account changed; reload before continuing. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body exceeds byte budget. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Invalid resource ID, query or nonempty request body. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Identity or private Library unavailable; no fallback. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  saveResourceV2: {
    parameters: {
      query?: never;
      header: {
        /** @description Exact configured public web origin. */
        Origin: string;
        /** @description Optional expected-account precondition. Compared with the independently verified subject; it never supplies identity. */
        'x-polymatik-account'?: string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Idempotent acknowledgement with canonical saved identity and saved state; no Library list or learning inference. */
      200: {
        headers: {
          'Cache-Control'?: 'no-store';
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AccountLibraryChange'];
        };
      };
      /** @description Verified identity required. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Origin or scope denied. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Resource or route not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Method not allowed. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body deadline exceeded. */
      408: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Signed-in account changed; reload before continuing. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body exceeds byte budget. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Invalid resource ID, query or nonempty request body. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Identity or private Library unavailable; no fallback. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  removeResourceV2: {
    parameters: {
      query?: never;
      header: {
        /** @description Exact configured public web origin. */
        Origin: string;
        /** @description Optional expected-account precondition. Compared with the independently verified subject; it never supplies identity. */
        'x-polymatik-account'?: string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Idempotent acknowledgement with canonical saved identity and saved state; no Library list or learning inference. */
      200: {
        headers: {
          'Cache-Control'?: 'no-store';
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AccountLibraryChange'];
        };
      };
      /** @description Verified identity required. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Origin or scope denied. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Resource or route not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Method not allowed. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body deadline exceeded. */
      408: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Signed-in account changed; reload before continuing. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body exceeds byte budget. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Invalid resource ID, query or nonempty request body. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Identity or private Library unavailable; no fallback. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  getInterestsV2: {
    parameters: {
      query?: never;
      header?: {
        /** @description Optional precondition matched against the independently verified account; never selects identity. */
        'X-Polymatik-Account'?: string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Current private subject selection. No learning progress or ranking is inferred. */
      200: {
        headers: {
          'Cache-Control'?: 'no-store';
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['InterestsV2'];
        };
      };
      /** @description Verified identity required. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Origin or scope denied. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Resource or route not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Method not allowed. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body deadline exceeded. */
      408: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Verified account no longer matches the account precondition. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Body exceeds 1024 bytes. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description PUT requires application/json. */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Invalid query, body, subject or selection status. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Identity or persistence unavailable; no fallback. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  updateInterestsV2: {
    parameters: {
      query?: never;
      header?: {
        /** @description Optional precondition matched against the independently verified account; never selects identity. */
        'X-Polymatik-Account'?: string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['InterestUpdateV2'];
      };
    };
    responses: {
      /** @description Current private subject selection. No learning progress or ranking is inferred. */
      200: {
        headers: {
          'Cache-Control'?: 'no-store';
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['InterestsV2'];
        };
      };
      /** @description Verified identity required. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Origin or scope denied. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Resource or route not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Method not allowed. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body deadline exceeded. */
      408: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Verified account no longer matches the account precondition. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Body exceeds 1024 bytes. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description PUT requires application/json. */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Invalid query, body, subject or selection status. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Identity or persistence unavailable; no fallback. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  resetInterestsV2: {
    parameters: {
      query?: never;
      header?: {
        /** @description Optional precondition matched against the independently verified account; never selects identity. */
        'X-Polymatik-Account'?: string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Current private subject selection. No learning progress or ranking is inferred. */
      200: {
        headers: {
          'Cache-Control'?: 'no-store';
          'X-Request-Id'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['InterestsV2'];
        };
      };
      /** @description Verified identity required. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Origin or scope denied. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Resource or route not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Method not allowed. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Request body deadline exceeded. */
      408: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Verified account no longer matches the account precondition. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Body exceeds 1024 bytes. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description PUT requires application/json. */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Invalid query, body, subject or selection status. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description Identity or persistence unavailable; no fallback. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
}
