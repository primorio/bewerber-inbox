// Liest eine abgegebene Datenbank und gibt den Verlauf aus.
//   npm run report -- pfad/zur/abgabe.db
//   npm run report -- pfad/zur/abgabe.db --extract ordner   (schreibt Antworten als HTML und alle Anhänge)
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const [file, flag, outDir] = process.argv.slice(2)
if (!file) {
  console.error('Aufruf: npm run report -- <abgabe.db> [--extract <ordner>]')
  process.exit(1)
}

const db = new DatabaseSync(file, { readOnly: true })
const meta = Object.fromEntries(db.prepare('SELECT key, value FROM meta').all().map((r) => [r.key, r.value]))
const start = new Date(meta.started_at)
const rel = (iso) => {
  if (!iso) return '–'
  const min = Math.round((new Date(iso) - start) / 60000)
  return `${min < 0 ? '-' : '+'}${String(Math.floor(Math.abs(min) / 60)).padStart(2, '0')}:${String(Math.abs(min) % 60).padStart(2, '0')}`
}

console.log(`\n${meta.candidate_name} <${meta.candidate_email}>`)
console.log(`Start: ${start.toLocaleString('de-DE')}   (Zeiten unten relativ zum Start, hh:mm)\n`)

console.log('MAILS')
const emails = db
  .prepare(
    `SELECT e.id, e.subject, s.delivered_at, s.first_opened_at, s.open_count,
            (SELECT MIN(sent_at) FROM replies r WHERE r.email_id = e.id) AS first_reply,
            (SELECT COUNT(*) FROM replies r WHERE r.email_id = e.id) AS replies,
            (SELECT MAX(matches_expected) FROM replies r WHERE r.email_id = e.id) AS matched,
            (SELECT COUNT(*) FROM drafts d WHERE d.email_id = e.id) AS draft
       FROM emails e LEFT JOIN email_state s ON s.email_id = e.id ORDER BY e.position`,
  )
  .all()
for (const e of emails) {
  const status = !e.delivered_at
    ? 'nie zugestellt'
    : `zugestellt ${rel(e.delivered_at)} · geöffnet ${rel(e.first_opened_at)} (${e.open_count}×) · ` +
      (e.replies ? `beantwortet ${rel(e.first_reply)} (${e.replies}×)` : e.draft ? 'nur Entwurf' : 'unbeantwortet') +
      (e.matched === null ? '' : e.matched ? ' · erwartete Antwort: JA' : ' · erwartete Antwort: nein')
  console.log(`  ${e.id.padEnd(26)} ${status}`)
}

console.log('\nREIHENFOLGE DER ANTWORTEN')
const replies = db.prepare('SELECT id, email_id, html, text, sent_at FROM replies ORDER BY sent_at, id').all()
const attachmentsOf = db.prepare('SELECT id, filename, size, data FROM attachments WHERE reply_id = ? ORDER BY id')
replies.forEach((r, i) => {
  const files = attachmentsOf.all(r.id)
  console.log(`  ${i + 1}. ${rel(r.sent_at)}  ${r.email_id}  (${r.text.length} Zeichen, ${files.length} Anhänge)`)
  if (flag === '--extract' && outDir) {
    const dir = path.join(outDir, `${String(i + 1).padStart(2, '0')}-${r.email_id}`)
    mkdirSync(dir, { recursive: true })
    writeFileSync(path.join(dir, 'antwort.html'), `<!doctype html><meta charset="utf-8"><body style="max-width:720px;margin:40px auto;font:16px/1.6 system-ui">${r.html}`)
    for (const f of files) writeFileSync(path.join(dir, `${f.id}-${path.basename(f.filename)}`), f.data)
  }
})

console.log('\nAKTIVITÄT')
const counts = db.prepare('SELECT type, COUNT(*) AS n FROM events GROUP BY type ORDER BY n DESC').all()
console.log('  ' + counts.map((c) => `${c.type}: ${c.n}`).join(' · '))
const last = db.prepare('SELECT MAX(at) AS at FROM events').get()
console.log(`  Letzte Aktivität: ${rel(last.at)}`)
if (flag === '--extract' && outDir) console.log(`\nAntworten und Anhänge liegen in ${path.resolve(outDir)}`)
console.log()
