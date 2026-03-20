# Alles Saniert - Frontend + Strapi Backend

Dieses Projekt kombiniert ein bestehendes statisches Frontend mit einem Strapi Headless CMS (Backend) fuer einen Werkzeugverleih.

## 1) Was ist Strapi in diesem Projekt?
Strapi ist hier die zentrale Admin-Oberflaeche fuer Redaktion und Betrieb:
- Werkzeuge, Kategorien und Seitentexte werden im Strapi Admin gepflegt.
- Das Frontend liest diese Daten ueber REST aus.
- Mietanfragen werden aus dem Frontend an Strapi gesendet und dort als Anfrage gespeichert.

## 2) Architektur (kurz)
- Frontend: statisches HTML/CSS/JS (kein React/Vue/Next)
- Backend: Strapi v5 in `backend/`
- API-Stil: REST (bewusst, da statisches Frontend)
- Verfuegbarkeit: serverseitig berechnet (Tool `quantityTotal` minus bestaetigte Reservierungen im Zeitraum)
- DB: lokal SQLite (Default), produktiv PostgreSQL empfohlen

## 3) Projektstruktur

```text
.
|-- index.html
|-- styles.css
|-- script.js
|-- shop.js                     # Strapi API Client + Shop UI Logik
|-- app-config.js               # Frontend Runtime-Konfig (Strapi URL)
|-- app-config.example.js
|-- sortiment/
|   |-- index.html              # Werkzeugliste (CMS-gestuetzt)
|   |-- produkt-hilti-sf-6-a22.html  # Produktdetail + Anfrageformular
|   `-- reservierung.html
|-- backend/
|   |-- package.json
|   |-- .env.example
|   |-- config/
|   |-- src/
|   |   |-- admin/app.js
|   |   |-- components/shared/
|   |   `-- api/
|   |       |-- category/
|   |       |-- tool/
|   |       |-- rental-request/
|   |       `-- site-setting/
|   `-- tests/
`-- README.md
```

## 4) Voraussetzungen
- Node.js 20.x oder 22.x
- npm 8+
- Python 3 (oder ein anderer einfacher Static-Server) fuer das Frontend
- Optional fuer Produktion: PostgreSQL

## 5) Installation (Schritt fuer Schritt)

### 5.1 Backend (Strapi)

```powershell
cd backend
Copy-Item .env.example .env
npm install
```

### 5.2 Frontend Runtime-Konfig

Im Projekt-Root:

```powershell
Copy-Item app-config.example.js app-config.js
```

`app-config.js` anpassen, falls Strapi nicht auf `http://localhost:1337` laeuft.

## 6) Development starten

### Terminal 1: Strapi Backend

```powershell
cd backend
npm run develop
```

Erreichbar unter:
- API: `http://localhost:1337/api`
- Admin: `http://localhost:1337/admin`

### Terminal 2: Frontend

Im Projekt-Root:

```powershell
python -m http.server 8000
```

Frontend URL:
- `http://localhost:8000/`

## 7) Erster Login / Ersteinrichtung in Strapi

### 7.1 Admin User anlegen
Beim ersten Start von Strapi wird die Admin-Registrierung angezeigt.
- E-Mail + Passwort setzen
- Account erstellen

### 7.2 Admin-Sprache auf Deutsch stellen
Die deutschen UI-Texte sind vorbereitet (`backend/src/admin/app.js`, Locale `de`).
Falls Strapi nicht automatisch auf Deutsch startet:
1. Admin oben rechts auf Benutzerprofil klicken
2. `Profile`
3. `Interface language`
4. `Deutsch` waehlen
5. Speichern

### 7.3 Rollen und Rechte (Users & Permissions)
Pfad:
1. `Settings`
2. `Users & Permissions Plugin`
3. `Roles`
4. `Public`

Empfohlene Public-Rechte:
- `tool`: `find`, `findOne`, `findBySlug`, `checkAvailability`
- `category`: `find`, `findOne`
- `site-setting`: `find`
- `rental-request`: `create`

Wichtig:
- Fuer `rental-request` **nur** `create` aktivieren.
- `find` / `findOne` bei `rental-request` fuer Public deaktiviert lassen.

## 8) Datenmodell in Strapi

### 8.1 Collection Type: Werkzeug (`tool`)
- `name` (string, required)
- `slug` (uid aus `name`, required, unique)
- `shortDescription` (string)
- `description` (richtext)
- `category` (manyToOne -> `category`)
- `images` (media multiple)
- `dailyPrice` (decimal, required)
- `deposit` (decimal)
- `quantityTotal` (integer, required, min 0)
- `quantityAvailable` (integer, required, min 0; Fallback)
- `location` (string)
- `tags` (json)
- `isActive` (boolean, default true)
- `seo` (component `shared.seo`)

### 8.2 Collection Type: Kategorie (`category`)
- `name` (string, required, unique)
- `slug` (uid aus `name`, required, unique)
- relation `tools` (oneToMany -> `tool`)

### 8.3 Collection Type: Anfrage (`rental-request`)
- `tool` (manyToOne -> `tool`, required)
- `customerName` (string, required)
- `customerEmail` (email, required)
- `customerPhone` (string)
- `startDate` (date, required)
- `endDate` (date, required)
- `quantity` (integer, required, min 1)
- `status` (enum, default `pending`)
- `notes` (text)
- `totalPrice` (decimal, serverseitig gesetzt)

Status-Mapping fuer Redaktion:
- `pending` = Offen
- `confirmed` = Bestaetigt
- `rejected` = Abgelehnt
- `cancelled` = Storniert
- `completed` = Abgeschlossen

### 8.4 Single Type: Seiteneinstellungen (`site-setting`)
- `companyName`
- `address`
- `email`
- `phone`
- `openingHours`
- `heroHeadline`
- `heroText`
- `heroImage`
- `socials` (json)
- `legal` (component `shared.legal`)

## 9) Businesslogik

### 9.1 Verfuegbarkeitspruefung
Service: `backend/src/api/rental-request/services/availability.js`

Logik:
- Verfuegbar = `tool.quantityTotal - Summe(confirmed Reservierungen im Zeitraum)`
- Validierung vor Anfrage-Erstellung:
  - `endDate >= startDate`
  - `quantity > 0`
  - Tool existiert und `isActive = true`
  - Menge darf Verfuegbarkeit nicht ueberschreiten

### 9.2 Anfrage erstellen (public)
Endpoint:
- `POST /api/rental-requests`

Server setzt:
- `status = pending`
- `totalPrice` basierend auf Tagen * Menge * Tagespreis

## 10) REST Endpoints (wichtig)

### Oeffentlich (Public)
- `GET /api/tools`
- `GET /api/tools/:id`
- `GET /api/tools/slug/:slug`
- `GET /api/tools/:id/availability?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&quantity=1`
- `GET /api/categories`
- `GET /api/site-setting`
- `POST /api/rental-requests`

### Nicht oeffentlich
- Lesen von `rental-requests` (nur Admin im Backend)

## 11) Frontend Integration

Die API-Schicht liegt in:
- `shop.js`

Enthaltene Funktionen:
- `getTools`
- `getToolBySlug`
- `getCategories`
- `getSiteSettings`
- `checkAvailability`
- `createRentalRequest`

UI-Integration:
- `sortiment/index.html`: Tool-Liste + Kategorien + Suche
- `sortiment/produkt-hilti-sf-6-a22.html`: Tool-Detail + Verfuegbarkeitscheck + Anfrageformular
- `index.html`: optionales Uebernehmen von `heroHeadline`/`heroText` aus `site-setting`

## 12) Inhalte pflegen (Redaktions-Workflow)

### 12.1 Kategorie anlegen
1. `Content Manager` -> `Kategorie`
2. `Create new entry`
3. Name eingeben (Slug wird erzeugt)
4. Speichern + Publish

### 12.2 Werkzeug anlegen
1. `Content Manager` -> `Werkzeug`
2. Name, Kategorie, Preis, Bestand, Aktiv-Flag setzen
3. Bilder hochladen
4. Optional SEO und Tags setzen
5. Speichern + Publish

### 12.3 Seiteneinstellungen pflegen
1. `Content Manager` -> `Seiteneinstellungen`
2. Headline, Kontakt, Oeffnungszeiten, Hero-Bild pflegen
3. Speichern + Publish

### 12.4 Anfragen bearbeiten
1. `Content Manager` -> `Anfrage`
2. Anfrage oeffnen
3. `status` auf `confirmed` / `rejected` etc. setzen
4. Speichern

## 13) Typische Fehler und Loesungen

### CORS Fehler im Browser
- `backend/.env` -> `CORS_ORIGIN` korrekt setzen
- Backend neu starten

### 403 / 401 Fehler
- Public-Role in Strapi pruefen (siehe Abschnitt 7.3)
- Endpoints in der richtigen Role aktivieren

### Upload funktioniert nicht
- In Development: lokaler Upload ist Standard
- Dateirechte von `backend/public/uploads` pruefen

### Port bereits belegt
- Frontend Port aendern: `python -m http.server 8080`
- Backend Port aendern: `PORT=1338` in `backend/.env`

## 14) Deployment Hinweise (kurz)
- `NODE_ENV=production` setzen
- PostgreSQL nutzen (`DATABASE_CLIENT=postgres`)
- sichere Secrets in `backend/.env` setzen
- Build + Start:
  - `npm run build`
  - `npm run start`
- Reverse Proxy (z. B. Nginx) vor Strapi schalten
- CORS auf echte Frontend-Domain begrenzen

## 15) ENV Variablen

### Root `.env.example`
- `FRONTEND_PUBLIC_URL`: URL des statischen Frontends
- `FRONTEND_STRAPI_URL`: Basis-URL von Strapi
- `FRONTEND_STRAPI_API_PREFIX`: API Prefix (Default `/api`)
- `CORS_ORIGIN`: Liste erlaubter Origins fuer Backend

### `backend/.env.example`
- `HOST`, `PORT`: Backend Host/Port
- `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`: Strapi Secrets
- `DATABASE_*`: DB-Konfiguration (SQLite oder PostgreSQL)
- `CORS_ORIGIN`: erlaubte Frontend Origins
- `UPLOAD_PROVIDER`: Upload-Provider (default lokal)

## 16) Beispiel-Request (API)

```bash
curl -X POST http://localhost:1337/api/rental-requests \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "tool": 1,
      "customerName": "Max Mustermann",
      "customerEmail": "max@beispiel.at",
      "customerPhone": "+43 123 456",
      "startDate": "2026-03-01",
      "endDate": "2026-03-03",
      "quantity": 1,
      "notes": "Bitte Rueckruf"
    }
  }'
```

---

## Hinweis zur lokalen Ausfuehrung in dieser Arbeitsumgebung
In der aktuellen Ausfuehrungsumgebung war Node/npm nicht installiert. Deshalb konnte ich `npm install` und `strapi develop` hier nicht ausfuehren.
Der Code und die Struktur wurden vollstaendig vorbereitet; bitte lokal mit installiertem Node 20+ wie oben starten.
