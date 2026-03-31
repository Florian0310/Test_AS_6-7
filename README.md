# Alles Saniert - Frontend + Payload CMS Backend

Dieses Projekt kombiniert ein bestehendes statisches Frontend mit einem Payload-CMS-Backend.

Wichtig:
- Strapi wurde entfernt.
- Payload CMS ist die einzige aktive Backend-/CMS-Lösung.

## Projektziel

Die Plattform bildet einen Anfrage-Checkout für Werkzeugverleih ab:
- Produkte und Kategorien anzeigen
- Mietdauer/Zeitraum erfassen
- Preis serverseitig berechnen
- Anfrage speichern
- Betreiber wird per E-Mail informiert
- manuelle Annahme/Ablehnung durch Betreiber

Kein Zahlungs-Checkout und kein Warenkorb mit Payment.

## Technischer Stand

### Frontend
- Statisches HTML/CSS/JS im Repo-Root
- DE/EN-Frontend mit Sprach-Autodetect auf der Startseite:
  - Standard: Deutsch
  - Bei englischer Browser-Sprache automatische EN-Startseite
- Consent-Banner mit Opt-in (notwendig + analytics)
- Google Tag Manager / GA4 nur nach Consent
- Cookie-Einstellungen Seiten:
  - `/cookie-einstellungen/` (DE)
  - `/en/cookie-settings/` (EN)
- Rechtsseiten:
  - `/impressum/`, `/datenschutz/`, `/cookie-richtlinie/`, `/barrierefreiheit/`
  - `/en/imprint/`, `/en/privacy-policy/`, `/en/cookie-policy/`, `/en/accessibility-statement/`
- Keine externen Google-Font Requests
- Kein externes Icon-CDN (lokale Icon-Styles)
- Startseite: „Beliebte Produkte“ wird aus Payload-Global gepflegt
- Sortiment: aufgeräumte Filter-UI, konsistente Kartenhöhen, bereinigte Debug-Ausgaben

### Backend
- Payload CMS + Next.js App Router in `backend/`
- SQLite für lokale Entwicklung
- Collections:
  - `users`, `media`, `categories`, `products`, `requests`
- Globals:
  - `rental-settings`
  - `site-settings`
  - `contact-settings`
  - `legal-settings`
- Admin-Verbesserungen:
  - Branding (Logo/Icon)
  - Dashboard-Intro
  - Dashboard-Schnellstatistik (aktive Produkte/Kategorien, offene Anfragen, 7-Tage-Anfragen)
- Public Endpoints:
  - `GET /api/catalog/products`
  - `GET /api/catalog/products/slug/:slug`
  - `GET /api/catalog/categories`
  - `POST /api/catalog/pricing/calculate`
  - `POST /api/catalog/requests`
  - `GET /api/public/site-config`
  - `POST /api/public/contact`
  - `GET /api/admin/statistics` (nur authentifiziert)

## Setup

### 1) Backend

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run generate:importmap
npm run generate:types
npm run migrate
npm run seed
npm run dev
```

Backend URLs:
- Admin: `http://localhost:3001/admin`
- API: `http://localhost:3001/api`

### 2) Frontend

```powershell
cd ..
python -m http.server 8000
```

Frontend URL:
- `http://localhost:8000`

## Wichtige Konfigurationsdateien

### Frontend `app-config.js`

```js
window.APP_CONFIG = Object.freeze({
  PAYLOAD_URL: 'http://localhost:3001',
  PAYLOAD_API_PREFIX: '/api',
  GTM_ID: '',
  GA4_MEASUREMENT_ID: '',
  TURNSTILE_SITE_KEY: '',
});
```

### Backend `.env` (Auszug)

```env
PAYLOAD_SECRET=change-me-in-production
DATABASE_URI=file:./data/payload.sqlite
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3001
FRONTEND_PUBLIC_URL=http://localhost:8000
FRONTEND_ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000

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

## Consent und Tracking

- Consent Mode v2 wird mit `denied` als Default gesetzt.
- Ohne Einwilligung kein Analytics-Tracking.
- Nach Opt-in werden GTM/GA4 dynamisch geladen.
- Consent kann auf den Cookie-Einstellungsseiten geaendert oder widerrufen werden.

## Formular- und Spam-Schutz

- Kontaktformular sendet an `POST /api/public/contact`
- Validierung client- und serverseitig
- Honeypot-Feld gegen einfache Bots
- Cloudflare Turnstile-Unterstuetzung
- In-Memory Rate-Limiting im Backend

## Preislogik (Backend)

Tarife pro Produkt:
- Tarif I: Tagespreis
- Tarif II: 3-Tages-Preis
- Tarif III: Wochenpreis (7 Tage)

Berechnung:
- zuerst 7-Tage-Bloecke
- dann 3-Tage-Bloecke
- dann Resttage
- Versicherung standardmäßig 10%
- Kaution/Reinigungsgebuehr separat

## Tests

```powershell
cd backend
npm test
```

Abgedeckt:
- Preisberechnung
- Anfrageprozess
- API-Endpunkte inkl. Contact-/Site-Config-Erweiterung

## Build / Production

```powershell
cd backend
npm run build
npm run start
```

## Frontend-Anbindung an Payload (statt Strapi)

- `shop.js` nutzt Payload-Endpoints unter `/api/catalog/*`
- Site-/Kontaktdaten können über `/api/public/site-config` geladen werden
- „Beliebte Produkte“ werden im Payload-Global `site-settings > Startseite > Beliebte Produkte` gewählt
- Kontaktformular nutzt `/api/public/contact`

## Wichtiger Hinweis zu GitHub Push

Das Repo ignoriert nun u.a.:
- `backend/.next/`
- `backend/node_modules/`
- `backend/data/`

Damit werden keine grossen Build-Cache-Dateien mehr mitgepusht.

## Weiterfuehrende Doku

- `docs/BACKEND_DOKUMENTATION.md`
- `docs/ENDNUTZER_PFLEGEANLEITUNG.md`
- `docs/GO_LIVE_CHECKLISTE.md`
