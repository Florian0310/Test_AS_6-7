# Sicherheitsbericht

Stand 26.10.2026. Prüfbereich: lokale statische Website, Payload/Next-Backend, Konfiguration und Abhängigkeiten. Keine fremden Ziele oder destruktiven Angriffstests.

## Befunde und Maßnahmen

| Priorität / Risiko | Komponente | Korrektur | Nachweis |
|---|---|---|---|
| P0: Offenlegung interner Dateien | Allgemeiner statischer Server | Öffentliche Dateien/Ordner explizit freigegeben; versteckte Dateien, Backend, Daten und Dokumentation gesperrt; Export enthält nur öffentliche Inhalte | HTTP 404 auf fünf interne Pfade sowie unbekannte Route |
| P0: Kritische Dependency-Warnungen | Payload, Next und transitive Pakete | Kompatible 3.x/16.x-Updates, gezielte getestete Sicherheitsmigrationen von Nodemailer/Zod/Sharp; transitive Overrides | Backend npm audit: 40 (2 kritisch, 24 hoch, 14 moderat) → 0; Root-Tooling ebenfalls 0 |
| P0: Unbeabsichtigte Admin-Erstellung | Payload-Konfiguration, Users | Kein Ersatzpasswort; Bootstrap nur explizit mit starkem Passwort; CRUD/Admin nur authentifiziert; Login-Lockout und begrenzte Sessions | Unit-Zugriffsprüfungen und lokale 403 auf Users/Requests; Statistik 401 |
| P1: Unsichere Produktionsdefaults | Secrets, CORS, Captcha | Starkes explizites Secret erforderlich, keine null-Origin-Freigabe, Entwickler-Originliste nur lokal; Dev-Captcha-Bypass in Produktion ausgeschlossen | Guard-Test und beobachteter abgewiesener Build mit unsicherer Entwicklungskonfiguration; erfolgreicher Build mit separatem Zufallssecret |
| P1: Missbrauch öffentlicher Formulare | JSON-Endpunkte | 16 KiB Body-Grenze auch bei Streams, Origin-Prüfung, Rate-Limits, begrenzter Speicher, Retry-Fehler; Forwarded-IP nur nach expliziter Vertrauenskonfiguration | 400/413/403-HTTP-Fälle; Unit-Tests für Limits/Proxy/JSON |
| P1: Interne Daten in Antworten | Fehler-/Mailantworten | 500er ohne interne Fehlermeldung; keine Mail-Vorschau, internen Empfänger oder SMTP-Details in öffentlichen Antworten | Unit-Test und isolierter realer Produktionsrequest |
| P1: Nachlaufendes Tracking | Consent | Kein optionaler Request vor Zustimmung; Datentyp-/Versions-/Ablaufprüfung; Widerruf beendet Dokument und löscht zugängliche Analyse-Cookies | E2E mit abgefangenem konfiguriertem Tracker; Reload und erneuter Besuch ohne erneutes Laden |
| P1: Preis-/Datumsmanipulation | Mietanfragen | Serverseitige Preise; Datenschutzhinweisbestätigung; Menge 1; aktive Geräte; echte Kalendertage; begrenzte Dauer | Preis-, Anfrage- und Security-Tests |
| P1: Ungeeignete Uploadformate | Media | Nur JPEG/PNG/WebP/AVIF, authentifizierter Upload, 8 MiB Datei-/10 MiB Requestlimit; aktualisierter Decoder; neue Vorschaubilder als WebP ohne Hochskalieren | Konfigurations-/Typecheck; echter authentifizierter Produktionsupload und Malware-Scan nicht durchgeführt |
| P1: Secrets im Buildpaket | Next-Standalone | dotenv-Dateien nach Build aus dem Paket entfernt; Runtime-Umgebung gesondert; native Sharp-/SQLite-Dateien vollständig erfasst | Paketprüfung und erfolgreicher Standalone-Smoke-Test |
| P2: Browserhärtung | Frontend und Backend | CSP, nosniff, Referrer-/Permissions-Policy, Produktion HSTS; Backend auf Loopback; eigene 404 | HTTP-Headerprüfungen lokal; öffentliche TLS-/Proxy-Konfiguration nicht erreichbar |

## Versionsstand und Kompatibilität

Payload-Pakete 3.92.0, Next 16.4.3, Nodemailer 10.2.1, Sharp 0.35.5, Zod 4.6.7; weitere exakte Versionen in Lockfiles. Node 24.22.1 ist lokal als Werkzeugruntime vorhanden und über .nvmrc dokumentiert. Kontrollierte Major-/Minor-Migrationen wurden mit Typecheck, 41 Backend-Tests, Migrationen und Produktionslauf geprüft. Die veröffentlichte Payload-Sicherheitsmigration verlangt neue Datenbankfelder; eine additive Baseline liegt bei.

Quellen: [Payload-Sicherheitsupdate](https://payloadcms.com/posts/blog/payload-security-update-available-for-3x-and-40), [Payload 3.90-Migrationshinweise](https://github.com/payloadcms/payload/releases/tag/v3.90.0), [OWASP Autorisierung](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [OWASP Uploads](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

## Offene Sicherheitsaufgaben

Bestehende Zugangsdaten wurden nicht zurückgesetzt. Vor Veröffentlichung starke Produktionssecrets und Admin-Passwörter setzen/rotieren, Secret-Historie prüfen und nur erforderliche Origins freigeben. Bei mehreren Prozessen braucht es Rate-Limits am vertrauenswürdigen Proxy bzw. einen gemeinsamen Store. TRUST_PROXY_HEADERS nur aktivieren, wenn ein vorgeschalteter Proxy X-Real-IP überschreibt und der Backendport nicht direkt erreichbar ist.

Die Admin-CSP erlaubt Inline-Skripte für Payload/Next; eine Nonce-Integration ist eine gesonderte Härtung. Die CSP berücksichtigt die erlaubte lokale CMS-Vorschau; das Frontend lässt sich nur durch die vorgesehene CMS-Origin einbetten. In-Memory-Limits ersetzen keine Edge-Abwehr. Für Payload-Authentifizierung ist kein eigener E-Mail-Adapter eingerichtet; Passwortreset und echte Benachrichtigungszustellung müssen vor Betrieb eingerichtet und geprüft werden. Reales TLS, DNS, SMTP-Zustellung, Login mit produktiven Accounts, AV-Scanning, externe Backupverschlüsselung, Penetrationstest und vollständige Secret-Historienprüfung sind nicht nachgewiesen. Keine pauschale Sicherheitsgarantie.
