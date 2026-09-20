const API_BASE = import.meta.env.VITE_DAYMARK_API_URL ?? "";

function buildHeaders(idempotencyKey, extra = {}) {
  return {
    accept: "application/json",
    ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
    ...extra,
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: buildHeaders(
      options.idempotencyKey,
      {
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...options.headers,
      },
    ),
  });

  if (response.status === 204) {
    if (!response.ok) {
      const error = new Error("Request failed");
      error.status = response.status;
      throw error;
    }
    return null;
  }

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
  return import.meta.env.VITE_DAYMARK_USE_API === "true";
}

export function getSession() {
  return request("/v1/session");
}

export function createSession(token) {
  return request("/v1/session", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function deleteSession() {
  return request("/v1/session", { method: "DELETE" });
}

export function getToday() {
  return request("/v1/today");
}

export function togglePriority(priorityId, idempotencyKey) {
  return request(`/v1/priorities/${priorityId}`, {
    method: "PATCH",
    idempotencyKey,
  });
}

export function setActiveProject(projectId, idempotencyKey) {
  return request("/v1/workspace/active-project", {
    method: "PATCH",
    body: JSON.stringify({ projectId }),
    idempotencyKey,
  });
}

export function setBeeLive(beeLive, idempotencyKey) {
  return request("/v1/workspace/bee-live", {
    method: "PATCH",
    body: JSON.stringify({ beeLive }),
    idempotencyKey,
  });
}

export function enqueueCodingTask(projectName, idempotencyKey) {
  return request("/v1/tasks/coding", {
    method: "POST",
    body: JSON.stringify({ projectName }),
    idempotencyKey,
  });
}

export function advanceTask(taskId, idempotencyKey) {
  return request(`/v1/tasks/${taskId}/advance`, {
    method: "PATCH",
    idempotencyKey,
  });
}

export function listProjects() {
  return request("/v1/projects");
}

export function getProject(projectId) {
  return request(`/v1/projects/${projectId}`);
}

export function createProject(input, idempotencyKey) {
  return request("/v1/projects", {
    method: "POST",
    body: JSON.stringify(input),
    idempotencyKey,
  });
}

export function updateProject(projectId, input, idempotencyKey) {
  return request(`/v1/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    idempotencyKey,
  });
}

export function archiveProject(projectId, idempotencyKey) {
  return request(`/v1/projects/${projectId}`, {
    method: "DELETE",
    idempotencyKey,
  });
}

export function openQueueEventSource({ onQueueUpdate, onError } = {}) {
  const source = new EventSource(`${API_BASE}/v1/events/queue`, {
    withCredentials: true,
  });

  source.addEventListener("queue.updated", (event) => {
    const payload = JSON.parse(event.data);
    onQueueUpdate?.(payload.queue);
  });

  source.onerror = (error) => {
    onError?.(error);
  };

  return source;
}
