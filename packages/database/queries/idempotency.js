export async function findIdempotentResponse(client, workspaceId, idempotencyKey) {
  if (!idempotencyKey) {
    return null;
  }

  const existing = await client.query(
    `SELECT response_status, response_body
     FROM idempotency_records
     WHERE workspace_id = $1 AND idempotency_key = $2`,
    [workspaceId, idempotencyKey],
  );

  if (existing.rowCount === 0) {
    return null;
  }

  const row = existing.rows[0];
  return {
    status: row.response_status,
    body: row.response_body,
  };
}

export async function storeIdempotentResponse(client, workspaceId, idempotencyKey, status, body) {
  if (!idempotencyKey) {
    return;
  }

  await client.query(
    `INSERT INTO idempotency_records (workspace_id, idempotency_key, response_status, response_body)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (workspace_id, idempotency_key) DO NOTHING`,
    [workspaceId, idempotencyKey, status, body],
  );
}
