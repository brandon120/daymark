import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
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
