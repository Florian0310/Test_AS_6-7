> Aktueller Auditstand vom 26.10.2026: [Go-live-Checkliste](../GO_LIVE_CHECKLIST.md) und [Auditbericht](../AUDIT_REPORT.md). Die nachfolgenden historischen Betriebsangaben vor Nutzung mit dem aktuellen Stand abgleichen.

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

### Admin
- `GET /api/admin/statistics` (nur fuer eingeloggte Benutzer)

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

## 6. Statistikdaten und DSGVO-Hinweis

Die Dashboard-Statistik im Payload-Admin (Schnellstatistik) wird direkt aus den eigenen Collections berechnet:
- `products` (aktive Produkte)
- `categories` (aktive Kategorien)
- `requests` (offene Anfragen + 7-Tage-Fenster)

Es werden dafuer keine externen Trackinganbieter (z. B. Google Analytics) und keine zusaetzlichen personenbezogenen Profile benoetigt.

Wichtig fuer DSGVO:
- Statistik nur in aggregierter Form anzeigen
- keine Speicherung zusaetzlicher personenbezogener Rohdaten nur fuer Dashboard-Zwecke
- IP-Adressen aus Kontaktanfragen nur zur Missbrauchspraevention verwenden und nicht fuer Marketing-Tracking zweckentfremden

## 7. Installation und Start

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

## 8. Relevante ENV-Variablen

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

## 9. Migration Strapi -> Payload

Entfernt:
- Strapi-Abhaengigkeiten
- Strapi-Konfiguration
- Strapi-Datenmodelle und API-Annahmen

Ersetzt durch Payload:
- Collections + Globals
- Custom Endpoints unter `/api/catalog/*` und `/api/public/*`
- TypeScript-basierte Services (`pricingService`, `requestService`, `emailService`, `turnstileService`)

## 10. Tests

```powershell
cd backend
npm test
```

Abgedeckt:
- Preisberechnung
- Anfrageprozess
- API-Endpoints (inkl. Site-Config und Contact-Validierung)
