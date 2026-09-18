export const codingPhases = ["Plan", "Sandbox", "Implement", "Test", "PR"];

export function nextCodingPhase(phase) {
  return Math.min(phase + 1, codingPhases.length - 1);
}

export function taskExecutionBoundary(kind) {
  return kind === "coding"
    ? { runtime: "vercel-sandbox", approval: "pull-request" }
    : { runtime: "control-plane", approval: "policy" };
}

export function createCodingTask(projectName) {
  return {
    id: `${projectName.toLowerCase().replaceAll(" ", "-")}-${Date.now()}`,
    kind: "coding",
    title: `Advance ${projectName}`,
    description: "Preparing a scoped implementation plan before creating an isolated workspace.",
    elapsed: "just now",
    status: "Awaiting plan approval — no sandbox started",
    phase: 0,
  };
}
