const time = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' })
const day = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' })
const full = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

export function shortDate(iso: string): string {
  const d = new Date(iso)
  return d.toDateString() === new Date().toDateString() ? time.format(d) : day.format(d)
}

export const fullDate = (iso: string) => `${full.format(new Date(iso))} Uhr`
export const clock = (iso: string) => time.format(new Date(iso))

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toLocaleString('de-DE', { maximumFractionDigits: 1 })} MB`
}

export function initials(name: string): string {
  const parts = name.replace(/^(Dr\.|Prof\.)\s+/i, '').split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '')).toUpperCase()
}

const AVATAR_TONES = ['#1f6f5c', '#8a4b2a', '#3d5a99', '#7a3e73', '#5d6b1e', '#a2452f', '#2c6f86']

export function avatarTone(name: string): string {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_TONES[h % AVATAR_TONES.length]
}
