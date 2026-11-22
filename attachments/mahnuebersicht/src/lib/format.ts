import type { Mahnstufe } from '../data/posten'

const euroFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

export const euro = (betrag: number) => euroFormat.format(betrag)
export const datum = (iso: string) => new Date(iso).toLocaleDateString('de-DE')
export const mahnstufeText = (stufe: Mahnstufe) => (stufe === 0 ? 'Zahlungserinnerung' : `${stufe}. Mahnung`)
