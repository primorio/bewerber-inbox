import { avatarTone, initials } from '../lib/format'

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-medium text-white"
      style={{ width: size, height: size, background: avatarTone(name), fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  )
}
