# Alles Saniert - Frontend + Payload CMS Backend

Dieses Repository enthaelt:
- ein bestehendes statisches Frontend (HTML/CSS/JS)
- ein Payload-CMS-Backend in `backend/`

Strapi wurde vollstaendig entfernt. Payload ist die einzige CMS-/Backend-Loesung.

## Projektzweck

Das System ist ein Anfrage-Checkout fuer Werkzeugverleih (kein Payment-Checkout):
- Produkte und Kategorien anzeigen
- Mietzeitraum erfassen
- Preise serverseitig berechnen
- Anfrage speichern
- Betreiber per E-Mail informieren
- manuelle Annahme/Ablehnung im Betrieb

## Architektur (Kurz)

- Frontend: statisch, konsumiert Payload-APIs
- Backend: Payload + Next.js App Router + TypeScript
- DB (lokal): SQLite (`backend/data/payload.sqlite`)
- Medien: Payload `media` Collection
- Preislogik: Utility/Service im Backend

## Strapi -> Payload (abgeschlossen)

Entfernt:
- Strapi-Abhaengigkeiten
- Strapi-Modelle/Config/Annahmen

Ersetzt durch Payload:
- Collections: `users`, `media`, `categories`, `products`, `requests`
- Globals: `rental-settings`, `site-settings`, `contact-settings`, `legal-settings`
- API-Endpunkte unter `/api/catalog/*`, `/api/public/*`, `/api/admin/statistics`

## Wichtige Features

### Frontend
- DE/EN mit Sprach-Autodetect auf der Startseite
  - Standard: Deutsch
  - Wenn Browser-Sprache Englisch: EN-Startseite
- Consent-Banner (Opt-in)
- GTM/GA4 nur nach Consent
- Cookie-Einstellungsseiten:
  - `/cookie-einstellungen/` (DE)
  - `/en/cookie-settings/` (EN)
- Keine externen Google-Fonts
- Lokale Icon-CSS (kein CDN)
- Katalogtexte koennen aus Payload gepflegt werden (DE/EN)
- Startseite: "Beliebte Produkte" aus Payload auswahlbar

### Payload Admin
- Branding (Logo/Icon)
- Dashboard-Intro
- Schnellstatistik (aktive Produkte, aktive Kategorien, offene Anfragen, Anfragen letzte 7 Tage)
- Preview-/Live-Preview-Konfiguration fuer Produkte und Website-Einstellungen

## Setup

### 1) Backend

```powershell
cd backend
Copy-Item .env.example .env
# In .env ein eigenes PAYLOAD_SECRET setzen. Bootstrap nur einmal bewusst aktivieren.
npm install
npm run generate:types
npm run migrate
npm run seed
npm run dev
```

Wichtig: `generate:importmap` laeuft automatisch ueber `predev` / `prebuild` / `prestart`.

Backend URLs:
- Admin: `http://localhost:3001/admin`
- API: `http://localhost:3001/api`

### 2) Frontend lokal starten

Option A (falls eigenes Frontend auf Port 3000 laeuft):
- `http://localhost:3000`

Option B (statisches Frontend aus diesem Repo):

```powershell
cd ..
npm ci
npm run dev
```

Dann im Backend `.env` setzen:
- `FRONTEND_PUBLIC_URL=http://localhost:8000`
- `FRONTEND_PREVIEW_URL=http://localhost:8000`

Frontend URL:
- `http://localhost:8000`

## NPM Scripts (Backend)

```powershell
npm run dev
npm run build
npm run start
npm run generate:types
npm run generate:importmap
npm run migrate
npm run seed
npm test
```

## ENV Variablen (Auszug)

```env
PAYLOAD_SECRET=<unique-random-secret-at-least-32-characters>
DATABASE_URI=file:./data/payload.sqlite
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3001
FRONTEND_PUBLIC_URL=http://localhost:3000
FRONTEND_PREVIEW_URL=http://localhost:3000
FRONTEND_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000

BOOTSTRAP_ADMIN=false
PAYLOAD_ADMIN_EMAIL=<admin-email>
PAYLOAD_ADMIN_PASSWORD=<unique-password-at-least-16-characters>

REQUEST_NOTIFICATION_EMAIL=office@allessaniert.at
ENABLE_EMAIL_SENDING=false
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

TURNSTILE_SECRET_KEY=
TURNSTILE_BYPASS_FOR_DEV=true
CONTACT_RATE_LIMIT_WINDOW_MS=600000
CONTACT_RATE_LIMIT_MAX=8
```

## API Endpunkte

### Katalog
- `GET /api/catalog/products`
- `GET /api/catalog/products/slug/:slug`
- `GET /api/catalog/categories`
- `POST /api/catalog/pricing/calculate`
- `POST /api/catalog/requests`

### Oeffentlich
- `GET /api/public/site-config`
- `POST /api/public/contact`

### Admin
- `GET /api/admin/statistics` (nur authentifiziert)

## Preislogik

Tarife je Produkt:
- Tarif I: Tagespreis
- Tarif II: 3-Tages-Preis
- Tarif III: Wochenpreis (7 Tage)

Berechnung:
1. 7-Tages-Bloecke
2. 3-Tages-Bloecke
3. Resttage

Zusatzkosten:
- Pflichtversicherung (standardmaessig 10%, konfigurierbar)
- optionale Kaution
- optionale Reinigungsgebuehr

## Anfrage-Checkout

Ablauf:
1. Produkt abrufen
2. Mietdauer/Zeitraum eingeben
3. Preis serverseitig berechnen
4. Anfrage validieren und speichern
5. E-Mail an Betreiber ausloesen/vorbereiten
6. Status im Backend pflegen

## Consent / Tracking

- Default Consent Mode: denied
- Kein Analytics-Tracking ohne Zustimmung
- Nach Opt-in: GTM/GA4 werden dynamisch aktiviert
- Einwilligung kann auf den Cookie-Seiten geaendert oder widerrufen werden

## Sicherheit

- Kontaktformular mit Validierung (Client + Server)
- Honeypot gegen einfache Bots
- Cloudflare Turnstile
- In-Memory Rate-Limit fuer Kontakt-Endpunkt
- Security Header in Next-Konfiguration

## Admin-Statistikdaten und DSGVO

Die Dashboard-Schnellstatistik basiert ausschliesslich auf internen Collections:
- `products`
- `categories`
- `requests`

Hinweis:
- keine externe Analytics-Quelle fuer diese Kennzahlen notwendig
- nur aggregierte Darstellung verwenden
- keine zusaetzliche personenbezogene Speicherung fuer Statistikzwecke

## Tests

```powershell
cd backend
npm test
```

Abgedeckt:
- Preisberechnung
- Anfrageprozess
- API-Endpunkte

## Frontend-Anbindung (Payload statt Strapi)

- `shop.js` nutzt Payload unter `/api/catalog/*`
- Site-/Kontaktdaten kommen aus `/api/public/site-config`
- Kontaktformular nutzt `/api/public/contact`
- Beliebte Produkte werden im Global `site-settings` gepflegt

## Git-Hinweis

Folgende grosse Artefakte sollten nicht ins Repository:
- `backend/.next/`
- `backend/node_modules/`
- `backend/data/`

## Weitere Doku

- `docs/BACKEND_DOKUMENTATION.md`
- `docs/ENDNUTZER_PFLEGEANLEITUNG.md`
- `docs/GO_LIVE_CHECKLISTE.md`

## Audit und Produktionsvorbereitung (26.10.2026)

Das Frontend wird ausschließlich mit dem begrenzten Server `npm run dev` im Repository-Root gestartet. Nicht das gesamte Repository über einen allgemeinen Dateiserver veröffentlichen. Node-Version: `.nvmrc` (24.22.1).

- Frontend-Prüfungen: `npm run lint`, `npm run test:static`, `npm run test:e2e` (lokale Dienste müssen laufen; Chrome erforderlich).
- Backend-Prüfungen: `npm --prefix backend test`, `npm --prefix backend run typecheck`, `npm --prefix backend run build`. Der Produktionsbuild erfordert ein starkes PAYLOAD_SECRET; die aktuelle lokale Entwicklungskonfiguration wird dabei bewusst abgelehnt, falls unsicher.
- Statische DE/EN-Inhalte: `locales/de.json` / `locales/en.json`, danach `npm run build:content`. CMS-Produkte und Kategorien haben eigene optionale englische Felder. Gemeinsame interaktive Texte stehen in `i18n.js`, Katalogtexte in `shop.js`, Consent-Texte in `consent.js`.
- Öffentliches Frontend-Paket: tatsächliche HTTPS-Backendadresse als `BACKEND_PUBLIC_URL` setzen, dann `npm run export`. Nur `dist/` hosten.
- Standalone-Backend: `npm --prefix backend run build` bereitet statische Dateien vor und entfernt dotenv-Dateien aus dem Paket. Runtime-Secrets, DATABASE_URI und MEDIA_DIR separat bereitstellen. `npm --prefix backend start` setzt standardmäßig Port 3001 und bindet an Loopback.
- Migrationen: `backend/src/migrations/` enthält eine additive Baseline für neue und bestehende Datenbanken. Vor dem ersten produktiven Lauf Backup und Test an einer Kopie; keine `migrate:fresh`-Befehle auf vorhandenen Nutzdaten. Entwicklungsschema nur lokal automatisch; Produktion migriert explizit.
- Siehe [AUDIT_REPORT.md](AUDIT_REPORT.md), [SECURITY_REPORT.md](SECURITY_REPORT.md), [PERFORMANCE_REPORT.md](PERFORMANCE_REPORT.md), [LEGAL_COMPLIANCE_REPORT.md](LEGAL_COMPLIANCE_REPORT.md), [TEST_REPORT.md](TEST_REPORT.md) und [GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md).
