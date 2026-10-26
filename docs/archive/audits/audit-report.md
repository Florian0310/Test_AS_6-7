> Historischer Audit vor dem aktuellen Refactoring. Aktuelle UI, Architektur und Messergebnisse: [Refactoring-Bericht](../../reports/refactoring.md). Aktueller Freigabestatus: [Go-Live-Checkliste](../../go-live-checklist.md).

# Website-Audit – Alles Saniert

Prüfdatum: 26.10.2026. Lokales Repository, keine Veröffentlichung.

**Aktueller Gesamtstatus: NO-GO für öffentliche Produktion.** Die gefundenen technischen Fehler wurden behoben und lokal geprüft. Echte SMTP-Zustellung, Produktionsinfrastruktur, Preis-/Steuerfreigabe und vollständige Unternehmensangaben sind offen. Es gab keinen Commit, Push oder Deployment.

## Priorisierte Ausgangsbefunde

| Priorität | Befund | Ausgangsstatus |
|---|---|---|
| P0 | Statischer Python-Server veröffentlicht auch backend/ einschließlich Konfiguration und Datenbank | Behebung begonnen |
| P0 | Dependency-Audit: 40 betroffene Pakete, davon 2 kritisch, 24 hoch | Behebung begonnen |
| P0 | Automatisches Admin-Bootstrap mit bekanntem Ersatzpasswort; Users ohne explizite Zugriffsregeln | Behebung begonnen |
| P1 | Widerruf kann bereits geladene Tracker weiterlaufen lassen; Cookie-Seite ohne Rückweg und Checkbox-Labels | Behebung begonnen |
| P1 | Öffentliche Anfragen ohne Missbrauchsschutz; interne E-Mail-Vorschau und Fehlermeldungen in API-Antworten | Behebung begonnen |
| P1 | Impressum und Datenschutzerklärung nennen widersprüchliche Verantwortliche; unbelegte Hosting-Aussagen | Unternehmensklärung erforderlich |
| P1 | Englischer Katalog konsumiert deutsche CMS-Texte; Produktdetails und mehrere Unterseiten nur deutsch | Behebung begonnen |
| P2 | Light-Modus fehlt; OS-Dark-CSS überschreibt explizite Auswahl; Vorteils-Icons zu dunkel | Behebung begonnen |
| P2 | Globale Suche ohne Suchfunktion; Fokus in ausgeblendeter Navigation/Suche; lange Kategorien ohne feste Metaspalten | Behebung begonnen |
| P2 | Startseite lädt etwa 4,11 MB; Hero-JPEG 2,04 MB | Behebung begonnen |

## Ausgangsprüfung

29/29 Vitest-Tests bestanden; Next-Produktionsbuild und Typecheck bestanden. Kein Linter konfiguriert. Lighthouse mobil auf EN-Startseite: Performance 75, Accessibility 92, Best Practices 96, SEO 100; LCP 20,60 s, CLS 0,00165, TBT 0 ms. Einzelmessung, kein Feldnachweis für INP oder das 75. Perzentil. Browser/axe reproduziert Fokus-, Kontrast- und Label-Fehler. Rohdaten in artifacts/ und backend/audit-baseline.json.

## Umgesetzter Endstand

| Priorität | Tatsächliche Korrektur | Nachweis / Status |
|---|---|---|
| P0 | Allgemeiner Dateiserver durch öffentlichen Allowlist-Server ersetzt; eigenes dist-Exportziel, interne Verzeichnisse und Dateien gesperrt | HTTP-Prüfungen: gesperrte Pfade liefern 404 |
| P0 | Payload/Next und verwundbare direkte/transitive Pakete aktualisiert | npm audit: 40 → 0 betroffene Pakete |
| P0 | Explizite User-Zugriffsrechte, sichere Produktionskonfiguration, bewusster einmaliger Admin-Bootstrap | Unit-Tests und reale 401/403-Antworten; unsichere lokale Konfiguration scheitert am Produktionsguard |
| P1 | Consent v2, strikte Typprüfung, Ablauf, Migration, tabübergreifende Synchronisierung; Widerruf mit Tracker-Beendigung und Cookie-Löschung | E2E einschließlich konfigurierter, abgefangener Google-Skripte bestanden |
| P1 | Cookie-Seite mit Speichern, Bestätigung, Widerruf, Labels und sicherem Rückweg | E2E in EN/DE und axe |
| P1 | Request-Body-Limit, Origin-Prüfung, Rate-Limits, sichere Fehlerantworten, keine Mail-Vorschau in öffentlichen DTOs; Kontaktversand meldet ohne Zustellung keinen falschen Erfolg | Unit-/HTTP-Prüfungen, Anfrage auf isolierter Produktionskopie gespeichert |
| P1 | Anfragepreise kommen vom Server, Pflichtversicherung/Kaution/Reinigung transparent; Menge auf tatsächlich unterstütztes Einzelgerät begrenzt; keine behauptete verbindliche Verfügbarkeit | Preis-/Request-Tests, UI-Quote und Produktionsprüfung |
| P1 | Gültige Kalendertage, vollständige Datumsintervalle und begrenzte ganzzahlige Mietdauer | Regressionstests |
| P1 | Kollisionsarme Anfragenummern und kein erneutes Absenden nach fehlgeschlagenem Mailstatus-Update | 200 Referenzen im gleichen Zeitpunkt eindeutig; Fehlerbehandlung im Code |
| P1 | Betreiber auf ausdrückliche Nutzervorgabe vereinheitlicht: Willy Schröder, Fotzebenweg 3, 2763 Pernitz | Statische Seiten, Defaults und lokale Kontakt-/Impressums-Globals angepasst; keine Produkt-/Anfragedaten geändert |
| P1 | DE/EN-Routen ergänzt (Produkt, Anfrage, Über uns, Forst, Bildnachweise); CMS hat englische Felder und explizite englische Fallbacks | Sprachwechsel mit Filtern, Slug und einmaliger Übernahme laufender Formulare getestet |
| P1 | Windows-Standalone enthielt native Sharp-DLLs nicht; Build-Paket vollständig gemacht und dotenv-Dateien daraus entfernt | Produktionsserver, Admin-JS und echte Anfrage auf Datenbankkopie bestanden |
| P2 | Zentrale Theme-Auflösung vor CSS: Hell, Dunkel, Auto; OS-Änderungen; semantische Farben und sichtbare Vorteils-Icons | Theme-E2E, visuelle Screenshotkontrolle |
| P2 | Globale Live-Suche mit Debounce, Abbruch veralteter Requests, Namen/Kategorien/Beschreibungen/Artikelnummern, Umlautnormalisierung, Dialogsemantik, Fokusführung, Escape und Tastaturnavigation | E2E und sichtgeprüfter Such-Screenshot |
| P2 | Kategorien mit eigenem Text-/Zähler-/Pfeilbereich; ganze Zeile bedienbar; korrekte globale Zahlen und leere Kategorien | Alle Kategorien durchgefiltert, alle sieben Viewports ohne horizontalen Überlauf |
| P2 | Navigation/Suche wirklich aus Fokusreihenfolge entfernt, mobile Menü-Fokusfalle und Schließen-Button repariert; Form-/Button-Kontraste und gültige Definitionslisten | 48 axe-Prüfungen über 24 Seiten in Light/Dark ohne Verstöße in geprüften AA-Regeln |
| P2 | WebP, kleinere mobile Hero-Datei, kleine Icons, Lazy Loading, Preload, defer, Gzip; Wiederverwendung lesender API-Requests; Kategorieabfragen von 1+N auf 2 reduziert | Lighthouse und Codeanalyse; siehe PERFORMANCE_REPORT.md |
| P2 | Canonical/hreflang und Sitemap beidseitig ergänzt; 404-Seite mit echtem HTTP-Status; interne Links/Assets/Anker kontrolliert | 26 HTML-Seiten statisch ohne gebrochene Ziele |
| P3 | Zentrale übersetzte Seiteninhalte, reproduzierbarer Generator, ESLint, Testtools, additive Migrationen, CI-Konfiguration | Lint/Typecheck/Build bestanden; CI selbst noch nicht remote ausgeführt |

## Verbleibende Arbeit nach Priorität

- **P1 vor Go-live:** Steuerstatus und Bruttopreise bestätigen; verpflichtende Nebenkosten bereits beim Preiseinstieg korrekt kommunizieren. Mietbedingungen zu Rückgabe, Schäden, Storno, Zahlung und gegebenenfalls Fernabsatzrecht juristisch freigeben.
- **P1 vor Go-live:** Rechtsform, Firmenbuch/UID/Gewerbe/Kammer prüfen und Impressum vervollständigen. Hosting-/E-Mail-Anbieter, Speicherorte, Fristen, AV-Verträge und Transfers fehlen. Benutzer bestätigte B2C als Hauptzielgruppe; Firmen und Vereine sind nicht ausgeschlossen.
- **P1 vor Go-live:** Reales SMTP/Absenderdomain, Turnstile falls eingesetzt, starke Produktionssecrets und bestehende Admin-Passwörter prüfen/rotieren. Entwicklungseinstellungen sind keine Produktionsfreigabe.
- **P1 Datenqualität:** Vier lokale Produkte, darunter „Test Forst“ und „Lego FFF“; zwei Produkte ohne eigene Bilder. Diese Daten wurden erhalten und müssen redaktionell freigegeben werden. Für zwei Testprodukte fehlen fachlich bestätigte englische Beschreibungen; englische Ersatztexte ermöglichen die Bedienung, ersetzen aber keine Übersetzung.
- **P2:** Echte Browser-/Screenreader-Matrix, Zoom-/Landscape-Prüfung, Feldmessungen und externes Backup-/Restore-/Monitoring-Konzept nachholen. Lokaler SQLite-Integritätstest und getestete Migration sind kein getesteter vollständiger Disaster-Recovery-Prozess.
- **P2 Skalierung:** Suche wertet höchstens 1000 Produkte serverseitig aus und kennzeichnet eine Begrenzung in der API. Bei größerem Bestand eine normalisierte, indizierte Suche einführen; kein Nachweis für große Kataloge.
- **P3:** Gemeinsame Navigation/Footer der alten statischen Seiten weiter vereinheitlichen; striktere Nonce-CSP im Payload-Admin prüfen. Die Backend-CSP benötigt derzeit Inline-Skripte für die vorhandene Admin-Integration.

## Grenzen

Kein Zugriff auf produktives DNS/TLS, Mailkonten, Verträge, Lizenzen oder Hostinglogs. Keine aktiven Tests gegen fremde Systeme. Kein externer Penetrationstest und keine Rechtsfreigabe. Die eingebettete Git-CLI von GitHub Desktop wurde gefunden. .env und backend/.env sind weder aktuell versioniert noch in der geprüften Pfadhistorie enthalten. Eine vollständige forensische Secret-Prüfung aller historischen Inhalte wurde nicht durchgeführt. Die vorhandenen Daten wurden vor Arbeiten gesichert; Migrationen/Produktionsanfragen liefen auf separaten Kopien.
