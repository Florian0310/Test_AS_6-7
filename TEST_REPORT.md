# Testbericht

Stand 26.10.2026. Ergebnisse betreffen den lokal geprüften Stand, keine produktive Domain. Die Rohdaten liegen in artifacts/ und den Dependency-Audit-Dateien im Backend.

| Prüfung | Ausgang | Endstand / Umfang |
|---|---|---|
| Vorhandene Vitest-Suite | 29/29 bestanden | 41/41 bestanden, 4 Dateien: Preise, Anfrageprozess, Endpunkte, Security-Regressionen |
| Typecheck | Bestanden | Bestanden einschließlich Konfiguration, Migration und Tests |
| ESLint | Nicht vorhanden | Frontend/Tooling konfiguriert; 0 Fehler/0 Warnungen; Backend separat via TypeScript geprüft |
| Produktionsbuild | Bestanden mit damaligen Defaults | Bestanden mit starkem separatem Buildsecret; anschließende Paketvorbereitung entfernt dotenv-Dateien und ergänzt Assets |
| Unsichere Produktionskonfiguration | Wurde akzeptiert | Wird absichtlich abgewiesen; lokales Entwicklungssecret wurde nicht überschrieben |
| Dependency-Scan Backend | 40 betroffene Pakete | 0 bekannte Warnungen laut npm audit; Tooling ebenfalls 0 |
| Playwright | Keine Suite vorhanden | 11/11 bestanden |
| axe-core AA-Regeln | Fokus-/Kontrast-/Label-Verstöße reproduziert | 48 Läufe: 24 Seiten jeweils Light/Dark ohne gemeldete Verstöße in wcag2a/2aa/21aa/22aa |
| Responsiveness | Keine dokumentierte Matrix | 320, 375, 390, 768, 1024, 1440, 1920 px; Startseite, Katalog, Cookie-Seite und Produktseite ohne horizontalen Überlauf |
| Links/Dateien/Anker/Metadaten | Kein statischer Checker | 26 HTML-Seiten, keine fehlenden geprüften Ziele; Canonical/hreflang zusätzlich generiert |
| Lokale HTTP-Sicherheit | Keine reproduzierbare Suite | 16 Prüfungen bestanden: private Pfade/404, Users/Requests/Globals/Statistik-Zugriff, JSON/Body/Origin, Header und Gzip |
| Migrationen | Keine versionierte Baseline | Neue DB und Kopie des Vor-Audit-Stands erfolgreich migriert; integrity_check und Bestandszahlen geprüft |
| Produktions-Smoke-Test | Kein Standalone-Lauf belegt | Katalog, Admin, Admin-JS, Header sowie tatsächliche Anfrage mit Speicherung und privater Mail-Datenabgrenzung auf separater Kopie bestanden |
| Lighthouse | 75/92/96/100 | 98/100/100/100; LCP 2,48 s in dokumentiertem Einzellauf, kein Feld-/P75-/INP-Nachweis |

## Kritische E2E-Abläufe

1. Theme: Hell/Dunkel/Auto, Reload-Persistenz, OS-Wechsel und sichtbare Vorteils-Icons.
2. Suche: live nach englischer Kategorie, Produkt und Begriff, Keyboard-Auswahl, Enter, Escape, Schließen-Button, Fokus-Rückgabe, leere Suche/kein Treffer und API-Ausfall.
3. Consent: sauberes Profil, kein früher Analyse-Request, Ablehnung, Reload, Speichern, Widerruf, Checkboxstatus und Rückweg.
4. Konfigurierter Testtracker: Requests im Browser abgefangen, vor Grant 0 Ladevorgänge, nach Grant genau 1, wiederholtes Speichern ohne Doppelstart; nach Widerruf frisches Dokument, kein erneutes Laden und zugängliches _ga-Cookie gelöscht.
5. Sprache: DE→EN mit Kategorie/Suchfilter und Produkt-Slug; Formularentwurf beim ausdrücklich gewählten Sprachwechsel einmalig übernommen und danach aus Sitzungsspeicher gelöscht, keine personenbezogenen Formulardaten in der URL.
6. Kategorien: jede Kategorie inklusive Nulltreffer und Alle Produkte gegen angezeigten Zähler geprüft.
7. Mobil: Menüzugang, Fokusfalle, Escape und Fokus-Rückkehr; sieben Breiten über vier Hauptansichten.
8. A11y: 24 Seiten in beiden Themes; zusätzlich eigene Screenshot-Sichtkontrolle von Suchdialog und dunkler Startseite.

## Reproduzierte und behobene Fehler während der Arbeit

Ein früher Lauf scheiterte beim kalten API-Start während parallelem Build; erneuter stabiler Lauf bestand. Mobile Menüs hatten einen durch CSS versteckten Schließen-Button und falsche Fokusrückgabe; behoben. axe fand weitere Button-/Label-Kontraste und eine ungültige leere Definitionsliste; behoben. Neue Compiler-/Lint-Regeln deckten Typverbreiterungen und fehlende Fehlerursachen auf; korrigiert. Der erste echte Standalone-Lauf scheiterte an fehlenden Sharp-DLLs; Tracing und Paketierung wurden korrigiert und erneut erfolgreich geprüft. Die alte Entwicklermigrationsmarkierung erforderte auf der Testkopie eine bewusste Baseline-Adoption; keine Original-Nutzdaten wurden dafür gelöscht.

## Nicht geprüft / Grenzen

- Reale SMTP-Zustellung, SPF/DKIM/DMARC, Provider-Verträge, echte Turnstile-Challenge und fremde Analytics-Container; Analyse im E2E ist simuliert und verhindert echte Google-Aufrufe.
- Safari/Firefox, reale iOS-/Android-Geräte, Screenreader-Nutzung, manuelle Zoom-200%- und Landscape-Matrix, Last-/Dauertests und Feld-INP.
- Remote-CI: Workflow vorbereitet, noch nicht gepusht/ausgeführt. Kein produktives TLS/DNS/CDN/Monitoring und keine vollständige Wiederherstellung aus externen Backups.
- Axe und Screenshots allein beweisen keine vollständige Barrierefreiheit. Automatisierte Tastaturabläufe sind kein vollständiger manueller Assistenztechnik-Audit.
- Fehlende fachliche Übersetzungen einzelner CMS-/Testprodukte werden mit englischen Ersatztexten abgefangen; Vollständigkeit sämtlicher redaktioneller Inhalte ist nicht bestätigt.

## Wiederholung

Root: `npm run lint`, `npm run test:static`, `npm run test:e2e` (Chrome und laufende lokale Dienste). Backend: `npm test`, `npm run typecheck`, `npm run build` mit sicherem Buildsecret. Zusatzprüfungen: `node tools/verify-api.mjs`, `node tools/test-migrations.mjs`, `node tools/production-smoke.mjs`, `node tools/measure.mjs after`. Migration-/Produktionsskripte nutzen eigene Dateien unter backend/data/; bestehende Benutzer, Produkte und Anfragen werden dabei nicht verändert.

## Sichtbarer Abschlusscheck

Zusätzlich zur automatisierten Suite wurde die EN-Startseite im integrierten Browser tatsächlich geöffnet: Cookie-Ablehnung, Suchöffnung mit automatisch fokussiertem Feld, Suche nach Hilti, Fokus per Pfeiltaste auf das Ergebnis und Escape mit Rückgabe zum Suchbutton wurden anhand des sichtbaren Accessibility-Baums kontrolliert. Tastenkürzel für Browser-Zoom waren im integrierten Browser nicht als exakte 200%-Vergrößerung nachweisbar; dieser Punkt bleibt NOT TESTED. Der fehlgeschlagene erste Verbindungsversuch fand vor dem erneuten Start der lokalen Dienste statt und wurde danach erfolgreich wiederholt.
