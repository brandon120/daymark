import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

test("migration runner bootstraps schema_migrations before reading it", async () => {
  const migrateSource = await readFile(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "../packages/database/migrate.mjs"),
    "utf8",
  );

  const bootstrapIndex = migrateSource.indexOf("ensureMigrationLedger");
  const appliedVersionsIndex = migrateSource.indexOf("appliedVersions(");

  assert.notEqual(bootstrapIndex, -1);
  assert.notEqual(appliedVersionsIndex, -1);
  assert.ok(bootstrapIndex < appliedVersionsIndex);
});
