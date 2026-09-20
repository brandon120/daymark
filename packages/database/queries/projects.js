export function mapProjectRow(row, { includeSortOrder = false } = {}) {
  const project = {
    id: row.id,
    name: row.name,
    phase: row.phase,
    phaseTone: row.phase_tone,
    updated: row.updated_label,
    latestChange: row.latest_change,
    milestone: row.milestone,
    milestoneTiming: row.milestone_timing,
    blocker: row.blocker,
    blockerTone: row.blocker_tone,
    worker: row.worker,
    workerState: row.worker_state,
    color: row.color,
    version: row.version,
  };

  if (includeSortOrder) {
    project.sortOrder = row.sort_order;
  }

  return project;
}

export async function listProjects(client, workspaceId) {
  const result = await client.query(
    `SELECT id, name, phase, phase_tone, updated_label, latest_change, milestone,
            milestone_timing, blocker, blocker_tone, worker, worker_state, color,
            sort_order, version
     FROM projects
     WHERE workspace_id = $1 AND archived_at IS NULL
     ORDER BY sort_order ASC, name ASC`,
    [workspaceId],
  );

  return result.rows.map((row) => mapProjectRow(row, { includeSortOrder: true }));
}

export async function getProjectById(client, workspaceId, projectId) {
  const result = await client.query(
    `SELECT id, name, phase, phase_tone, updated_label, latest_change, milestone,
            milestone_timing, blocker, blocker_tone, worker, worker_state, color,
            sort_order, version
     FROM projects
     WHERE workspace_id = $1 AND id = $2 AND archived_at IS NULL`,
    [workspaceId, projectId],
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapProjectRow(result.rows[0], { includeSortOrder: true });
}

export async function getNextProjectSortOrder(client, workspaceId) {
  const result = await client.query(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort
     FROM projects
     WHERE workspace_id = $1`,
    [workspaceId],
  );

  return result.rows[0].next_sort;
}

export async function insertProject(client, workspaceId, project) {
  await client.query(
    `INSERT INTO projects (
      id, workspace_id, name, phase, phase_tone, updated_label, latest_change,
      milestone, milestone_timing, blocker, blocker_tone, worker, worker_state,
      color, sort_order, version
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      project.id,
      workspaceId,
      project.name,
      project.phase,
      project.phaseTone,
      project.updatedLabel,
      project.latestChange,
      project.milestone,
      project.milestoneTiming,
      project.blocker,
      project.blockerTone,
      project.worker,
      project.workerState,
      project.color,
      project.sortOrder,
      project.version,
    ],
  );
}

export async function updateProject(client, workspaceId, projectId, expectedVersion, patch) {
  const columns = [];
  const values = [];
  let index = 1;

  const fieldMap = {
    name: "name",
    phase: "phase",
    phaseTone: "phase_tone",
    latestChange: "latest_change",
    milestone: "milestone",
    milestoneTiming: "milestone_timing",
    blocker: "blocker",
    blockerTone: "blocker_tone",
    worker: "worker",
    workerState: "worker_state",
    color: "color",
    sortOrder: "sort_order",
  };

  for (const [patchKey, column] of Object.entries(fieldMap)) {
    if (patch[patchKey] === undefined) continue;
    columns.push(`${column} = $${index++}`);
    values.push(patch[patchKey]);
  }

  if (patch.latestChange !== undefined) {
    columns.push(`updated_label = $${index++}`);
    values.push("just now");
  }

  columns.push(`version = version + 1`);
  columns.push(`updated_at = NOW()`);

  values.push(workspaceId, projectId, expectedVersion);

  const result = await client.query(
    `UPDATE projects
     SET ${columns.join(", ")}
     WHERE workspace_id = $${index++}
       AND id = $${index++}
       AND version = $${index}
       AND archived_at IS NULL
     RETURNING id, name, phase, phase_tone, updated_label, latest_change, milestone,
               milestone_timing, blocker, blocker_tone, worker, worker_state, color,
               sort_order, version`,
    values,
  );

  return result;
}

export async function archiveProject(client, workspaceId, projectId) {
  const result = await client.query(
    `UPDATE projects
     SET archived_at = NOW(), updated_at = NOW()
     WHERE workspace_id = $1 AND id = $2 AND archived_at IS NULL
     RETURNING id`,
    [workspaceId, projectId],
  );

  return result.rowCount > 0;
}

export async function reassignActiveProjectIfNeeded(client, workspaceId, archivedProjectId) {
  const workspace = await client.query(
    `SELECT active_project_id FROM workspaces WHERE id = $1`,
    [workspaceId],
  );

  if (workspace.rowCount === 0 || workspace.rows[0].active_project_id !== archivedProjectId) {
    return null;
  }

  const replacement = await client.query(
    `SELECT id FROM projects
     WHERE workspace_id = $1 AND archived_at IS NULL
     ORDER BY sort_order ASC, name ASC
     LIMIT 1`,
    [workspaceId],
  );

  const nextActiveProjectId = replacement.rows[0]?.id ?? null;

  await client.query(
    `UPDATE workspaces
     SET active_project_id = $1, updated_at = NOW()
     WHERE id = $2`,
    [nextActiveProjectId, workspaceId],
  );

  return nextActiveProjectId;
}
