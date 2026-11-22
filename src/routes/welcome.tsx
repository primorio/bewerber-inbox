import { useState, type FormEvent } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Download, Inbox, Paperclip } from 'lucide-react'
import { api } from '../lib/api'

export const Route = createFileRoute('/welcome')({
  beforeLoad: async () => {
    const state = await api.state()
    if (state.session) throw redirect({ to: '/inbox' })
  },
  component: Welcome,
})

function Welcome() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.startSession(name, email)
      await navigate({ to: '/inbox' })
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  const input =
    'mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] outline-none focus:border-pine focus:ring-2 focus:ring-pine/20'

  return (
    <div className="grid min-h-full place-items-center px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_20px_60px_-30px_rgba(28,35,33,0.35)] md:grid-cols-[1.1fr_1fr]">
        <div className="bg-pine p-8 text-white md:p-10">
          <p className="text-sm tracking-wide text-white/70">Primorio</p>
          <h1 className="mt-6 font-serif text-4xl leading-tight">Dein erster Tag im Posteingang.</h1>
          <p className="mt-5 font-serif text-2xl">Sei kreativ.</p>
          <p className="mt-3 text-[15px] leading-relaxed text-white/90">
            Du darfst Annahmen treffen, dir Sachen ausdenken und auf Sachen hinweisen, die du tun würdest (aber in der
            Demo nicht wirklich getan hast).
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-white/90">
            Bearbeite deinen Posteingang in einer Reihenfolge deiner Wahl.
          </p>
          <ul className="mt-8 space-y-4 text-sm text-white/90">
            <li className="flex gap-3">
              <Inbox className="mt-0.5 size-4 shrink-0" />
              Du antwortest direkt auf die Nachrichten. Während du arbeitest, kann weitere Post eintreffen.
            </li>
            <li className="flex gap-3">
              <Paperclip className="mt-0.5 size-4 shrink-0" />
              Antworten können formatierten Text, Bilder und Dateianhänge enthalten.
            </li>
            <li className="flex gap-3">
              <Download className="mt-0.5 size-4 shrink-0" />
              Am Ende lädst du deinen Stand als eine Datei herunter und schickst sie uns.
            </li>
          </ul>
        </div>

        <form onSubmit={submit} className="p-8 md:p-10">
          <h2 className="font-serif text-2xl">Los geht's</h2>
          <p className="mt-1 text-sm text-muted">Damit wir deine Abgabe zuordnen können.</p>

          <label className="mt-6 block text-sm font-medium">
            Name
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </label>
          <label className="mt-4 block text-sm font-medium">
            E-Mail-Adresse
            <input
              className={input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          {error && <p className="mt-4 text-sm text-flag">{error}</p>}

          <button
            disabled={busy}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-pine px-4 py-3 font-medium text-white hover:bg-pine-deep disabled:opacity-60"
          >
            Posteingang öffnen <ArrowRight className="size-4" />
          </button>

          <p className="mt-6 text-xs leading-relaxed text-muted">
            Alles bleibt auf deinem Rechner, bis du die Datei selbst an uns schickst. Sie enthält deine Antworten, deine
            Anhänge und Zeitstempel deiner Aktivität im Posteingang.
          </p>
        </form>
      </div>
    </div>
  )
}
