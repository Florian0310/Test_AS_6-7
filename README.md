# Alles Saniert – Website und Payload CMS

Werkzeugverleih mit unverbindlichen Anfragen, serverseitiger Preisberechnung und persönlicher Bestätigung. Überwiegend für Privatkunden; Unternehmen und Vereine sind ebenfalls möglich. Bestätigter Betreiber: Willy Schröder, Fotzebenweg 3, 2763 Pernitz.

Das Frontend bleibt statisches HTML/CSS mit nativen JavaScript-Modulen. Das getrennte Backend verwendet Payload 3, Next.js 16 und TypeScript mit SQLite. Bestehende Routen, Collections und CMS-Daten bleiben erhalten. Es gibt keinen Payment-Checkout.

## Lokal starten

Node 24.22.1 gemäß `.nvmrc` verwenden. In zwei Terminals im Repository:

```powershell
npm ci
npm run dev
```

```powershell
npm --prefix backend ci
npm --prefix backend run dev
```

Nur bei der ersten Einrichtung `backend/.env.example` nach `backend/.env` kopieren und ein eigenes starkes `PAYLOAD_SECRET` eintragen. Bestehende Konfiguration und Datenbank erhalten. Keine Seeds oder frischen Migrationen auf einer bestehenden Datenbank starten. Details: [Entwicklung](docs/DEVELOPMENT.md).

- Website: <http://localhost:8000>
- Sortiment: <http://localhost:8000/sortiment/>
- CMS: <http://localhost:3001/admin>

`npm run dev` baut zuerst HTML, Übersetzungen und CSS. Nach Änderungen an Vorlagen, Übersetzungen oder Styles erneut `npm run build` ausführen. JavaScript-Module werden direkt ausgeliefert. Den vorgesehenen lokalen Server benutzen; keine internen Projektverzeichnisse allgemein freigeben.

## Orientierung

| Pfad | Aufgabe |
|---|---|
| `frontend/pages/` | Controller für Startseite, Katalog und Produktdetails |
| `frontend/components/` | Navigation, Produktkarte, Kontakt, Sprache und Consent |
| `frontend/data/` | Gemeinsamer API-Client und Normalisierung |
| `frontend/config/`, `frontend/lib/` | Betreiber-Fallback, Routen und Katalogzustand |
| `frontend/styles/` | Design-Tokens und Styles nach Zuständigkeit |
| `locales/de.json`, `locales/en.json` | Zentrale statische und dynamische Übersetzungen |
| `tools/templates/` | Gemeinsamer Header/Footer, Katalog und redaktionelle Vorlagen |
| `backend/src/` | Payload-Konfiguration, Collections, Globals, Endpunkte, Services |
| `tests/`, `backend/tests/` | Browser-, Frontend- und Backend-Prüfungen |

Die HTML-Dateien unter den öffentlichen Routen, `styles.css`, `sitemap.xml` und `frontend/i18n/messages.js` sind mitgeführte Build-Ausgaben. Änderungen an deren Quellen vornehmen. Alte Root-Skriptnamen sind kleine Kompatibilitätsmodule; Seiten laden ausschließlich `frontend/main.js`. Theme-Umschalter und Suchmodal sind entfernt. Die Header-Suche führt zum Katalog; Suche, Kategorie, Sortierung und Seite stehen in der URL.

## Prüfen

```powershell
npm run build
npm run lint
npm run test:static
npm run test:frontend
npm --prefix backend test
npm --prefix backend run typecheck
# Beide Dienste müssen laufen; Chrome wird benötigt:
npm run test:e2e
npm audit --audit-level=moderate
npm --prefix backend audit --audit-level=moderate
```

Produktionsbuild: `npm --prefix backend run build` mit gültigem Secret. Windows-Test mit isolierter Datenbankkopie: `node tools/production-smoke.mjs`. Labor-Messung: `node tools/measure.mjs refactor-after`. Ergebnisse liegen im nicht veröffentlichten Verzeichnis `artifacts/`.

## Dokumentation und Freigabe

- [Architektur](docs/ARCHITECTURE.md)
- [Entwicklung und Tests](docs/DEVELOPMENT.md)
- [Deployment und Betrieb](docs/DEPLOYMENT.md)
- [Refactoring-Bericht mit Messungen](docs/REFACTORING_REPORT.md)
- [Aktuelle Go-Live-Checkliste](docs/GO_LIVE_CHECKLIST.md)

**Go-Live: NO-GO.** Lokaler Review ist möglich. Produktive Infrastruktur/Secrets, reale E-Mail-Zustellung, rechtliche und steuerliche Angaben, Produktfreigabe sowie Betriebsabnahme fehlen. Historische Root-Audits dokumentieren den vorangehenden Stand; bei geänderten UI-Funktionen gilt der aktuelle Refactoring-Bericht. Es wurde nichts veröffentlicht.
