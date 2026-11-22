export interface Sender {
  name: string
  email: string
  role?: string
}

export interface Session {
  name: string
  email: string
  startedAt: string
}

export interface EmailSummary {
  id: string
  from: Sender
  subject: string
  preview: string
  urgent: boolean
  hasAttachments: boolean
  deliveredAt: string
  read: boolean
  replyCount: number
  lastReplyAt: string | null
  hasDraft: boolean
}

export interface InboxState {
  session: Session | null
  emails: EmailSummary[]
  lastExportAt: string | null
}

export interface UploadedFile {
  id: number
  filename: string
  mime: string
  size: number
}

export interface Reply {
  id: number
  html: string
  sentAt: string
  attachments: UploadedFile[]
}

export interface EmailDetail {
  id: string
  from: Sender
  subject: string
  body: string
  urgent: boolean
  attachments: { name: string; href: string; hint?: string }[]
  deliveredAt: string
  replies: Reply[]
  draft: { html: string; updatedAt: string | null; attachments: UploadedFile[] }
}

export interface SentItem {
  id: number
  emailId: string
  to: Sender
  subject: string
  preview: string
  sentAt: string
  attachmentCount: number
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, init)
  } catch {
    throw new Error('Der lokale Server antwortet nicht. Läuft "npm run dev" noch?')
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Fehler ${res.status}`)
  }
  return (await res.json()) as T
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const api = {
  state: () => request<InboxState>('/api/state'),
  startSession: (name: string, email: string) => request<InboxState>('/api/session', jsonInit('POST', { name, email })),
  sent: () => request<SentItem[]>('/api/sent'),
  email: (id: string) => request<EmailDetail>(`/api/emails/${encodeURIComponent(id)}`),
  markOpened: (id: string) => request<{ ok: true }>(`/api/emails/${encodeURIComponent(id)}/open`, { method: 'POST' }),
  saveDraft: (id: string, html: string) =>
    request<{ updatedAt: string }>(`/api/emails/${encodeURIComponent(id)}/draft`, jsonInit('PUT', { html })),
  sendReply: (id: string, html: string) =>
    request<EmailDetail>(`/api/emails/${encodeURIComponent(id)}/reply`, jsonInit('POST', { html })),
  upload: (id: string, file: File) =>
    request<UploadedFile>(`/api/emails/${encodeURIComponent(id)}/attachments`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-Filename': encodeURIComponent(file.name),
      },
      body: file,
    }),
  removeAttachment: (id: number) => request<{ ok: true }>(`/api/attachments/${id}`, { method: 'DELETE' }),
}
