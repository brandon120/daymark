import { createServer } from "node:http";
import { writeHttpResponse } from "./http-response.mjs";
import { handleApiRequest } from "./router.mjs";
import { registerGracefulShutdown } from "./lifecycle.mjs";

const port = Number(process.env.PORT ?? 3001);

const server = createServer((incoming, outgoing) => {
  handleApiRequest(incoming)
    .then(async (response) => {
      const resolved = response ?? new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "content-type": "application/json; charset=utf-8" },
      });

      await writeHttpResponse(incoming, outgoing, resolved);
    })
    .catch((error) => {
      console.error(error);
      outgoing.writeHead(500, { "content-type": "application/json" });
      outgoing.end(JSON.stringify({ error: "Internal server error" }));
    });
});

registerGracefulShutdown(server);

server.listen(port, "0.0.0.0", () => {
  console.log(`Daymark API listening on http://0.0.0.0:${port}`);
});
