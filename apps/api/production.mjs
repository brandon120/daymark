import { createServer } from "node:http";
import { handleApiRequest } from "./router.mjs";
import { clientBuildExists, serveStatic } from "./static.mjs";

const port = Number(process.env.PORT ?? 3001);

async function dispatch(incoming) {
  const apiResponse = await handleApiRequest(incoming);
  if (apiResponse) {
    return apiResponse;
  }

  const staticResponse = await serveStatic(incoming);
  if (staticResponse) {
    return staticResponse;
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

createServer((incoming, outgoing) => {
  dispatch(incoming)
    .then(async (response) => {
      outgoing.writeHead(response.status, Object.fromEntries(response.headers.entries()));

      if (incoming.method === "HEAD") {
        outgoing.end();
        return;
      }

      if (response.body) {
        const buffer = Buffer.from(await response.arrayBuffer());
        outgoing.end(buffer);
      } else {
        outgoing.end();
      }
    })
    .catch((error) => {
      console.error(error);
      outgoing.writeHead(500, { "content-type": "application/json" });
      outgoing.end(JSON.stringify({ error: "Internal server error" }));
    });
}).listen(port, "0.0.0.0", () => {
  const mode = clientBuildExists() ? "web + api" : "api only";
  console.log(`Daymark production server (${mode}) listening on http://0.0.0.0:${port}`);
});
