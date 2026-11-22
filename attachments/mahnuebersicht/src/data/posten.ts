/** 0 = Zahlungserinnerung, 1–3 = Mahnung der jeweiligen Stufe */
export type Mahnstufe = 0 | 1 | 2 | 3

export interface OffenerPosten {
  id: string
  mieter: string
  objekt: string
  einheit: string
  /** ISO-Datum, seit dem der Posten fällig ist */
  faelligSeit: string
  mahnstufe: Mahnstufe
  betrag: number
  /** Im Datenmodell vorhanden, wird in der Oberfläche bisher nicht verwendet. */
  ratenzahlung: boolean
}

export const offenePosten: OffenerPosten[] = [
  { id: 'p-01', mieter: 'Aylin Demir', objekt: 'Hafenstraße 12', einheit: 'WE 03', faelligSeit: '2026-09-03', mahnstufe: 2, betrag: 1240.0, ratenzahlung: false },
  { id: 'p-02', mieter: 'Jörg Matthiesen', objekt: 'Hafenstraße 12', einheit: 'WE 07', faelligSeit: '2026-10-03', mahnstufe: 1, betrag: 615.5, ratenzahlung: true },
  { id: 'p-03', mieter: 'Praxis Dr. Sommer', objekt: 'Am Markt 4', einheit: 'GE 01', faelligSeit: '2026-08-05', mahnstufe: 3, betrag: 4380.0, ratenzahlung: false },
  { id: 'p-04', mieter: 'Lena Brückner', objekt: 'Am Markt 4', einheit: 'WE 11', faelligSeit: '2026-11-03', mahnstufe: 0, betrag: 389.0, ratenzahlung: false },
  { id: 'p-05', mieter: 'Familie Okafor', objekt: 'Lindenallee 27', einheit: 'WE 02', faelligSeit: '2026-10-05', mahnstufe: 1, betrag: 870.25, ratenzahlung: true },
  { id: 'p-06', mieter: 'Tobias Reimann', objekt: 'Lindenallee 27', einheit: 'WE 05', faelligSeit: '2026-09-04', mahnstufe: 2, betrag: 1695.0, ratenzahlung: false },
  { id: 'p-07', mieter: 'Café Küstenkind', objekt: 'Deichweg 9', einheit: 'GE 02', faelligSeit: '2026-10-01', mahnstufe: 1, betrag: 2150.0, ratenzahlung: false },
  { id: 'p-08', mieter: 'Marta Nowak', objekt: 'Deichweg 9', einheit: 'WE 04', faelligSeit: '2026-11-04', mahnstufe: 0, betrag: 412.8, ratenzahlung: false },
  { id: 'p-09', mieter: 'Henning Clausen', objekt: 'Speicherhof 3', einheit: 'WE 09', faelligSeit: '2026-07-03', mahnstufe: 3, betrag: 3020.0, ratenzahlung: false },
  { id: 'p-10', mieter: 'Sophie Wagenknecht', objekt: 'Speicherhof 3', einheit: 'WE 14', faelligSeit: '2026-10-04', mahnstufe: 1, betrag: 540.0, ratenzahlung: false },
  { id: 'p-11', mieter: 'Ibrahim Yıldız', objekt: 'Speicherhof 3', einheit: 'WE 02', faelligSeit: '2026-11-03', mahnstufe: 0, betrag: 298.4, ratenzahlung: false },
  { id: 'p-12', mieter: 'Steuerkanzlei Albers', objekt: 'Am Markt 4', einheit: 'GE 03', faelligSeit: '2026-09-01', mahnstufe: 2, betrag: 2760.0, ratenzahlung: false },
]
