export async function getTodayAggregate(client, workspaceId) {
  const workspaceResult = await client.query(
    `SELECT w.id, w.name, w.timezone, w.bee_live, w.active_project_id,
            u.display_name, u.initials
     FROM workspaces w
     JOIN users u ON u.id = w.owner_user_id
     WHERE w.id = $1`,
    [workspaceId],
  );

  if (workspaceResult.rowCount === 0) {
    return null;
  }

  const workspace = workspaceResult.rows[0];

  const [projects, priorities, schedule, queue, memories] = await Promise.all([
    client.query(
      `SELECT id, name, phase, phase_tone, updated_label, latest_change, milestone,
              milestone_timing, blocker, blocker_tone, worker, worker_state, color, version
       FROM projects
       WHERE workspace_id = $1 AND archived_at IS NULL
       ORDER BY sort_order ASC, name ASC`,
      [workspaceId],
    ),
    client.query(
      `SELECT id, group_name, time_label, title, detail, project_name, tone, completed
       FROM priorities
       WHERE workspace_id = $1
       ORDER BY sort_order ASC`,
      [workspaceId],
    ),
    client.query(
      `SELECT time_label, title, detail, duration, tone
       FROM schedule_items
       WHERE workspace_id = $1
       ORDER BY sort_order ASC`,
      [workspaceId],
    ),
    client.query(
      `SELECT id, kind, title, description, elapsed_label, status, phase
       FROM tasks
       WHERE workspace_id = $1
       ORDER BY created_at ASC`,
      [workspaceId],
    ),
    client.query(
      `SELECT icon, title, detail, updated_at
       FROM working_memories
       WHERE workspace_id = $1
       ORDER BY sort_order ASC`,
      [workspaceId],
    ),
  ]);

  const workingMemoryUpdatedAt = memories.rows.reduce((latest, row) => {
    const value = new Date(row.updated_at).toISOString();
    return !latest || value > latest ? value : latest;
  }, null);

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      userDisplayName: workspace.display_name,
      userInitials: workspace.initials,
      timezone: workspace.timezone,
    },
    activeProjectId: workspace.active_project_id,
    beeLive: workspace.bee_live,
    projects: projects.rows.map((row) => ({
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
    })),
    priorities: priorities.rows.map((row) => ({
      id: row.id,
      group: row.group_name,
      time: row.time_label,
      title: row.title,
      detail: row.detail,
      project: row.project_name,
      tone: row.tone,
      completed: row.completed,
    })),
    schedule: schedule.rows.map((row) => ({
      time: row.time_label,
      title: row.title,
      detail: row.detail ?? undefined,
      duration: row.duration,
      tone: row.tone,
    })),
    queue: queue.rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      description: row.description,
      elapsed: row.elapsed_label,
      status: row.status,
      phase: row.phase ?? undefined,
    })),
    memories: memories.rows.map((row) => ({
      icon: row.icon,
      title: row.title,
      detail: row.detail,
    })),
    workingMemoryUpdatedAt: workingMemoryUpdatedAt ?? new Date().toISOString(),
  };
}

export async function recordAuditEvent(client, {
  workspaceId,
  actorType,
  actorId,
  eventType,
  resourceType,
  resourceId,
  payload = {},
  idempotencyKey = null,
}) {
  if (idempotencyKey) {
    const existing = await client.query(
      `SELECT id FROM audit_events
       WHERE workspace_id = $1 AND idempotency_key = $2`,
      [workspaceId, idempotencyKey],
    );

    if (existing.rowCount > 0) {
      return;
    }
  }

  await client.query(
    `INSERT INTO audit_events (
      workspace_id, actor_type, actor_id, event_type, resource_type, resource_id, payload, idempotency_key
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [workspaceId, actorType, actorId, eventType, resourceType, resourceId, payload, idempotencyKey],
  );
}
