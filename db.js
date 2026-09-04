import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve('data');
fs.mkdirSync(dataDir, { recursive: true });
export const db = new Database(path.join(dataDir, 'status.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monitor_id TEXT NOT NULL,
    checked_at TEXT NOT NULL,
    ok INTEGER NOT NULL,
    status_code INTEGER,
    response_ms INTEGER,
    reason TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_checks_monitor_time ON checks(monitor_id, checked_at);
  CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monitor_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    resolved_at TEXT,
    title TEXT NOT NULL,
    cause TEXT,
    last_error TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_incidents_monitor_time ON incidents(monitor_id, started_at);
`);

export const insertCheck = db.prepare(`
  INSERT INTO checks (monitor_id, checked_at, ok, status_code, response_ms, reason)
  VALUES (@monitorId, @checkedAt, @ok, @statusCode, @responseMs, @reason)
`);
export const openIncident = db.prepare(`
  INSERT INTO incidents (monitor_id, started_at, title, cause, last_error)
  VALUES (?, ?, ?, ?, ?)
`);
export const updateIncident = db.prepare(`UPDATE incidents SET last_error = ? WHERE id = ?`);
export const resolveIncident = db.prepare(`UPDATE incidents SET resolved_at = ? WHERE id = ?`);
export const currentIncident = db.prepare(`
  SELECT * FROM incidents WHERE monitor_id = ? AND resolved_at IS NULL ORDER BY started_at DESC LIMIT 1
`);
export const latestCheck = db.prepare(`
  SELECT * FROM checks WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT 1
`);
export const lastChecks = db.prepare(`
  SELECT * FROM checks WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT ?
`);
export const recentChecks = db.prepare(`
  SELECT * FROM checks WHERE monitor_id = ? AND checked_at >= ? ORDER BY checked_at ASC
`);
export const recentIncidents = db.prepare(`
  SELECT * FROM incidents WHERE started_at >= ? ORDER BY started_at DESC
`);

