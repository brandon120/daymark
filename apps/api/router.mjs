import { readJsonBody } from "./body.mjs";
import { authenticateRequest } from "./auth.mjs";
import { preflightResponse, withCors } from "./cors.mjs";
import { handleHealth } from "./handlers/health.mjs";
import {
  handleCreateSession,
  handleDeleteSession,
  handleGetSession,
} from "./handlers/session.mjs";
import {
  handleAdvanceTask,
  handleEnqueueCodingTask,
  handleGetToday,
  handleSetActiveProject,
  handleSetBeeLive,
  handleTogglePriority,
} from "./handlers/today.mjs";

function jsonResponse(status, body, extraHeaders = {}) {
  return new Response(body ? JSON.stringify(body) : null, {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

function isApiPath(pathname) {
  return pathname === "/health" || pathname.startsWith("/v1/");
}

export async function handleApiRequest(incoming) {
  const url = new URL(incoming.url ?? "/", "http://localhost");
  const { pathname } = url;
  const request = new Request(`http://localhost${pathname}${url.search}`, {
    method: incoming.method,
    headers: incoming.headers,
  });

  if (request.method === "OPTIONS" && isApiPath(pathname)) {
    return preflightResponse(request);
  }

  if (request.method === "GET" && pathname === "/health") {
    const result = await handleHealth();
    return withCors(request, jsonResponse(result.status, result.body));
  }

  if (request.method === "GET" && pathname === "/v1/session") {
    const result = await handleGetSession(request);
    return withCors(request, jsonResponse(result.status, result.body, result.headers));
  }

  if (request.method === "POST" && pathname === "/v1/session") {
    const parsed = await readJsonBody(incoming);
    if (parsed.error) {
      return withCors(request, jsonResponse(parsed.error.status, { error: parsed.error.message }));
    }

    const result = await handleCreateSession(parsed.value);
    return withCors(
      request,
      jsonResponse(result.status, result.body, result.headers),
    );
  }

  if (request.method === "DELETE" && pathname === "/v1/session") {
    const result = await handleDeleteSession(request);
    return withCors(request, jsonResponse(result.status, result.body, result.headers));
  }

  if (!pathname.startsWith("/v1/")) {
    return null;
  }

  const auth = await authenticateRequest(request);
  if (!auth.ok) {
    return withCors(request, jsonResponse(auth.status, { error: auth.error }));
  }

  const idempotencyKey = request.headers.get("idempotency-key");

  try {
    if (request.method === "GET" && pathname === "/v1/today") {
      const result = await handleGetToday(auth.workspaceId);
      return withCors(request, jsonResponse(result.status, result.body));
    }

    if (request.method === "PATCH" && pathname.startsWith("/v1/priorities/")) {
      const priorityId = pathname.slice("/v1/priorities/".length);
      const result = await handleTogglePriority(auth.workspaceId, auth.actor, priorityId, idempotencyKey);
      return withCors(request, jsonResponse(result.status, result.body));
    }

    if (request.method === "PATCH" && pathname === "/v1/workspace/active-project") {
      const parsed = await readJsonBody(incoming);
      if (parsed.error) {
        return withCors(request, jsonResponse(parsed.error.status, { error: parsed.error.message }));
      }

      const result = await handleSetActiveProject(
        auth.workspaceId,
        auth.actor,
        parsed.value.projectId,
        idempotencyKey,
      );
      return withCors(request, jsonResponse(result.status, result.body));
    }

    if (request.method === "PATCH" && pathname === "/v1/workspace/bee-live") {
      const parsed = await readJsonBody(incoming);
      if (parsed.error) {
        return withCors(request, jsonResponse(parsed.error.status, { error: parsed.error.message }));
      }

      const result = await handleSetBeeLive(
        auth.workspaceId,
        auth.actor,
        Boolean(parsed.value.beeLive),
        idempotencyKey,
      );
      return withCors(request, jsonResponse(result.status, result.body));
    }

    if (request.method === "POST" && pathname === "/v1/tasks/coding") {
      const parsed = await readJsonBody(incoming);
      if (parsed.error) {
        return withCors(request, jsonResponse(parsed.error.status, { error: parsed.error.message }));
      }

      const result = await handleEnqueueCodingTask(
        auth.workspaceId,
        auth.actor,
        parsed.value.projectName,
        idempotencyKey,
      );
      return withCors(request, jsonResponse(result.status, result.body));
    }

    if (request.method === "PATCH" && pathname.startsWith("/v1/tasks/") && pathname.endsWith("/advance")) {
      const taskId = pathname.slice("/v1/tasks/".length, -"/advance".length);
      const result = await handleAdvanceTask(auth.workspaceId, auth.actor, taskId, idempotencyKey);
      return withCors(request, jsonResponse(result.status, result.body));
    }

    return withCors(request, jsonResponse(404, { error: "Not found" }));
  } catch (error) {
    console.error(error);
    return withCors(request, jsonResponse(500, { error: "Internal server error" }));
  }
}
