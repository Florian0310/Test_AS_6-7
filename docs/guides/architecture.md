# Architektur

Stand: 26.10.2026. Bestehenden Stack beibehalten; keine Datenmodellmigration und kein Frontend-Framework eingeführt.

## Build und Seiten

`scripts/build/site.mjs` kopiert redaktionelle Quellen aus `frontend/templates/pages/`, erzeugt weitere Inhalte aus `scripts/build/content.mjs` und `frontend/locales/` sowie den Katalog aus `frontend/templates/catalog.mjs`. Alle 27 Seiten einschließlich 404 erhalten denselben Header und Footer aus `frontend/templates/shell.mjs`. Sprache, Ziele und aktive Navigation variieren, Struktur und Branding bleiben gemeinsam.

Danach entstehen Übersetzungsmodul, gemeinsame CSS-Datei, Sprachverweise und Sitemap. Header/Footer sind bereits im HTML enthalten und benötigen keinen Nachladevorgang. Sämtliche öffentlichen Ausgaben liegen ausschließlich unter `dist/`; der Repository-Root enthält keine generierten Webseiten mehr. PostCSS dient ausschließlich als Build-Prüfer für die Styles.

`scripts/build.mjs` ist der npm-Einstieg; `scripts/lib/paths.mjs` bündelt Projekt- und Ausgabepfade. Ein sauberer Build kopiert `frontend/public/` in den Webroot und `frontend/src/` nach `dist/frontend/`. Das Übersetzungsmodul entsteht nur unter `dist/frontend/i18n/messages.js`. Browserimporte werden gegen diese Ausgabe aufgelöst: `/frontend/main.js`, `/app-config.js` und alle bestehenden Asset-/Seiten-URLs bleiben erhalten. Öffentliche Dateien und vertrauliche Backend-/Entwicklungsdateien sind damit auch physisch getrennt. Die Beispiel-Konfigurationsdatei wird nicht exportiert.

## Laufzeit und Zuständigkeiten

`frontend/src/main.js` startet Navigation, Sprache, Consent und Kontaktangaben und importiert nur das benötigte Seitenmodul.

| Modul | Verantwortung |
|---|---|
| `pages/catalog.js` | Such-/Filterereignisse, URL, Ergebnisdarstellung und Pagination |
| `lib/catalog-state.js` | Reines Parsing, erlaubte Sortierung, Kategorie-Abwahl |
| `data/catalog-api.js` | HTTP, Timeouts, Abbruch, normalisierte CMS-Antworten und Lesecaches |
| `components/product-card.js` | Gemeinsame Karte für Startseite, Katalog und verwandte Produkte |
| `pages/product.js` | Originalbild-Galerie, Spezifikationen, Zeitraumprüfung und Anfrage |
| `components/contact-form.js` | Kontaktvalidierung, optionales Turnstile und POST |
| `components/locale-switch.js` | Gegenroute, Parameter, Präferenz und kurzlebiger Formulardraft |
| `components/consent.js` | Opt-in, Widerruf, Tab-Sync und Tracking-Lebenszyklus |

UI verwendet Textknoten statt ungeprüfter CMS-HTML-Fragmente. Der bestehende Backend-Code bleibt TypeScript, Browsercode JavaScript. Keine zusätzliche Laufzeitbibliothek wurde benötigt.

## Katalog und Datenzugriff

Ein Zustand enthält `category`, `search`, `sort` und `page`. Live-Suche wartet 200 ms; bewusste Filter-/Seitenwechsel erzeugen History-Einträge, Texteingaben ersetzen den aktuellen Eintrag. `popstate` und Reload stellen die Ansicht wieder her. Vorherige Anfragen werden abgebrochen; eine Anfrage-ID verhindert zusätzlich verspätetes Überschreiben.

Der Katalog lädt 12 Produkte je Seite. Titel-/Preissortierung erfolgt in der Datenbank. Die bestehende serverseitige Textsuche normalisiert Großschreibung und Umlaute, berücksichtigt Namen, Beschreibungen, Artikelnummer und lokalisierte Kategorien und sortiert vor der Seitenauswahl. Der Suchdeckel von 1.000 Kandidaten bleibt über `searchTruncated` sichtbar; für größere Bestände ist eine Datenbank-Volltextsuche erforderlich. Namenssortierung ohne Suchbegriff verwendet den CMS-Haupttitel.

Kategorien stammen aus aktiven CMS-Kategorien und zählen aktive Produkte. Leere Kategorien sind nur bei expliziter URL-Auswahl sichtbar und abwählbar. Die additive API-Gesamtzahl hält „Alle Produkte“ auch bei inaktiver verknüpfter Kategorie korrekt. Zähler sind Bestandszahlen, keine suchabhängigen Facettenzahlen. Fehler beim Kategorienabruf blockieren Produkte nicht und bieten einen eigenen Wiederholungsversuch.

Website-Einstellungen und Kategorien teilen 30 Sekunden lang ein Promise. Fehler werden aus dem Cache entfernt. Katalogergebnisse und Details werden pro Abruf geladen. Bild-DTOs erhalten additive `originalUrl`-/`thumbnailUrl`-Felder; vorhandenes `url` bleibt kompatibel. Karten bevorzugen ein kleineres vorhandenes Derivat, Details das Original; Ladefehler erhalten einen stabilen Platzhalter. Medien wurden nicht neu verarbeitet.

## Konfiguration, Sprache und Styles

`frontend/src/config/site.js` enthält öffentliche Fallbacks von Willy Schröder; gepflegte CMS-Globals liefern Kontaktangaben. `routes.js` ist die gemeinsame Zuordnung für Sprache und SEO. `app-config.js` enthält nur öffentliche Backend-/Tracking-/Turnstile-Kennungen, niemals Secrets.

DE/EN-Nachrichten entstehen aus `frontend/locales/*.json`. CMS-Übersetzungen und vorhandene redaktionelle Fallbacks bleiben erhalten. Explizite Sprachwahl bleibt bestehen; automatische Erkennung ist auf den deutschen Startseiten-Einstieg beschränkt. Formulardaten werden nur beim gewählten Sprachwechsel kurzzeitig in der Sitzung übergeben und danach gelöscht.

Feste helle Markendarstellung in Dunkelblau, Weiß und Orange. Tokens liegen in `frontend/styles/tokens.css`; Shell, Katalog, Produkt und Inhaltslayouts haben eigene Dateien. Theme-Datei und Suchmodal sind entfernt. Die mobile Navigation sperrt den Hintergrund, begrenzt den Tastaturfokus und führt ihn zurück.

## Backend und Datenerhalt

Bestehende Collections: Users, Media, Categories, Products und Requests; Globals: Website, Kontakt, Rechtliches und Mieteinstellungen. Endpunkte delegieren Preisberechnung, Speicherung, Benachrichtigung und Turnstile an Services. Zugriffsregeln und Validierung bleiben in Utils/Collections. Keine Collection-Felder, Migrationen oder Bestandsdatensätze wurden verändert.

SQLite und Medien liegen außerhalb des Frontend-Webroots. Vorhandene Größen-/Origin-Prüfungen, Rate-Limits und Header bleiben erhalten. Prozesslokale Rate-Limits benötigen bei mehreren Instanzen einen gemeinsamen Speicher; diese Skalierungsentscheidung ist noch offen.
