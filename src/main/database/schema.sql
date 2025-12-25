-- Claude Maestro Database Schema
-- Version: 1
-- SQLite database for project management

-- Projects table
-- Stores core project information
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Project tags (many-to-many relationship)
-- A project can have multiple tags
CREATE TABLE IF NOT EXISTS project_tags (
  project_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag)
);

-- Project repositories (one-to-many relationship)
-- A project can have multiple repositories
CREATE TABLE IF NOT EXISTS project_repositories (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT,
  url TEXT NOT NULL,
  default_branch TEXT,
  provider TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- App metadata table
-- Stores active project ID and schema version
CREATE TABLE IF NOT EXISTS app_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_tags_project_id ON project_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_repositories_project_id ON project_repositories(project_id);

-- Initial metadata (only insert if not exists)
INSERT OR IGNORE INTO app_metadata (key, value) VALUES ('schema_version', '1');
INSERT OR IGNORE INTO app_metadata (key, value) VALUES ('active_project_id', 'null');
