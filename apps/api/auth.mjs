import { authenticateSession, validateAccessToken } from "./handlers/session.mjs";

export async function authenticateRequest(request) {
  const session = await authenticateSession(request);
  if (session.ok) {
    return session;
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing authentication" };
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return { ok: false, status: 401, error: "Missing authentication" };
  }

  return validateAccessToken(token);
}
