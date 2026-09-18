import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  advanceCodingTask,
  codingPhases,
  enqueueCodingTask,
  formatToday,
  toggleSetMember,
} from "./domain.js";

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
            aria-label={item.label}
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

function CommandBar({ beeLive, onBeeChange, onOpenMcp, onSubmit }) {
  const [command, setCommand] = useState("");
  const [model, setModel] = useState("Claude Sonnet 4");

  function submit(event) {
    event.preventDefault();
    const value = command.trim();
    if (!value) return;
    onSubmit({ text: value, model, beeLive });
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

      <button className="mcp-control" type="button" aria-label="3 connected MCP servers" onClick={onOpenMcp}>
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

function ProjectPulse({ activeProjectId, headingId = "project-pulse-title", onSelect, showViewAll = true }) {
  return (
    <section className="project-pulse" aria-labelledby={headingId}>
      <div className="section-heading-row">
        <div>
          <h2 id={headingId} className="section-title">Project Pulse</h2>
          <p>Key projects at a glance. Select one to ground Daymark’s next action.</p>
        </div>
        {showViewAll && <button className="text-button" onClick={() => onSelect("all")}>View all projects <ArrowRight size={14} /></button>}
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

function Schedule({ onOpenCalendar }) {
  return (
    <section className="rail-section schedule" aria-labelledby="schedule-title">
      <div className="rail-heading">
        <h2 id="schedule-title">Today’s Schedule</h2>
        <button onClick={onOpenCalendar}>View calendar <ArrowRight size={14} /></button>
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
  const [filter, setFilter] = useState("all");
  const filteredQueue = filter === "all" ? queue : queue.filter((item) => item.kind === filter);

  function cycleFilter() {
    setFilter((current) => current === "all" ? "coding" : current === "coding" ? "assistant" : "all");
  }

  return (
    <section className="rail-section work-queue" aria-labelledby="queue-title">
      <div className="rail-heading">
        <h2 id="queue-title">Work Queue <span>({queue.length})</span></h2>
        <button className="queue-filter" onClick={cycleFilter} aria-label={`Filter queue, currently ${filter}`}>
          {filter === "all" ? "All tasks" : filter === "coding" ? "Coding" : "Assistant"} <CaretDown size={12} />
        </button>
      </div>
      <div className="queue-list">
        {filteredQueue.map((item) => (
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
                  {codingPhases.map((phase, index) => {
                    const isTerminal = index === codingPhases.length - 1;
                    const isCurrent = index === item.phase;
                    return (
                      <button
                        key={phase}
                        className={index < item.phase ? "phase phase--done" : isCurrent ? `phase phase--active ${isTerminal ? "phase--terminal" : ""}` : "phase"}
                        onClick={() => isCurrent && !isTerminal && onAdvance(item.id)}
                        aria-label={isCurrent && !isTerminal ? `Advance from ${phase}` : isCurrent ? `${phase} awaiting review` : phase}
                        disabled={!isCurrent || isTerminal}
                      >
                        <span>{index < item.phase ? <Check size={10} weight="bold" /> : null}</span>
                        <small>{phase}</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function WorkingMemory({ onOpenMemory = () => {} }) {
  return (
    <section className="rail-section working-memory" aria-labelledby="memory-title">
      <div className="rail-heading"><h2 id="memory-title">Working Memory</h2><small>Updated 10:24 AM</small></div>
      <div className="memory-list">
        {memories.map((memory) => (
          <button key={memory.title} onClick={() => onOpenMemory(memory.title)}>
            <NavIcon name={memory.icon} size={18} />
            <span><strong>{memory.title}</strong><small>{memory.detail}</small></span>
          </button>
        ))}
      </div>
    </section>
  );
}

function WorkspacePanel({ activeProjectId, onAction, onClose, onSelectProject, view }) {
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
        {view === "projects" && <ProjectPulse activeProjectId={activeProjectId} headingId="workspace-project-pulse-title" onSelect={onSelectProject} showViewAll={false} />}
        {view === "memory" && <WorkingMemory onOpenMemory={(title) => onAction(`Opened ${title} memory details.`)} />}
        {view === "files" && <EmptyWorkspace icon="FileText" title="Project files stay durable" copy="Daymark will keep source documents and generated artifacts in project-scoped object storage, never inside an ephemeral sandbox." onAction={onAction} />}
        {view === "agents" && <EmptyWorkspace icon="Robot" title="Workers are policy-bound" copy="Each worker receives a scoped task, selected model route, allowed MCP tools, and an auditable approval policy." onAction={onAction} />}
        {view === "connections" && <EmptyWorkspace icon="ShareNetwork" title="Connections are explicit" copy="Register MCP servers and providers, inspect their scopes, and decide which chat or agent surfaces may use them." onAction={onAction} />}
      </div>
    </section>
  );
}

function EmptyWorkspace({ icon, title, copy, onAction }) {
  return (
    <div className="empty-workspace">
      <NavIcon name={icon} size={28} />
      <h2>{title}</h2>
      <p>{copy}</p>
      <button className="secondary-button" onClick={() => onAction(`${title} architecture plan is documented and ready for implementation.`)}>Review planned architecture</button>
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
  const toastTimer = useRef(null);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[1],
    [activeProjectId],
  );

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  function notify(message) {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => {
      setToast("");
      toastTimer.current = null;
    }, 3200);
  }

  function togglePriority(id) {
    setCompleted((current) => toggleSetMember(current, id));
  }

  function approveSuggestion() {
    const result = enqueueCodingTask(queue, activeProject.name);
    if (!result.added) {
      notify(`${activeProject.name} already has an active planning task in the queue.`);
      return;
    }
    setQueue(result.queue);
    notify(`Planning started for ${activeProject.name}. No sandbox has been created yet.`);
  }

  function advanceTask(id) {
    setQueue((current) => advanceCodingTask(current, id));
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
            <div className="date-row"><span>{formatToday()}</span><blockquote>“A quieter mind builds bolder things.”</blockquote></div>
            <h1>Today’s Flight Plan</h1>
            <p>Focus on the work that moves things forward. Tell me what you’re aiming for, and I’ll take care of the rest.</p>
          </header>

          <CommandBar
            beeLive={beeLive}
            onBeeChange={(value) => { setBeeLive(value); notify(value ? "Bee live context enabled." : "Bee live context paused."); }}
            onOpenMcp={() => { setActiveView("connections"); notify("Opened MCP connections and tool permissions."); }}
            onSubmit={({ text, model, beeLive: includedBee }) => notify(`Sent with ${model}${includedBee ? " + Bee context" : ""}: “${text}”`)}
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
          <Schedule onOpenCalendar={() => notify("Calendar details opened for today’s schedule.")} />
          <WorkQueue queue={queue} onAdvance={advanceTask} />
          <WorkingMemory onOpenMemory={(title) => { setActiveView("memory"); notify(`Opened ${title} memory details.`); }} />
        </aside>

        {activeView !== "today" && (
          <WorkspacePanel
            activeProjectId={activeProjectId}
            onAction={notify}
            onClose={() => setActiveView("today")}
            onSelectProject={selectProject}
            view={activeView}
          />
        )}
      </main>
      <Toast message={toast} />
    </div>
  );
}
