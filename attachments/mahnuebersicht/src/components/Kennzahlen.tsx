import type { OffenerPosten } from '../data/posten'
import { euro } from '../lib/format'

export function Kennzahlen({ posten }: { posten: OffenerPosten[] }) {
  const summe = posten.reduce((s, p) => s + p.betrag, 0)
  const mieter = new Set(posten.map((p) => p.mieter)).size

  return (
    <dl className="kennzahlen">
      <div>
        <dt>Offene Posten</dt>
        <dd>{posten.length}</dd>
      </div>
      <div>
        <dt>Betroffene Mieter</dt>
        <dd>{mieter}</dd>
      </div>
      <div>
        <dt>Summe</dt>
        <dd>{euro(summe)}</dd>
      </div>
    </dl>
  )
}
