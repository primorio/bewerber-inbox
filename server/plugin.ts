import type { Connect, Plugin } from 'vite'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { handleApi } from './api.ts'
import { zipFolder } from './zip.ts'

const [major, minor] = process.versions.node.split('.').map(Number)
if (major < 22 || (major === 22 && minor < 13)) {
  console.error(
    `\nDiese App braucht Node.js 22.13 oder neuer (installiert: ${process.versions.node}).\n` +
      'Aktuelle Version: https://nodejs.org\n',
  )
  process.exit(1)
}

const ATTACHMENTS_DIR = path.resolve(process.cwd(), 'attachments')

/**
 * Liefert Mail-Anhänge aus /attachments:
 *   /attachments/<ordner>.zip  -> der Ordner wird beim Abruf frisch gepackt
 *   /attachments/<datei>       -> die Datei, wie sie ist
 */
const serveAttachment: Connect.NextHandleFunction = (req, res, next) => {
  const name = decodeURIComponent((req.url ?? '').split('?')[0].replace(/^\/attachments\//, ''))
  if (!name || name.includes('/') || name.includes('\\') || name.startsWith('.')) return next()

  const folder = path.join(ATTACHMENTS_DIR, name.replace(/\.zip$/, ''))
  const file = path.join(ATTACHMENTS_DIR, name)
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Disposition', `attachment; filename="${name}"`)

  if (name.endsWith('.zip') && existsSync(folder) && statSync(folder).isDirectory()) {
    res.setHeader('Content-Type', 'application/zip')
    return res.end(zipFolder(folder))
  }
  if (existsSync(file) && statSync(file).isFile()) {
    res.setHeader('Content-Type', name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream')
    return res.end(readFileSync(file))
  }
  res.removeHeader('Content-Disposition')
  next()
}

/** Hängt die lokale API (SQLite) und die Mail-Anhänge in den Vite-Server ein, damit ein einziger Prozess reicht. */
export function inboxApi(): Plugin {
  const mount = (middlewares: Connect.Server) => {
    middlewares.use((req, res, next) => {
      if (req.url?.startsWith('/api/')) handleApi(req, res)
      else if (req.url?.startsWith('/attachments/')) serveAttachment(req, res, next)
      else next()
    })
  }
  return {
    name: 'inbox-api',
    configureServer: (server) => mount(server.middlewares),
    configurePreviewServer: (server) => mount(server.middlewares),
  }
}
