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
python -m http.server 8000
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
PAYLOAD_SECRET=change-me-in-production
DATABASE_URI=file:./data/payload.sqlite
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3001
FRONTEND_PUBLIC_URL=http://localhost:3000
FRONTEND_PREVIEW_URL=http://localhost:3000
FRONTEND_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000

PAYLOAD_ADMIN_EMAIL=admin@example.com
PAYLOAD_ADMIN_PASSWORD=ChangeMe123!

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
