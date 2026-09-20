import assert from "node:assert/strict";
import { Readable } from "node:stream";
import test from "node:test";
import { readJsonBody } from "../apps/api/body.mjs";

function streamFromString(value) {
  return Readable.from([Buffer.from(value)]);
}

test("readJsonBody rejects payloads above the configured limit with 413", async () => {
  const oversized = "a".repeat(65 * 1024);
  const result = await readJsonBody(streamFromString(oversized));

  assert.deepEqual(result.error, { status: 413, message: "Payload too large" });
});

test("readJsonBody rejects invalid JSON with 400", async () => {
  const result = await readJsonBody(streamFromString("{not-json"));

  assert.deepEqual(result.error, { status: 400, message: "Invalid JSON body" });
});

test("readJsonBody parses valid JSON payloads", async () => {
  const result = await readJsonBody(streamFromString('{"projectId":"device-mcp"}'));

  assert.deepEqual(result.value, { projectId: "device-mcp" });
});
