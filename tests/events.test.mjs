import assert from "node:assert/strict";
import test from "node:test";
import { publishQueueUpdate, resetQueueEventsForTests, subscribeQueueEvents } from "../apps/api/events.mjs";

test("queue event subscribers receive published updates", () => {
  resetQueueEventsForTests();

  const messages = [];
  const unsubscribe = subscribeQueueEvents("workspace-1", Object.assign(
    (message) => messages.push(message),
    { close: () => {} },
  ));

  publishQueueUpdate("workspace-1", [{ id: "task-1", kind: "coding", title: "Advance Device MCP" }]);

  assert.equal(messages.length, 1);
  assert.match(messages[0], /event: queue\.updated/);
  assert.match(messages[0], /Advance Device MCP/);

  unsubscribe();
  publishQueueUpdate("workspace-1", []);
  assert.equal(messages.length, 1);
});
