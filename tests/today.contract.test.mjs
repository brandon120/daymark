import assert from "node:assert/strict";
import test from "node:test";
import { validateTodayResponse } from "@daymark/contracts/today";
import { createMockToday } from "../src/mockToday.js";

test("mock today payload matches the /v1/today contract", () => {
  const today = validateTodayResponse(createMockToday());

  assert.equal(today.projects.length, 3);
  assert.equal(today.priorities.length, 4);
  assert.equal(today.queue.length, 2);
  assert.equal(today.workspace.userDisplayName, "Brandon");
});

test("contract rejects malformed today payloads", () => {
  assert.throws(
    () => validateTodayResponse({ workspace: {}, activeProjectId: "x" }),
    /response\.beeLive must be a boolean/,
  );
});
