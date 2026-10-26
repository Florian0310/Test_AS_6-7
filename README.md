# Alles Saniert – Website und Payload CMS

Werkzeugverleih mit unverbindlichen Anfragen, serverseitigen Preisen und persönlicher Bestätigung. Betreiber: Willy Schröder, Fotzebenweg 3, 2763 Pernitz. Privatkunden, Unternehmen und Vereine können anfragen; es gibt keinen Payment-Checkout.

**Stack:** statisches HTML/CSS und native JavaScript-Module im Frontend; Payload 3 / Next.js 16 / TypeScript mit SQLite im Backend. Bestehende URLs und CMS-Daten bleiben erhalten.

## Projektstruktur

```text
.
├── frontend/
│   ├── src/                  # Browsercode: components, pages, data, config, lib, i18n
│   ├── styles/               # Design-Tokens und Komponenten-/Seitenstyles
│   ├── templates/            # Gemeinsamer Seitenrahmen und HTML-Inhaltsvorlagen
│   ├── locales/              # Zentrale DE-/EN-Quelldateien
│   └── public/               # Unverändert zu kopierende Assets und öffentliche Konfiguration
├── backend/
│   ├── src/                  # App, Collections, Globals, Services, Endpunkte, Migrationen
│   ├── scripts/              # Standalone-Paketierung und Produktionsstart
│   ├── tests/                # Backend-Tests
│   ├── data/                 # Lokale persistente Daten, nicht versioniert
│   └── media/                # CMS-Uploads, nicht versioniert
├── scripts/
│   ├── build/                # Seiten, Übersetzungen, Styles, SEO und Export
│   ├── check/                # Statische, Dokumentations-, API- und Produktionsprüfungen
│   ├── dev/                  # Lokaler Frontend-Server
│   ├── perf/                 # Lighthouse-Messung
│   └── lib/                  # Gemeinsame Projektpfade
├── tests/                    # Frontend-Zustandstests und Browserprüfungen
├── docs/                     # Guides, aktuelle Berichte und gekennzeichnetes Archiv
├── deploy/                   # Anzupassende Infrastrukturvorlagen
├── dist/                     # Generiertes öffentliches Frontend, nicht versioniert
└── artifacts/                # Lokale Prüfberichte/Screenshots, nicht versioniert
```

Root-Konfigurationen wie `package.json`, ESLint, Playwright und `.nvmrc` liegen weiterhin am üblichen Werkzeug-Einstieg. Das Backend behält seine eigenen Paket-, Framework- und Typkonfigurationen. Dokumentationsdateien verwenden kleingeschriebene Namen mit Bindestrichen; `README.md` ist der übliche Einstieg.

## Setup und lokaler Start

Node **24.22.1** gemäß `.nvmrc` aktivieren, dann im Repository:

```powershell
npm ci
npm --prefix backend ci
```

Nur bei neuer Einrichtung `backend/.env.example` nach `backend/.env` kopieren und ein eigenes zufälliges `PAYLOAD_SECRET` mit mindestens 32 Zeichen setzen. Vorhandene Konfiguration und Daten niemals überschreiben. Migrationen/optionale Seeds für eine neue Umgebung sind in [Entwicklung](docs/guides/development.md) beschrieben.

Zwei Terminals im Repository öffnen:

```powershell
npm run dev
```

```powershell
npm --prefix backend run dev
```

- [Website](http://localhost:8000) und [Sortiment](http://localhost:8000/sortiment/)
- [Payload-Administration](http://localhost:3001/admin)

Der Frontend-Start baut zunächst `dist/` und liefert ausschließlich diese Ausgabe aus. Nach Änderungen an Vorlagen, Übersetzungen, Styles **oder Browsercode** erneut `npm run build` ausführen und die Seite aktualisieren. Es gibt keinen automatischen Datei-Watcher.

## Quellen und Konfiguration

- Interaktionen: `frontend/src/pages/`; gemeinsame Komponenten: `frontend/src/components/`.
- CMS-Zugriff und Normalisierung: `frontend/src/data/`; reine Zustandslogik: `frontend/src/lib/`.
- Routen und Betreiber-Fallbacks: `frontend/src/config/`.
- Header/Footer: `frontend/templates/shell.mjs`; weitere Inhaltsquellen: `frontend/templates/pages/`, `frontend/locales/` und `scripts/build/content.mjs`.
- Öffentliche lokale Backend-/Tracking-/Turnstile-Einstellungen: `frontend/public/app-config.js`. Eine Vorlage liegt daneben. Dort niemals Secrets eintragen.
- Backend-Secrets, Datenbank, CORS, SMTP: ausschließlich `backend/.env` bzw. geschützte Dienst-Umgebung.

`dist/` enthält dieselben öffentlichen Pfade wie zuvor, einschließlich `/frontend/main.js`, `/assets/`, Sprachseiten und Produktdetail-URLs. Build-Ausgaben nicht bearbeiten oder committen. Das Nachrichtenmodul unter `dist/frontend/i18n/messages.js` entsteht aus den Sprachdateien. Browserimporte werden gegen diese öffentliche Ausgabe aufgelöst. Kleine alte Skript-Einstiege bleiben für bestehende Asset-URLs erhalten.

## Wichtige Befehle

| Befehl | Zweck |
|---|---|
| `npm run build` | Sauberes Frontend in `dist/` erzeugen |
| `npm run lint` | Frontend-/Build-/Testcode prüfen |
| `npm run test:static` | 27 Seiten, Module, Links, Bilder/CSS-Ressourcen prüfen |
| `npm run test:docs` | Lokale Markdown-Verweise prüfen |
| `npm run test:frontend` | Katalogzustand und Sprachrouten prüfen |
| `npm --prefix backend test` | Backend-Tests ausführen |
| `npm --prefix backend run typecheck` | Backend-Typprüfung |
| `npm run test:e2e` | Chrome-Browsertests; beide Dienste müssen laufen |
| `npm run test:api` | Zugriffsregeln, Header und ungültige Eingaben prüfen |
| `npm --prefix backend run build` | Produktionspaket mit gültigem Secret bauen |
| `npm run test:production` | Produktionsprüfung auf Datenbankkopie; Windows/Python erforderlich |
| `npm run perf -- <label>` | Lighthouse-Laborlauf in lokalem Chrome |

Prüfbefunde stehen unter `artifacts/`. Migrationstests mit `npm run test:migrations` benötigen die im Guide beschriebene alte Sicherung; nicht auf die Arbeitsdatenbank umstellen. Abhängigkeiten mit `npm audit --audit-level=moderate` in beiden Paketen prüfen.

## Veröffentlichung und Dokumentation

`BACKEND_PUBLIC_URL` auf die echte HTTPS-Adresse setzen und `npm run export` ausführen. Dieser Befehl baut neu und schreibt produktive öffentliche Konfiguration in `dist/`; ohne gültige Adresse bricht er ab. Nur `dist/` veröffentlichen. Ein normaler Build stellt anschließend die lokale Konfiguration wieder her.

- [Dokumentationsübersicht](docs/README.md)
- [Architektur](docs/guides/architecture.md)
- [Entwicklung und Tests](docs/guides/development.md)
- [Deployment und Betrieb](docs/guides/deployment.md)
- [Änderungen der Projektstruktur](docs/reports/structure-cleanup.md)
- [Go-Live-Checkliste](docs/go-live-checklist.md)

**Go-Live bleibt NO-GO:** Produktive Infrastruktur/Secrets, reale E-Mail-Zustellung, rechtliche/steuerliche Angaben und Produktfreigaben sind noch offen. Diese Strukturänderung veröffentlicht nichts und verändert keine Geschäftsfunktionen oder bestehenden CMS-Daten.
