import { Link, createFileRoute } from '@tanstack/react-router'
import { Paperclip, Send } from 'lucide-react'
import { api } from '../../lib/api'
import { shortDate } from '../../lib/format'

export const Route = createFileRoute('/_app/sent')({
  loader: () => api.sent(),
  staleTime: 0,
  component: Sent,
})

function Sent() {
  const items = Route.useLoaderData()

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-6">
        <h1 className="font-serif text-2xl">Gesendet</h1>
        {items.length === 0 ? (
          <div className="mt-16 text-center">
            <Send className="mx-auto size-10 text-line" strokeWidth={1.25} />
            <p className="mt-3 text-sm text-muted">Du hast noch nichts gesendet.</p>
          </div>
        ) : (
          <ul className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
            {items.map((r) => (
              <li key={r.id} className="border-b border-line last:border-0">
                <Link to="/inbox/$emailId" params={{ emailId: r.emailId }} className="block px-5 py-3.5 hover:bg-paper/60">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-sm font-medium">An {r.to.name}</span>
                    {r.attachmentCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <Paperclip className="size-3.5" /> {r.attachmentCount}
                      </span>
                    )}
                    <span className="ml-auto shrink-0 text-xs text-muted">{shortDate(r.sentAt)}</span>
                  </div>
                  <p className="truncate text-sm">AW: {r.subject}</p>
                  <p className="mt-0.5 truncate text-[13px] text-muted">{r.preview || 'Nur Anhänge'}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
