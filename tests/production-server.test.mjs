import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import { handleApiRequest } from "../apps/api/router.mjs";
import { serveStatic } from "../apps/api/static.mjs";

test("health endpoint is public and includes CORS headers for allowed dev origins", async () => {
  const response = await handleApiRequest({
    url: "/health",
    method: "GET",
    headers: {
      origin: "http://localhost:4173",
      accept: "application/json",
    },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:4173");
  assert.deepEqual(await response.json(), {
    ok: true,
    service: "daymark",
    database: "not_configured",
  });
});

test("serves the built client shell when dist/client exists", async (t) => {
  try {
    await access(new URL("../dist/client/index.html", import.meta.url));
  } catch {
    t.skip("dist/client is not built");
    return;
  }

  const response = await serveStatic({
    url: "/",
    method: "GET",
    headers: { accept: "text/html" },
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
});

test("does not route missing API requests through the SPA shell", async () => {
  const response = await handleApiRequest({
    url: "/v1/today",
    method: "GET",
    headers: { accept: "application/json" },
  });

  assert.equal(response.status, 401);
});
