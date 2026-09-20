# ADR 0001: Control Plane and Sandbox Boundary

- Status: Accepted
- Date: 2026-09-18

## Context

Daymark combines ordinary assistant work with software-development agents. A
single unrestricted execution environment would make personal context,
credentials, repositories, and production resources mutually exposed.

## Decision

The Daymark control plane owns identity, durable state, context, policy,
approvals, provider routing, audit, and orchestration.

Normal assistant work runs in the control plane and cannot execute arbitrary
project code.

Only a task classified as coding may create a Vercel Sandbox. The sandbox
receives one immutable run specification, a bounded context bundle, and
short-lived credentials. It produces logs, tests, patches, artifacts, and a
feature-branch pull request. The sandbox is destroyed after export.

Merge and deployment are outside the coding run and require separate policy.

## Consequences

### Positive

- Personal context and credentials stay outside untrusted code execution.
- Runs are reproducible and auditable.
- Coding workers and sandbox providers remain replaceable.
- Pull requests provide a natural human review boundary.

### Costs

- Requires durable orchestration and artifact export.
- Adds latency for sandbox provisioning and repository restoration.
- Demands explicit task classification and approval modeling.
- Local developer workflows need an equivalent adapter for testing.

## Invariants

- A normal assistant message never starts a sandbox.
- A sandbox is never the authoritative store.
- A model cannot grant itself additional tools or credentials.
- A coding run cannot directly merge or deploy.
- Material plan changes invalidate prior approval.
