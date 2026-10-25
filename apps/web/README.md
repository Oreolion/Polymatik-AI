# web

Polymatik AI's Living Atlas Discover preview, using the Next.js App Router API
through vinext and a local Cloudflare Worker. UI-01 includes topic/search
filters, browser-only Library saves, session dismiss/Undo and a sun/moon theme
toggle. Original resource links and source attribution are included. Account
sync, catalog/ranking and Learn/Profile are future work. See
`docs/36_WEB_DISCOVER_UI.md` for scope, provenance and verification gaps.

From the repository root in the project's Node 24 shell:

```bash
pnpm.cmd install --frozen-lockfile --ignore-scripts
pnpm.cmd lint
pnpm.cmd typecheck
pnpm.cmd test
pnpm.cmd build:web
pnpm.cmd test:web
```

`test:web` starts its own ephemeral local Worker from the built output and stops
it afterward. Its pinned Wrangler test API is experimental. To test an already
running local preview instead, set `POLYMATIK_WEB_BASE_URL=http://127.0.0.1:8787`.
Remote targets are rejected. For interactive checks, run `pnpm.cmd preview:web`
after building, or `pnpm.cmd dev:web` for development.

Engineering fixtures live at `/dev/runtime` and include a request-specific SSR marker, client counter, dynamic topic
route, JSON validation, bounded SSE with cancellation, a static SVG and a
nonsecret local variable binding. `/api/spike/protected` always returns 401,
including for forged identity headers; real authentication belongs to a later
ticket. No identity provider, user data or model calls are configured.

`wrangler.jsonc` is the source configuration. `dist/server/wrangler.json` is
generated during the build. Regenerate binding/runtime declarations with
`pnpm.cmd --filter web types:worker` after changing the source configuration.
Tailwind scanning is scoped to `app/` to avoid traversing monorepo caches.

The web workspace retains the generator's `skipLibCheck` setting: browser DOM
and generated Worker declarations overlap, and the installed Vite plugin also
references an unavailable declaration dependency. Application code remains
strictly checked; the root and other workspaces retain their existing settings.
This does not establish complete runtime compatibility with Node APIs.

Keep `instrumentation-client.ts`: vinext 1.3.0's installed optional fallback
points at a missing empty-module file. An explicit empty app entry avoids it
without enabling telemetry. Restart the dev server after adding this entry;
an existing server can retain the old alias and render HTML without starting
client interactions. HTTP contracts now check browser bootstrap imports too.

The compatibility date is 2026-10-12, supported by both workerd versions in the
lockfile. A regression test checks the date against the locked runtimes. Advance
it with a compatible runtime upgrade and observed verification.
