import { createServer } from "node:http";
import { handleApiRequest } from "./router.mjs";

const port = Number(process.env.PORT ?? 3001);

createServer((incoming, outgoing) => {
  handleApiRequest(incoming)
    .then(async (response) => {
      const resolved = response ?? new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "content-type": "application/json; charset=utf-8" },
      });

      outgoing.writeHead(resolved.status, Object.fromEntries(resolved.headers.entries()));

      if (incoming.method === "HEAD") {
        outgoing.end();
        return;
      }

      if (resolved.body) {
        const buffer = Buffer.from(await resolved.arrayBuffer());
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
  console.log(`Daymark API listening on http://0.0.0.0:${port}`);
});
