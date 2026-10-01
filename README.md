# Ferienhaus

Ferienhäuser als Gruppe sammeln, filtern, vergleichen und abstimmen. Mobile-first, Next.js 16, Tailwind 4, Leaflet/OpenStreetMap.

## Funktionen

- **Häuser erfassen** in wenigen Feldern: Link einfügen füllt Name, Titelbild, Quelle und oft Koordinaten automatisch (Airbnb klappt, andere Portale je nach Seite)
- **Felder:** Bilder (Upload oder URL, erstes = Titelbild), Name, Link, Quelle, Schlafplätze, Gesamtpreis, Preis/Nacht, Preis pro Person (berechnet), Pool, Entfernung zum Meer, Zeitraum, Ausstattung (WLAN, Klima, Waschmaschine, Grill), Nachteile, Status, vorgeschlagen von
- **Filter** wie im Shop, kombinierbar: Preis p. P./gesamt, Schlafplätze, Meer, Pool, Ausstattung, Status, Quelle, Person, passt zum Reisezeitraum
- **Sortierung:** Stimmen, Preis, Schlafplätze, Strandnähe, neueste
- **Karte** mit Preis-Pins, **Vergleich** von 2 bis 3 Häusern (bester Wert grün markiert)
- **Herz-Voting und Kommentare** mit Namen, **Favorit und Ranking**, **Aktivitätsfeed**
- **WhatsApp-Teilen** pro Haus und für den aktuellen Stand

## Preisrechnung

- Nächte = Reisezeitraum (unter Einstellungen), sonst verfügbarer Zeitraum des Hauses
- Fehlt der Gesamtpreis: Preis/Nacht × Nächte (mit * markiert), umgekehrt genauso
- Preis pro Person = Gesamtpreis ÷ Mitreisende (Einstellungen), sonst ÷ Schlafplätze

## Lokal starten

```bash
pnpm install
pnpm dev
```

Ohne Datenbank speichert die App lokal in `.data/db.json`.

## Deploy auf Vercel

1. Repo in Vercel importieren
2. **Storage → Marketplace → Upstash Redis** verbinden (Free-Tier reicht). Die Variablen `KV_REST_API_URL` und `KV_REST_API_TOKEN` setzt Vercel automatisch.
3. Optional `GROUP_CODE` setzen, z. B. `sonne27`. Dann braucht jede Person den Code. Geteilte WhatsApp-Links enthalten ihn automatisch.
4. Redeploy

Ohne Redis zeigt die App auf Vercel einen gelben Hinweis, Daten gehen dann verloren.

## Hinweise

- Keine Konten: Jede Person gibt einmal ihren Namen ein (im Browser gespeichert). Jeder mit Zugang kann alles bearbeiten.
- Hochgeladene Fotos werden im Browser auf max. 1600 px verkleinert und in Redis gespeichert.
- Geokodierung über OpenStreetMap Nominatim, Kartenkacheln von OpenStreetMap.
