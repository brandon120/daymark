import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceCodingTask,
  codingPhases,
  enqueueCodingTask,
  formatToday,
  nextCodingPhase,
  taskExecutionBoundary,
  toggleSetMember,
} from "../src/domain.js";

test("coding lifecycle advances one phase at a time", () => {
  assert.equal(nextCodingPhase(0), 1);
  assert.equal(nextCodingPhase(2), 3);
});

test("coding lifecycle cannot advance past pull request", () => {
  assert.equal(nextCodingPhase(codingPhases.length - 1), codingPhases.length - 1);
});

test("coding work is isolated while assistant work remains in the control plane", () => {
  assert.deepEqual(taskExecutionBoundary("coding"), {
    runtime: "vercel-sandbox",
    approval: "pull-request",
  });
  assert.deepEqual(taskExecutionBoundary("assistant"), {
    runtime: "control-plane",
    approval: "policy",
  });
});

test("coding task enqueueing rejects active duplicates without phantom state", () => {
  const first = enqueueCodingTask([], "Device MCP", 100);
  const duplicate = enqueueCodingTask(first.queue, "Device MCP", 200);

  assert.equal(first.added, true);
  assert.equal(duplicate.added, false);
  assert.equal(duplicate.queue.length, 1);
  assert.equal(duplicate.task.id, first.task.id);
});

test("coding task advancement updates state through the domain layer", () => {
  const task = enqueueCodingTask([], "Device MCP", 100).task;
  const advanced = advanceCodingTask([task], task.id);

  assert.equal(advanced[0].phase, 1);
  assert.match(advanced[0].status, /Vercel Sandbox/);
});

test("set membership toggles without mutating the existing set", () => {
  const current = new Set(["one"]);
  const added = toggleSetMember(current, "two");
  const removed = toggleSetMember(added, "one");

  assert.deepEqual([...current], ["one"]);
  assert.deepEqual([...added], ["one", "two"]);
  assert.deepEqual([...removed], ["two"]);
});

test("today heading is derived from the supplied date", () => {
  assert.equal(formatToday(new Date("2026-09-18T12:00:00Z"), "en-US"), "Friday, September 18, 2026");
});
