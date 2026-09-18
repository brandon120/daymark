import test from "node:test";
import assert from "node:assert/strict";
import { codingPhases, nextCodingPhase, taskExecutionBoundary } from "../src/domain.js";

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
