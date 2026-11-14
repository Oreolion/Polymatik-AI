# Account Library — UI-06

Development implementation, 13 November 2026. Web/backend first; mobile parked.
This is the next private-persistence slice after the deployed catalog and managed
session boundary. It does not close the earlier hosted Google/browser gates.

## Behavior

Profile shows a private account Library after sign-in. The panel reads reviewed
resource metadata, explicitly copies the current browser's saved resources when
requested, and removes resources from the account. Browser originals are kept.
Discover, detail Save buttons and the existing Library tab still address device
storage; they do not automatically change accounts or upload bookmarks.

The panel has loading, empty, failure/refresh, expired-account and pending-action
states. It uses the Living Atlas typography, rules, semantic theme colors and
44px actions. Lists are keyed by account; in-flight requests abort on unmount.
An expected-account precondition rejects an account switch rather than applying
a previously initiated copy to the newly signed-in account. Partial copies are
shown only after acknowledgement and can be retried idempotently.

Saving records interest, not understanding. No mastery, topic progress, ranking,
AI inference, learning event, tracking provider or new dependency is introduced.
The owner's updated docs/prompt.md remains intact. Its cross-subject learning,
adaptation, evidence-based progress and specialist/human-review direction informs
later onboarding, ranking and learning tickets; the external HackerTube comparison
needs a separately verified source before any design conclusions.

## Contract and trust boundaries

| Product API | Same-origin web adapter | Operation |
| --- | --- | --- |
| GET /v1/library | GET /api/account/library | Current private resource list |
| PUT /v1/library/{id} | PUT /api/account/library/{id} | Idempotent save |
| DELETE /v1/library/{id} | DELETE /api/account/library/{id} | Idempotent own removal |

Responses use the shared ResourceList contract with at most four reviewed
resources, newest saves first, Cache-Control: no-store and no private account
fields. OpenAPI v0.3.0 and generated types describe these operations. Writes
require an exact allowed Origin and an empty body; no user ID is accepted in
query/body data. The BFF forwards one opaque session cookie. The product API
independently revalidates it and enforces library:read or library:write. Optional
x-polymatik-account is only compared with the verified principal; it cannot
select identity. Mismatch is 409. Foreign origins and insufficient scopes are
403; missing/revoked credentials 401; unavailable persistence 503 without local
or public-catalog fallback. Bodies and responses have byte/deadline limits.

SQL uses the existing node-postgres/Hyperdrive path. Every operation creates one
request-scoped client and executes BEGIN, set_config(..., true), scoped SQL and
COMMIT/ROLLBACK on that same connection. RLS is forced on product users/saves,
and queries also include explicit subject predicates. SQL uses parameters; no
managed Auth schema is accessed. GET does not create a product user. A save
creates only the authenticated product user, if needed. Withdrawn catalog entries
are excluded. ON CONFLICT DO NOTHING preserves the original save timestamp.

## Development permission and live SQL verification passed

**Owner-executed and verified on 13 November.** The restricted role's existing
SELECT/INSERT privileges were extended with exactly:

```sql
GRANT DELETE ON polymatik.saved_items TO polymatik_app;
```

Review db/operations/enable_account_library.sql. It verifies the owner connection,
restricted role and forced row security in a transaction before this grant. It
changes no role membership, table data, Auth grants, schema, production target or
migration 0001. Existing RLS limits removal to the verified account. This is a
privileged operation explicitly approved by the owner under AGENTS.md. No further
approval is needed for this exact development grant.

The agent's offline CLI attempt failed with npm ENOTCACHED before Neon or SQL
ran. The owner then ran the following command successfully in Git Bash; no rerun
is needed:

```bash
bash scripts/node24.sh npx.cmd --yes neon@8.23.1 psql br-noisy-poetry-zaka8dav \
  --project-id gentle-shadow-65971019 \
  --database-name neondb --role-name neondb_owner \
  -- -X -v ON_ERROR_STOP=1 -f db/operations/enable_account_library.sql
```

The fixed branch is dev-auth-working. No account/role creation or password is
needed. Do not change the command to production. SQL alone cannot attest the
Neon branch; the CLI's fixed branch selector is part of the target boundary.

Then prove actual restricted-login behavior, keeping credentials private:

```bash
bash scripts/node24.sh node scripts/library-verify.mjs
```

The probe loads the existing ignored development connection, rejects elevated
roles, requires DELETE, and tests real repository save/read/remove with two
temporary users. Cross-user DELETE must affect zero rows; unsigned private reads
must be empty. All fixture changes roll back, including after a failure. It
prints no connection strings or fixture identities. The owner's pasted output
shows BEGIN, SET, SET, DO, GRANT, COMMIT followed by the successful probe below.
This is owner-reported live database evidence, not an agent-executed check or
proof of deployed Hyperdrive behavior.

Owner-observed final result:

```text
Account Library verification: idempotent save; two-user reads isolated; own removal; cross-user delete denied; unsigned reads empty; fixtures rolled back.
```

## Acceptance and rollback

The restricted-login probe passed. Check the local web/API before pushing:
sign in, save a resource in the device Library, open Profile, explicitly copy it,
reload, remove it from the account, and confirm the device original remains.
Use a second account/browser to prove no first-account saves appear. Test expired
sessions, failed requests, keyboard use, narrow reflow and both appearances. No
computer-use runtime is callable in this session; no rendered screenshot or
accessibility conformance claim is available.

Do not push solely to obtain green CI: this checkout's aggregate test run has
one installed Expo color-link failure, recorded in docs/24. The previous clean
Windows/Linux run #7 is green for b0dc950; it does not test this new code.
Run current checks in the normal terminal before the next checkpoint push.

Rollback app code independently of data. The grant can be revoked, with a
separate owner decision and the same development target:
REVOKE DELETE ON polymatik.saved_items FROM polymatik_app. Do not delete users,
saves, schemas, credentials or managed Auth tables. Existing device saves are
untouched by either application rollback or this permission change.

References: [Cloudflare node-postgres](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/),
[same-client transactions](https://node-postgres.com/features/transactions).
