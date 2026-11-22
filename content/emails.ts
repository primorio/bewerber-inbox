import type { EmailDefinition, Sender } from './types.ts'

/**
 * Alle Mails, die im Posteingang landen.
 * Reihenfolge hier = Reihenfolge bei gleichem Zeitstempel.
 */

const felix: Sender = {
  name: 'Felix Brandner',
  email: 'felix.brandner@primorio.example',
  role: 'Geschäftsführer, Primorio',
}

const niklas: Sender = {
  name: 'Niklas Ohlendorf',
  email: 'niklas.ohlendorf@primorio.example',
  role: 'CTO, Primorio',
}

const mara: Sender = {
  name: 'Mara Lindqvist',
  email: 'mara.lindqvist@primorio.example',
  role: 'Customer Success, Primorio',
}

const tarek: Sender = {
  name: 'Tarek Aydin',
  email: 'tarek.aydin@primorio.example',
  role: 'Vertrieb, Primorio',
}

const jule: Sender = {
  name: 'Jule Petersen',
  email: 'jule.petersen@primorio.example',
  role: 'Produkt, Primorio',
}

export const emails: EmailDefinition[] = [
  {
    id: 'linkedin-post',
    from: felix,
    subject: 'LinkedIn – jeder einen Post, bitte',
    arrival: { type: 'start', minutesBeforeStart: 190 },
    body: `Hi,

wir brauchen mal wieder ein bisschen Aktivität auf LinkedIn. Jeder aus unserem Team soll einen Post erstellen. Es ist komplett egal was, Hauptsache wir posten auf unseren Accounts etwas, damit diese für zukünftige Interessenten belebt aussehen.

Schick mir den Post einfach als E-Mail oder PDF-Anhang zurück, ich plane die dann für die nächsten Wochen ein.

Danke dir
Felix`,
  },
  {
    id: 'demo-freitag',
    from: niklas,
    subject: 'Demo-Runde: du bist dran',
    arrival: { type: 'start', minutesBeforeStart: 140 },
    body: `Moin,

bei der nächsten Demo-Runde bist du dran. Die Regeln kennst du, hier trotzdem nochmal:

Bau mit Claude Code (oder einem anderen KI-Werkzeug deiner Wahl) irgendein eigenes Stück Hausverwaltungssoftware. Thema ist völlig frei. Das kann etwas sein, das es bei uns noch gar nicht gibt, etwas, das dich bei uns nervt und das du isoliert als Mock besser baust, oder etwas, das ohne KI vor zwei Jahren niemand gebaut hätte. Es muss nicht an unsere Codebasis andocken und es muss auch nicht fertig sein.

Schick mir einfach zurück, was du gebaut hast (du kannst uns dann im nächsten Termin eine Demo geben).

Bin gespannt
Niklas`,
  },
  {
    id: 'vertragsaenderungen',
    from: tarek,
    subject: 'WG: Ihr Angebot vom 14.11. – Änderungswünsche Vossberg',
    arrival: { type: 'start', minutesBeforeStart: 95 },
    attachments: [
      {
        name: 'Angebot_Primorio_Vossberg.pdf',
        href: '/attachments/Angebot_Primorio_Vossberg.pdf',
        hint: 'Unser Angebot vom 14.11. mit Zusatzvereinbarung und Vertragsbedingungen',
      },
    ],
    body: `Hey,

kannst du das hier bitte übernehmen? Ich bin ab morgen drei Tage auf der Messe und komme nicht dazu. Felix weiß, dass es bei dir liegt. Antworte Herrn Dr. Vossberg einfach direkt aus diesem Thread, er liest mit.

Zur Einordnung: 1.850 Einheiten, zwei Demos, die Buchhaltung dort will uns unbedingt. Unser Angebot hängt an, falls du nachlesen willst, was genau drinsteht. Es ist unser Standard: 1,20 € pro Einheit und Monat, 24 Monate Laufzeit, einmalig 4.900 € für die Datenmigration.

Danke!
Tarek

---------- Weitergeleitete Nachricht ----------
Von: Dr. Henrik Vossberg <h.vossberg@vossberg-toechter.example>
Betreff: Ihr Angebot vom 14.11.

Sehr geehrter Herr Aydin,

vielen Dank für das Angebot. Grundsätzlich möchten wir mit Primorio arbeiten. Bevor ich unterschreibe, müssen allerdings folgende Punkte angepasst werden:

1. Der Preis ist zu hoch. Uns liegt ein Angebot eines Wettbewerbers über 0,90 € je Einheit vor. Ich erwarte einen Nachlass von mindestens 25 %.
2. Kündigung jederzeit mit einer Frist von 14 Tagen, keine Mindestlaufzeit.
3. Preisgarantie über fünf Jahre, also fest bis Ende 2031.
4. Die Datenmigration ist kostenfrei. Das macht jeder Ihrer Wettbewerber so.
5. Die Schulung findet nicht remote statt, sondern vor Ort bei uns in Braunschweig: zwei volle Tage für alle 14 Mitarbeiter, ohne Mehrkosten.
6. Vertragsstrafe von 500 € je angefangener Stunde, in der das System nicht erreichbar ist.
7. Unbegrenzte Haftung Ihrerseits für sämtliche Folgeschäden aus Buchungsfehlern.
8. Gebietsschutz: keine weitere Hausverwaltung in Braunschweig erhält Ihre Software.
9. Die DATEV-Schnittstelle nach unseren Vorgaben wird bis zum 31.01. fertiggestellt, ohne Mehrkosten.
10. Hinterlegung des Quellcodes bei einem Treuhänder unserer Wahl.

Wenn Sie mir das bis Freitag so bestätigen, unterschreibe ich noch am selben Tag.

Mit freundlichen Grüßen
Dr. Henrik Vossberg
Geschäftsführender Gesellschafter
Vossberg & Töchter Immobilienverwaltung GmbH`,
  },
  {
    id: 'mahnuebersicht-ticket',
    from: jule,
    subject: 'Ticket #4821: Mahnübersicht – Kundenwunsch Nordlicht',
    arrival: { type: 'start', minutesBeforeStart: 60 },
    attachments: [
      {
        name: 'mahnuebersicht.zip',
        href: '/attachments/mahnuebersicht.zip',
        hint: 'Aktueller Stand als lauffähiges Frontend-Projekt (React, Vite)',
      },
    ],
    body: `Hi,

ich habe dir Ticket #4821 zugewiesen. Im Anhang findest du den aktuellen Stand unserer Mahnübersicht als kleines Frontend-Projekt, herausgelöst aus dem Produkt und ohne Backend. Entpacken, starten und direkt darin arbeiten, wie es geht, steht in der README.

Die Hausverwaltung Nordlicht (Frau Hansen, rund 3.200 Einheiten) schreibt dazu:

„Die Mahnübersicht ist für uns so nicht nutzbar. Wir können nur alle offenen Posten auf einmal mahnen. Wir haben aber Mieter mit Ratenzahlungsvereinbarung, die dürfen auf keinen Fall eine Mahnung bekommen. Außerdem wollen wir vor dem Versand sehen, was genau rausgeht, und nach Mahnstufe filtern können. Bitte ändern Sie das."

Setz das bitte im Mock um und schick mir das Ergebnis zurück, damit ich es Frau Hansen zeigen kann.

Danke
Jule`,
  },
  {
    id: 'vdiv-budget',
    from: felix,
    subject: 'Verwaltertag: 3.000 € statt Messestand',
    arrival: { type: 'start', minutesBeforeStart: 25 },
    body: `Hi,

kurze Version: Der kleinste Stand auf dem Deutschen Verwaltertag des VDIV liegt mit allem Drum und Dran weit über dem, was wir dieses Jahr ausgeben können. Ich habe dafür genau 3.000 € frei gemacht. Mehr gibt es nicht, auch nicht „nur dieses eine Mal".

Ich will trotzdem, dass wir aus diesen zwei Tagen mit neuen Kunden rausgehen. In Berlin sind dann über tausend Verwalter an einem Ort, so eine Gelegenheit haben wir das ganze Jahr nicht noch einmal.

Was machst du mit den 3.000 €? Schick mir bitte deinen Plan.

Felix`,
  },
  {
    id: 'testmandant-code',
    from: mara,
    subject: 'Ganz schnell: Freischaltcode Testmandant?',
    urgent: true,
    arrival: { type: 'afterMinutes', minutes: 12 },
    body: `Hey,

ich sitze in zehn Minuten im Onboarding-Call mit der Hausverwaltung Brandt und brauche den Freischaltcode für deren Testmandanten. Lukas hat ihn hinterlegt, bevor er in den Urlaub gefahren ist. Er meinte nur, der steht „im System", mehr weiß ich leider nicht und ans Telefon geht er nicht.

Kannst du ihn mir bitte schicken? Nur der Code reicht völlig.

Danke, du rettest mich
Mara`,
    expectedReply: 'PRM-TEST-7Q4X-91KD',
  },
  {
    id: 'absage-kroeger',
    from: {
      name: 'Sabine Kröger',
      email: 's.kroeger@kroeger-hausverwaltung.example',
      role: 'Inhaberin, Kröger Hausverwaltung',
    },
    subject: 'Unsere Entscheidung',
    arrival: { type: 'afterMinutes', minutes: 30 },
    body: `Guten Tag,

vielen Dank für die drei Termine und die Geduld mit unseren vielen Fragen. Wir haben uns intern beraten und uns für einen anderen Anbieter entschieden. Am Ende hat uns dort das Gesamtpaket etwas mehr überzeugt.

Das ist keine Entscheidung gegen Sie persönlich, die Gespräche waren immer angenehm.

Ich wünsche Ihnen und dem Team weiterhin viel Erfolg.

Freundliche Grüße
Sabine Kröger`,
  },
  {
    id: 'mahnuebersicht-nachtrag',
    from: {
      name: 'Kerstin Hansen',
      email: 'k.hansen@hv-nordlicht.example',
      role: 'Leitung Buchhaltung, Hausverwaltung Nordlicht',
    },
    subject: 'AW: Ticket #4821 – noch eine Sache zur Mahnübersicht',
    arrival: { type: 'afterReplyTo', emailId: 'mahnuebersicht-ticket', delayMinutes: 4 },
    body: `Hallo,

Frau Petersen hat mir Ihren Entwurf weitergeleitet, vielen Dank dafür.

Ich habe es gerade mit meiner Kollegin durchgesprochen und wir müssen leider nachschärfen. Einzelne Mieter auszunehmen reicht uns nicht. Wir haben zwei Objekte, die gerade verkauft werden, dort darf überhaupt nicht gemahnt werden, egal welcher Mieter. Und bei allen anderen soll die Zahlungsfrist in der Mahnung nicht fest sein, die legen wir je Mahnlauf selbst fest.

Können Sie das noch einbauen? Wir haben am Donnerstag Eigentümerversammlung und würden es dort gerne schon zeigen.

Viele Grüße
Kerstin Hansen`,
  },
]
