import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.ts';

mkdirSync(dirname(config.dbFile), { recursive: true });

export const db = new DatabaseSync(config.dbFile);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

// Append-only migrations, tracked by PRAGMA user_version.
const migrations: string[] = [
  `
  CREATE TABLE properties (
    id            INTEGER PRIMARY KEY,
    hostaway_id   INTEGER UNIQUE,
    name          TEXT NOT NULL,
    summary       TEXT,
    city          TEXT,
    tags          TEXT NOT NULL DEFAULT '[]',
    photo_url     TEXT,
    photo_count   INTEGER,
    archived      INTEGER NOT NULL DEFAULT 0,
    hidden        INTEGER NOT NULL DEFAULT 0,
    search_text   TEXT NOT NULL DEFAULT '',
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ')),
    updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ')),
    synced_at     TEXT
  );

  CREATE TABLE field_values (
    property_id   INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    field_key     TEXT NOT NULL,
    value         TEXT,
    source        TEXT NOT NULL CHECK (source IN ('sync', 'claude', 'admin')),
    updated_at    TEXT NOT NULL,
    updated_by    TEXT,
    PRIMARY KEY (property_id, field_key)
  );

  CREATE TABLE platforms (
    id            INTEGER PRIMARY KEY,
    key           TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    kind          TEXT NOT NULL CHECK (kind IN ('hostaway', 'manual')),
    icon          TEXT,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    retired       INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE property_platforms (
    property_id   INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    platform_id   INTEGER NOT NULL REFERENCES platforms(id),
    listed        INTEGER NOT NULL DEFAULT 0,
    url           TEXT,
    source        TEXT NOT NULL CHECK (source IN ('sync', 'claude', 'admin')),
    updated_at    TEXT NOT NULL,
    PRIMARY KEY (property_id, platform_id)
  );

  INSERT INTO platforms (key, name, kind, sort_order) VALUES
    ('airbnb', 'Airbnb', 'hostaway', 1),
    ('bookingcom', 'Booking.com', 'hostaway', 2),
    ('vrbo', 'Vrbo', 'hostaway', 3),
    ('blueground', 'Blueground', 'manual', 4),
    ('silverdoor', 'SilverDoor', 'manual', 5);
  `,
  // 2: admin accounts. The only account type; nothing is shared with the office booking app.
  `
  CREATE TABLE admins (
    id                    INTEGER PRIMARY KEY,
    username              TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash         TEXT NOT NULL,
    must_change_password  INTEGER NOT NULL DEFAULT 1,
    created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ')),
    password_changed_at   TEXT,
    last_sign_in_at       TEXT
  );
  `,
  // 3: sign-in sessions, sync history, and properties added by hand with an uploaded photo.
  `
  CREATE TABLE sessions (
    token_hash    TEXT PRIMARY KEY,
    admin_id      INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    created_at    TEXT NOT NULL,
    expires_at    TEXT NOT NULL
  );
  CREATE INDEX sessions_admin ON sessions(admin_id);

  CREATE TABLE sync_runs (
    id            INTEGER PRIMARY KEY,
    started_at    TEXT NOT NULL,
    finished_at   TEXT,
    started_by    TEXT,
    summary       TEXT,
    error         TEXT
  );

  ALTER TABLE properties ADD COLUMN photo_source TEXT NOT NULL DEFAULT 'hostaway'
    CHECK (photo_source IN ('hostaway', 'upload'));
  ALTER TABLE properties ADD COLUMN created_by TEXT;
  `,
  // 4: access tokens for the Claude fill. Only a hash of each token is stored.
  `
  CREATE TABLE api_tokens (
    id            INTEGER PRIMARY KEY,
    name          TEXT NOT NULL,
    token_hash    TEXT NOT NULL UNIQUE,
    created_by    TEXT NOT NULL,
    created_at    TEXT NOT NULL,
    last_used_at  TEXT,
    revoked_at    TEXT
  );
  `,
];

const current = (db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
for (let v = current; v < migrations.length; v++) {
  db.exec('BEGIN');
  try {
    db.exec(migrations[v]!);
    db.exec(`PRAGMA user_version = ${v + 1}`);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function transaction<T>(fn: () => T): T {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
