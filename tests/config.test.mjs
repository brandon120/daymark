import assert from "node:assert/strict";
import test from "node:test";

test("validateStartupConfig requires DATABASE_URL", async () => {
  const env = { ...process.env };
  process.env.NODE_ENV = "development";
  delete process.env.DATABASE_URL;

  const { validateStartupConfig } = await import("../apps/api/config.mjs");

  assert.throws(
    () => validateStartupConfig(),
    /DATABASE_URL is required/,
  );

  process.env = env;
});

test("validateStartupConfig requires production secrets", async () => {
  const env = { ...process.env };
  process.env.NODE_ENV = "production";
  process.env.DATABASE_URL = "postgresql://example";
  delete process.env.DAYMARK_API_TOKEN;
  delete process.env.DAYMARK_WORKSPACE_ID;

  const { validateStartupConfig } = await import("../apps/api/config.mjs");

  assert.throws(
    () => validateStartupConfig(),
    /DAYMARK_API_TOKEN is required in production/,
  );

  process.env = env;
});
