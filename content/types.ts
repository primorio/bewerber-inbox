/**
 * Wann eine Mail im Posteingang erscheint.
 *
 * - start:         liegt schon da, wenn der Posteingang zum ersten Mal geöffnet wird.
 *                  `minutesBeforeStart` verschiebt nur den angezeigten Zeitstempel in die Vergangenheit.
 * - afterMinutes:  kommt x Minuten nach dem Start rein.
 * - afterReplyTo:  kommt rein, nachdem auf eine andere Mail geantwortet wurde (optional mit Verzögerung).
 */
export type Arrival =
  | { type: 'start'; minutesBeforeStart?: number }
  | { type: 'afterMinutes'; minutes: number }
  | { type: 'afterReplyTo'; emailId: string; delayMinutes?: number }

export interface Sender {
  name: string
  email: string
  /** Rolle/Firma, wird unter dem Namen angezeigt */
  role?: string
}

export interface EmailAttachment {
  /** Anzeigename */
  name: string
  /**
   * Pfad unter /attachments.
   * Ein Ordner wird als ZIP ausgeliefert: attachments/mahnuebersicht/ -> "/attachments/mahnuebersicht.zip".
   * Eine einzelne Datei direkt: attachments/preisliste.pdf -> "/attachments/preisliste.pdf".
   */
  href: string
  hint?: string
}

export interface EmailDefinition {
  /** Stabile ID. Nicht mehr ändern, sobald Bewerber damit arbeiten – sie landet in der Datenbank. */
  id: string
  from: Sender
  subject: string
  /** Reiner Text. Leerzeilen trennen Absätze. */
  body: string
  arrival: Arrival
  attachments?: EmailAttachment[]
  /** Markiert die Mail im Posteingang als dringend */
  urgent?: boolean
  expectedReply?: string
}
