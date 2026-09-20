#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { closePool, getPool } from "./pool.js";

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");

async function appliedVersions(client) {
  const result = await client.query("SELECT version FROM schema_migrations ORDER BY version");
  return new Set(result.rows.map((row) => row.version));
}

async function main() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    const applied = await appliedVersions(client);

    for (const file of files) {
      const version = file.replace(/\.sql$/, "");
      if (applied.has(version)) continue;

      const sql = await readFile(path.join(migrationsDir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [version]);
        await client.query("COMMIT");
        console.log(`Applied migration ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    client.release();
    await closePool();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
