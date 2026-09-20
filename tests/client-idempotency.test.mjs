import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("client mutations require caller-supplied idempotency keys", async () => {
  const source = await readFile(new URL("../src/api.js", import.meta.url), "utf8");

  assert.doesNotMatch(source, /idempotencyKey:\s*`active-project:/);
  assert.doesNotMatch(source, /idempotencyKey:\s*`bee-live:/);
  assert.doesNotMatch(source, /idempotencyKey:\s*`coding-task:/);
  assert.match(source, /setActiveProject\(projectId, idempotencyKey\)/);
  assert.match(source, /setBeeLive\(beeLive, idempotencyKey\)/);
  assert.match(source, /enqueueCodingTask\(projectName, idempotencyKey\)/);
});
