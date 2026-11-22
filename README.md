# Posteingang

Eine kleine Arbeitsprobe: ein Posteingang mit Nachrichten, die du so bearbeitest, wie du es im Job tun würdest.

## Starten

Du brauchst [Node.js](https://nodejs.org) in Version 22.13 oder neuer.

```bash
npm install
npm run dev
```

Danach öffnest du <http://localhost:4747> im Browser.

## Arbeiten

- Du antwortest direkt auf die Nachrichten. Antworten können formatierten Text, eingefügte Bilder (zum Beispiel Screenshots per Strg/⌘ + V) und Dateianhänge enthalten.
- Entwürfe werden automatisch gespeichert. Du kannst die App jederzeit beenden und später weitermachen.
- Während du arbeitest, kann neue Post eintreffen.

## Abgeben

Oben rechts auf **Fortschritt herunterladen** klicken. Du bekommst eine einzelne Datei (`abgabe-….db`), die du an deinen Ansprechpartner bei uns schickst. Sie enthält deine Antworten, deine Anhänge und Zeitstempel deiner Aktivität im Posteingang.

Alles liegt nur lokal auf deinem Rechner in `data/inbox.db`. Mit `npm run reset` fängst du von vorne an.

## Aufbau

| Ort | Inhalt |
| --- | --- |
| `content/emails.ts` | Die Nachrichten im Posteingang und wann sie eintreffen |
| `server/` | Lokale API auf SQLite (`node:sqlite`), läuft im selben Prozess wie Vite |
| `src/` | Oberfläche mit React und TanStack Router |
| `attachments/` | Anhänge der Mails. Ein Ordner hier wird beim Herunterladen automatisch als ZIP gepackt, zum Beispiel das Frontend-Projekt `attachments/mahnuebersicht/` |
| `scripts/report.mjs` | Liest eine abgegebene Datenbank aus: `npm run report -- abgabe.db` |
