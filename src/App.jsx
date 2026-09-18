import { useMemo, useState } from "react";
import {
  ArrowRight,
  CaretDown,
  CaretRight,
  Check,
  Circle,
  Code,
  FileText,
  Folder,
  LinkSimple,
  Microphone,
  Robot,
  ShareNetwork,
  ShieldCheck,
  Sparkle,
  Stack,
  Sun,
  X,
} from "@phosphor-icons/react";
import {
  initialQueue,
  memories,
  navigation,
  priorities,
  projects,
  schedule,
  workspaceDetails,
} from "./data.js";
import { codingPhases, createCodingTask, nextCodingPhase } from "./domain.js";

const icons = { Sun, Folder, ShieldCheck, FileText, Robot, ShareNetwork, Code, Stack };

function NavIcon({ name, size = 21 }) {
  const Icon = icons[name] ?? Circle;
  return <Icon size={size} weight="regular" aria-hidden="true" />;
}

function StatusDot({ tone = "muted" }) {
  return <span className={`status-dot status-dot--${tone}`} aria-hidden="true" />;
}

function Sidebar({ activeView, onNavigate }) {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <button className="brand" onClick={() => onNavigate("today")} aria-label="Daymark home">
        <span className="brand-mark"><Sun size={17} weight="fill" /></span>
        <span>
          <strong>Daymark</strong>
          <small>A calmer, more capable you.</small>
        </span>
      </button>

      <nav className="nav-list">
        {navigation.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? "nav-item--active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button className="profile" onClick={() => onNavigate("connections")}>
        <span className="avatar">BM</span>
        <span className="profile-copy">
          <strong>Brandon</strong>
          <small>Personal workspace</small>
        </span>
        <CaretRight size={15} aria-hidden="true" />
      </button>
    </aside>
  );
}

function CommandBar({ beeLive, onBeeChange, onSubmit }) {
  const [command, setCommand] = useState("");
  const [model, setModel] = useState("Claude Sonnet 4");

  function submit(event) {
    event.preventDefault();
    const value = command.trim();
    if (!value) return;
    onSubmit(value);
    setCommand("");
  }

  return (
    <form className="command-bar" onSubmit={submit}>
      <label className="command-input-wrap">
        <span className="sr-only">Ask Daymark</span>
        <input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          placeholder="Ask, plan, delegate, or give an instruction…"
        />
        <Microphone size={20} aria-hidden="true" />
      </label>

      <label className="select-control">
        <span className="sr-only">Model route</span>
        <Robot size={18} aria-hidden="true" />
        <select value={model} onChange={(event) => setModel(event.target.value)}>
          <option>Claude Sonnet 4</option>
          <option>Codex</option>
          <option>AI Gateway · Auto</option>
        </select>
        <CaretDown size={13} aria-hidden="true" />
      </label>

      <button className="mcp-control" type="button" aria-label="3 connected MCP servers">
        <LinkSimple size={18} />
        <span>3 MCP</span>
        <CaretDown size={13} />
      </button>

      <label className="bee-toggle">
        <button
          type="button"
          role="switch"
          aria-checked={beeLive}
          className={`switch ${beeLive ? "switch--on" : ""}`}
          onClick={() => onBeeChange(!beeLive)}
        >
          <span />
        </button>
        <span>
          <strong>Use live Bee context</strong>
          <small>Memory, calendar, files & tools</small>
        </span>
      </label>

      <button className="send-button" type="submit">
        <span>Send</span>
        <ArrowRight size={17} weight="bold" />
      </button>
    </form>
  );
}

function Suggestion({ activeProject, onApprove, onDiscuss }) {
  const isDevice = activeProject.id === "device-mcp";
  return (
    <section className="suggestion" aria-labelledby="suggestion-title">
      <Sparkle size={22} weight="fill" aria-hidden="true" />
      <div className="suggestion-copy">
        <span className="eyebrow">Suggestion</span>
        <h2 id="suggestion-title">
          {isDevice ? "Advance Device MCP’s enrollment reliability?" : `Advance ${activeProject.name}’s next milestone?`}
        </h2>
        <p>
          I can scope the change, implement it with tests, and open a pull request for your review.
          This runs in an isolated Vercel Sandbox and won’t affect production.
        </p>
      </div>
      <div className="suggestion-actions">
        <div>
          <button className="primary-button" onClick={onApprove}>Yes, run it</button>
          <button className="secondary-button" onClick={onDiscuss}>Discuss</button>
        </div>
        <small>Sandboxed in Vercel <span>•</span> PR requires approval</small>
      </div>
    </section>
  );
}

function Priorities({ completed, onToggle }) {
  return (
    <section className="priorities" aria-labelledby="priorities-title">
      <h2 id="priorities-title" className="section-title">Today’s Priorities</h2>
      <div className="priority-list">
        {priorities.map((item, index) => (
          <article className={`priority-row ${completed.has(item.id) ? "priority-row--done" : ""}`} key={item.id}>
            <span className="priority-index">{index + 1}</span>
            <div className="priority-content">
              <div className="priority-meta">
                <strong>{item.group}</strong>
                <span>{item.time}</span>
                {item.project && <span className="project-label"><StatusDot tone={item.tone} />{item.project}</span>}
              </div>
              <button className="todo-toggle" onClick={() => onToggle(item.id)} aria-label={`Mark ${item.title} ${completed.has(item.id) ? "incomplete" : "complete"}`}>
                <span className="todo-circle">{completed.has(item.id) && <Check size={15} weight="bold" />}</span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
              </button>
            </div>
            <CaretRight size={15} className="row-caret" aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  );
}

function ProjectPulse({ activeProjectId, onSelect }) {
  return (
    <section className="project-pulse" aria-labelledby="project-pulse-title">
      <div className="section-heading-row">
        <div>
          <h2 id="project-pulse-title" className="section-title">Project Pulse</h2>
          <p>Key projects at a glance. Select one to ground Daymark’s next action.</p>
        </div>
        <button className="text-button" onClick={() => onSelect("all")}>View all projects <ArrowRight size={14} /></button>
      </div>
      <div className="project-table" role="table" aria-label="Active project state">
        <div className="project-head" role="row">
          <span role="columnheader">Project</span>
          <span role="columnheader">Phase</span>
          <span role="columnheader">Latest change</span>
          <span role="columnheader">Next milestone</span>
          <span role="columnheader">Blockers</span>
          <span role="columnheader">Agent / Worker</span>
        </div>
        {projects.map((project) => (
          <button
            className={`project-row ${activeProjectId === project.id ? "project-row--active" : ""}`}
            key={project.id}
            onClick={() => onSelect(project.id)}
            role="row"
          >
            <span className="project-name" role="cell"><span className={`project-icon project-icon--${project.color}`}><Stack size={15} /></span>{project.name}</span>
            <span role="cell"><StatusDot tone={project.phaseTone} />{project.phase}</span>
            <span role="cell"><strong>{project.updated}</strong><small>{project.latestChange}</small></span>
            <span role="cell"><strong>{project.milestone}</strong><small>{project.milestoneTiming}</small></span>
            <span role="cell"><StatusDot tone={project.blockerTone} />{project.blocker}</span>
            <span role="cell"><StatusDot tone={project.workerState.includes("Running") ? "healthy" : "muted"} /><strong>{project.worker}</strong><small>{project.workerState}</small></span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Schedule() {
  return (
    <section className="rail-section schedule" aria-labelledby="schedule-title">
      <div className="rail-heading">
        <h2 id="schedule-title">Today’s Schedule</h2>
        <button>View calendar <ArrowRight size={14} /></button>
      </div>
      <div className="schedule-list">
        {schedule.map((item) => (
          <div className="schedule-row" key={`${item.time}-${item.title}`}>
            <StatusDot tone={item.tone} />
            <time>{item.time}</time>
            <span><strong>{item.title}</strong>{item.detail && <small>{item.detail}</small>}<small>{item.duration}</small></span>
          </div>
        ))}
      </div>
      <p className="timezone">All times in your local timezone</p>
    </section>
  );
}

function WorkQueue({ queue, onAdvance }) {
  return (
    <section className="rail-section work-queue" aria-labelledby="queue-title">
      <div className="rail-heading">
        <h2 id="queue-title">Work Queue <span>({queue.length})</span></h2>
        <button className="queue-filter">All tasks <CaretDown size={12} /></button>
      </div>
      <div className="queue-list">
        {queue.map((item) => (
          <article className="queue-item" key={item.id}>
            <div className={`queue-icon queue-icon--${item.kind}`}>
              {item.kind === "coding" ? <Code size={18} /> : <FileText size={18} />}
            </div>
            <div className="queue-copy">
              <div className="queue-title-row"><strong>{item.title}</strong><small>{item.elapsed}</small></div>
              <p>{item.description}</p>
              <div className={`runtime-label runtime-label--${item.kind}`}><StatusDot tone={item.kind === "coding" ? "healthy" : "blue"} />{item.status}</div>
              {item.kind === "coding" && (
                <div className="phase-tracker" aria-label={`Current phase: ${codingPhases[item.phase]}`}>
                  {codingPhases.map((phase, index) => (
                    <button
                      key={phase}
                      className={index < item.phase ? "phase phase--done" : index === item.phase ? "phase phase--active" : "phase"}
                      onClick={() => index === item.phase && onAdvance(item.id)}
                      aria-label={index === item.phase ? `Advance from ${phase}` : phase}
                    >
                      <span>{index < item.phase ? <Check size={10} weight="bold" /> : null}</span>
                      <small>{phase}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function WorkingMemory() {
  return (
    <section className="rail-section working-memory" aria-labelledby="memory-title">
      <div className="rail-heading"><h2 id="memory-title">Working Memory</h2><small>Updated 10:24 AM</small></div>
      <div className="memory-list">
        {memories.map((memory) => (
          <button key={memory.title}>
            <NavIcon name={memory.icon} size={18} />
            <span><strong>{memory.title}</strong><small>{memory.detail}</small></span>
          </button>
        ))}
      </div>
    </section>
  );
}

function WorkspacePanel({ view, onClose }) {
  const detail = workspaceDetails[view];
  if (!detail) return null;
  return (
    <section className="workspace-panel" aria-labelledby="workspace-title">
      <div className="workspace-header">
        <div>
          <span className="eyebrow">{detail.eyebrow}</span>
          <h1 id="workspace-title">{detail.title}</h1>
          <p>{detail.description}</p>
        </div>
        <button onClick={onClose} aria-label="Close workspace"><X size={20} /></button>
      </div>
      <div className="workspace-content">
        {view === "projects" && <ProjectPulse activeProjectId="device-mcp" onSelect={() => {}} />}
        {view === "memory" && <WorkingMemory />}
        {view === "files" && <EmptyWorkspace icon="FileText" title="Project files stay durable" copy="Daymark will keep source documents and generated artifacts in project-scoped object storage, never inside an ephemeral sandbox." />}
        {view === "agents" && <EmptyWorkspace icon="Robot" title="Workers are policy-bound" copy="Each worker receives a scoped task, selected model route, allowed MCP tools, and an auditable approval policy." />}
        {view === "connections" && <EmptyWorkspace icon="ShareNetwork" title="Connections are explicit" copy="Register MCP servers and providers, inspect their scopes, and decide which chat or agent surfaces may use them." />}
      </div>
    </section>
  );
}

function EmptyWorkspace({ icon, title, copy }) {
  return (
    <div className="empty-workspace">
      <NavIcon name={icon} size={28} />
      <h2>{title}</h2>
      <p>{copy}</p>
      <button className="secondary-button">Review planned architecture</button>
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return <div className="toast" role="status"><Check size={16} weight="bold" />{message}</div>;
}

export function App() {
  const [activeView, setActiveView] = useState("today");
  const [beeLive, setBeeLive] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState("device-mcp");
  const [completed, setCompleted] = useState(new Set());
  const [queue, setQueue] = useState(initialQueue);
  const [toast, setToast] = useState("");

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[1],
    [activeProjectId],
  );

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  function togglePriority(id) {
    setCompleted((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function approveSuggestion() {
    const task = createCodingTask(activeProject.name);
    setQueue((current) => current.some((item) => item.title === task.title) ? current : [...current, task]);
    notify(`Planning started for ${activeProject.name}. No sandbox has been created yet.`);
  }

  function advanceTask(id) {
    setQueue((current) => current.map((item) => {
      if (item.id !== id || item.kind !== "coding") return item;
      const phase = nextCodingPhase(item.phase);
      const reachedPr = phase === codingPhases.length - 1;
      return {
        ...item,
        phase,
        status: reachedPr ? "Pull request ready — your approval required" : "Vercel Sandbox — PR approval required",
      };
    }));
  }

  function selectProject(id) {
    if (id === "all") {
      setActiveView("projects");
      return;
    }
    setActiveProjectId(id);
    notify(`${projects.find((project) => project.id === id)?.name} is now active context.`);
  }

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <main className="main-stage">
        <div className="primary-column">
          <header className="page-header">
            <div className="date-row"><span>Friday, September 18, 2026</span><blockquote>“A quieter mind builds bolder things.”</blockquote></div>
            <h1>Today’s Flight Plan</h1>
            <p>Focus on the work that moves things forward. Tell me what you’re aiming for, and I’ll take care of the rest.</p>
          </header>

          <CommandBar
            beeLive={beeLive}
            onBeeChange={(value) => { setBeeLive(value); notify(value ? "Bee live context enabled." : "Bee live context paused."); }}
            onSubmit={(value) => notify(`Daymark received: “${value}”`)}
          />

          <Suggestion
            activeProject={activeProject}
            onApprove={approveSuggestion}
            onDiscuss={() => notify(`Opening a planning conversation for ${activeProject.name}.`)}
          />

          <Priorities completed={completed} onToggle={togglePriority} />
          <ProjectPulse activeProjectId={activeProjectId} onSelect={selectProject} />
        </div>

        <aside className="context-rail" aria-label="Today’s context">
          <Schedule />
          <WorkQueue queue={queue} onAdvance={advanceTask} />
          <WorkingMemory />
        </aside>

        {activeView !== "today" && <WorkspacePanel view={activeView} onClose={() => setActiveView("today")} />}
      </main>
      <Toast message={toast} />
    </div>
  );
}
