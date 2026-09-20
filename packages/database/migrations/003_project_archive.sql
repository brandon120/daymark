ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_projects_workspace_active
  ON projects (workspace_id, sort_order ASC)
  WHERE archived_at IS NULL;
