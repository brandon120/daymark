# Current State

Last updated: 2026-09-18

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
- Command submission produces user feedback.
- A suggested coding action enters the work queue in the Plan phase.
- Coding tasks advance through Plan, Sandbox, Implement, Test, and PR.
- A coding task retains the Vercel Sandbox and PR-approval labels.
- Normal assistant work is labeled as control-plane work with no sandbox.

### Quality and documentation

- Domain unit tests protect the runtime boundary and lifecycle saturation.
- Production build and Sites worker contract.
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

Build the control-plane skeleton with:

1. authenticated user and workspace identity;
2. PostgreSQL migrations for projects, tasks, runs, approvals, and audit events;
3. a read-only `GET /v1/today` aggregate endpoint;
4. replacement of the dashboard's mock data with the typed endpoint contract;
5. contract tests and seed data.

Do not begin sandbox execution until durable runs, approvals, and audit events
exist.
