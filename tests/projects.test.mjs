import assert from "node:assert/strict";
import test from "node:test";
import {
  createProjectDefaults,
  extractProjectPatch,
  slugifyProjectId,
  validateCreateProjectInput,
} from "@daymark/domain";

test("slugifyProjectId normalizes project names", () => {
  assert.equal(slugifyProjectId("Device MCP"), "device-mcp");
  assert.equal(slugifyProjectId("  Product Forge!!! "), "product-forge");
});

test("createProjectDefaults returns stable starter fields", () => {
  const project = createProjectDefaults("New Initiative", 2);

  assert.equal(project.id, "new-initiative");
  assert.equal(project.phase, "Planning");
  assert.equal(project.color, "teal");
  assert.equal(project.version, 1);
});

test("validateCreateProjectInput requires a name", () => {
  assert.equal(validateCreateProjectInput({}).error, "name is required");
  assert.deepEqual(validateCreateProjectInput({ name: "Roadmap" }).input.name, "Roadmap");
});

test("extractProjectPatch requires version and at least one field", () => {
  assert.equal(extractProjectPatch({ version: 1 }).error, "At least one project field must be provided");
  assert.equal(extractProjectPatch({ name: "Updated" }).error, "version must be a positive integer");

  const parsed = extractProjectPatch({ version: 2, milestone: "Private beta" });
  assert.deepEqual(parsed.patch, { version: 2, milestone: "Private beta" });
});

test("extractProjectPatch rejects invalid tones", () => {
  const parsed = extractProjectPatch({ version: 1, phaseTone: "invalid" });
  assert.equal(parsed.error, "phaseTone is invalid");
});
