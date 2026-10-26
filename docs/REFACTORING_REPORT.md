# Refactoring-Auftrag – 26.10.2026

## Ausgangslage und Prioritäten

Stack: statisches HTML/CSS/JavaScript, Payload 3 / Next 16 im getrennten Backend, SQLite. Kein Framework-Wechsel und keine Änderungen an bestehenden CMS-Inhalten vorgesehen. Bestehende DE/EN-URLs bleiben erhalten. Betreiber: die bereits ausdrücklich bestätigten Angaben von Willy Schröder.

| Priorität | Befund | Maßnahme |
|---|---|---|
| P1 | Doppelte Header/Footer, abweichendes Branding | Gemeinsame HTML-Komponenten zur Buildzeit auf allen Seiten verwenden |
| P1 | Filter ohne Abwahl und popstate; Suchzustand erst nach Submit | Gemeinsamer URL-Zustand, Live-Suche im Katalog, kombinierte Filter und Reset |
| P1 | Suchmodal und sichtbare Theme-Auswahl widersprechen neuer Produktrichtung | Feste helle Markendarstellung; Header-Suche führt zum Katalog |
| P1 | Monolithische Skripte, doppelte API-/Übersetzungslogik | ES-Module für Datenzugriff, Komponenten und Seiten; Übersetzungen zentral |
| P2 | Doppelte Mini-Produktraster, unübersichtliche Katalogfläche | Ein Produktraster mit Ergebniszahl, aktiven Filtern und Pagination |
| P2 | Galerie nutzt zugeschnittene Derivate; uneinheitliche Platzhalter | Originalbild auf Detailseite, konsistente Karten und robuste Bildfehlerbehandlung |
| P2 | Umfangreiche Theme-/Modal-CSS und nachträgliche Überschreibungen | Styles nach Zuständigkeit konsolidieren; Design-Tokens und generierte Gesamtdatei |
| P2 | Fehlende aktuelle Architektur-/Entwicklungs-/Betriebsdokumentation | Praktische Dokumentation anhand der tatsächlich entstandenen Struktur |

## Ausgangsprüfung

Lint, Typecheck, statische Prüfung von 26 Seiten, 41 Backend-Tests und Produktionsbuild bestanden vor dem Refactoring. Bestehende Änderungen aus dem vorherigen Audit sind Ausgangsbasis. Die Vorher-Messung liegt in `artifacts/lighthouse-refactor-before.json`. Kein Commit, Push oder Deployment wurde vorgenommen.

## Ergebnis

### Änderungen und Architektur

Die priorisierten technischen Punkte sind umgesetzt. Das Frontend bleibt statisch und verwendet native ES-Module; Payload/Next/SQLite bleiben erhalten. Wiederverwendbarer Seitenrahmen zur Buildzeit, separate Inhaltsvorlagen, ein gemeinsamer API-Client, Komponenten und Seitencontroller ersetzen die monolithischen Root-Skripte. Die alten Skriptnamen bleiben als kleine Kompatibilitätsmodule erhalten, werden von den Seiten nicht geladen. Theme-Datei und Theme-/Modal-Styles wurden entfernt. Für CSS-Parsing/Validierung wurde PostCSS als reine Entwicklungsabhängigkeit ergänzt; keine neue Browserbibliothek.

Header und vierteiliger Footer sind auf 27 Seiten einschließlich 404 gemeinsam. Die Marke verwendet Willy Schröder entsprechend der vorherigen ausdrücklichen Nutzerkorrektur. Mobile Navigation, Sprachwechsel, einheitliche Touch-Ziele und Fokusdarstellung bleiben erhalten; das Logo wird nicht abgeschnitten. Inhalts- und Modulquellen sind von generierten öffentlichen Dateien getrennt. Zwei aufeinanderfolgende Builds erzeugten identische Ausgaben für alle 30 generierten Dateien.

Die Header-Suche führt zum fokussierten Katalogfeld. Eine Live-Suche, ein Ergebnisraster und ein URL-Zustand ersetzen mehrere Such-/Rasterimplementierungen. Kategorien können gewählt und wieder abgewählt werden; Suchbegriff und Kategorie funktionieren gemeinsam. Aktive Filter, Ergebniszahl, Reset, leere Zustände, Reload, Zurück/Vorwärts, Preissortierung und 12er-Pagination sind umgesetzt. Kategoriefehler blockieren die Suche nicht. Die Gesamtzahl stammt aus dem tatsächlichen aktiven Produktbestand, auch wenn eine verknüpfte Kategorie inaktiv ist.

Karten auf Startseite, Katalog und verwandten Produkten verwenden dieselbe Komponente. Produktdetails zeigen vollständige Beschreibungen, strukturierte Spezifikationen und Originalbilder. Galerie-Wechsel hält den Tastaturfokus; defekte Bilder fallen kontrolliert zurück. Zeitraumänderungen korrigieren das Enddatum vor der Preisabfrage; verspätete Preisantworten überschreiben keine neuere Auswahl. Ein Submit-Lock greift vor der asynchronen Prüfung und verhindert doppelte Anfragen.

Die vorhandenen CMS-Felder, Relationen, API-Pfade und Bestandsdaten bleiben erhalten. Neue Medien-URLs und Kategorie-Gesamtzahl sind additive DTO-Felder. Es gibt keine Datenmodelländerung, Migration oder Löschung bestehender CMS-Inhalte. Erfolgreiche Formular-POSTs im Browser wurden abgefangen; der Produktionslauf schreibt nur in eine isolierte Datenbankkopie.

### Performance

Gleiche lokale mobile Lighthouse-Prüfung von `/en/index.html`, Chrome und bestehendem Beispielbestand:

| Messwert | Vorher | Nachher |
|---|---:|---:|
| Performance / Accessibility / Best Practices / SEO | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| LCP | 1,655 s | 1,729 s; Bestätigungslauf 1,579 s |
| CLS | 0,00336 | 0 |
| TBT | 0 ms | 0 ms |
| Übertragene Daten im initialen Navigationslauf | 903.763 Byte | 111.043 Byte; Bestätigung 111.474 Byte |

Die initiale Datenmenge sinkt in diesen Läufen um etwa 88 %. Hauptgründe sind entfernte statische Platzhalterbilder, bedarfsgerechtes Laden echter Kartenbilder, kleinere vorhandene Medienderivate und gemeinsame CMS-Konfigurationsabrufe. Der Netzwerkbericht zeigt vorher zwei Site-Config-Abrufe, nachher einen. CSS-Transfer im Lauf: 11.977 auf 8.755 Byte; entfernte Theme-/Modal-Regeln tragen dazu bei. Detail-/Katalogcontroller laden nur auf den jeweiligen Seiten. Verwandte Produkte benötigen höchstens fünf Kandidaten statt des gesamten Kategorienbestands.

Die neue Oberfläche lädt Bilder unterhalb des sichtbaren mobilen Bereichs erst bei Bedarf. Die Byte-Angabe ist daher die gemessene initiale Navigation, **keine** Behauptung über das Datenvolumen nach vollständigem Scrollen. Ein früher Zwischenlauf lag bei rund 476 KB; die endgültigen beiden Läufe wurden anhand der Netzwerkliste auf erfolgreiche CMS-Antworten und fehlende Konsolenfehler kontrolliert. LCP schwankt im Bereich der Laborstreuung; keine belastbare LCP-Verbesserung behauptet. Keine Felddaten, echten Hostingmessungen oder P75-INP-Werte vorhanden.

### Tatsächlich ausgeführte Prüfungen

| Prüfung | Ergebnis |
|---|---|
| Frontend-Build, reproduzierbare Ausgabe | PASS; 27 Seiten, 30 generierte Dateien identisch |
| ESLint | PASS |
| Statische Ziele/Fragmente/Module/Seitenrahmen | PASS; 27 Seiten, 0 Fehler |
| Reine Frontend-Zustandstests | PASS; 4 Tests |
| Backend Vitest | PASS; 44 Tests statt zuvor 41 |
| Backend TypeScript und Produktionsbuild | PASS; Standalone-Paket einschließlich Assets erzeugt |
| Vollständige Playwright-Suite | PASS; 16 Tests, Chrome |
| Responsive Matrix | PASS; 9 Breiten × 4 Hauptseiten, kein horizontaler Overflow |
| Axe AA-Regeln | PASS; 27 Seiten, keine gemeldeten Verstöße |
| Formular-Fehler, Retry, Datumskorrektur, Doppel-Submit | PASS; abgefangene POSTs |
| Produktions-Smoke | PASS; 7 Prüfungen einschließlich Anfragepersistenz und SQLite-Integrität auf Kopie |
| Zugriffssperren, Eingaben, Header, Kompression | PASS; 16 HTTP-Prüfungen |
| Root- und Backend-Abhängigkeitsaudit | PASS; jeweils 0 gemeldete Schwachstellen |
| Öffentlicher Export | PASS; Testziel `https://backend.example.invalid`, keine Veröffentlichung |
| Remote-CI, reale E-Mail, reale Infrastruktur | NICHT AUSGEFÜHRT |

Ein erster vollständiger Browserlauf scheiterte an einem nicht mehr laufenden Backend-Prozess. Beide Dienste wurden kontrolliert neu gestartet; der vollständige Wiederholungslauf bestand. Die Browserprüfung hat jetzt einen Erreichbarkeits-Preflight. Nach der letzten Änderung der Skip-Link-Reihenfolge/entfernten Altpräferenz wurden die betroffenen Such- und mobilen Tastaturabläufe nochmals gezielt geprüft.

Lokale Nachweise in `artifacts/`: `e2e-results.json`, `axe-after.json`, `static-check.json`, `production-smoke.json`, `api-security.json`, `lighthouse-refactor-before.json`, `lighthouse-refactor-after.json`, `lighthouse-refactor-after-confirm.json` und `refactor-*.png`. Diese Ausgaben sind absichtlich nicht versioniert oder öffentlich exportiert.

### Offene Punkte und Go-Live

**NO-GO für öffentliche Produktion.** Lokale Technik und Reviewbetrieb sind vorbereitet; folgende externe/betriebliche Voraussetzungen bleiben kritisch:

- Produktive Secrets/Accounts, Hosting, Origins/TLS/Proxy und Dienstbetrieb tatsächlich einrichten und prüfen.
- Hosting-/E-Mail-Anbieter und Datenschutz-/Löschprozesse bestätigen; SMTP sowie Payload-Auth-Mailadapter samt Passwort-Reset und realer Zustellung testen.
- Rechtsform-/Gewerbe-/Register-/Kammer-/UID-Daten, Steuer-/Bruttopreise und Mietbedingungen freigeben. Die Betreiberkorrektur ersetzt diese fehlenden Angaben nicht.
- Die zwei vorhandenen Testprodukte, fehlende eigene Bilder, Übersetzungen, technische Angaben und Nutzungsrechte redaktionell freigeben. Sie wurden erhalten.
- Manuelle Screenreader-/WCAG-/Zoom-/Geräteprüfung, externe Backups/Recovery, Monitoring, echte Domain/SEO und Remote-CI abnehmen.

Bekannte technische Grenzen: Textsuche prüft höchstens 1.000 Kandidaten, Kategorienzählung liest aktive Kategoriezuordnungen, Lesecache kann bis zu 30 Sekunden alt sein, Rate-Limits sind pro Prozess. Kein unbestätigtes Skalierungsversprechen. Die bestehende englische Inhaltsfallback-Strategie bleibt redaktionell freizugeben.

Praktische Dokumentation: [Architektur](ARCHITECTURE.md), [Entwicklung](DEVELOPMENT.md), [Deployment](DEPLOYMENT.md), [Go-Live](GO_LIVE_CHECKLIST.md). Sämtliche Freigabepunkte bleiben in der zentralen Checkliste sichtbar. Nichts wurde committed, gepusht oder produktiv bereitgestellt.
