#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function main() {
  if (process.env.DATABASE_URL) {
    console.log("Running database migrations…");
    await run("node", ["packages/database/migrate.mjs"]);

    if (process.env.DAYMARK_SEED_ON_START === "1") {
      console.log("Seeding database…");
      await run("node", ["packages/database/seed.mjs"]);
    }
  } else {
    console.warn("DATABASE_URL is not set. Starting without migrations.");
  }

  await run("node", ["apps/api/production.mjs"]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
