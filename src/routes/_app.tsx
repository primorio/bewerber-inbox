import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { Check, Download, Inbox, Mail, Send, X } from 'lucide-react'
import { api, type EmailSummary } from '../lib/api'
import { clock } from '../lib/format'

export const Route = createFileRoute('/_app')({
  loader: async () => {
    const state = await api.state()
    if (!state.session) throw redirect({ to: '/welcome' })
    return { ...state, session: state.session }
  },
  staleTime: 0,
  component: AppLayout,
})

const POLL_MS = 15_000

function AppLayout() {
  const { session, emails, lastExportAt } = Route.useLoaderData()
  const router = useRouter()
  const [toast, setToast] = useState<EmailSummary | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const known = useRef<Set<string> | null>(null)

  // Regelmäßig nach neuer Post sehen
  useEffect(() => {
    const refresh = () => router.invalidate({ filter: (r) => r.routeId === Route.id })
    const timer = setInterval(refresh, POLL_MS)
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [router])

  useEffect(() => {
    const ids = new Set(emails.map((e) => e.id))
    if (known.current) {
      const fresh = emails.find((e) => !known.current!.has(e.id))
      if (fresh) setToast(fresh)
    }
    known.current = ids
  }, [emails])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 8000)
    return () => clearTimeout(t)
  }, [toast])

  const unread = emails.filter((e) => !e.read).length
  const sent = emails.reduce((n, e) => n + e.replyCount, 0)

  const navItem =
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink/80 hover:bg-black/5 data-[status=active]:bg-pine-wash data-[status=active]:font-medium data-[status=active]:text-pine-deep'

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-surface px-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-pine text-white">
            <Mail className="size-4" />
          </span>
          <span className="font-serif text-lg">Posteingang</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-medium">{session.name}</p>
            <p className="text-xs text-muted">{session.email}</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setExportOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-white hover:bg-black"
            >
              <Download className="size-4" /> Fortschritt herunterladen
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-11 z-20 w-80 rounded-xl border border-line bg-surface p-4 shadow-xl">
                <p className="font-medium">Deinen Stand als Datei sichern</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Die Datei enthält alle gesendeten Antworten, Entwürfe und Anhänge. Schick sie an deinen
                  Ansprechpartner bei uns. Du kannst jederzeit weiterarbeiten und später erneut herunterladen.
                </p>
                <a
                  href="/api/export"
                  download
                  onClick={() => setTimeout(() => router.invalidate(), 800)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-pine px-3 py-2 text-sm font-medium text-white hover:bg-pine-deep"
                >
                  <Download className="size-4" /> Datenbank herunterladen
                </a>
                {lastExportAt && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                    <Check className="size-3.5 text-pine" /> Zuletzt heruntergeladen um {clock(lastExportAt)} Uhr
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="w-52 shrink-0 space-y-1 border-r border-line p-3">
          <Link to="/inbox" className={navItem}>
            <Inbox className="size-4" /> Posteingang
            {unread > 0 && (
              <span className="ml-auto rounded-full bg-pine px-2 py-0.5 text-xs font-medium text-white">{unread}</span>
            )}
          </Link>
          <Link to="/sent" className={navItem}>
            <Send className="size-4" /> Gesendet
            {sent > 0 && <span className="ml-auto text-xs text-muted">{sent}</span>}
          </Link>
        </nav>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-30 flex w-80 items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-xl">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-pine-wash text-pine">
            <Mail className="size-4" />
          </span>
          <Link
            to="/inbox/$emailId"
            params={{ emailId: toast.id }}
            onClick={() => setToast(null)}
            className="min-w-0 flex-1"
          >
            <p className="text-xs text-muted">Neue Nachricht von {toast.from.name}</p>
            <p className="truncate text-sm font-medium">{toast.subject}</p>
          </Link>
          <button aria-label="Schließen" onClick={() => setToast(null)} className="text-muted hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
