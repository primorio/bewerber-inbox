import { useEffect, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { CornerUpLeft, Download, FileArchive, FileCode2, FileText, Flag } from 'lucide-react'
import { api } from '../../lib/api'
import { fileSize, fullDate } from '../../lib/format'
import { Avatar } from '../../components/Avatar'
import { Composer } from '../../components/Composer'

export const Route = createFileRoute('/_app/inbox/$emailId')({
  loader: ({ params }) => api.email(params.emailId),
  staleTime: 0,
  component: EmailView,
})

function EmailView() {
  const email = Route.useLoaderData()
  const router = useRouter()
  const hasDraft = email.draft.html !== '' || email.draft.attachments.length > 0
  const [composing, setComposing] = useState(email.replies.length === 0 || hasDraft)

  const refreshList = () => router.invalidate({ filter: (r) => r.routeId === '/_app' })

  useEffect(() => {
    setComposing(email.replies.length === 0 || hasDraft)
    api.markOpened(email.id).then(refreshList, () => {})
  }, [email.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <article className="mx-auto max-w-3xl px-8 py-7">
      <h1 className="flex items-start gap-2.5 font-serif text-[26px] leading-tight">
        {email.urgent && <Flag className="mt-2 size-4 shrink-0 fill-flag text-flag" aria-label="Dringend" />}
        {email.subject}
      </h1>

      <div className="mt-5 flex items-center gap-3">
        <Avatar name={email.from.name} size={40} />
        <div className="min-w-0 leading-tight">
          <p className="text-sm">
            <span className="font-medium">{email.from.name}</span>{' '}
            <span className="text-muted">&lt;{email.from.email}&gt;</span>
          </p>
          {email.from.role && <p className="mt-0.5 text-xs text-muted">{email.from.role}</p>}
        </div>
        <time className="ml-auto shrink-0 text-xs text-muted">{fullDate(email.deliveredAt)}</time>
      </div>

      <div className="mt-6 whitespace-pre-wrap text-[15px] leading-[1.7]">{email.body}</div>

      {email.attachments.length > 0 && (
        <ul className="mt-6 space-y-2">
          {email.attachments.map((a) => (
            <li key={a.href}>
              <a
                href={a.href}
                download={a.name}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-pine"
              >
                <span className="grid size-10 place-items-center rounded-lg bg-pine-wash text-pine-deep">
                  {a.href.endsWith('.zip') ? (
                    <FileArchive className="size-5" />
                  ) : a.href.endsWith('.pdf') ? (
                    <FileText className="size-5" />
                  ) : (
                    <FileCode2 className="size-5" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{a.name}</span>
                  {a.hint && <span className="block text-xs text-muted">{a.hint}</span>}
                </span>
                <Download className="ml-auto size-4 text-muted" />
              </a>
            </li>
          ))}
        </ul>
      )}

      {email.replies.map((r) => (
        <section key={r.id} className="mt-6 rounded-xl border border-line bg-surface">
          <header className="flex items-center gap-2 border-b border-line px-5 py-2.5 text-sm">
            <CornerUpLeft className="size-4 text-pine" />
            <span className="font-medium">Deine Antwort</span>
            <time className="ml-auto text-xs text-muted">{fullDate(r.sentAt)}</time>
          </header>
          {r.html && <div className="mail-prose px-5 py-4" dangerouslySetInnerHTML={{ __html: r.html }} />}
          {r.attachments.length > 0 && (
            <ul className="flex flex-wrap gap-2 border-t border-line px-5 py-3">
              {r.attachments.map((a) => (
                <li key={a.id}>
                  <a
                    href={`/api/attachments/${a.id}`}
                    className="flex items-center gap-2 rounded-lg border border-line bg-paper/50 px-2.5 py-1.5 text-sm hover:border-pine"
                  >
                    <FileText className="size-4 text-muted" />
                    <span className="max-w-56 truncate">{a.filename}</span>
                    <span className="text-xs text-muted">{fileSize(a.size)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <div className="mt-6 pb-10">
        {composing ? (
          <Composer
            key={`${email.id}:${email.replies.length}`}
            emailId={email.id}
            to={email.from}
            initialHtml={email.draft.html}
            initialAttachments={email.draft.attachments}
            initialSavedAt={email.draft.updatedAt}
            onDraftChange={refreshList}
            onSent={() => {
              setComposing(false)
              router.invalidate()
            }}
          />
        ) : (
          <button
            onClick={() => setComposing(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-pine"
          >
            <CornerUpLeft className="size-4" /> Weitere Antwort schreiben
          </button>
        )}
      </div>
    </article>
  )
}
