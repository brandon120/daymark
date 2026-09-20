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

const projectListShape = {
  ...projectShape,
  sortOrder: "number",
};

function assertType(value, expected, path) {
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

export function validateProjectResponse(project) {
  assertObject(project, projectShape, "project");
  return project;
}

export function validateProjectListResponse(response) {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    throw new Error("response must be an object");
  }

  assertArray(response.projects, projectListShape, "response.projects");
  return response;
}

export const projectResponseShape = Object.keys(projectShape);
export const projectListResponseShape = Object.keys(projectListShape);
