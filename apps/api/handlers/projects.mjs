import {
  createProjectDefaults,
  extractProjectPatch,
  validateCreateProjectInput,
} from "@daymark/domain";
import { findIdempotentResponse, storeIdempotentResponse } from "@daymark/database/queries/idempotency.js";
import { getPool } from "@daymark/database/pool";
import {
  archiveProject,
  getNextProjectSortOrder,
  getProjectById,
  insertProject,
  listProjects,
  reassignActiveProjectIfNeeded,
  updateProject,
} from "@daymark/database/queries/projects.js";
import { getTodayAggregate, recordAuditEvent } from "@daymark/database/queries/today";

function isUniqueViolation(error) {
  return error?.code === "23505";
}

async function finishMutation(client, workspaceId, idempotencyKey, status, body) {
  await storeIdempotentResponse(client, workspaceId, idempotencyKey, status, body);
  return { status, body };
}

async function replayOrContinue(client, workspaceId, idempotencyKey) {
  const replay = await findIdempotentResponse(client, workspaceId, idempotencyKey);
  if (replay) {
    return { replay: true, result: replay };
  }
  return { replay: false };
}

export async function handleListProjects(workspaceId) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const projects = await listProjects(client, workspaceId);
    return { status: 200, body: { projects } };
  } finally {
    client.release();
  }
}

export async function handleGetProject(workspaceId, projectId) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const project = await getProjectById(client, workspaceId, projectId);
    if (!project) {
      return { status: 404, body: { error: "Project not found" } };
    }

    return { status: 200, body: { project } };
  } finally {
    client.release();
  }
}

export async function handleCreateProject(workspaceId, actor, input, idempotencyKey) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cached = await replayOrContinue(client, workspaceId, idempotencyKey);
    if (cached.replay) {
      await client.query("COMMIT");
      return cached.result;
    }

    const sortOrder = input.sortOrder ?? await getNextProjectSortOrder(client, workspaceId);
    const defaults = createProjectDefaults(input.name, sortOrder);
    const project = {
      ...defaults,
      ...(input.id ? { id: input.id } : {}),
      ...(input.phase ? { phase: input.phase } : {}),
      ...(input.phaseTone ? { phaseTone: input.phaseTone } : {}),
      ...(input.latestChange ? { latestChange: input.latestChange } : {}),
      ...(input.milestone ? { milestone: input.milestone } : {}),
      ...(input.milestoneTiming ? { milestoneTiming: input.milestoneTiming } : {}),
      ...(input.blocker ? { blocker: input.blocker } : {}),
      ...(input.blockerTone ? { blockerTone: input.blockerTone } : {}),
      ...(input.worker ? { worker: input.worker } : {}),
      ...(input.workerState ? { workerState: input.workerState } : {}),
      ...(input.color ? { color: input.color } : {}),
      sortOrder,
    };

    try {
      await insertProject(client, workspaceId, project);
    } catch (error) {
      if (isUniqueViolation(error)) {
        await client.query("ROLLBACK");
        return { status: 409, body: { error: "Project already exists" } };
      }
      throw error;
    }

    await recordAuditEvent(client, {
      workspaceId,
      actorType: actor.type,
      actorId: actor.id,
      eventType: "project.created",
      resourceType: "project",
      resourceId: project.id,
      payload: { name: project.name },
      idempotencyKey,
    });

    const today = await getTodayAggregate(client, workspaceId);
    const result = await finishMutation(client, workspaceId, idempotencyKey, 201, today);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function handleUpdateProject(workspaceId, actor, projectId, body, idempotencyKey) {
  const parsed = extractProjectPatch(body);
  if (parsed.error) {
    return { status: 400, body: { error: parsed.error } };
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cached = await replayOrContinue(client, workspaceId, idempotencyKey);
    if (cached.replay) {
      await client.query("COMMIT");
      return cached.result;
    }

    const current = await getProjectById(client, workspaceId, projectId);
    if (!current) {
      await client.query("ROLLBACK");
      return { status: 404, body: { error: "Project not found" } };
    }

    if (current.version !== parsed.patch.version) {
      await client.query("ROLLBACK");
      return {
        status: 409,
        body: {
          error: "version_conflict",
          message: "Project was updated elsewhere. Reload and try again.",
          project: current,
        },
      };
    }

    const { version, ...patch } = parsed.patch;

    const updated = await updateProject(client, workspaceId, projectId, version, patch);

    if (updated.rowCount === 0) {
      const latest = await getProjectById(client, workspaceId, projectId);
      await client.query("ROLLBACK");
      return {
        status: 409,
        body: {
          error: "version_conflict",
          message: "Project was updated elsewhere. Reload and try again.",
          project: latest,
        },
      };
    }

    await recordAuditEvent(client, {
      workspaceId,
      actorType: actor.type,
      actorId: actor.id,
      eventType: "project.updated",
      resourceType: "project",
      resourceId: projectId,
      payload: { fields: Object.keys(patch) },
      idempotencyKey,
    });

    const today = await getTodayAggregate(client, workspaceId);
    const result = await finishMutation(client, workspaceId, idempotencyKey, 200, today);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function handleArchiveProject(workspaceId, actor, projectId, idempotencyKey) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cached = await replayOrContinue(client, workspaceId, idempotencyKey);
    if (cached.replay) {
      await client.query("COMMIT");
      return cached.result;
    }

    const archived = await archiveProject(client, workspaceId, projectId);
    if (!archived) {
      await client.query("ROLLBACK");
      return { status: 404, body: { error: "Project not found" } };
    }

    await reassignActiveProjectIfNeeded(client, workspaceId, projectId);

    await recordAuditEvent(client, {
      workspaceId,
      actorType: actor.type,
      actorId: actor.id,
      eventType: "project.archived",
      resourceType: "project",
      resourceId: projectId,
      payload: {},
      idempotencyKey,
    });

    const today = await getTodayAggregate(client, workspaceId);
    const result = await finishMutation(client, workspaceId, idempotencyKey, 200, today);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function parseCreateProjectInput(body) {
  return validateCreateProjectInput(body);
}
