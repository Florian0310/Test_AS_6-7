# Alles Saniert - Werkzeugverleih mit Payload CMS

Dieses Repository enthaelt ein bestehendes statisches Frontend und ein vollstaendig auf Payload CMS umgestelltes Backend fuer einen Werkzeugverleih.

Wichtig: Strapi wurde aus dem Projekt entfernt und durch Payload ersetzt.

## Projektzweck

Das System ist bewusst kein klassischer Onlineshop mit Zahlung.

Es ist ein Anfrage-Checkout:
- Produkte anzeigen
- Mietzeitraum oder Miettage erfassen
- Preis serverseitig berechnen
- Anfrage speichern
- E-Mail an Betreiber senden oder vorbereitet protokollieren
- Betreiber entscheidet manuell

## Architektur (kurz)

- Frontend: statisches HTML/CSS/JS im Repository-Root
- Backend: Payload CMS 3.x + Next.js App Router in `backend/`
- Sprache/Stack: TypeScript, Node.js
- Datenbank: SQLite (pragmatisch fuer lokale Entwicklung, kein extra DB-Server noetig)
- Medien: Payload Upload Collection `media`
- Tests: Vitest

## Strapi wurde entfernt

Entfernt bzw. ersetzt:
- fruehere Strapi-Backend-Struktur in `backend/` (vollstaendig ersetzt)
- Strapi-Dependencies und Strapi-Konfiguration
- Strapi-spezifische API-Annahmen im Frontend (`shop.js`, `app-config.js`)
- Strapi-Hinweise in der Projektdokumentation

Aktive Backend-Loesung:
- ausschliesslich Payload CMS

## Projektstruktur (relevant)

```text
.
|-- app-config.js
|-- app-config.example.js
|-- shop.js
|-- index.html
|-- sortiment/
|-- backend/
|   |-- package.json
|   |-- payload.config.ts
|   |-- next.config.mjs
|   |-- src/
|   |   |-- app/(payload)/
|   |   |   |-- layout.tsx
|   |   |   |-- admin/
|   |   |   |   |-- importMap.js
|   |   |   |   `-- [[...segments]]/page.tsx
|   |   |   `-- api/[...slug]/route.ts
|   |   |-- collections/
|   |   |   |-- Categories.ts
|   |   |   |-- Products.ts
|   |   |   |-- Requests.ts
|   |   |   |-- Media.ts
|   |   |   `-- Users.ts
|   |   |-- globals/
|   |   |   `-- RentalSettings.ts
|   |   |-- endpoints/
|   |   |   `-- publicEndpoints.ts
|   |   |-- services/
|   |   |   |-- pricingService.ts
|   |   |   |-- requestService.ts
|   |   |   `-- emailService.ts
|   |   |-- utils/
|   |   |   |-- pricing.ts
|   |   |   |-- slug.ts
|   |   |   `-- access.ts
|   |   |-- seed/
|   |   |   |-- defaultCategories.ts
|   |   |   |-- defaultProducts.ts
|   |   |   `-- runSeed.ts
|   |   |-- migrations/
|   |   |   `-- .gitkeep
|   |   `-- payload-types.ts
|   `-- tests/
|       |-- pricing.test.ts
|       |-- request-process.test.ts
|       `-- endpoints.test.ts
`-- docs/
    |-- BACKEND_DOKUMENTATION.md
    `-- ENDNUTZER_PFLEGEANLEITUNG.md
```

## Setup

### 1) Backend vorbereiten

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run generate:importmap
npm run generate:types
npm run migrate
npm run seed
```

### 2) Backend starten

```powershell
cd backend
npm run dev
```

Erreichbar:
- Admin: `http://localhost:3001/admin`
- API: `http://localhost:3001/api`

### 3) Frontend starten

```powershell
cd ..
python -m http.server 8000
```

Erreichbar:
- Frontend: `http://localhost:8000`

## Runtime-Konfiguration Frontend

`app-config.js`:

```js
window.APP_CONFIG = Object.freeze({
  PAYLOAD_URL: 'http://localhost:3001',
  PAYLOAD_API_PREFIX: '/api',
});
```

## Wichtige Collections und Global

- `categories`
- `products`
- `requests`
- `media`
- Global: `rental-settings`

## Wichtige Endpoints

Custom Catalog API:
- `GET /api/catalog/products`
- `GET /api/catalog/products/slug/:slug`
- `GET /api/catalog/categories`
- `POST /api/catalog/pricing/calculate`
- `POST /api/catalog/requests`

Zusaetzlich: Standard-Payload-REST unter `/api/<collection>`.

## Preislogik

Tarife je Produkt:
- Tarif I: Tagespreis
- Tarif II: 3-Tages-Preis
- Tarif III: Wochenpreis (7 Tage)

Berechnung:
- Wochenbloecke (7 Tage)
- danach 3-Tages-Bloecke
- danach Resttage als Tagespreis

Beispiele:
- 1 Tag = Tagespreis
- 3 Tage = 3-Tages-Preis
- 7 Tage = Wochenpreis
- 10 Tage = Wochenpreis + 3-Tages-Preis
- 8 Tage = Wochenpreis + 1 Tagespreis
- 11 Tage = Wochenpreis + 3-Tages-Preis + 1 Tagespreis

Zusatz:
- Pflichtversicherung standardmaessig 10% auf Mietpreis
- Kaution separat
- Reinigungsgebuehr separat

Rueckgabe ist strukturiert (`blocks`, `unitPrices`, `subtotals`, `insurance`).

## Anfrage-Checkout

Ablauf:
1. Produktdaten laden
2. Preis berechnen
3. Anfrage validieren
4. Anfrage speichern
5. E-Mail senden oder vorbereiten
6. Status im Backend pflegen (`new`, `in_progress`, `answered`, `accepted`, `rejected`, `completed`)

## E-Mail-Logik

- Implementierung in `backend/src/services/emailService.ts`
- Bei `ENABLE_EMAIL_SENDING=false` wird E-Mail als `prepared` in Anfrage gespeichert
- Bei `ENABLE_EMAIL_SENDING=true` wird SMTP verwendet

Relevante ENVs (`backend/.env`):
- `REQUEST_NOTIFICATION_EMAIL`
- `ENABLE_EMAIL_SENDING`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`

## Tests

```powershell
cd backend
npm test
```

Abgedeckt:
- Preisberechnung (Tarifkombinationen, Versicherung, Kaution, Reinigungsgebuehr, Mindestmiete, Input-Validierung)
- Anfrageprozess (Speichern, Status, Produkt-Snapshot, E-Mail-Trigger)
- Endpoints (Produkte, Produkt per Slug, Kategorien, Pricing, Anfrage)

## Frontend-Umstellung von Strapi auf Payload

In der bestehenden Frontend-Integration wurde umgestellt:
- `STRAPI_URL` -> `PAYLOAD_URL`
- `STRAPI_API_PREFIX` -> `PAYLOAD_API_PREFIX`
- API-Ziele auf `/api/catalog/*` und `/api/globals/rental-settings`
- Datenmapping in `shop.js` auf Payload-Produktstruktur (`title`, `pricing`, `availabilityStatus`)

Wenn weitere Frontend-Teile noch alte Endpoints verwenden, muessen sie auf die oben genannten Payload-Endpoints migriert werden.

## Build / Production

```powershell
cd backend
npm run build
npm run start
```

## Erweiterung (spaeter)

- echte Verfuegbarkeitsverwaltung mit Reservierungsbestaenden
- Reservierungskalender
- E-Mail-Adapter direkt ueber Payload konfigurieren
- SEO-Ausbau
- echtes Buchungs- oder Checkout-System

## Weiterfuehrende Doku

- Technik + API + Migration: `docs/BACKEND_DOKUMENTATION.md`
- Endnutzer-Adminpflege: `docs/ENDNUTZER_PFLEGEANLEITUNG.md`
