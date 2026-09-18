# Product Specification

## Vision

Daymark is a trusted personal operating system that carries context across a
user's day, conversations, files, memories, projects, and agent work. It should
feel like an executive assistant in the foreground and a carefully governed
agent platform underneath.

## Product principles

1. **Calm before comprehensive.** Show the next useful decision, not every
   available capability.
2. **Context must be inspectable.** The user can see which memories, files,
   events, and project facts ground an answer.
3. **Planning and execution are separate.** A recommendation is not authority
   to create infrastructure or modify code.
4. **Durable state lives outside workers.** Sandboxes and external workers are
   replaceable compute.
5. **Every consequential action is reviewable.** Plans, approvals, logs,
   artifacts, diffs, and outcomes form one trace.
6. **Provider choice is a route, not a product boundary.** Models and coding
   workers are adapters behind a stable Daymark task contract.

## Primary jobs

### Run the day

- synthesize calendar, todos, project state, and working memory;
- create a focused flight plan;
- reschedule or capture work with explicit confirmation;
- produce a daily and weekly review.

### Remember deliberately

- capture user-authored facts, preferences, decisions, and commitments;
- distinguish durable memory from transient context;
- attach provenance and confidence;
- let the user correct, merge, archive, or forget a memory.

### Manage projects

- maintain goals, milestones, blockers, tasks, decisions, files, and links;
- create a current-state narrative and proposed next milestone;
- allow natural-language changes while retaining structured data;
- relate multiple repositories and external resources to one project.

### Converse with context

- provide normal assistant chat outside a sandbox;
- select model routes and MCP connections per conversation;
- optionally include Bee live context;
- expose the context manifest used for each answer.

### Build software safely

- turn an approved outcome into a scoped coding task;
- choose a compatible coding worker and model;
- create an isolated Vercel Sandbox only for coding;
- restore repositories and project context;
- implement, test, collect artifacts, and open a pull request;
- wait for review before any merge or deployment.

## Main surfaces

### Today

Daily command bar, assistant recommendation, priorities, schedule, project
pulse, work queue, and working memory.

### Projects

Portfolio and project detail. Each project has an overview, plan, tasks,
decisions, files, conversations, repositories, runs, and activity timeline.

### Memory

Inbox, durable memory, working memory, conflicts, sources, retention controls,
and deletion.

### Files

Project-scoped object browser, previews, generated artifacts, version history,
and links to the runs or conversations that produced each file.

### Agents

Worker registry, model routes, skills, allowed tools, runs, costs, approvals,
logs, and evaluation results.

### Connections

MCP servers, source control, calendars, Bee, model providers, object storage,
and notification channels.

## Non-goals for the first production milestone

- Autonomous production deployment.
- Silent calendar or messaging changes.
- General-purpose code execution in normal assistant chat.
- Treating raw Bee audio or transcripts as durable memory by default.
- Building every worker integration before one end-to-end coding path is safe.
