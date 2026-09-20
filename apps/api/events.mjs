const subscribers = new Map();

function workspaceSubscribers(workspaceId) {
  if (!subscribers.has(workspaceId)) {
    subscribers.set(workspaceId, new Set());
  }
  return subscribers.get(workspaceId);
}

export function subscribeQueueEvents(workspaceId, listener) {
  const bucket = workspaceSubscribers(workspaceId);
  bucket.add(listener);

  return () => {
    bucket.delete(listener);
    if (bucket.size === 0) {
      subscribers.delete(workspaceId);
    }
  };
}

export function publishQueueUpdate(workspaceId, queue) {
  const payload = JSON.stringify({ queue });
  const message = `event: queue.updated\ndata: ${payload}\n\n`;

  for (const listener of workspaceSubscribers(workspaceId)) {
    try {
      listener(message);
    } catch {
      listener.close?.();
      workspaceSubscribers(workspaceId).delete(listener);
    }
  }
}

export function resetQueueEventsForTests() {
  subscribers.clear();
}
