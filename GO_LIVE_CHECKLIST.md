# Go-live-Checkliste

Stand 26.10.2026. **Entscheidung: NO-GO für öffentliche Produktion.** Lokaler Entwicklungs-/Reviewbetrieb ist möglich. PASS gilt ausschließlich für die explizit beschriebene Prüfung, nicht für einen ganzen Themenbereich oder die produktive Infrastruktur.

| Bereich / Kriterium | Status | Nachweis / nächste Voraussetzung |
|---|---|---|
| Funktion: Suche, Kategorien, Navigation, Anfragepreis | PASS | Unit-/E2E-Tests; serverseitige Berechnung |
| Funktion: tatsächliche Anfragespeicherung im Produktionsmodus | PASS | Separate SQLite-Kopie, HTTP 201 und Datensatzprüfung |
| Funktion: reale Kontakt-/Benachrichtigungszustellung | NOT TESTED | SMTP-Anbieter/Absenderdomain, Credentials und Empfängerprozess fehlen |
| Funktion: verbindlicher Online-Payment-Checkout | NOT APPLICABLE | Aktuelle Anwendung erzeugt unverbindliche Anfragen |
| Security: öffentlicher Server sperrt interne Dateien | PASS | Fünf private Pfade liefern 404; nur dist/ veröffentlichen |
| Security: Dependency-Audit und explizite Zugriffsregeln | PASS | npm audit 0; HTTP 401/403 und Unit-Tests |
| Security: produktive Accounts/Secrets | FAIL | Bestehende Credentials nicht rotiert; unsichere lokale Defaults sind nicht produktionsfähig |
| Security: Proxy-/CORS-/TLS-Konfiguration der echten Domain | NOT TESTED | Freigegebene Origins, korrekte Forwarded-Header, direkter Backendport gesperrt |
| Security: externer Penetrationstest / Upload-AV | NOT TESTED | Nicht beauftragt/keine Produktionsumgebung vorhanden |
| Datenschutz: kein optionales Tracking vor Grant / nach Widerruf | PASS | E2E inkl. simulierter Trackingkonfiguration und Reload |
| Datenschutz: reale Anbieter, Logs, AV-Verträge und Löschfristen | FAIL | Unternehmens-/Providerangaben und betriebliche Prozesse ergänzen |
| Rechtliches: Willy Schröder und Pernitzer Anschrift konsistent | PASS | Nutzerbestätigung in Seiten, Defaults und lokalen Globals umgesetzt |
| Rechtliches: vollständige Gewerbe-/Register-/Kammerangaben | FAIL | Rechtsform, UID/Registerstatus, Behörde und Berufsrecht offen |
| Rechtliches: Bruttopreise, Pflichtkosten und Mietbedingungen | FAIL | Steuerstatus, Preisfreigabe und juristische Vertragsprüfung erforderlich |
| Rechtliches: BaFG-Ausnahme/Anwendbarkeit verbindlich geklärt | NOT TESTED | Betriebsgröße und juristische Einordnung fehlen |
| Rechtliches: Lizenzbelege sämtlicher Assets | NOT TESTED | Vorhandene Urheberangaben erhalten, Nutzungsrechte nicht extern verifiziert |
| A11y: 24 Seiten, beide Themes, axe-AA-Regeln | PASS | 48 Prüfungen ohne gemeldete Verstöße |
| A11y: Tastaturabläufe der Hauptinteraktionen | PASS | Automatisierte echte Tastendrücke inkl. Fokusfalle/Rückgabe |
| A11y: vollständiger manueller WCAG-/Screenreader-Audit | NOT TESTED | Automatisierte Tests ersetzen diese Abnahme nicht |
| Performance: Lighthouse-Laborziele | PASS | Einzellauf 98/100/100/100; siehe Messgrenzen |
| Performance: reale P75-CWV einschließlich INP | NOT TESTED | Keine Felddaten oder echte Hostingmessung |
| SEO: interne Ziele, Canonical/hreflang, Sitemap und 404 | PASS | 26 Seiten statisch geprüft, 404 per HTTP; EN-Labor-SEO 100 |
| SEO: Indexierung und Produkt-SEO auf echter Domain | NOT TESTED | Search-Console-/Domainzugriff fehlt; dynamische Slug-Seiten abschließend prüfen |
| Responsive: sieben Breiten über vier Hauptseiten | PASS | Kein horizontaler Überlauf in geprüfter Matrix |
| Responsive: reale Geräte, Landscape, Zoom 200 % | NOT TESTED | Separate manuelle Geräteprüfung erforderlich |
| Mehrsprachigkeit: UI/Routen, Filter/Slug und Formularwechsel | PASS | EN-Zielseiten ergänzt; E2E bestanden |
| Mehrsprachigkeit: alle redaktionellen CMS-Inhalte freigegeben | FAIL | Testprodukte/englische Beschreibungen und technische Spezifikationen prüfen |
| Theme: Hell/Dunkel/Auto, Persistenz und Systemwechsel | PASS | E2E und Screenshots |
| Cookie-Management: speichern, widerrufen, verlassen, Sync | PASS | E2E; notwendige Einstellungen und Rückweg vorhanden |
| Deployment: sicherer Export und Standalone-Paket | PASS | Öffentliche Dateien getrennt; native Bibliotheken/Assets enthalten; dotenv ausgeschlossen |
| Deployment: Migration frisch + bestehende Kopie | PASS | Integritätsprüfung und Bestandszahlen unverändert |
| Deployment: echte Bereitstellung, DNS/TLS, Dienstneustart | NOT TESTED | Keine Veröffentlichung durchgeführt; Vorlage muss angepasst werden |
| Betrieb: externe Backups und vollständige Wiederherstellung | NOT TESTED | Lokale Sicherung/Migration getestet, Medien und externe Recovery noch offen |
| Monitoring: Alarmierung, Logs und Ausfallüberwachung | NOT TESTED | Kein produktives Monitoringkonto oder Alarmziel konfiguriert |
| Wartbarkeit: Lint, Typecheck, Regressionen, reproduzierbare Inhalte | PASS | Lokale Prüfungen und Generatoren vorhanden |
| Wartbarkeit: Remote-CI erfolgreich | NOT TESTED | Workflow angelegt, kein Push/Remote-Lauf |
| Datenqualität: nur freigegebene Produktdaten | FAIL | Zwei Testprodukte und fehlende eigene Bilder/Übersetzungen im erhaltenen lokalen Bestand |

Vor GO müssen alle FAIL-Punkte behoben und die produktionskritischen NOT-TESTED-Punkte tatsächlich geprüft werden. Eine technische Freigabe ersetzt die erforderliche juristische Prüfung nicht. Nichts wurde veröffentlicht, committed oder gepusht.
