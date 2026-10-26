> Aktueller Auditstand vom 26.10.2026: [Go-live-Checkliste](../go-live-checklist.md) und [Auditbericht](audits/audit-report.md). Die nachfolgenden historischen Betriebsangaben vor Nutzung mit dem aktuellen Stand abgleichen.

# Go-Live Checkliste

## Technik
- [ ] `backend/.env` mit produktiven Secrets gepflegt
- [ ] `PAYLOAD_SECRET` sicher gesetzt
- [ ] `PAYLOAD_ADMIN_PASSWORD` geaendert
- [ ] CORS-Origins auf produktive Domains begrenzt
- [ ] SMTP-Konfiguration getestet
- [ ] Turnstile Site/Secret Key gesetzt
- [ ] `ENABLE_EMAIL_SENDING=true` (falls produktiv gewuenscht)

## Datenschutz / Consent
- [ ] Consent-Banner erscheint bei Erstbesuch
- [ ] Ohne Consent werden keine Analytics-Skripte geladen
- [ ] Cookie-Einstellungen DE und EN pruefen
- [ ] Widerruf funktioniert und wird gespeichert

## Inhalt / CMS
- [ ] Kontaktdaten in `contact-settings` korrekt
- [ ] Rechtstexte in `legal-settings` final geprueft
- [ ] SEO-Defaults in `site-settings` gepflegt
- [ ] Kategorien und Produkte final gepflegt

## Frontend
- [ ] Keine externen Font-Requests
- [ ] Keine externen Icon-CDN-Requests
- [ ] Header-/Footer-Kontraste in Light/Dark geprueft
- [ ] Mobile Darstellung (320px bis Desktop) getestet
- [ ] Tastatur-Navigation und Fokuszustand geprueft

## SEO
- [ ] `robots.txt` erreichbar
- [ ] `sitemap.xml` erreichbar
- [ ] Canonical/Meta/OG auf Kernseiten geprueft
- [ ] JSON-LD auf Startseite validiert

## Funktionstests
- [ ] Produktliste laedt aus Payload
- [ ] Produktdetails + Preisberechnung funktionieren
- [ ] Anfrage-Checkout speichert Anfrage
- [ ] Kontaktformular sendet erfolgreich
- [ ] Admin-Login und Pflegeprozess getestet
