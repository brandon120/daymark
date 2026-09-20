#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import { closePool, getPool } from "./pool.js";

const WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";
const USER_ID = "00000000-0000-4000-8000-000000000010";

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function main() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO users (id, email, display_name, initials)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE
       SET display_name = EXCLUDED.display_name, initials = EXCLUDED.initials`,
      [USER_ID, "brandon@daymark.local", "Brandon", "BM"],
    );

    await client.query(
      `INSERT INTO workspaces (id, name, owner_user_id, timezone, bee_live, active_project_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name,
           bee_live = EXCLUDED.bee_live,
           active_project_id = EXCLUDED.active_project_id,
           updated_at = NOW()`,
      [WORKSPACE_ID, "Personal workspace", USER_ID, "America/Los_Angeles", true, "device-mcp"],
    );

    const devToken = process.env.DAYMARK_DEV_TOKEN ?? randomBytes(24).toString("hex");
    await client.query(
      `INSERT INTO api_tokens (workspace_id, token_hash, label)
       VALUES ($1, $2, $3)
       ON CONFLICT (token_hash) DO NOTHING`,
      [WORKSPACE_ID, hashToken(devToken), "development"],
    );

    const projects = [
      ["product-forge", "Product Forge", "Implementation", "healthy", "2 hours ago", "Added auth middleware and updated tests", "Beta release (v0.2)", "in 4 days", "None", "healthy", "Codex", "Running (Vercel)", "amber", 0],
      ["device-mcp", "Device MCP", "Design", "active", "1 day ago", "Finalized MCP schema for device telemetry", "MVP integration", "in 1 week", "1 blocker", "danger", "Claude", "Idle", "blue", 1],
      ["monroe-eve", "Monroe Eve", "Research", "neutral", "6 hours ago", "Ingest pipeline performance improved", "Private alpha", "in 2 weeks", "None", "healthy", "GPT-5", "Idle", "slate", 2],
    ];

    for (const project of projects) {
      await client.query(
        `INSERT INTO projects (
          id, workspace_id, name, phase, phase_tone, updated_label, latest_change,
          milestone, milestone_timing, blocker, blocker_tone, worker, worker_state, color, sort_order
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          phase = EXCLUDED.phase,
          phase_tone = EXCLUDED.phase_tone,
          updated_label = EXCLUDED.updated_label,
          latest_change = EXCLUDED.latest_change,
          milestone = EXCLUDED.milestone,
          milestone_timing = EXCLUDED.milestone_timing,
          blocker = EXCLUDED.blocker,
          blocker_tone = EXCLUDED.blocker_tone,
          worker = EXCLUDED.worker,
          worker_state = EXCLUDED.worker_state,
          color = EXCLUDED.color,
          sort_order = EXCLUDED.sort_order,
          updated_at = NOW()`,
        [project[0], WORKSPACE_ID, ...project.slice(1)],
      );
    }

    const priorities = [
      ["priority-product-forge", "Deep Work", "9:00 AM – 11:00 AM", "Finish Product Forge onboarding flow", "Complete error states and polish copy. Ship ready for internal beta.", "Product Forge", "amber", 0],
      ["priority-device-mcp", "Project Progress", "11:00 AM – 1:00 PM", "Review Device MCP sandbox results", "Assess changes, run locally, and provide feedback.", "Device MCP", "teal", 1],
      ["priority-messages", "Communication", "2:00 PM – 3:00 PM", "Respond to key messages", "Customer follow-up, partnership thread, and team updates.", null, "slate", 2],
      ["priority-review", "Plan Ahead", "4:30 PM – 5:30 PM", "Weekly review and next week’s plan", "Close the loop and set priorities.", null, "slate", 3],
    ];

    for (const priority of priorities) {
      await client.query(
        `INSERT INTO priorities (
          id, workspace_id, group_name, time_label, title, detail, project_name, tone, sort_order
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO UPDATE SET
          group_name = EXCLUDED.group_name,
          time_label = EXCLUDED.time_label,
          title = EXCLUDED.title,
          detail = EXCLUDED.detail,
          project_name = EXCLUDED.project_name,
          tone = EXCLUDED.tone,
          sort_order = EXCLUDED.sort_order`,
        [priority[0], WORKSPACE_ID, ...priority.slice(1)],
      );
    }

    const schedule = [
      ["00000000-0000-4000-8000-000000000101", "8:30 AM", "Coffee & plan", null, "30 min", "muted", 0],
      ["00000000-0000-4000-8000-000000000102", "9:00 AM", "Deep work", "Product Forge", "2 hr", "amber", 1],
      ["00000000-0000-4000-8000-000000000103", "11:00 AM", "Project review", "Device MCP", "2 hr", "teal", 2],
      ["00000000-0000-4000-8000-000000000104", "1:00 PM", "Lunch", null, "1 hr", "muted", 3],
      ["00000000-0000-4000-8000-000000000105", "2:00 PM", "Messages & sync", null, "1 hr", "muted", 4],
      ["00000000-0000-4000-8000-000000000106", "3:30 PM", "Monroe Eve planning", null, "1 hr", "blue", 5],
      ["00000000-0000-4000-8000-000000000107", "4:30 PM", "Weekly review", null, "1 hr", "muted", 6],
    ];

    for (const item of schedule) {
      await client.query(
        `INSERT INTO schedule_items (id, workspace_id, time_label, title, detail, duration, tone, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO UPDATE SET
           time_label = EXCLUDED.time_label,
           title = EXCLUDED.title,
           detail = EXCLUDED.detail,
           duration = EXCLUDED.duration,
           tone = EXCLUDED.tone,
           sort_order = EXCLUDED.sort_order`,
        [item[0], WORKSPACE_ID, ...item.slice(1)],
      );
    }

    const tasks = [
      ["weekly-brief", "assistant", "Prepare weekly project brief", "Summarize progress, risks, and next steps across all projects.", "12m elapsed", "Control plane — no sandbox", null, null],
      ["device-enrollment", "coding", "Harden Device MCP enrollment", "Implement retry logic, improve error handling, add tests, and open a PR.", "28m elapsed", "Vercel Sandbox — PR approval required", "device-mcp", 2],
    ];

    for (const task of tasks) {
      await client.query(
        `INSERT INTO tasks (id, workspace_id, project_id, kind, title, description, elapsed_label, status, phase)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET
           project_id = EXCLUDED.project_id,
           kind = EXCLUDED.kind,
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           elapsed_label = EXCLUDED.elapsed_label,
           status = EXCLUDED.status,
           phase = EXCLUDED.phase,
           updated_at = NOW()`,
        [task[0], WORKSPACE_ID, task[6], task[1], task[2], task[3], task[4], task[5], task[7]],
      );
    }

    const memories = [
      ["00000000-0000-4000-8000-000000000201", "FileText", "Device MCP", "Enrollment reliability work in progress. Focusing on error handling and tests.", 0],
      ["00000000-0000-4000-8000-000000000202", "Code", "Product Forge", "Onboarding flow nearly complete. Polish copy and ship for internal beta.", 1],
      ["00000000-0000-4000-8000-000000000203", "Stack", "Monroe Eve", "Planning private alpha. Ingest pipeline performance improved.", 2],
    ];

    for (const memory of memories) {
      await client.query(
        `INSERT INTO working_memories (id, workspace_id, icon, title, detail, sort_order, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6, NOW())
         ON CONFLICT (id) DO UPDATE SET
           icon = EXCLUDED.icon,
           title = EXCLUDED.title,
           detail = EXCLUDED.detail,
           sort_order = EXCLUDED.sort_order,
           updated_at = NOW()`,
        [memory[0], WORKSPACE_ID, ...memory.slice(1)],
      );
    }

    await client.query("COMMIT");
    console.log("Seed complete.");
    console.log(`Workspace ID: ${WORKSPACE_ID}`);
    console.log(`Development API token: ${devToken}`);
    console.log("Set DAYMARK_API_TOKEN to this value for server-side access and sign-in.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await closePool();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
