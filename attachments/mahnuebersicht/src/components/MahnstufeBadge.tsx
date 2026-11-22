import type { Mahnstufe } from '../data/posten'
import { mahnstufeText } from '../lib/format'

export function MahnstufeBadge({ stufe }: { stufe: Mahnstufe }) {
  return <span className={`badge badge-${stufe}`}>{mahnstufeText(stufe)}</span>
}
