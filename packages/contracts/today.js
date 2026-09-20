const projectShape = {
  id: "string",
  name: "string",
  phase: "string",
  phaseTone: "string",
  updated: "string",
  latestChange: "string",
  milestone: "string",
  milestoneTiming: "string",
  blocker: "string",
  blockerTone: "string",
  worker: "string",
  workerState: "string",
  color: "string",
  version: "number",
};

const priorityShape = {
  id: "string",
  group: "string",
  time: "string",
  title: "string",
  detail: "string",
  project: "string|null",
  tone: "string",
  completed: "boolean",
};

const scheduleShape = {
  time: "string",
  title: "string",
  detail: "string|undefined",
  duration: "string",
  tone: "string",
};

const queueItemShape = {
  id: "string",
  kind: "string",
  title: "string",
  description: "string",
  elapsed: "string",
  status: "string",
  phase: "number|undefined",
};

const memoryShape = {
  icon: "string",
  title: "string",
  detail: "string",
};

function assertType(value, expected, path) {
  if (expected === "string|null") {
    if (value !== null && typeof value !== "string") {
      throw new Error(`${path} must be a string or null`);
    }
    return;
  }

  if (expected === "string|undefined") {
    if (value !== undefined && typeof value !== "string") {
      throw new Error(`${path} must be a string or undefined`);
    }
    return;
  }

  if (expected === "number|undefined") {
    if (value !== undefined && typeof value !== "number") {
      throw new Error(`${path} must be a number or undefined`);
    }
    return;
  }

  if (expected.endsWith("|undefined")) {
    const base = expected.replace("|undefined", "");
    if (value !== undefined && typeof value !== base) {
      throw new Error(`${path} must be a ${base} or undefined`);
    }
    return;
  }

  if (typeof value !== expected) {
    throw new Error(`${path} must be a ${expected}`);
  }
}

function assertObject(value, shape, path = "response") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }

  for (const [key, type] of Object.entries(shape)) {
    assertType(value[key], type, `${path}.${key}`);
  }
}

function assertArray(value, shape, path) {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }

  for (const [index, item] of value.entries()) {
    assertObject(item, shape, `${path}[${index}]`);
  }
}

export function validateTodayResponse(response) {
  assertObject(response, {
    workspace: "object",
    activeProjectId: "string",
    beeLive: "boolean",
    projects: "object",
    priorities: "object",
    schedule: "object",
    queue: "object",
    memories: "object",
    workingMemoryUpdatedAt: "string",
  });

  assertObject(response.workspace, {
    id: "string",
    name: "string",
    userDisplayName: "string",
    userInitials: "string",
    timezone: "string",
  }, "response.workspace");

  assertArray(response.projects, projectShape, "response.projects");
  assertArray(response.priorities, priorityShape, "response.priorities");
  assertArray(response.schedule, scheduleShape, "response.schedule");
  assertArray(response.queue, queueItemShape, "response.queue");
  assertArray(response.memories, memoryShape, "response.memories");

  return response;
}

export const todayResponseShape = {
  workspace: ["id", "name", "userDisplayName", "userInitials", "timezone"],
  projects: Object.keys(projectShape),
  priorities: Object.keys(priorityShape),
  schedule: Object.keys(scheduleShape),
  queue: Object.keys(queueItemShape),
  memories: Object.keys(memoryShape),
};
