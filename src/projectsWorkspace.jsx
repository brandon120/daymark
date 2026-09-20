import { useMemo, useState } from "react";
import { ArrowRight, Stack, Trash } from "@phosphor-icons/react";
import { projectColors } from "./domain.js";

const emptyDraft = {
  name: "",
  phase: "Planning",
  latestChange: "",
  milestone: "Define scope",
  milestoneTiming: "not set",
  blocker: "None",
  worker: "Unassigned",
  color: "blue",
};

function StatusDot({ tone = "muted" }) {
  return <span className={`status-dot status-dot--${tone}`} aria-hidden="true" />;
}

function ProjectForm({ draft, mode, onChange, onSubmit, onCancel, submitting, errorMessage }) {
  return (
    <form className="project-form" onSubmit={onSubmit}>
      <div className="project-form-grid">
        <label>
          <span>Name</span>
          <input
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
            placeholder="Project name"
            required
          />
        </label>
        <label>
          <span>Phase</span>
          <input
            value={draft.phase}
            onChange={(event) => onChange({ ...draft, phase: event.target.value })}
            placeholder="Planning"
          />
        </label>
        <label>
          <span>Latest change</span>
          <input
            value={draft.latestChange}
            onChange={(event) => onChange({ ...draft, latestChange: event.target.value })}
            placeholder="What changed most recently?"
          />
        </label>
        <label>
          <span>Next milestone</span>
          <input
            value={draft.milestone}
            onChange={(event) => onChange({ ...draft, milestone: event.target.value })}
            placeholder="Define scope"
          />
        </label>
        <label>
          <span>Milestone timing</span>
          <input
            value={draft.milestoneTiming}
            onChange={(event) => onChange({ ...draft, milestoneTiming: event.target.value })}
            placeholder="in 1 week"
          />
        </label>
        <label>
          <span>Blocker</span>
          <input
            value={draft.blocker}
            onChange={(event) => onChange({ ...draft, blocker: event.target.value })}
            placeholder="None"
          />
        </label>
        <label>
          <span>Worker</span>
          <input
            value={draft.worker}
            onChange={(event) => onChange({ ...draft, worker: event.target.value })}
            placeholder="Unassigned"
          />
        </label>
        <label>
          <span>Color</span>
          <select
            value={draft.color}
            onChange={(event) => onChange({ ...draft, color: event.target.value })}
          >
            {projectColors.map((color) => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </label>
      </div>

      {errorMessage && <p className="project-form-error">{errorMessage}</p>}

      <div className="project-form-actions">
        <button className="secondary-button" type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button className="primary-button" type="submit" disabled={submitting || !draft.name.trim()}>
          {submitting ? "Saving…" : mode === "create" ? "Create project" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export function ProjectsWorkspace({
  activeProjectId,
  onArchive,
  onCreate,
  onSelectProject,
  onUpdate,
  projects,
}) {
  const [mode, setMode] = useState("list");
  const [selectedId, setSelectedId] = useState(activeProjectId ?? projects[0]?.id ?? null);
  const [draft, setDraft] = useState(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? null,
    [projects, selectedId],
  );

  function openCreate() {
    setMode("create");
    setDraft({
      ...emptyDraft,
      color: projectColors[projects.length % projectColors.length],
    });
    setErrorMessage("");
  }

  function openEdit(project) {
    setSelectedId(project.id);
    setMode("edit");
    setDraft({
      name: project.name,
      phase: project.phase,
      latestChange: project.latestChange,
      milestone: project.milestone,
      milestoneTiming: project.milestoneTiming,
      blocker: project.blocker,
      worker: project.worker,
      color: project.color,
    });
    setErrorMessage("");
  }

  async function submitCreate(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      await onCreate({
        name: draft.name.trim(),
        phase: draft.phase.trim(),
        latestChange: draft.latestChange.trim() || undefined,
        milestone: draft.milestone.trim(),
        milestoneTiming: draft.milestoneTiming.trim(),
        blocker: draft.blocker.trim(),
        worker: draft.worker.trim(),
        color: draft.color,
      });
      setMode("list");
      setDraft(emptyDraft);
    } catch (error) {
      setErrorMessage(error.body?.message ?? error.message ?? "Could not create project.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!selectedProject) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      await onUpdate(selectedProject.id, {
        version: selectedProject.version,
        name: draft.name.trim(),
        phase: draft.phase.trim(),
        latestChange: draft.latestChange.trim() || undefined,
        milestone: draft.milestone.trim(),
        milestoneTiming: draft.milestoneTiming.trim(),
        blocker: draft.blocker.trim(),
        worker: draft.worker.trim(),
        color: draft.color,
      });
      setMode("list");
    } catch (error) {
      if (error.body?.project) {
        openEdit(error.body.project);
      }
      setErrorMessage(error.body?.message ?? error.message ?? "Could not save project.");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmArchive() {
    if (!selectedProject) return;
    if (!window.confirm(`Archive ${selectedProject.name}? It will disappear from Today and the portfolio.`)) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      await onArchive(selectedProject.id);
      setMode("list");
      setSelectedId(projects.find((project) => project.id !== selectedProject.id)?.id ?? null);
    } catch (error) {
      setErrorMessage(error.body?.message ?? error.message ?? "Could not archive project.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="projects-workspace">
      <div className="projects-toolbar">
        <div>
          <h2 className="section-title">Portfolio</h2>
          <p>Create, edit, and archive projects without leaving the control plane.</p>
        </div>
        <button className="primary-button" type="button" onClick={openCreate}>
          New project
        </button>
      </div>

      {mode === "create" && (
        <section className="project-editor" aria-labelledby="create-project-title">
          <h3 id="create-project-title">Create project</h3>
          <ProjectForm
            draft={draft}
            mode="create"
            onChange={setDraft}
            onSubmit={submitCreate}
            onCancel={() => setMode("list")}
            submitting={submitting}
            errorMessage={errorMessage}
          />
        </section>
      )}

      {mode === "edit" && selectedProject && (
        <section className="project-editor" aria-labelledby="edit-project-title">
          <div className="project-editor-header">
            <h3 id="edit-project-title">Edit {selectedProject.name}</h3>
            <button className="danger-button" type="button" onClick={confirmArchive} disabled={submitting}>
              <Trash size={15} />
              Archive
            </button>
          </div>
          <ProjectForm
            draft={draft}
            mode="edit"
            onChange={setDraft}
            onSubmit={submitEdit}
            onCancel={() => setMode("list")}
            submitting={submitting}
            errorMessage={errorMessage}
          />
        </section>
      )}

      <div className="project-table" role="table" aria-label="Project portfolio">
        <div className="project-head" role="row">
          <span role="columnheader">Project</span>
          <span role="columnheader">Phase</span>
          <span role="columnheader">Latest change</span>
          <span role="columnheader">Next milestone</span>
          <span role="columnheader">Blockers</span>
          <span role="columnheader">Agent / Worker</span>
          <span role="columnheader">Actions</span>
        </div>
        {projects.map((project) => (
          <div
            className={`project-row project-row--static ${activeProjectId === project.id ? "project-row--active" : ""}`}
            key={project.id}
            role="row"
          >
            <span className="project-name" role="cell">
              <span className={`project-icon project-icon--${project.color}`}><Stack size={15} /></span>
              {project.name}
            </span>
            <span role="cell"><StatusDot tone={project.phaseTone} />{project.phase}</span>
            <span role="cell"><strong>{project.updated}</strong><small>{project.latestChange}</small></span>
            <span role="cell"><strong>{project.milestone}</strong><small>{project.milestoneTiming}</small></span>
            <span role="cell"><StatusDot tone={project.blockerTone} />{project.blocker}</span>
            <span role="cell"><StatusDot tone={project.workerState.includes("Running") ? "healthy" : "muted"} /><strong>{project.worker}</strong><small>{project.workerState}</small></span>
            <span className="project-row-actions" role="cell">
              <button className="text-button" type="button" onClick={() => onSelectProject(project.id)}>
                Set active
              </button>
              <button className="text-button" type="button" onClick={() => openEdit(project)}>
                Edit <ArrowRight size={14} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
