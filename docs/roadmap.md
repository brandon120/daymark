# Delivery Roadmap

## Phase 0 — Product foundation

Status: implemented in this repository.

- Selected visual system and interactive dashboard.
- Product principles and execution boundary.
- Architecture, domain model, security baseline, and agent handoff.

## Phase 1 — Durable control plane

Goal: replace mock state with an authenticated, auditable source of truth.

- User/workspace authentication.
- PostgreSQL migrations for projects, tasks, runs, approvals, and audit events.
- Railway API and worker processes.
- `GET /v1/today` aggregate and project CRUD.
- Realtime server events for the work queue.
- Seed data, contract tests, tracing, and basic budgets.

Exit: refreshing the web app preserves project/task state and every command has
an audit event.

## Phase 2 — Memory and context

- Conversation and message persistence.
- Context manifests and source citations.
- Memory inbox, approval, correction, supersession, and deletion.
- Semantic retrieval with project/user scopes.
- Bee opt-in ingest, transient buffer, and reviewed memory promotion.

Exit: the user can inspect and correct exactly what informed an answer.

## Phase 3 — Project files and planning

- Railway object storage integration.
- Project file browser, versioning, previews, and provenance.
- Milestones, blockers, decisions, and natural-language project updates.
- Cross-project relationships and weekly reviews.

Exit: Daymark can rebuild a project's current state from durable records.

## Phase 4 — First coding-agent vertical slice

- GitHub App installation and repository linking.
- Immutable plan and approval records.
- Vercel Sandbox create/restore/run/destroy adapter.
- One worker adapter (recommend Codex first).
- Tests, artifact capture, branch push, and pull-request creation.

Exit: an approved Daymark task produces a tested PR without touching main.

## Phase 5 — Model and worker gateway

- Vercel AI Gateway routes and fallback policy.
- Claude Code, Cursor, Devin, and OpenCode adapters.
- Capability-based routing and user overrides.
- Cost, latency, quality, and failure evaluation.

Exit: providers are replaceable without changing the Daymark task contract.

## Phase 6 — MCP and automations

- MCP registry, OAuth/secret references, tool discovery, and scoped grants.
- Scheduled/durable workflows through Monroe Eve-compatible events.
- Notification and approval channels.
- Personal daily brief, weekly review, and project next-step automations.

Exit: automations produce proposed or policy-approved work with complete traces.

## Phase 7 — Extended surfaces

- Mobile and realtime voice interface.
- Proactive assistant contact with quiet hours and escalation policy.
- Device MCP and home/device management.
- Team workspaces if the personal product expands.

## Ordering constraints

- Do not build sandbox execution before durable runs and approvals.
- Do not ingest Bee context before consent, retention, and deletion controls.
- Do not add many provider adapters before one end-to-end path is evaluated.
- Do not enable autonomous deployment as part of coding-run approval.
