import { enqueueCodingTask, nextCodingPhase } from "@daymark/domain";
import { getPool } from "@daymark/database/pool";
import { getTodayAggregate, recordAuditEvent } from "@daymark/database/queries/today";

export async function handleGetToday(workspaceId) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const today = await getTodayAggregate(client, workspaceId);
    if (!today) {
      return { status: 404, body: { error: "Workspace not found" } };
    }

    return { status: 200, body: today };
  } finally {
    client.release();
  }
}

export async function handleTogglePriority(workspaceId, actor, priorityId, idempotencyKey) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT id, completed FROM priorities WHERE workspace_id = $1 AND id = $2`,
      [workspaceId, priorityId],
    );

    if (existing.rowCount === 0) {
      await client.query("ROLLBACK");
      return { status: 404, body: { error: "Priority not found" } };
    }

    const completed = !existing.rows[0].completed;
    await client.query(
      `UPDATE priorities SET completed = $1 WHERE workspace_id = $2 AND id = $3`,
      [completed, workspaceId, priorityId],
    );

    await recordAuditEvent(client, {
      workspaceId,
      actorType: actor.type,
      actorId: actor.id,
      eventType: "priority.toggled",
      resourceType: "priority",
      resourceId: priorityId,
      payload: { completed },
      idempotencyKey,
    });

    await client.query("COMMIT");

    const today = await getTodayAggregate(client, workspaceId);
    return { status: 200, body: today };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function handleSetActiveProject(workspaceId, actor, projectId, idempotencyKey) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const project = await client.query(
      `SELECT id, name FROM projects WHERE workspace_id = $1 AND id = $2`,
      [workspaceId, projectId],
    );

    if (project.rowCount === 0) {
      await client.query("ROLLBACK");
      return { status: 404, body: { error: "Project not found" } };
    }

    await client.query(
      `UPDATE workspaces SET active_project_id = $1, updated_at = NOW() WHERE id = $2`,
      [projectId, workspaceId],
    );

    await recordAuditEvent(client, {
      workspaceId,
      actorType: actor.type,
      actorId: actor.id,
      eventType: "workspace.active_project_changed",
      resourceType: "project",
      resourceId: projectId,
      payload: { projectName: project.rows[0].name },
      idempotencyKey,
    });

    await client.query("COMMIT");

    const today = await getTodayAggregate(client, workspaceId);
    return { status: 200, body: today };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function handleSetBeeLive(workspaceId, actor, beeLive, idempotencyKey) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE workspaces SET bee_live = $1, updated_at = NOW() WHERE id = $2`,
      [beeLive, workspaceId],
    );

    await recordAuditEvent(client, {
      workspaceId,
      actorType: actor.type,
      actorId: actor.id,
      eventType: "workspace.bee_live_changed",
      resourceType: "workspace",
      resourceId: workspaceId,
      payload: { beeLive },
      idempotencyKey,
    });

    await client.query("COMMIT");

    const today = await getTodayAggregate(client, workspaceId);
    return { status: 200, body: today };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function handleEnqueueCodingTask(workspaceId, actor, projectName, idempotencyKey) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const today = await getTodayAggregate(client, workspaceId);
    const result = enqueueCodingTask(today.queue, projectName);

    if (!result.added) {
      return {
        status: 409,
        body: {
          error: "duplicate_active_task",
          message: `${projectName} already has an active planning task in the queue.`,
          today,
        },
      };
    }

    const task = result.task;
    const project = today.projects.find((item) => item.name === projectName);

    await client.query("BEGIN");
    await client.query(
      `INSERT INTO tasks (id, workspace_id, project_id, kind, title, description, elapsed_label, status, phase)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        task.id,
        workspaceId,
        project?.id ?? null,
        task.kind,
        task.title,
        task.description,
        task.elapsed,
        task.status,
        task.phase,
      ],
    );

    await recordAuditEvent(client, {
      workspaceId,
      actorType: actor.type,
      actorId: actor.id,
      eventType: "task.coding_enqueued",
      resourceType: "task",
      resourceId: task.id,
      payload: { projectName, title: task.title },
      idempotencyKey,
    });

    await client.query("COMMIT");

    const updated = await getTodayAggregate(client, workspaceId);
    return { status: 201, body: updated };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function handleAdvanceTask(workspaceId, actor, taskId, idempotencyKey) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const existing = await client.query(
      `SELECT id, kind, phase FROM tasks WHERE workspace_id = $1 AND id = $2`,
      [workspaceId, taskId],
    );

    if (existing.rowCount === 0) {
      return { status: 404, body: { error: "Task not found" } };
    }

    const task = existing.rows[0];
    if (task.kind !== "coding") {
      return { status: 400, body: { error: "Only coding tasks can be advanced" } };
    }

    const nextPhase = nextCodingPhase(task.phase ?? 0);
    const reachedPr = nextPhase === 4;
    const status = reachedPr
      ? "Pull request ready — your approval required"
      : "Vercel Sandbox — PR approval required";

    await client.query("BEGIN");
    await client.query(
      `UPDATE tasks SET phase = $1, status = $2, updated_at = NOW()
       WHERE workspace_id = $3 AND id = $4`,
      [nextPhase, status, workspaceId, taskId],
    );

    await recordAuditEvent(client, {
      workspaceId,
      actorType: actor.type,
      actorId: actor.id,
      eventType: "task.coding_advanced",
      resourceType: "task",
      resourceId: taskId,
      payload: { phase: nextPhase, status },
      idempotencyKey,
    });

    await client.query("COMMIT");

    const today = await getTodayAggregate(client, workspaceId);
    return { status: 200, body: today };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
