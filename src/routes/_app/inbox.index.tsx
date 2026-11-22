import { createFileRoute } from '@tanstack/react-router'
import { MailOpen } from 'lucide-react'

export const Route = createFileRoute('/_app/inbox/')({
  component: () => (
    <div className="grid h-full place-items-center p-8 text-center">
      <div>
        <MailOpen className="mx-auto size-10 text-line" strokeWidth={1.25} />
        <p className="mt-3 font-serif text-xl">Wähle eine Nachricht aus</p>
        <p className="mt-1 text-sm text-muted">Links findest du alles, was heute auf dich wartet.</p>
      </div>
    </div>
  ),
})
