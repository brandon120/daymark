export async function writeHttpResponse(incoming, outgoing, response) {
  const headers = Object.fromEntries(response.headers.entries());

  if (response.body && headers["content-type"]?.includes("text/event-stream")) {
    outgoing.writeHead(response.status, headers);

    if (incoming.method === "HEAD") {
      outgoing.end();
      return;
    }

    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      outgoing.write(Buffer.from(value));
    }
    outgoing.end();
    return;
  }

  outgoing.writeHead(response.status, headers);

  if (incoming.method === "HEAD") {
    outgoing.end();
    return;
  }

  if (response.body) {
    const buffer = Buffer.from(await response.arrayBuffer());
    outgoing.end(buffer);
    return;
  }

  outgoing.end();
}
