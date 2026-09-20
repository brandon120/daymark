import assert from "node:assert/strict";
import test from "node:test";
import {
  validateProjectListResponse,
  validateProjectResponse,
} from "@daymark/contracts/projects";

const sampleProject = {
  id: "device-mcp",
  name: "Device MCP",
  phase: "Design",
  phaseTone: "active",
  updated: "1 day ago",
  latestChange: "Finalized MCP schema for device telemetry",
  milestone: "MVP integration",
  milestoneTiming: "in 1 week",
  blocker: "1 blocker",
  blockerTone: "danger",
  worker: "Claude",
  workerState: "Idle",
  color: "blue",
  version: 3,
};

test("project response contract accepts a valid project", () => {
  const project = validateProjectResponse(sampleProject);
  assert.equal(project.version, 3);
});

test("project list response contract requires sortOrder", () => {
  validateProjectListResponse({
    projects: [{ ...sampleProject, sortOrder: 1 }],
  });

  assert.throws(
    () => validateProjectListResponse({ projects: [sampleProject] }),
    /response\.projects\[0\]\.sortOrder must be a number/,
  );
});
