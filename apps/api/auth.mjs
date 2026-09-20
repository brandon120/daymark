import { createHash } from "node:crypto";
import { getPool } from "@daymark/database/pool";

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function authenticateRequest(request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing bearer token" };
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return { ok: false, status: 401, error: "Missing bearer token" };
  }

  const configuredToken = process.env.DAYMARK_API_TOKEN;
  if (configuredToken && token === configuredToken) {
    const workspaceId = process.env.DAYMARK_WORKSPACE_ID;
    if (!workspaceId) {
      return { ok: false, status: 500, error: "DAYMARK_WORKSPACE_ID is not configured" };
    }

    return {
      ok: true,
      workspaceId,
      actor: { type: "user", id: "configured-token" },
    };
  }

  const pool = getPool();
  const result = await pool.query(
    `SELECT t.workspace_id, t.id AS token_id
     FROM api_tokens t
     WHERE t.token_hash = $1`,
    [hashToken(token)],
  );

  if (result.rowCount === 0) {
    return { ok: false, status: 401, error: "Invalid bearer token" };
  }

  const row = result.rows[0];
  await pool.query("UPDATE api_tokens SET last_used_at = NOW() WHERE id = $1", [row.token_id]);

  return {
    ok: true,
    workspaceId: row.workspace_id,
    actor: { type: "user", id: row.token_id },
  };
}
