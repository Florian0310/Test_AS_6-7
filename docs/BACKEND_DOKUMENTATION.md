# Backend-Dokumentation (Payload, Deutsch)

## 1. Projektuebersicht

Das Backend basiert vollstaendig auf Payload CMS und ersetzt Strapi vollstaendig.

Kernfunktionen:
- Produktkatalog (Kategorien, Produkte, Medien)
- Anfrage-Checkout fuer Mietanfragen
- Serverseitige Preisberechnung (Tag / 3-Tage / Woche)
- E-Mail-Benachrichtigung fuer Anfragen
- Oeffentliche Endpunkte fuer Frontend-Daten
- Kontakt-Endpoint mit Validierung, Turnstile und Rate-Limit

## 2. Collections und Globals

### Collections
- `users` (Admin-Login)
- `media` (Bilder)
- `categories`
- `products`
- `requests`

### Globals
- `rental-settings` (Tarif-/Anfrage-Defaults)
- `site-settings` (SEO, Tracking IDs, Basis-Seitenkonfig)
- `contact-settings` (Firma, Adresse, Kontakt, Kontakt-Empfaenger)
- `legal-settings` (DE/EN Rechtstexte)

## 3. Endpunkte

### Katalog
- `GET /api/catalog/products`
- `GET /api/catalog/products/slug/:slug`
- `GET /api/catalog/categories`
- `POST /api/catalog/pricing/calculate`
- `POST /api/catalog/requests`

### Oeffentlich / Frontend
- `GET /api/public/site-config`
- `POST /api/public/contact`

## 4. Preislogik

Reihenfolge:
1. Wochenbloecke (7 Tage)
2. 3-Tages-Bloecke
3. Resttage

Zusatzlogik:
- Versicherung standardmaessig 10% (global konfigurierbar)
- Optionale Kaution
- Optionale Reinigungsgebuehr
- Mindestmietdauer-Pruefung

## 5. Kontaktformular-Sicherheit

`POST /api/public/contact` implementiert:
- serverseitige Schema-Validierung
- Honeypot-Feld
- Cloudflare Turnstile-Verifikation
- Rate-Limiting (In-Memory)
- E-Mail-Versand ueber bestehende Mail-Logik

## 6. Installation und Start

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

## 7. Relevante ENV-Variablen

```env
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

## 8. Migration Strapi -> Payload

Entfernt:
- Strapi-Abhaengigkeiten
- Strapi-Konfiguration
- Strapi-Datenmodelle und API-Annahmen

Ersetzt durch Payload:
- Collections + Globals
- Custom Endpoints unter `/api/catalog/*` und `/api/public/*`
- TypeScript-basierte Services (`pricingService`, `requestService`, `emailService`, `turnstileService`)

## 9. Tests

```powershell
cd backend
npm test
```

Abgedeckt:
- Preisberechnung
- Anfrageprozess
- API-Endpoints (inkl. Site-Config und Contact-Validierung)
