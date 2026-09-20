# Security and Privacy

Daymark will hold unusually sensitive information: private memories, schedules,
files, project code, provider credentials, and realtime context. Security is a
product feature, not a deployment task.

## Trust boundaries

- Browser: untrusted presentation client.
- Control plane: authenticated authority and policy enforcement point.
- External model: data processor receiving a minimized request.
- MCP server: untrusted tool provider with explicit grants.
- Coding worker: replaceable executor.
- Sandbox: hostile-by-default ephemeral compute boundary.
- Object storage: durable bytes protected by application authorization.

## Required controls

### Identity and tenancy

- Strong authenticated identity and short-lived sessions.
- Workspace-scoped authorization on every API and database query.
- Row-level defense in depth where supported.
- Separate service identities for web, API, workers, and migrations.

### Secrets

- Server-side secret manager references only.
- No provider key in browser bundles, logs, prompts, or project files.
- Short-lived sandbox credentials scoped to one run and repository.
- Rotation and revocation paths for every connection.

### Memory and Bee

- Bee context is off or paused visibly at the conversation level.
- Raw realtime data has a short retention window.
- Durable memory requires policy approval or explicit user intent.
- Sensitive memories are redacted from providers that lack permission.
- User-visible export, correction, and deletion workflows are required.

### Agent actions

- Tool allowlists are computed by policy, never by the model.
- High-risk actions require fresh, scoped approval.
- Approved plan hashes prevent post-approval scope drift.
- Network egress, time, compute, and spend are bounded.
- Git writes target a feature branch and terminate at a pull request.
- Production deployment is a separate workflow and approval.

### Files

- Malware/content scanning before downstream processing.
- Content hashes and immutable versions.
- Signed, short-lived download URLs.
- Project and workspace authorization before object access.

### Audit

Record user commands, model route, context manifest, tool calls, approvals,
worker identity, sandbox identity, repository changes, test results, costs, and
terminal outcome. Audit events are append-only and reference large payloads by
hash.

## Threats to test

- Prompt injection in files, repositories, Bee transcripts, and MCP output.
- Cross-workspace data leakage in retrieval.
- Tool-schema manipulation by an MCP server.
- Approval reuse after a plan changes.
- Sandbox credential exfiltration and unrestricted egress.
- Malicious repository hooks or dependency scripts.
- Poisoned memory becoming durable truth.
- Sensitive prompt/log exposure through observability providers.

Run threat-model reviews before enabling external users or autonomous writes.
