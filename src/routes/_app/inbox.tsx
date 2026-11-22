import { Link, Outlet, createFileRoute, getRouteApi } from '@tanstack/react-router'
import { CornerUpLeft, Flag, Paperclip, PencilLine } from 'lucide-react'
import { shortDate } from '../../lib/format'

export const Route = createFileRoute('/_app/inbox')({ component: InboxLayout })

const app = getRouteApi('/_app')

function InboxLayout() {
  const { emails } = app.useLoaderData()

  return (
    <div className="flex h-full">
      <section className="flex w-[360px] shrink-0 flex-col border-r border-line bg-surface">
        <div className="border-b border-line px-5 py-3">
          <h1 className="font-serif text-xl">Posteingang</h1>
          <p className="text-xs text-muted">
            {emails.length} {emails.length === 1 ? 'Nachricht' : 'Nachrichten'}
          </p>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {emails.map((e) => (
            <li key={e.id}>
              <Link
                to="/inbox/$emailId"
                params={{ emailId: e.id }}
                className="group relative block border-b border-line px-5 py-3.5 hover:bg-paper/60 data-[status=active]:bg-pine-wash"
              >
                {!e.read && <span className="absolute left-2 top-5 size-2 rounded-full bg-pine" aria-label="Ungelesen" />}
                <div className="flex items-baseline gap-2">
                  <span className={`truncate text-sm ${e.read ? 'text-ink/80' : 'font-semibold'}`}>{e.from.name}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted">{shortDate(e.deliveredAt)}</span>
                </div>
                <p className={`mt-0.5 flex items-center gap-1.5 text-sm ${e.read ? '' : 'font-semibold'}`}>
                  {e.urgent && <Flag className="size-3.5 shrink-0 fill-flag text-flag" aria-label="Dringend" />}
                  <span className="truncate">{e.subject}</span>
                </p>
                <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted">{e.preview}</p>
                {(e.replyCount > 0 || e.hasDraft || e.hasAttachments) && (
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                    {e.replyCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-pine-deep">
                        <CornerUpLeft className="size-3.5" /> Beantwortet
                      </span>
                    )}
                    {e.hasDraft && (
                      <span className="inline-flex items-center gap-1">
                        <PencilLine className="size-3.5" /> Entwurf
                      </span>
                    )}
                    {e.hasAttachments && (
                      <span className="inline-flex items-center gap-1">
                        <Paperclip className="size-3.5" /> Anhang
                      </span>
                    )}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </section>
    </div>
  )
}
