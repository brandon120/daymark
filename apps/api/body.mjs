const MAX_BODY_BYTES = 64 * 1024;

export async function readJsonBody(incoming) {
  const chunks = [];
  let size = 0;

  for await (const chunk of incoming) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      return { error: { status: 413, message: "Payload too large" } };
    }
    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) {
    return { value: {} };
  }

  try {
    return { value: JSON.parse(text) };
  } catch {
    return { error: { status: 400, message: "Invalid JSON body" } };
  }
}
