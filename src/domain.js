export const codingPhases = ["Plan", "Sandbox", "Implement", "Test", "PR"];

export function nextCodingPhase(phase) {
  return Math.min(phase + 1, codingPhases.length - 1);
}

export function taskExecutionBoundary(kind) {
  return kind === "coding"
    ? { runtime: "vercel-sandbox", approval: "pull-request" }
    : { runtime: "control-plane", approval: "policy" };
}

export function createCodingTask(projectName, now = Date.now()) {
  return {
    id: `${projectName.toLowerCase().replaceAll(" ", "-")}-${now}`,
    kind: "coding",
    title: `Advance ${projectName}`,
    description: "Preparing a scoped implementation plan before creating an isolated workspace.",
    elapsed: "just now",
    status: "Awaiting plan approval — no sandbox started",
    phase: 0,
  };
}

export function toggleSetMember(current, id) {
  const next = new Set(current);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
}

export function enqueueCodingTask(queue, projectName, now = Date.now()) {
  const task = createCodingTask(projectName, now);
  const existing = queue.find((item) => item.title === task.title);

  if (existing) {
    return { queue, task: existing, added: false };
  }

  return { queue: [...queue, task], task, added: true };
}

export function advanceCodingTask(queue, id) {
  return queue.map((item) => {
    if (item.id !== id || item.kind !== "coding") return item;

    const phase = nextCodingPhase(item.phase);
    const reachedPr = phase === codingPhases.length - 1;

    return {
      ...item,
      phase,
      status: reachedPr
        ? "Pull request ready — your approval required"
        : "Vercel Sandbox — PR approval required",
    };
  });
}

export function formatToday(date = new Date(), locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
