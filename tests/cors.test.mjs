import assert from "node:assert/strict";
import test from "node:test";
import { preflightResponse, withCors } from "../apps/api/cors.mjs";

test("CORS rejects wildcard origins when credentials are enabled", async () => {
  process.env.DAYMARK_CORS_ORIGIN = "*";

  const request = new Request("http://localhost/v1/today", {
    headers: { origin: "https://evil.example" },
  });
  const response = withCors(
    request,
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );

  assert.equal(response.headers.get("access-control-allow-origin"), null);
  delete process.env.DAYMARK_CORS_ORIGIN;
});

test("CORS allows explicitly configured dev origins", () => {
  const request = new Request("http://localhost/v1/today", {
    headers: { origin: "http://localhost:4173" },
  });
  const response = preflightResponse(request);

  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:4173");
  assert.equal(response.headers.get("access-control-allow-credentials"), "true");
});
