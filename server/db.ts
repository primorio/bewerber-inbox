import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { emails } from '../content/emails.ts'

export const DB_PATH = path.resolve(process.cwd(), 'data', 'inbox.db')

let db: DatabaseSync | undefined

export function getDb(): DatabaseSync {
  if (db) return db
  mkdirSync(path.dirname(DB_PATH), { recursive: true })
  db = new DatabaseSync(DB_PATH)
  // Kein WAL: die Abgabe soll genau eine Datei sein.
  db.exec(`
    PRAGMA journal_mode = DELETE;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS emails (
      id           TEXT PRIMARY KEY,
      position     INTEGER NOT NULL,
      sender_name  TEXT NOT NULL,
      sender_email TEXT NOT NULL,
      subject      TEXT NOT NULL,
      body         TEXT NOT NULL,
      arrival_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_state (
      email_id        TEXT PRIMARY KEY REFERENCES emails(id),
      delivered_at    TEXT NOT NULL,
      first_opened_at TEXT,
      last_opened_at  TEXT,
      open_count      INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS drafts (
      email_id   TEXT PRIMARY KEY REFERENCES emails(id),
      html       TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS replies (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      email_id         TEXT NOT NULL REFERENCES emails(id),
      html             TEXT NOT NULL,
      text             TEXT NOT NULL,
      sent_at          TEXT NOT NULL,
      matches_expected INTEGER
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      email_id    TEXT NOT NULL REFERENCES emails(id),
      reply_id    INTEGER REFERENCES replies(id),
      filename    TEXT NOT NULL,
      mime        TEXT NOT NULL,
      size        INTEGER NOT NULL,
      data        BLOB NOT NULL,
      uploaded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      at       TEXT NOT NULL,
      type     TEXT NOT NULL,
      email_id TEXT,
      payload  TEXT
    );
  `)

  // Momentaufnahme der Mails, damit die Datenbank für sich allein lesbar ist.
  const upsert = db.prepare(`
    INSERT INTO emails (id, position, sender_name, sender_email, subject, body, arrival_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      position = excluded.position, sender_name = excluded.sender_name,
      sender_email = excluded.sender_email, subject = excluded.subject,
      body = excluded.body, arrival_json = excluded.arrival_json
  `)
  emails.forEach((e, i) =>
    upsert.run(e.id, i, e.from.name, e.from.email, e.subject, e.body, JSON.stringify(e.arrival)),
  )
  return db
}

export function getMeta(key: string): string | undefined {
  const row = getDb().prepare('SELECT value FROM meta WHERE key = ?').get(key) as
    | { value: string }
    | undefined
  return row?.value
}

export function setMeta(key: string, value: string) {
  getDb()
    .prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, value)
}

export function logEvent(type: string, emailId: string | null = null, payload?: unknown) {
  getDb()
    .prepare('INSERT INTO events (at, type, email_id, payload) VALUES (?, ?, ?, ?)')
    .run(new Date().toISOString(), type, emailId, payload === undefined ? null : JSON.stringify(payload))
}
