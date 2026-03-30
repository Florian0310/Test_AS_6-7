# Backend-Dokumentation (Payload, Deutsch)

## 1. Projektuebersicht

Dieses Backend bildet den Anfrageprozess fuer einen Werkzeugverleih ab.

Warum Payload statt Strapi:
- eine einheitliche TypeScript-basierte Codebasis
- schlanke Modellierung mit Collections + Globals
- flexible Custom-Endpoints fuer Preislogik und Anfrageprozess
- gute Admin-Usability fuer nicht-technische Nutzer

### Kernfunktionen
- Kategorien und Produkte im Admin pflegen
- drei Tarife pro Produkt verwalten
- Preis serverseitig berechnen
- Anfragen speichern und statusbasiert bearbeiten
- E-Mail-Benachrichtigung senden oder vorbereitet protokollieren

### Enthaltene Payload-Strukturen
- Collection `categories`
- Collection `products`
- Collection `requests`
- Collection `media`
- Global `rental-settings`

## 2. Installation

### Voraussetzungen
- Node.js >= 20
- npm

### Schritte

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

### URLs (lokal)
- Admin: `http://localhost:3001/admin`
- API: `http://localhost:3001/api`

### Tests

```powershell
cd backend
npm test
```

### Build / Production

```powershell
cd backend
npm run build
npm run start
```

## 3. Datenmodell

### Categories
- `name` (required)
- `slug` (required, unique)
- `description` (optional)
- `sortOrder` (optional)
- `isActive`

### Products
- `title` (required)
- `slug` (required, unique)
- `articleNumber` (required, unique)
- `shortDescription` (required)
- `longDescription` (optional)
- `category` (required, relationship -> categories)
- `images` (upload -> media, multiple)
- `isActive`
- `availabilityStatus` (`available`, `limited`, `unavailable`)
- `pricing` (group)
  - `dailyPrice` (Tarif I)
  - `threeDayPrice` (Tarif II)
  - `weeklyPrice` (Tarif III)
  - `minimumRentalDays` (optional)
  - `deposit` (optional)
  - `cleaningFee` (optional)
  - `insuranceRequired` (default true)
  - `insuranceRateOverride` (optional)
  - `priceNote` (optional)
  - `consumableCostNote` (optional)
- `specifications` (optional, key/value)
- `seo` (optional)

### Requests
- `requestNumber` (auto, unique)
- `status` (`new`, `in_progress`, `answered`, `accepted`, `rejected`, `completed`)
- `product` (relationship -> products)
- `productSnapshot` (Titel/Slug/Artikelnummer + Preisstand)
- `customerName`, `customerEmail` (required)
- `customerPhone` (optional)
- `rentalStart`, `rentalEnd` (optional)
- `rentalDays` (optional)
- `pricingSummary` (required, json)
- `message` (optional)
- `emailResult` (json, read-only)

### Media
- Bild-Upload
- `alt` (required)
- `caption` (optional)

### Global: Rental Settings
- `companyName`
- `heroHeadline`, `heroText`
- `defaultInsuranceRate` (default 0.1)
- `insuranceMandatory`
- `requestNotificationEmail`
- `priceDisclaimer`

## 4. API-Nutzung

### Produktliste
`GET /api/catalog/products`

Beispiel-Response (gekuezt):

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Hilti SF 6-A22",
      "slug": "hilti-sf-6-a22",
      "articleNumber": "AS-1001",
      "pricing": {
        "dailyPrice": 49.9,
        "threeDayPrice": 129.9,
        "weeklyPrice": 249.9
      }
    }
  ],
  "total": 1
}
```

### Einzelprodukt per Slug
`GET /api/catalog/products/slug/hilti-sf-6-a22`

### Kategorien
`GET /api/catalog/categories`

### Preisberechnung
`POST /api/catalog/pricing/calculate`

```json
{
  "productId": "1",
  "rentalDays": 10
}
```

Alternative:

```json
{
  "productSlug": "hilti-sf-6-a22",
  "startDate": "2026-04-01",
  "endDate": "2026-04-10"
}
```

### Anfrage anlegen
`POST /api/catalog/requests`

```json
{
  "productId": "1",
  "name": "Max Mustermann",
  "email": "max@example.com",
  "phone": "+43 123 456",
  "startDate": "2026-04-01",
  "endDate": "2026-04-03",
  "message": "Bitte Rueckruf"
}
```

## 5. Preislogik aus der Preisliste

Tarifmodell:
- Tarif I = Tagespreis
- Tarif II = 3-Tages-Preis (Wochenende)
- Tarif III = Wochenpreis (7 Tage)

Regeln:
- 7er-Bloecke zuerst
- dann 3er-Bloecke
- dann Resttage
- Pflichtversicherung standardmaessig 10% auf Mietpreis
- Kaution und Reinigungsgebuehr separat
- Mindestmietdauer wird validiert

Beispiele:
- 10 Tage = 7 + 3
- 8 Tage = 7 + 1
- 11 Tage = 7 + 3 + 1

## 6. Migration Strapi -> Payload

### Entfernte Strapi-Bestandteile
- Strapi-Backend-Verzeichnis und Strapi-Konfiguration
- Strapi-spezifische Collection-/Endpoint-Konzepte
- Strapi-Frontend-Konfigurationsnamen

### Payload-Ersatz
- Modelle als Payload Collections (`categories`, `products`, `requests`, `media`)
- zentrale Einstellungen als Payload Global (`rental-settings`)
- Custom Endpoints fuer Katalog, Pricing und Anfrage
- Services fuer Preisberechnung und Anfrageverarbeitung

### Frontend-Anpassungen
- `STRAPI_URL` -> `PAYLOAD_URL`
- `STRAPI_API_PREFIX` -> `PAYLOAD_API_PREFIX`
- Produktabfrage ueber `/api/catalog/products`
- Einzelprodukt ueber `/api/catalog/products/slug/:slug`
- Kategorien ueber `/api/catalog/categories`
- Preisberechnung ueber `/api/catalog/pricing/calculate`
- Anfrage ueber `/api/catalog/requests`

## 7. Erweiterbarkeit

Sinnvolle naechste Schritte:
- echte Bestands-/Verfuegbarkeitslogik (Kalender, Doppelbuchungen)
- Reservierungsobjekte mit Konfliktpruefung
- SMTP-/Mailanbieter-Ausbau
- weitere SEO-Felder und dynamische Meta-Ausgabe
- spaeter optional echtes Buchungssystem
