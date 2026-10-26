# Go-Live-Checkliste

Stand 26.10.2026: **NO-GO für öffentliche Produktion.** Die vollständige Kriterienmatrix steht in der [zentralen Checkliste](../GO_LIVE_CHECKLIST.md). Diese Datei ist der Einstieg aus der Entwicklerdokumentation; es gibt keine zweite abweichende Freigabeentscheidung.

## Lokal vorbereitet

- Gemeinsamer Seitenrahmen auf 27 Seiten, feste Markendarstellung und zentrale Katalogsuche.
- URL-Filter, Abwahl/Reset, Sortierung, Pagination, Originalbild-Galerie und Formularschutz.
- Frontend-/Backend-Prüfungen, Produktionsbuild und isolierte Produktionsanfrage.
- Öffentlicher Export und Zugriffssperren; keine Modellmigration oder Datenlöschung.

## Kritische Voraussetzungen vor GO

- [ ] Produktive Secrets/Accounts, exakte Origins, TLS und Proxy-Konfiguration prüfen.
- [ ] Hosting-/E-Mail-Anbieter, Datenschutzangaben, AV-Verträge und Löschprozesse festlegen.
- [ ] SMTP und Payload-Auth-Mailadapter samt Zustellung/Passwort-Reset prüfen.
- [ ] Rechtsform, Gewerbe-/Register-/Kammer-/UID-Angaben, Steuerstatus und Bruttopreise klären.
- [ ] Mietbedingungen und persönliche Bestätigung juristisch/betrieblich freigeben.
- [ ] Testprodukte, Bilder/Nutzungsrechte, Übersetzungen und Spezifikationen freigeben.
- [ ] Reale Geräte, Zoom, Screenreader und weitere manuelle WCAG-/BaFG-Fragen abnehmen.
- [ ] Externe Recovery, Überwachung, Alarmierung und Dienstneustart nachweisen.
- [ ] Remote-CI und echte Domain-/Indexierungsprüfung durchführen.

Kein produktiver Eingriff, Push oder Commit wurde vorgenommen. Technische Nachweise und Messgrenzen: [Refactoring-Bericht](REFACTORING_REPORT.md). Betriebsschritte: [Deployment](DEPLOYMENT.md).
