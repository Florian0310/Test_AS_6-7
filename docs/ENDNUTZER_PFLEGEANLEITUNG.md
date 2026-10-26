> Aktueller Auditstand vom 26.10.2026: [Go-live-Checkliste](../GO_LIVE_CHECKLIST.md) und [Auditbericht](../AUDIT_REPORT.md). Die nachfolgenden historischen Betriebsangaben vor Nutzung mit dem aktuellen Stand abgleichen.

# Endnutzer-Pflegeanleitung (Admin)

## 1) Anmeldung

1. `http://localhost:3001/admin` aufrufen
2. mit Admin-Zugangsdaten anmelden

## 2) Kategorien pflegen

- Menue: `Kategorien`
- Neu anlegen, umbenennen, aktiv/inaktiv setzen
- `Sortierung` fuer Reihenfolge nutzen

## 3) Produkte pflegen

Pflichtfelder:
- Titel
- Artikelnummer
- Kategorie
- Kurzbeschreibung
- Preise: Tagespreis, 3-Tages-Preis, Wochenpreis

Optional:
- Langbeschreibung
- Bilder
- Verfuegbarkeitsstatus
- Kaution, Mindestmietdauer, Reinigungsgebuehr
- technische Daten

## 4) Preise aktualisieren

Bereich `Preise und Tarife` im Produkt:
- Tarif I (Tag)
- Tarif II (3 Tage)
- Tarif III (Woche)

## 5) Medien

- Menue: `Medien`
- Bild hochladen
- Alternativtext pflegen (wichtig fuer Barrierefreiheit)

## 6) Anfragen bearbeiten

- Menue: `Anfragen`
- Status setzen: `Neu`, `In Bearbeitung`, `Beantwortet`, `Angenommen`, `Abgelehnt`, `Abgeschlossen`

## 7) Neue Globals

### `Vermietungs-Einstellungen`
- Versicherungssatz
- Preis-Hinweis
- Anfrage-Empfaenger

### `Website-Einstellungen`
- SEO-Defaults
- Tracking IDs (GTM / GA4)
- Startseite: "Beliebte Produkte" (Titel, Untertitel, Produktauswahl)
- Sortiment/Katalog: Ueberschrift, Einleitung, Such-Placeholder und Bereichstitel (DE/EN)

### `Kontakt-Einstellungen`
- Firmenname, Adresse, Telefon, E-Mail
- Empfaenger fuer Kontaktformular

### `Rechtstexte`
- Impressum DE/EN
- Datenschutz DE/EN
- Cookie-Text DE/EN
- Barrierefreiheit DE/EN

## 8) Cookie/Tracking

Wichtig:
- Analytics nur nach Consent aktivieren
- IDs in `Website-Einstellungen` eintragen
- Cookie-Einstellungen im Frontend pruefen
- Statistik im Admin basiert auf internen Daten (Produkte/Kategorien/Anfragen), nicht auf externem Tracking

## 9) Typische Fehler

### Produkte erscheinen nicht
- Produkt `Aktiv`?
- Kategorie `Aktiv`?
- Pflichtfelder vorhanden?

### Kontaktformular sendet nicht
- Backend erreichbar?
- Turnstile-Schluessel gesetzt?
- Rate-Limit ausgeloest?

### Keine Anfrage-E-Mail
- `ENABLE_EMAIL_SENDING` und SMTP in `backend/.env` pruefen
- ansonsten wird E-Mail als vorbereitetes Ergebnis gespeichert
