# Architecture and Data Flows

## System overview

```mermaid
flowchart TD
    UI["Daymark Web App"] --> API["Control Plane API"]
    API --> DB["PostgreSQL"]
    API --> Files["Railway Object Storage"]
    API --> Queue["Durable Work Queue"]
    API --> Context["Context & Memory Service"]
    API --> Policy["Policy / Approval Engine"]
    Queue --> Orchestrator["Run Orchestrator"]
    Orchestrator --> Models["Model Gateway Adapters"]
    Orchestrator --> MCP["MCP Connection Manager"]
    Orchestrator --> Workers["Coding Worker Adapters"]
    Workers --> Sandbox["Vercel Sandbox"]
    Sandbox --> GitHub["GitHub Pull Request"]
```

## Component responsibilities

| Component | Owns | Must not own |
| --- | --- | --- |
| Web app | presentation, optimistic UI, streaming display | provider secrets or authority |
| Control Plane API | auth, tenancy, domain commands, aggregate reads | arbitrary code execution |
| PostgreSQL | authoritative structured state and audit metadata | large binary artifacts |
| Object storage | project files, run artifacts, snapshots, exports | mutable task state |
| Context service | retrieval, provenance, memory policy | direct side effects |
| Policy engine | scopes, approvals, budgets, risk classification | model reasoning |
| Queue | durable, retryable work dispatch | final business state |
| Orchestrator | run state machine and adapter coordination | user identity source |
| Model adapters | normalized inference and tool-call envelopes | direct database access |
| MCP manager | connection scopes, tool discovery, invocation records | self-approved scopes |
| Worker adapters | worker-specific task translation | durable project authority |
| Vercel Sandbox | isolated coding compute | durable user data or credentials |

## Assistant chat flow

Normal conversation never starts a sandbox.

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web App
    participant C as Control Plane
    participant X as Context Service
    participant M as Model Gateway
    participant T as MCP Manager

    U->>W: Send message
    W->>C: Create message
    C->>X: Build context manifest
    X-->>C: Memories, files, projects, Bee excerpts
    C->>M: Prompt + manifest + allowed tools
    M->>T: Optional scoped tool request
    T-->>M: Tool result + audit ID
    M-->>C: Stream response
    C-->>W: Tokens + citations + proposed actions
    W-->>U: Answer and reviewable actions
```

## Coding change flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Control Plane
    participant P as Policy Engine
    participant O as Orchestrator
    participant S as Vercel Sandbox
    participant G as GitHub

    U->>C: Approve scoped coding plan
    C->>P: Evaluate repository, tools, budget
    P-->>C: Approval decision
    C->>O: Enqueue immutable run specification
    O->>S: Create isolated sandbox
    O->>S: Restore repository and context bundle
    S->>S: Implement and test
    S-->>O: Logs, patch, tests, artifacts
    O->>G: Push branch and open pull request
    G-->>C: Pull request and checks
    C-->>U: Review requested
    O->>S: Destroy sandbox
```

## Bee live-context flow

Bee context is opt-in per conversation. Raw streams should be short-lived.

```mermaid
flowchart LR
    Bee["Bee Stream"] --> Ingest["Consent-aware Ingest"]
    Ingest --> Buffer["Encrypted Short-lived Buffer"]
    Buffer --> Extract["Event & Intent Extraction"]
    Extract --> Review["User Review / Policy"]
    Review -->|Transient| Context["Working Context"]
    Review -->|Approved| Memory["Durable Memory"]
    Review -->|Action| Task["Todo or Proposed Run"]
```

## Memory lifecycle

1. Ingest a candidate with source, timestamp, actor, and consent state.
2. Classify it as transient context, proposed memory, or explicit user memory.
3. Deduplicate against semantically similar active memories.
4. Ask for confirmation when the item is sensitive, ambiguous, or behavioral.
5. Store approved durable memory with provenance and retention policy.
6. Retrieve through a context manifest that records why each item was selected.
7. Support correction, supersession, archival, export, and deletion.

## Deployment topology

Recommended initial topology:

- Web app on Vercel or Railway.
- Control plane, queue workers, and scheduled jobs on Railway.
- Managed PostgreSQL with row-level tenant enforcement.
- Railway object storage for project files and artifacts.
- Vercel Sandbox as ephemeral coding compute.
- GitHub App for repository access and pull-request delivery.
- Monroe Eve-compatible events for durable schedules and notifications.

Keep interfaces portable; deployment location is an adapter decision.
