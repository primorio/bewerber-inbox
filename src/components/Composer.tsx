import { useEffect, useRef, useState, type ReactNode } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Check,
  FileText,
  Heading2,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Paperclip,
  Send,
  TextQuote,
  Underline,
  X,
} from 'lucide-react'
import { api, type Sender, type UploadedFile } from '../lib/api'
import { clock, fileSize } from '../lib/format'

const MAX_INLINE_WIDTH = 1600

/** Bild als Data-URL einlesen, sehr breite Bilder dabei verkleinern. */
async function imageToDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return raw
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('Das Bild konnte nicht gelesen werden.'))
    el.src = raw
  })
  if (img.naturalWidth <= MAX_INLINE_WIDTH) return raw
  const canvas = document.createElement('canvas')
  canvas.width = MAX_INLINE_WIDTH
  canvas.height = Math.round((img.naturalHeight / img.naturalWidth) * MAX_INLINE_WIDTH)
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.9)
}

interface Props {
  emailId: string
  to: Sender
  initialHtml: string
  initialAttachments: UploadedFile[]
  initialSavedAt: string | null
  onSent: () => void
  onDraftChange: () => void
}

export function Composer({ emailId, to, initialHtml, initialAttachments, initialSavedAt, onSent, onDraftChange }: Props) {
  const [attachments, setAttachments] = useState(initialAttachments)
  const [uploading, setUploading] = useState(0)
  const [savedAt, setSavedAt] = useState(initialSavedAt)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingHtml = useRef<string | null>(null)
  const done = useRef(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const imageInput = useRef<HTMLInputElement>(null)
  const addFilesRef = useRef<(files: File[], inlineImages: boolean) => void>(() => {})

  async function flushDraft() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = null
    const html = pendingHtml.current
    pendingHtml.current = null
    if (html === null || done.current) return
    try {
      const { updatedAt } = await api.saveDraft(emailId, html)
      setSavedAt(updatedAt)
      onDraftChange()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder: 'Schreib deine Antwort …' }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: { class: 'mail-prose', 'aria-label': 'Antwort' },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? [])
        if (files.length === 0) return false
        addFilesRef.current(files, true)
        return true
      },
      handleDrop: (_view, event) => {
        const files = Array.from((event as DragEvent).dataTransfer?.files ?? [])
        if (files.length === 0) return false
        event.preventDefault()
        addFilesRef.current(files, true)
        return true
      },
    },
    onUpdate: ({ editor }) => {
      pendingHtml.current = editor.getHTML()
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(flushDraft, 1200)
    },
  })

  // Beim Verlassen den letzten Stand noch sichern
  useEffect(() => () => void flushDraft(), []) // eslint-disable-line react-hooks/exhaustive-deps

  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive('bold') ?? false,
      italic: editor?.isActive('italic') ?? false,
      underline: editor?.isActive('underline') ?? false,
      heading: editor?.isActive('heading', { level: 2 }) ?? false,
      bullet: editor?.isActive('bulletList') ?? false,
      ordered: editor?.isActive('orderedList') ?? false,
      quote: editor?.isActive('blockquote') ?? false,
      link: editor?.isActive('link') ?? false,
    }),
  })

  addFilesRef.current = async (files, inlineImages) => {
    setError(null)
    for (const file of files) {
      try {
        if (inlineImages && file.type.startsWith('image/')) {
          const src = await imageToDataUrl(file)
          editor?.chain().focus().setImage({ src, alt: file.name }).run()
        } else {
          setUploading((n) => n + 1)
          try {
            const saved = await api.upload(emailId, file)
            setAttachments((list) => [...list, saved])
            onDraftChange()
          } finally {
            setUploading((n) => n - 1)
          }
        }
      } catch (err) {
        setError(`${file.name}: ${(err as Error).message}`)
      }
    }
  }

  async function removeAttachment(id: number) {
    try {
      await api.removeAttachment(id)
      setAttachments((list) => list.filter((a) => a.id !== id))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function setLink() {
    if (!editor) return
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const href = window.prompt('Adresse des Links', 'https://')
    if (!href || href === 'https://') return
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run()
    } else {
      editor.chain().focus().setLink({ href }).run()
    }
  }

  async function send() {
    if (!editor || sending) return
    setSending(true)
    setError(null)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    pendingHtml.current = null
    try {
      await api.sendReply(emailId, editor.getHTML())
      done.current = true
      onSent()
    } catch (err) {
      setError((err as Error).message)
      setSending(false)
    }
  }

  const tool = (on: boolean) =>
    `grid size-8 place-items-center rounded-md hover:bg-black/5 ${on ? 'bg-pine-wash text-pine-deep' : 'text-ink/70'}`
  const Tool = (p: { label: string; on?: boolean; onClick: () => void; children: ReactNode }) => (
    <button
      type="button"
      title={p.label}
      aria-label={p.label}
      aria-pressed={p.on}
      onMouseDown={(e) => e.preventDefault()}
      onClick={p.onClick}
      className={tool(!!p.on)}
    >
      {p.children}
    </button>
  )
  const Divider = () => <span className="mx-1 h-5 w-px bg-line" />
  const chain = () => editor!.chain().focus()

  return (
    <div
      className={`rounded-xl border bg-white transition-colors ${dragging ? 'border-pine ring-2 ring-pine/20' : 'border-line'}`}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault()
          setDragging(true)
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        setDragging(false)
        if (e.defaultPrevented) return
        e.preventDefault()
        addFilesRef.current(Array.from(e.dataTransfer.files), false)
      }}
    >
      <div className="border-b border-line px-5 py-2.5 text-sm">
        <span className="text-muted">An </span>
        <span className="font-medium">{to.name}</span> <span className="text-muted">&lt;{to.email}&gt;</span>
      </div>

      <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-3 py-1.5">
        <Tool label="Fett" on={active?.bold} onClick={() => chain().toggleBold().run()}>
          <Bold className="size-4" />
        </Tool>
        <Tool label="Kursiv" on={active?.italic} onClick={() => chain().toggleItalic().run()}>
          <Italic className="size-4" />
        </Tool>
        <Tool label="Unterstrichen" on={active?.underline} onClick={() => chain().toggleUnderline().run()}>
          <Underline className="size-4" />
        </Tool>
        <Divider />
        <Tool label="Überschrift" on={active?.heading} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="size-4" />
        </Tool>
        <Tool label="Aufzählung" on={active?.bullet} onClick={() => chain().toggleBulletList().run()}>
          <List className="size-4" />
        </Tool>
        <Tool label="Nummerierte Liste" on={active?.ordered} onClick={() => chain().toggleOrderedList().run()}>
          <ListOrdered className="size-4" />
        </Tool>
        <Tool label="Zitat" on={active?.quote} onClick={() => chain().toggleBlockquote().run()}>
          <TextQuote className="size-4" />
        </Tool>
        <Divider />
        <Tool label="Link" on={active?.link} onClick={setLink}>
          <LinkIcon className="size-4" />
        </Tool>
        <Tool label="Bild einfügen" onClick={() => imageInput.current?.click()}>
          <ImagePlus className="size-4" />
        </Tool>
        <Tool label="Datei anhängen" onClick={() => fileInput.current?.click()}>
          <Paperclip className="size-4" />
        </Tool>
        <span className="ml-auto hidden text-xs text-muted 2xl:block">
          Screenshots direkt einfügen (Strg/⌘ + V) oder Dateien hierher ziehen
        </span>
      </div>

      <EditorContent editor={editor} />

      {(attachments.length > 0 || uploading > 0) && (
        <ul className="flex flex-wrap gap-2 border-t border-line px-5 py-3">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded-lg border border-line bg-paper/50 py-1.5 pl-2.5 pr-1.5 text-sm">
              <FileText className="size-4 text-muted" />
              <span className="max-w-56 truncate">{a.filename}</span>
              <span className="text-xs text-muted">{fileSize(a.size)}</span>
              <button
                type="button"
                aria-label={`${a.filename} entfernen`}
                onClick={() => removeAttachment(a.id)}
                className="grid size-6 place-items-center rounded text-muted hover:bg-black/5 hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
          {uploading > 0 && (
            <li className="flex items-center gap-2 px-2 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" /> Wird hochgeladen …
            </li>
          )}
        </ul>
      )}

      {error && <p className="border-t border-line px-5 py-2 text-sm text-flag">{error}</p>}

      <div className="flex items-center gap-3 border-t border-line px-5 py-3">
        <button
          type="button"
          onClick={send}
          disabled={sending || uploading > 0}
          className="inline-flex items-center gap-2 rounded-lg bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-pine-deep disabled:opacity-60"
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Senden
        </button>
        {savedAt && (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Check className="size-3.5" /> Entwurf gespeichert um {clock(savedAt)} Uhr
          </span>
        )}
      </div>

      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          addFilesRef.current(Array.from(e.target.files ?? []), false)
          e.target.value = ''
        }}
      />
      <input
        ref={imageInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addFilesRef.current(Array.from(e.target.files ?? []), true)
          e.target.value = ''
        }}
      />
    </div>
  )
}
