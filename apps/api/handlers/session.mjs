import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getPool } from "@daymark/database/pool";

const SESSION_COOKIE = "daymark_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function hashValue(value) {
  return createHash("sha256").update(value).digest("hex");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookies(header) {
  if (!header) {
    return {};
  }

  return Object.fromEntries(
    header.split(";").map((part) => {
      const [name, ...rest] = part.trim().split("=");
      return [name, decodeURIComponent(rest.join("="))];
    }),
  );
}

function sessionCookieOptions(maxAgeSeconds) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

async function validateAccessToken(token) {
  const configuredToken = process.env.DAYMARK_API_TOKEN;
  if (configuredToken && safeEqual(token, configuredToken)) {
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
    [hashValue(token)],
  );

  if (result.rowCount === 0) {
    return { ok: false, status: 401, error: "Invalid access token" };
  }

  const row = result.rows[0];
  await pool.query("UPDATE api_tokens SET last_used_at = NOW() WHERE id = $1", [row.token_id]);

  return {
    ok: true,
    workspaceId: row.workspace_id,
    actor: { type: "user", id: row.token_id },
  };
}

export function readSessionToken(request) {
  const cookies = parseCookies(request.headers.get("cookie"));
  return cookies[SESSION_COOKIE] ?? null;
}

export async function authenticateSession(request) {
  const sessionToken = readSessionToken(request);
  if (!sessionToken) {
    return { ok: false, status: 401, error: "Missing session" };
  }

  const pool = getPool();
  const result = await pool.query(
    `SELECT s.workspace_id, s.id AS session_id
     FROM sessions s
     WHERE s.session_token_hash = $1
       AND s.expires_at > NOW()`,
    [hashValue(sessionToken)],
  );

  if (result.rowCount === 0) {
    return { ok: false, status: 401, error: "Invalid or expired session" };
  }

  const row = result.rows[0];
  return {
    ok: true,
    workspaceId: row.workspace_id,
    actor: { type: "user", id: row.session_id },
  };
}

export async function handleCreateSession(body) {
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return { status: 400, body: { error: "token is required" }, headers: {} };
  }

  const validated = await validateAccessToken(token);
  if (!validated.ok) {
    return { status: validated.status, body: { error: validated.error }, headers: {} };
  }

  const sessionToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const pool = getPool();

  await pool.query(
    `INSERT INTO sessions (workspace_id, session_token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [validated.workspaceId, hashValue(sessionToken), expiresAt.toISOString()],
  );

  return {
    status: 204,
    body: null,
    headers: {
      "set-cookie": `${SESSION_COOKIE}=${encodeURIComponent(sessionToken)}; ${sessionCookieOptions(Math.floor(SESSION_TTL_MS / 1000))}`,
    },
  };
}

export async function handleGetSession(request) {
  const auth = await authenticateSession(request);
  return {
    status: 200,
    body: { authenticated: auth.ok },
    headers: {},
  };
}

export async function handleDeleteSession(request) {
  const sessionToken = readSessionToken(request);
  if (sessionToken) {
    const pool = getPool();
    await pool.query("DELETE FROM sessions WHERE session_token_hash = $1", [hashValue(sessionToken)]);
  }

  return {
    status: 204,
    body: null,
    headers: {
      "set-cookie": `${SESSION_COOKIE}=; ${sessionCookieOptions(0)}`,
    },
  };
}

export { validateAccessToken };
