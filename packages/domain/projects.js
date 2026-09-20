export const projectColors = ["amber", "blue", "teal", "slate", "muted"];

export const projectPhaseTones = new Set(["healthy", "active", "neutral", "danger", "muted"]);
export const projectBlockerTones = new Set(["healthy", "active", "neutral", "danger", "muted"]);

export function slugifyProjectId(name) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return slug || "project";
}

export function createProjectDefaults(name, sortOrder = 0, now = new Date()) {
  const trimmed = name.trim();

  return {
    id: slugifyProjectId(trimmed),
    name: trimmed,
    phase: "Planning",
    phaseTone: "neutral",
    updatedLabel: "just now",
    latestChange: "Project created",
    milestone: "Define scope",
    milestoneTiming: "not set",
    blocker: "None",
    blockerTone: "healthy",
    worker: "Unassigned",
    workerState: "Idle",
    color: projectColors[sortOrder % projectColors.length],
    sortOrder,
    version: 1,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

const patchableFields = {
  name: "name",
  phase: "phase",
  phaseTone: "phaseTone",
  latestChange: "latestChange",
  milestone: "milestone",
  milestoneTiming: "milestoneTiming",
  blocker: "blocker",
  blockerTone: "blockerTone",
  worker: "worker",
  workerState: "workerState",
  color: "color",
  sortOrder: "sortOrder",
};

export function extractProjectPatch(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be an object" };
  }

  if (typeof body.version !== "number" || !Number.isInteger(body.version) || body.version < 1) {
    return { error: "version must be a positive integer" };
  }

  const patch = { version: body.version };

  for (const [inputKey, patchKey] of Object.entries(patchableFields)) {
    if (body[inputKey] === undefined) continue;

    const value = body[inputKey];
    if (inputKey === "sortOrder") {
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        return { error: "sortOrder must be a non-negative integer" };
      }
      patch[patchKey] = value;
      continue;
    }

    if (typeof value !== "string" || value.trim().length === 0) {
      return { error: `${inputKey} must be a non-empty string` };
    }

    patch[patchKey] = value.trim();
  }

  if (Object.keys(patch).length === 1) {
    return { error: "At least one project field must be provided" };
  }

  if (patch.phaseTone && !projectPhaseTones.has(patch.phaseTone)) {
    return { error: "phaseTone is invalid" };
  }

  if (patch.blockerTone && !projectBlockerTones.has(patch.blockerTone)) {
    return { error: "blockerTone is invalid" };
  }

  if (patch.color && !projectColors.includes(patch.color)) {
    return { error: "color is invalid" };
  }

  return { patch };
}

export function validateCreateProjectInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be an object" };
  }

  if (typeof body.name !== "string" || body.name.trim().length === 0) {
    return { error: "name is required" };
  }

  if (body.name.trim().length > 120) {
    return { error: "name must be 120 characters or fewer" };
  }

  const input = { name: body.name.trim() };

  if (body.id !== undefined) {
    if (typeof body.id !== "string" || body.id.trim().length === 0) {
      return { error: "id must be a non-empty string" };
    }
    input.id = slugifyProjectId(body.id);
  }

  for (const [inputKey, patchKey] of Object.entries(patchableFields)) {
    if (body[inputKey] === undefined || inputKey === "name") continue;

    const value = body[inputKey];
    if (inputKey === "sortOrder") {
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        return { error: "sortOrder must be a non-negative integer" };
      }
      input[patchKey] = value;
      continue;
    }

    if (typeof value !== "string" || value.trim().length === 0) {
      return { error: `${inputKey} must be a non-empty string` };
    }

    input[patchKey] = value.trim();
  }

  return { input };
}
