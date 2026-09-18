# Daymark

Daymark is a personal operating system for memory, planning, projects, files,
assistant chat, and safe agent-driven software work.

It is designed to answer three questions:

1. What matters now?
2. What context should inform the decision?
3. What can Daymark safely advance on the user's behalf?

## What exists today

This initial repository contains:

- a responsive React/Vite dashboard matching the selected Daymark design;
- interactive priorities, project context, Bee context, model routing, and work
  queue states;
- an explicit control-plane versus sandbox execution model;
- domain tests for the coding lifecycle boundary;
- production architecture, data models, security rules, and a phased roadmap;
- a durable handoff guide for future coding agents.

The external services shown in the interface are modeled, not connected yet.
See [Current state](docs/current-state.md) for an exact inventory.

## Quick start

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

Quality gate:

```bash
npm run check
```

## Product map

| Surface | Purpose |
| --- | --- |
| Today | Daily priorities, schedule, active context, and suggested next actions |
| Projects | State, files, milestones, blockers, and safe project progression |
| Memory | Durable facts, decisions, preferences, and source-backed context |
| Files | Persistent project artifacts stored outside ephemeral sandboxes |
| Agents | Worker capabilities, model routes, runs, approvals, and audits |
| Connections | MCP servers, model providers, Bee context, and repository access |

## Core invariant

Normal assistant operations run in the Daymark control plane. Only coding work
uses Vercel Sandboxes, and a coding run ends in a pull request requiring review.

## Documentation

- [Product specification](docs/product-spec.md)
- [System architecture and data flows](docs/architecture.md)
- [Current implementation state](docs/current-state.md)
- [Domain data model](docs/data-model.md)
- [Agent and model runtime](docs/agent-runtime.md)
- [Security and privacy](docs/security-and-privacy.md)
- [Development guide](docs/development.md)
- [Delivery roadmap](docs/roadmap.md)
- [Architecture decisions](docs/decisions/)

## Technology baseline

The current UI uses React 19, Vite 6, Phosphor icons, locally bundled DM Sans,
and Newsreader. The proposed production control plane is designed for Railway,
PostgreSQL, durable object storage, queue-backed workers, Vercel Sandboxes, and
provider adapters for AI Gateway, Claude Code, Codex, Cursor, Devin, and
OpenCode.

Read [AGENTS.md](AGENTS.md) before making substantial changes.
