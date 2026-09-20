import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
import { validateProjectListResponse } from "@daymark/contracts/projects";
import { validateTodayResponse } from "@daymark/contracts/today";

const databaseUrl = process.env.DATABASE_URL;
const runIntegration = process.env.DAYMARK_RUN_INTEGRATION === "1" && databaseUrl;

test("GET /v1/today returns seeded workspace data", { skip: !runIntegration }, async () => {
  const token = process.env.DAYMARK_API_TOKEN ?? process.env.DAYMARK_DEV_TOKEN;
  assert.ok(token, "DAYMARK_API_TOKEN or DAYMARK_DEV_TOKEN is required");

  const child = spawn("node", ["apps/api/index.mjs"], {
    cwd: new URL("..", import.meta.url).pathname,
    env: {
      ...process.env,
      PORT: "3011",
      DATABASE_URL: databaseUrl,
      DAYMARK_API_TOKEN: token,
      DAYMARK_WORKSPACE_ID: process.env.DAYMARK_WORKSPACE_ID ?? "00000000-0000-4000-8000-000000000001",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  await once(child.stdout, "data");

  try {
    const response = await fetch("http://127.0.0.1:3011/v1/today", {
      headers: { authorization: `Bearer ${token}` },
    });

    assert.equal(response.status, 200);
    const body = validateTodayResponse(await response.json());
    assert.equal(body.activeProjectId, "device-mcp");
    assert.ok(body.projects.some((project) => project.id === "device-mcp"));
  } finally {
    child.kill("SIGTERM");
    await once(child, "exit");
  }
});

test("project CRUD supports optimistic versioning", { skip: !runIntegration }, async () => {
  const token = process.env.DAYMARK_API_TOKEN ?? process.env.DAYMARK_DEV_TOKEN;
  assert.ok(token, "DAYMARK_API_TOKEN or DAYMARK_DEV_TOKEN is required");

  const child = spawn("node", ["apps/api/index.mjs"], {
    cwd: new URL("..", import.meta.url).pathname,
    env: {
      ...process.env,
      PORT: "3012",
      DATABASE_URL: databaseUrl,
      DAYMARK_API_TOKEN: token,
      DAYMARK_WORKSPACE_ID: process.env.DAYMARK_WORKSPACE_ID ?? "00000000-0000-4000-8000-000000000001",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  await once(child.stdout, "data");

  const headers = {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };

  try {
    const createResponse = await fetch("http://127.0.0.1:3012/v1/projects", {
      method: "POST",
      headers: { ...headers, "idempotency-key": "integration-create-project" },
      body: JSON.stringify({ name: "Integration Test Project" }),
    });

    assert.equal(createResponse.status, 201);
    const createdToday = validateTodayResponse(await createResponse.json());
    const createdProject = createdToday.projects.find((project) => project.id === "integration-test-project");
    assert.ok(createdProject);
    assert.equal(createdProject.version, 1);

    const listResponse = await fetch("http://127.0.0.1:3012/v1/projects", { headers });
    const listed = validateProjectListResponse(await listResponse.json());
    assert.ok(listed.projects.some((project) => project.id === "integration-test-project"));

    const staleUpdate = await fetch("http://127.0.0.1:3012/v1/projects/integration-test-project", {
      method: "PATCH",
      headers: { ...headers, "idempotency-key": "integration-stale-update" },
      body: JSON.stringify({ version: 99, milestone: "Should fail" }),
    });
    assert.equal(staleUpdate.status, 409);

    const updateResponse = await fetch("http://127.0.0.1:3012/v1/projects/integration-test-project", {
      method: "PATCH",
      headers: { ...headers, "idempotency-key": "integration-update-project" },
      body: JSON.stringify({ version: 1, milestone: "Integration milestone" }),
    });
    assert.equal(updateResponse.status, 200);
    const updatedToday = validateTodayResponse(await updateResponse.json());
    const updatedProject = updatedToday.projects.find((project) => project.id === "integration-test-project");
    assert.equal(updatedProject.milestone, "Integration milestone");
    assert.equal(updatedProject.version, 2);

    const archiveResponse = await fetch("http://127.0.0.1:3012/v1/projects/integration-test-project", {
      method: "DELETE",
      headers: { ...headers, "idempotency-key": "integration-archive-project" },
    });
    assert.equal(archiveResponse.status, 200);
    const archivedToday = validateTodayResponse(await archiveResponse.json());
    assert.ok(!archivedToday.projects.some((project) => project.id === "integration-test-project"));
  } finally {
    child.kill("SIGTERM");
    await once(child, "exit");
  }
});
