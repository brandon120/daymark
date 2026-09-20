import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../dist/client",
);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

function safePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const relative = normalized.startsWith("/") ? normalized.slice(1) : normalized;
  const resolved = path.resolve(clientRoot, relative);

  if (!resolved.startsWith(clientRoot)) {
    return null;
  }

  return resolved;
}

async function fileResponse(filePath) {
  const body = await readFile(filePath);
  const extension = path.extname(filePath).toLowerCase();

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": contentTypes[extension] ?? "application/octet-stream",
      "cache-control": extension === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
    },
  });
}

export function clientBuildExists() {
  return existsSync(path.join(clientRoot, "index.html"));
}

export async function serveStatic(incoming) {
  if (!clientBuildExists()) {
    return null;
  }

  const url = new URL(incoming.url ?? "/", "http://localhost");
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = safePath(pathname);

  if (filePath && existsSync(filePath)) {
    return fileResponse(filePath);
  }

  const acceptsHtml = incoming.headers.accept?.includes("text/html");
  if (
    acceptsHtml
    && ["GET", "HEAD"].includes(incoming.method ?? "GET")
    && !pathname.startsWith("/v1/")
    && pathname !== "/health"
  ) {
    const indexPath = path.join(clientRoot, "index.html");
    if (existsSync(indexPath)) {
      return fileResponse(indexPath);
    }
  }

  return null;
}
