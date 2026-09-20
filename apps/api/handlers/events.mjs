import { publishQueueUpdate, subscribeQueueEvents } from "../events.mjs";
import { getPool } from "@daymark/database/pool";

function mapQueueRow(row) {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    description: row.description,
    elapsed: row.elapsed_label,
    status: row.status,
    phase: row.phase ?? undefined,
  };
}

async function loadQueue(client, workspaceId) {
  const result = await client.query(
    `SELECT id, kind, title, description, elapsed_label, status, phase
     FROM tasks
     WHERE workspace_id = $1
     ORDER BY created_at ASC`,
    [workspaceId],
  );

  return result.rows.map(mapQueueRow);
}

export async function notifyQueueUpdate(client, workspaceId) {
  const queue = await loadQueue(client, workspaceId);
  publishQueueUpdate(workspaceId, queue);
}

export async function handleQueueEvents(workspaceId, requestSignal) {
  const pool = getPool();
  const client = await pool.connect();

  let closed = false;
  let heartbeat;
  let unsubscribe = () => {};

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(message) {
        if (closed) return;
        controller.enqueue(encoder.encode(message));
      }

      function close() {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        client.release();
        try {
          controller.close();
        } catch {
          // Stream already closed.
        }
      }

      const listener = Object.assign(send, { close });
      unsubscribe = subscribeQueueEvents(workspaceId, listener);

      try {
        const queue = await loadQueue(client, workspaceId);
        send(`event: queue.updated\ndata: ${JSON.stringify({ queue })}\n\n`);
      } catch (error) {
        close();
        controller.error(error);
        return;
      }

      heartbeat = setInterval(() => {
        send(": heartbeat\n\n");
      }, 25_000);

      if (requestSignal) {
        requestSignal.addEventListener("abort", close, { once: true });
      }
    },
    cancel() {
      if (closed) return;
      closed = true;
      clearInterval(heartbeat);
      unsubscribe();
      client.release();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
