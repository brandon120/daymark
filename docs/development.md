# Development Guide

## Local setup

```bash
npm install
cp .env.example .env
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

The web prototype can run without environment variables and will use local mock
Today data. To connect the dashboard to the control-plane API:

```bash
docker compose up -d
cp .env.example .env
npm run db:setup
npm run api:dev
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

Set `VITE_DAYMARK_USE_API=true` for local API mode. Set `DAYMARK_API_TOKEN` to the
token printed by `npm run db:seed`, then sign in through the web UI. The token is
never embedded in the client bundle. Leave `VITE_DAYMARK_API_URL` empty to use
the Vite dev proxy.

## Railway (single service)

Daymark deploys as **one Railway service** that serves the web UI and API from
the same origin. You do **not** need object storage for the current Phase 1
scope — only PostgreSQL.

### Resources

1. **One web/API service** from this repository (`railway.toml` at the repo root).
2. **One PostgreSQL database** added from the Railway project dashboard.

No Railway volume or bucket is required yet. Project files and run artifacts
are planned for Phase 3.

### First deploy

1. Push this repository to GitHub.
2. Create a Railway project and deploy the repo.
3. Add **PostgreSQL** to the same project.
4. On the Daymark service, set variables:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Reference from the PostgreSQL service |
| `DAYMARK_API_TOKEN` | Long random secret (server-side only) |
| `VITE_DAYMARK_USE_API` | `true` |
| `DAYMARK_WORKSPACE_ID` | `00000000-0000-4000-8000-000000000001` |
| `DAYMARK_SEED_ON_START` | `1` for the first deploy only |
| `VITE_DAYMARK_API_URL` | Leave empty (same-origin) |
| `NODE_ENV` | `production` |

5. Generate a public domain for the service.
6. After the first successful boot, set `DAYMARK_SEED_ON_START=0` and redeploy.

Railway runs:

- **Build:** `npm ci && npm run build:railway`
- **Start:** migrations, optional seed, then `apps/api/production.mjs`

Health check path: `/health`

### Local production smoke test

```bash
npm run build:railway
DATABASE_URL=... DAYMARK_API_TOKEN=dev npm run start
```

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
