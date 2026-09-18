# Daymark Agent Guide

This file is the first stop for any coding agent working in this repository.

## Product intent

Daymark is Brandon's personal operating system: an executive assistant, durable
knowledge base, planning workspace, project command center, assistant chat, and
safe launcher for coding agents.

The defining boundary is:

- Normal assistant work runs in the Daymark control plane.
- Coding work may use an ephemeral Vercel Sandbox only after the work is scoped.
- A coding run must end in a reviewable pull request. It must never silently
  deploy or mutate production.

Do not weaken that boundary to simplify an implementation.

## Repository state

The repository currently contains a high-fidelity interactive web prototype and
the product/architecture documentation for the production system. It does not
yet contain the production API, database, authentication, queue, provider
integrations, MCP gateway, Bee ingestion, or Vercel Sandbox integration.

Read [docs/current-state.md](docs/current-state.md) before proposing work.

## Required reading

For any meaningful change, read:

1. [README.md](README.md)
2. [docs/product-spec.md](docs/product-spec.md)
3. [docs/architecture.md](docs/architecture.md)
4. [docs/current-state.md](docs/current-state.md)
5. The domain-specific document for the feature being changed

For runtime or permission changes, also read:

- [docs/agent-runtime.md](docs/agent-runtime.md)
- [docs/security-and-privacy.md](docs/security-and-privacy.md)
- [docs/decisions/0001-control-plane-sandbox-boundary.md](docs/decisions/0001-control-plane-sandbox-boundary.md)

## Working conventions

- Preserve the warm, calm, low-noise visual language selected for the initial
  Daymark dashboard.
- Keep domain data and state transitions separate from view components.
- Treat memories, Bee context, files, and tool output as provenance-bearing
  records, not prompt strings.
- Every side effect must have an actor, policy decision, audit event, and
  idempotency key.
- Never place API keys or provider credentials in browser code.
- Never store the authoritative project state inside a sandbox.
- Never let model-generated instructions expand their own tool scopes.
- Prefer an adapter for every external model, worker, MCP server, repository
  provider, file store, and sandbox provider.
- Add an ADR under `docs/decisions/` when a durable architectural choice is
  made.
- Update `docs/current-state.md` in the same pull request as each completed
  feature.

## UI source of truth

The selected visual reference is the merged Daymark dashboard generated during
product design. The local copy is not committed because generated source images
are conversation artifacts. The implemented dashboard should retain:

- left navigation;
- Today's Flight Plan as the primary surface;
- command composer with model, MCP, and Bee controls;
- assistant recommendation with an explicit approval boundary;
- priorities and Project Pulse;
- schedule, work queue, and working-memory rail;
- visible distinction between control-plane and sandboxed work.

## Commands

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
npm run check
```

`npm run check` runs domain tests, the production build, and the Sites worker
contract test.

## Definition of done

A feature is not complete until:

- behavior and failure states are tested;
- relevant docs and diagrams are updated;
- security boundaries are preserved;
- the app builds without warnings that affect users;
- accessibility and responsive behavior are checked;
- `docs/current-state.md` records what is now implemented and what remains;
- the pull request describes migrations, configuration, risks, and rollback.

## Protected hosting files

Keep these files compatible with the Product Design/Sites runtime:

- `.openai/hosting.json`
- `worker/index.js`
- `scripts/prepare-sites-build.mjs`
- `tests/sites-worker.test.mjs`

Do not replace this application with static HTML.
