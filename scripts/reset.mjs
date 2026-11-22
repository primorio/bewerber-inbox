// Löscht die lokale Datenbank. Danach startet die App wieder bei null.
import { rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const db = fileURLToPath(new URL('../data/inbox.db', import.meta.url))
rmSync(db, { force: true })
rmSync(db + '-journal', { force: true })
console.log('Datenbank gelöscht:', db)
