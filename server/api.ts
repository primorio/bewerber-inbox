import type { IncomingMessage, ServerResponse } from 'node:http'
import { readFileSync } from 'node:fs'
import { emails } from '../content/emails.ts'
import type { EmailDefinition } from '../content/types.ts'
import { DB_PATH, getDb, getMeta, logEvent, setMeta } from './db.ts'

const MAX_UPLOAD_BYTES = 150 * 1024 * 1024
const MAX_JSON_BYTES = 80 * 1024 * 1024

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

const byId = new Map<string, EmailDefinition>(emails.map((e) => [e.id, e]))

function json(res: ServerResponse, body: unknown, status = 200) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

async function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) throw new HttpError(413, 'Die Datei ist zu groß.')
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks)
}

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const raw = await readBody(req, MAX_JSON_BYTES)
  try {
    return JSON.parse(raw.toString('utf8') || '{}') as T
  } catch {
    throw new HttpError(400, 'Ungültige Anfrage.')
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<img[^>]*>/gi, ' [Bild] ')
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim()
}

function session() {
  const startedAt = getMeta('started_at')
  if (!startedAt) return null
  return {
    name: getMeta('candidate_name') ?? '',
    email: getMeta('candidate_email') ?? '',
    startedAt,
  }
}

function requireSession() {
  const s = session()
  if (!s) throw new HttpError(409, 'Noch nicht gestartet.')
  return s
}

const addMinutes = (iso: string, minutes: number) =>
  new Date(new Date(iso).getTime() + minutes * 60_000).toISOString()

/** Stellt alle Mails zu, deren Zeitpunkt gekommen ist. */
function deliverDue(startedAt: string) {
  const db = getDb()
  const now = new Date().toISOString()
  const delivered = new Set(
    (db.prepare('SELECT email_id FROM email_state').all() as { email_id: string }[]).map((r) => r.email_id),
  )
  const insert = db.prepare('INSERT INTO email_state (email_id, delivered_at) VALUES (?, ?)')

  for (const email of emails) {
    if (delivered.has(email.id)) continue
    const a = email.arrival
    let at: string | undefined
    if (a.type === 'start') {
      at = addMinutes(startedAt, -(a.minutesBeforeStart ?? 0))
    } else if (a.type === 'afterMinutes') {
      at = addMinutes(startedAt, a.minutes)
    } else {
      const first = db
        .prepare('SELECT MIN(sent_at) AS sent_at FROM replies WHERE email_id = ?')
        .get(a.emailId) as { sent_at: string | null }
      if (first.sent_at) at = addMinutes(first.sent_at, a.delayMinutes ?? 0)
    }
    if (at && at <= now) {
      insert.run(email.id, at)
      logEvent('email_delivered', email.id)
    }
  }
}

function attachmentsFor(emailId: string, replyId: number | null) {
  const db = getDb()
  const rows =
    replyId === null
      ? db
          .prepare(
            'SELECT id, filename, mime, size FROM attachments WHERE email_id = ? AND reply_id IS NULL ORDER BY id',
          )
          .all(emailId)
      : db.prepare('SELECT id, filename, mime, size FROM attachments WHERE reply_id = ? ORDER BY id').all(replyId)
  return rows as { id: number; filename: string; mime: string; size: number }[]
}

function listState() {
  const s = session()
  if (!s) return { session: null, emails: [], lastExportAt: null }
  deliverDue(s.startedAt)
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT s.email_id, s.delivered_at, s.first_opened_at,
              (SELECT COUNT(*) FROM replies r WHERE r.email_id = s.email_id) AS reply_count,
              (SELECT MAX(sent_at) FROM replies r WHERE r.email_id = s.email_id) AS last_reply_at,
              (SELECT COUNT(*) FROM drafts d WHERE d.email_id = s.email_id) AS has_draft
         FROM email_state s
         JOIN emails e ON e.id = s.email_id
        ORDER BY s.delivered_at DESC, e.position DESC`,
    )
    .all() as {
    email_id: string
    delivered_at: string
    first_opened_at: string | null
    reply_count: number
    last_reply_at: string | null
    has_draft: number
  }[]

  const list = rows.flatMap((r) => {
    const def = byId.get(r.email_id)
    if (!def) return []
    return [
      {
        id: def.id,
        from: def.from,
        subject: def.subject,
        preview: def.body.replace(/\s+/g, ' ').slice(0, 140),
        urgent: !!def.urgent,
        hasAttachments: !!def.attachments?.length,
        deliveredAt: r.delivered_at,
        read: !!r.first_opened_at,
        replyCount: r.reply_count,
        lastReplyAt: r.last_reply_at,
        hasDraft: !!r.has_draft,
      },
    ]
  })
  const lastExport = db.prepare("SELECT MAX(at) AS at FROM events WHERE type = 'exported'").get() as {
    at: string | null
  }
  return { session: s, emails: list, lastExportAt: lastExport.at }
}

function requireDelivered(emailId: string): EmailDefinition {
  const def = byId.get(emailId)
  const state = getDb().prepare('SELECT 1 FROM email_state WHERE email_id = ?').get(emailId)
  if (!def || !state) throw new HttpError(404, 'Diese Nachricht gibt es nicht.')
  return def
}

function emailDetail(emailId: string) {
  const def = requireDelivered(emailId)
  const db = getDb()
  const state = db.prepare('SELECT delivered_at FROM email_state WHERE email_id = ?').get(emailId) as {
    delivered_at: string
  }
  const replies = (
    db.prepare('SELECT id, html, sent_at FROM replies WHERE email_id = ? ORDER BY id').all(emailId) as {
      id: number
      html: string
      sent_at: string
    }[]
  ).map((r) => ({ id: r.id, html: r.html, sentAt: r.sent_at, attachments: attachmentsFor(emailId, r.id) }))
  const draft = db.prepare('SELECT html, updated_at FROM drafts WHERE email_id = ?').get(emailId) as
    | { html: string; updated_at: string }
    | undefined
  return {
    id: def.id,
    from: def.from,
    subject: def.subject,
    body: def.body,
    urgent: !!def.urgent,
    attachments: def.attachments ?? [],
    deliveredAt: state.delivered_at,
    replies,
    draft: { html: draft?.html ?? '', updatedAt: draft?.updated_at ?? null, attachments: attachmentsFor(emailId, null) },
  }
}

function slug(s: string) {
  return (
    s
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase() || 'bewerber'
  )
}

async function route(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const parts = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean)
  const method = req.method ?? 'GET'
  const db = getDb()

  // GET /api/state
  if (method === 'GET' && parts[0] === 'state') return json(res, listState())

  // POST /api/session
  if (method === 'POST' && parts[0] === 'session') {
    const body = await readJson<{ name?: string; email?: string }>(req)
    const name = body.name?.trim()
    const email = body.email?.trim()
    if (!name || !email) throw new HttpError(400, 'Bitte Name und E-Mail-Adresse angeben.')
    if (!session()) {
      setMeta('candidate_name', name)
      setMeta('candidate_email', email)
      setMeta('started_at', new Date().toISOString())
      logEvent('session_started')
    }
    return json(res, listState())
  }

  // GET /api/sent
  if (method === 'GET' && parts[0] === 'sent') {
    requireSession()
    const rows = db
      .prepare('SELECT id, email_id, text, sent_at FROM replies ORDER BY sent_at DESC, id DESC')
      .all() as { id: number; email_id: string; text: string; sent_at: string }[]
    return json(
      res,
      rows.map((r) => {
        const def = byId.get(r.email_id)
        return {
          id: r.id,
          emailId: r.email_id,
          to: def?.from ?? { name: r.email_id, email: '' },
          subject: def?.subject ?? '',
          preview: r.text.replace(/\s+/g, ' ').slice(0, 160),
          sentAt: r.sent_at,
          attachmentCount: attachmentsFor(r.email_id, r.id).length,
        }
      }),
    )
  }

  // GET /api/export
  if (method === 'GET' && parts[0] === 'export') {
    const s = requireSession()
    logEvent('exported')
    const file = readFileSync(DB_PATH)
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/vnd.sqlite3')
    res.setHeader('Content-Length', file.length)
    res.setHeader('Content-Disposition', `attachment; filename="abgabe-${slug(s.name)}-${stamp}.db"`)
    res.setHeader('Cache-Control', 'no-store')
    return res.end(file)
  }

  // /api/attachments/:id
  if (parts[0] === 'attachments' && parts[1]) {
    const id = Number(parts[1])
    if (method === 'GET') {
      const row = db.prepare('SELECT filename, mime, data FROM attachments WHERE id = ?').get(id) as
        | { filename: string; mime: string; data: Uint8Array }
        | undefined
      if (!row) throw new HttpError(404, 'Anhang nicht gefunden.')
      res.statusCode = 200
      res.setHeader('Content-Type', row.mime)
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(row.filename)}`)
      return res.end(Buffer.from(row.data))
    }
    if (method === 'DELETE') {
      const row = db.prepare('SELECT email_id, filename, reply_id FROM attachments WHERE id = ?').get(id) as
        | { email_id: string; filename: string; reply_id: number | null }
        | undefined
      if (!row) throw new HttpError(404, 'Anhang nicht gefunden.')
      if (row.reply_id !== null) throw new HttpError(409, 'Bereits gesendete Anhänge lassen sich nicht entfernen.')
      db.prepare('DELETE FROM attachments WHERE id = ?').run(id)
      logEvent('attachment_removed', row.email_id, { filename: row.filename })
      return json(res, { ok: true })
    }
  }

  // /api/emails/:id/...
  if (parts[0] === 'emails' && parts[1]) {
    requireSession()
    const emailId = decodeURIComponent(parts[1])
    const def = requireDelivered(emailId)
    const action = parts[2]

    if (method === 'GET' && !action) return json(res, emailDetail(emailId))

    if (method === 'POST' && action === 'open') {
      const now = new Date().toISOString()
      db.prepare(
        `UPDATE email_state
            SET first_opened_at = COALESCE(first_opened_at, ?), last_opened_at = ?, open_count = open_count + 1
          WHERE email_id = ?`,
      ).run(now, now, emailId)
      logEvent('email_opened', emailId)
      return json(res, { ok: true })
    }

    if (method === 'PUT' && action === 'draft') {
      const { html = '' } = await readJson<{ html?: string }>(req)
      const now = new Date().toISOString()
      if (htmlToText(html) === '') {
        db.prepare('DELETE FROM drafts WHERE email_id = ?').run(emailId)
      } else {
        db.prepare(
          `INSERT INTO drafts (email_id, html, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(email_id) DO UPDATE SET html = excluded.html, updated_at = excluded.updated_at`,
        ).run(emailId, html, now)
      }
      logEvent('draft_saved', emailId, { length: htmlToText(html).length })
      return json(res, { updatedAt: now })
    }

    if (method === 'POST' && action === 'attachments') {
      const filename = decodeURIComponent(String(req.headers['x-filename'] ?? 'datei'))
      const mime = String(req.headers['content-type'] ?? 'application/octet-stream')
      const data = await readBody(req, MAX_UPLOAD_BYTES)
      if (data.length === 0) throw new HttpError(400, 'Die Datei ist leer.')
      const result = db
        .prepare(
          'INSERT INTO attachments (email_id, reply_id, filename, mime, size, data, uploaded_at) VALUES (?, NULL, ?, ?, ?, ?, ?)',
        )
        .run(emailId, filename, mime, data.length, data, new Date().toISOString())
      logEvent('attachment_uploaded', emailId, { filename, size: data.length })
      return json(res, { id: Number(result.lastInsertRowid), filename, mime, size: data.length })
    }

    if (method === 'POST' && action === 'reply') {
      const { html = '' } = await readJson<{ html?: string }>(req)
      const text = htmlToText(html)
      const pending = attachmentsFor(emailId, null)
      if (text === '' && pending.length === 0) {
        throw new HttpError(400, 'Die Antwort ist leer. Schreib etwas oder hänge eine Datei an.')
      }
      const now = new Date().toISOString()
      const matches = def.expectedReply === undefined ? null : text.includes(def.expectedReply) ? 1 : 0
      const result = db
        .prepare('INSERT INTO replies (email_id, html, text, sent_at, matches_expected) VALUES (?, ?, ?, ?, ?)')
        .run(emailId, html, text, now, matches)
      const replyId = Number(result.lastInsertRowid)
      db.prepare('UPDATE attachments SET reply_id = ? WHERE email_id = ? AND reply_id IS NULL').run(replyId, emailId)
      db.prepare('DELETE FROM drafts WHERE email_id = ?').run(emailId)
      logEvent('reply_sent', emailId, { replyId, length: text.length, attachments: pending.length })
      return json(res, emailDetail(emailId))
    }
  }

  throw new HttpError(404, 'Nicht gefunden.')
}

export function handleApi(req: IncomingMessage, res: ServerResponse) {
  route(req, res).catch((err: unknown) => {
    if (!(err instanceof HttpError)) console.error('[inbox-api]', err)
    const status = err instanceof HttpError ? err.status : 500
    const message = err instanceof HttpError ? err.message : 'Unerwarteter Fehler im lokalen Server.'
    if (!res.headersSent) json(res, { error: message }, status)
    else res.end()
  })
}
