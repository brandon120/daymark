# Current State

Last updated: 2026-09-20

This file is the authoritative boundary between what exists and what is still a
design. Update it in every feature pull request.

## Implemented

### Application shell

- Responsive React/Vite single-page application.
- Daymark dark visual system with locally bundled fonts.
- Sidebar navigation and modal-like secondary workspace surfaces.
- Today dashboard with schedule, priorities, Project Pulse, work queue, and
  working memory.

### Prototype behavior

- Priorities toggle between complete and incomplete.
- Project selection changes the active project context and recommendation.
- Bee live context can be enabled or paused.
- Model route selection is interactive.
- Command submission produces feedback that identifies the selected model route
  and whether Bee context was included.
- A suggested coding action enters the work queue in the Plan phase.
- Repeating an approval for the same active project reuses the existing task
  instead of creating duplicate work.
- Coding tasks advance through Plan, Sandbox, Implement, Test, and PR.
- Terminal PR tasks cannot be advanced again, and queue filtering works across
  all, coding-agent, and assistant work.
- A coding task retains the Vercel Sandbox and PR-approval labels.
- Normal assistant work is labeled as control-plane work with no sandbox.
- Project rows remain selectable inside the Projects workspace.
- MCP, calendar, and working-memory controls produce visible prototype actions.
- The Today heading is generated from the user's current browser date.

### Control plane (Phase 1 — in progress)

- npm workspaces monorepo with `apps/api`, `packages/domain`, `packages/contracts`,
  and `packages/database`.
- PostgreSQL schema for users, workspaces, projects, priorities, schedule items,
  tasks, working memories, audit events, runs, and approvals.
- SQL migrations and a seed script that reproduces the dashboard fixture data.
- HttpOnly session cookies for browser auth plus server-side bearer tokens for
  programmatic access. Access tokens are not embedded in the client bundle.
- Control-plane API with:
  - `GET /health`
  - `GET /v1/today`
  - `PATCH /v1/priorities/:id`
  - `PATCH /v1/workspace/active-project`
  - `PATCH /v1/workspace/bee-live`
  - `POST /v1/tasks/coding`
  - `PATCH /v1/tasks/:id/advance`
- Audit events for priority toggles, active-project changes, Bee context changes,
  coding-task enqueue, and coding-task advancement.
- Web app loads Today from the API when `VITE_DAYMARK_USE_API=true`, with a local
  mock fallback when it is not.
- Migration runner bootstraps `schema_migrations` before reading it.
- Mutation idempotency records replay prior responses instead of re-running writes.
- Contract tests for the `/v1/today` response shape.
- Docker Compose file for local PostgreSQL.
- Single-service Railway deployment config (`railway.toml`) that builds the web
  client and serves UI + API from one Node process.
- CORS support for local dev when the web app and API run on different origins.

### Quality and documentation

- Domain unit tests protect the runtime boundary, lifecycle saturation,
  duplicate-task handling, immutable selection, queue transitions, and date
  formatting.
- The clean-check quality gate runs domain tests, a production build, then the
  Sites worker contract without depending on an existing `dist` directory.
- End-to-end architecture, data model, runtime, security, development, and
  roadmap documentation.
- Agent handoff rules in `AGENTS.md`.

## Modeled but not integrated

- Authentication and user/workspace tenancy.
- Persistent todos, projects, memories, conversations, files, and runs.
- Railway API service, PostgreSQL, object storage, and queues.
- Realtime streaming.
- Vercel Sandbox creation, snapshots, execution, and teardown.
- GitHub Apps, branches, commits, checks, and pull requests.
- MCP discovery, authorization, and tool invocation.
- Bee realtime context ingestion and user consent controls.
- AI Gateway, Claude Code, Codex, Cursor, Devin, and OpenCode adapters.
- Calendar and scheduling provider integrations.
- Semantic memory retrieval and embeddings.
- Auditing, budgets, rate limits, notifications, and policy evaluation.

## Next recommended implementation

Continue Phase 1:

1. project CRUD endpoints and optimistic versioning;
2. Production hardening for the single-service Railway deployment;
3. realtime server events for the work queue;
4. richer authentication than a single bearer token;
5. integration tests in CI with PostgreSQL;
6. tracing and basic budget hooks.

Do not begin sandbox execution until durable runs, approvals, and audit events
are production-ready.
