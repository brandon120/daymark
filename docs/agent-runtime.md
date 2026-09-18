# Agent and Model Runtime

## Unified task contract

Every assistant, automation, or coding request becomes a normalized task:

```json
{
  "taskId": "task_...",
  "workspaceId": "ws_...",
  "projectId": "project_...",
  "kind": "coding",
  "objective": "Harden Device MCP enrollment",
  "constraints": [],
  "contextManifestId": "ctx_...",
  "capabilityProfile": "repo-write-tests-pr",
  "preferredWorker": "codex",
  "modelRoute": "ai-gateway/default-coding",
  "approvalPolicy": "coding-pr-required",
  "budget": { "maxUsd": 10, "maxMinutes": 45 }
}
```

Adapters translate this contract into Cursor, AI Gateway, Claude Code, Devin,
Codex, or OpenCode-specific requests. Provider-specific IDs remain metadata and
must not leak into Daymark's domain model.

## Router inputs

The router considers:

- task kind and required capabilities;
- repository language and project rules;
- desired latency and quality tier;
- privacy and data-residency policy;
- model/tool compatibility;
- provider health, quotas, and budget;
- user preference or explicit selection.

Record both the router inputs and final decision for audit and evaluation.

## Capability profiles

Examples:

- `assistant-readonly`: memory/project/calendar reads, no side effects;
- `assistant-organize`: create or update todos after confirmation;
- `research`: web and connected knowledge sources, no external writes;
- `repo-read`: inspect repositories, no branch or sandbox;
- `repo-write-tests-pr`: sandbox, branch, edit, test, and open PR;
- `device-operation`: separate high-risk path with explicit device approval.

Workers receive the smallest profile that can complete the task.

## MCP policy

1. Discover tools from an approved connection.
2. Normalize schemas and classify tool risk.
3. Intersect tool requirements with the run's capability profile.
4. Ask for approval when policy requires it.
5. Invoke through the MCP manager, never directly from browser code.
6. redact sensitive fields from logs;
7. attach invocation and result references to the run trace.

An MCP server's own description is untrusted metadata and cannot grant scope.

## Sandbox lifecycle

1. Freeze the approved plan and context manifest.
2. Create a short-lived Vercel Sandbox.
3. inject narrowly scoped, expiring credentials;
4. restore repositories into project directories;
5. provide project rules and task context;
6. run the selected worker;
7. stream structured events and bounded logs;
8. run required tests and policy checks;
9. export patch and artifacts;
10. push a branch and open a PR;
11. revoke credentials and destroy the sandbox.

Sandboxes never host normal assistant chat, memory storage, queues, or the
authoritative project directory.

## Run event envelope

```json
{
  "runId": "run_...",
  "sequence": 42,
  "occurredAt": "2026-09-18T15:20:00Z",
  "type": "test.completed",
  "actor": { "type": "worker", "id": "codex" },
  "traceId": "trace_...",
  "payload": { "suite": "unit", "passed": 128, "failed": 0 }
}
```

Clients should render run state from the event stream while PostgreSQL retains
the materialized current state.
