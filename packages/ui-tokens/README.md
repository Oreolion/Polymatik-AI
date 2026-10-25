# @polymatik/ui-tokens

Shared, immutable design values for Polymatik AI. Platform components stay
separate. Source TypeScript is exported directly for Metro and the web bundler.

Exports: semantic light/dark themes, theme preference resolution, spacing,
radii, readable typography, touch-target sizing and reduced-motion durations.
Font family names are descriptors; this module does not load fonts. The initial
native scaffold uses system fonts until font assets are installed and reviewed.

The six contract tests verify text/control contrast with a reference-checked
WCAG luminance calculation, preference fallback, motion preferences, sizing
invariants and runtime immutability. They do not establish rendered WCAG
conformance or screen-reader usability.

Run `pnpm --filter @polymatik/ui-tokens typecheck` from the repository root.
Run `node --test tests/contracts/ui-tokens.test.mjs` for the contract tests.
