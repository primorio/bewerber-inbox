import type { OffenerPosten } from '../data/posten'
import { datum, euro } from '../lib/format'
import { MahnstufeBadge } from './MahnstufeBadge'

export function PostenTabelle({ posten }: { posten: OffenerPosten[] }) {
  return (
    <div className="tabelle-wrap">
      <table>
        <thead>
          <tr>
            <th>Mieter</th>
            <th>Objekt</th>
            <th>Einheit</th>
            <th>Fällig seit</th>
            <th>Mahnstufe</th>
            <th className="num">Offen</th>
          </tr>
        </thead>
        <tbody>
          {posten.map((p) => (
            <tr key={p.id}>
              <td>{p.mieter}</td>
              <td>{p.objekt}</td>
              <td>{p.einheit}</td>
              <td>{datum(p.faelligSeit)}</td>
              <td>
                <MahnstufeBadge stufe={p.mahnstufe} />
              </td>
              <td className="num">{euro(p.betrag)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
