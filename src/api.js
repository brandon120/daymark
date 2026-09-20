const API_BASE = import.meta.env.VITE_DAYMARK_API_URL ?? "";
const API_TOKEN = import.meta.env.VITE_DAYMARK_API_TOKEN ?? "";

function authHeaders(idempotencyKey) {
  const headers = {
    accept: "application/json",
    authorization: `Bearer ${API_TOKEN}`,
  };

  if (idempotencyKey) {
    headers["idempotency-key"] = idempotencyKey;
  }

  return headers;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders(options.idempotencyKey),
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.message ?? body.error ?? "Request failed");
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

export function isApiConfigured() {
  return Boolean(API_TOKEN);
}

export function getToday() {
  return request("/v1/today");
}

export function togglePriority(priorityId) {
  return request(`/v1/priorities/${priorityId}`, {
    method: "PATCH",
    idempotencyKey: `priority-toggle-${priorityId}-${Date.now()}`,
  });
}

export function setActiveProject(projectId) {
  return request("/v1/workspace/active-project", {
    method: "PATCH",
    body: JSON.stringify({ projectId }),
    idempotencyKey: `active-project-${projectId}`,
  });
}

export function setBeeLive(beeLive) {
  return request("/v1/workspace/bee-live", {
    method: "PATCH",
    body: JSON.stringify({ beeLive }),
    idempotencyKey: `bee-live-${beeLive}`,
  });
}

export function enqueueCodingTask(projectName) {
  return request("/v1/tasks/coding", {
    method: "POST",
    body: JSON.stringify({ projectName }),
    idempotencyKey: `coding-task-${projectName}`,
  });
}

export function advanceTask(taskId) {
  return request(`/v1/tasks/${taskId}/advance`, {
    method: "PATCH",
    idempotencyKey: `advance-task-${taskId}-${Date.now()}`,
  });
}
