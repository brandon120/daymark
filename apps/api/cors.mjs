const DEFAULT_METHODS = "GET, HEAD, POST, PATCH, DELETE, OPTIONS";
const DEFAULT_HEADERS = "Authorization, Content-Type, Accept, Idempotency-Key";

function allowedOrigins() {
  const configured = process.env.DAYMARK_CORS_ORIGIN?.trim();
  if (configured) {
    return configured.split(",").map((origin) => origin.trim()).filter(Boolean);
  }

  return [
    "http://localhost:4173",
    "http://127.0.0.1:4173",
  ];
}

function resolveOrigin(request) {
  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin) {
    return null;
  }

  const allowed = allowedOrigins();
  if (allowed.includes("*") || allowed.includes(requestOrigin)) {
    return requestOrigin;
  }

  return null;
}

export function withCors(request, response) {
  const origin = resolveOrigin(request);
  const headers = new Headers(response.headers);

  if (origin) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-credentials", "true");
    headers.set("vary", "Origin");
  }

  headers.set("access-control-allow-methods", DEFAULT_METHODS);
  headers.set("access-control-allow-headers", DEFAULT_HEADERS);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function preflightResponse(request) {
  const origin = resolveOrigin(request);
  const headers = {
    "access-control-allow-methods": DEFAULT_METHODS,
    "access-control-allow-headers": DEFAULT_HEADERS,
    "access-control-max-age": "86400",
  };

  if (origin) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-credentials"] = "true";
    headers.vary = "Origin";
  }

  return new Response(null, { status: 204, headers });
}
