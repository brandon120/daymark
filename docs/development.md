# Development Guide

## Local setup

```bash
npm install
cp .env.example .env
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

The current prototype does not require environment variables. The example file
documents proposed server-side integration names; never populate secrets in a
committed file.

## Quality gate

```bash
npm run check
```

This runs domain tests, produces the static client and Sites worker bundle, and
tests the worker contract.

## Source layout

```text
src/
  App.jsx       interactive UI and view composition
  data.js       current mock view models
  domain.js     execution-boundary and lifecycle logic
  styles.css    design tokens, layout, responsive behavior
docs/
  decisions/    architecture decision records
tests/
  domain.test.mjs
  sites-worker.test.mjs
worker/         hosting worker
```

## Adding a feature

1. Read `AGENTS.md` and `docs/current-state.md`.
2. Define the domain change and security boundary before the screen.
3. Add or update an API contract before wiring external integrations.
4. Keep provider-specific code behind an adapter.
5. Add happy-path, denial, retry, and idempotency tests.
6. Update the relevant architecture document and current-state inventory.
7. Run the quality gate and visually inspect responsive states.

## Proposed production repository shape

When the control plane begins, prefer a workspace/monorepo without prematurely
splitting services:

```text
apps/
  web/
  api/
  worker/
packages/
  domain/
  contracts/
  database/
  policy/
  provider-adapters/
  ui/
docs/
```

Keep the first vertical slice deployable before extracting independent
services.

## Configuration rules

- Validate configuration at process startup.
- Namespace environment variables by integration.
- Represent credentials as secret references in database records.
- Feature-flag incomplete providers.
- Record migrations and rollback steps in pull requests.
