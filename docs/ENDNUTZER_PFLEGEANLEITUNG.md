# Endnutzer-Pflegeanleitung (Admin)

Diese Anleitung richtet sich an Redakteure oder Betreiber ohne technische Vorkenntnisse.

## 1) Anmeldung im Admin

1. Browser oeffnen: `http://localhost:3001/admin`
2. Mit Admin-Zugangsdaten anmelden

## 2) Neue Kategorie anlegen

1. Links `Kategorien` oeffnen
2. `Create new` klicken
3. `Name` eintragen (Slug wird automatisch erzeugt)
4. Optional `Beschreibung` und `Sortierung` setzen
5. `Aktiv` pruefen
6. Speichern

## 3) Kategorie umbenennen

1. `Kategorien` oeffnen
2. Gewuenschte Kategorie anklicken
3. Feld `Name` aendern
4. Speichern

Hinweis: Der Slug kann automatisch angepasst werden. Wenn der Slug bereits im Frontend verwendet wird, bitte mit Bedacht aendern.

## 4) Neues Produkt anlegen

1. `Produkte` oeffnen
2. `Create new` klicken
3. Pflichtfelder ausfuellen:
- `Titel`
- `Artikelnummer`
- `Kategorie`
- `Kurzbeschreibung`
- Preisgruppe `Tarif I`, `Tarif II`, `Tarif III`
4. Optional:
- Bilder hochladen (`Produktbilder`)
- `Langbeschreibung`
- `Technische Daten`
- `Kaution`, `Mindestmietdauer`, `Reinigungsgebuehr`
5. Speichern

## 5) Preise pflegen

Produkt oeffnen -> Bereich `Preise und Tarife`:
- `Tarif I - Tagespreis`
- `Tarif II - 3-Tages-Preis`
- `Tarif III - Wochenpreis`

Optional:
- `Kaution`
- `Mindestmietdauer`
- `Reinigungsgebuehr`
- `Preisnotiz`
- `Hinweis zu Treibstoff / Verschleiss`

## 6) Bild hochladen

1. Produkt oeffnen
2. Feld `Produktbilder`
3. Datei auswaehlen oder hochladen
4. Im Medien-Eintrag `Alternativtext` pflegen
5. Speichern

## 7) Produkt aktiv/inaktiv schalten

Im Produkt rechts:
- Feld `Aktiv` an/aus

Auswirkung:
- Inaktive Produkte werden in den oeffentlichen Katalog-Endpoints nicht mehr ausgeliefert.

## 8) Anfragen ansehen und bearbeiten

1. `Anfragen` oeffnen
2. Anfrage auswaehlen
3. Status setzen:
- `Neu`
- `In Bearbeitung`
- `Beantwortet`
- `Angenommen`
- `Abgelehnt`
- `Abgeschlossen`
4. Speichern

Wichtig:
- In `Produkt-Snapshot` und `Preiszusammenfassung` sehen Sie den Stand zum Zeitpunkt der Anfrage.

## 9) Wo wird die Anfrage-E-Mail hingeschickt?

Global `Vermietungs-Einstellungen`:
- Feld `Empfaenger fuer Anfragen`

Technische SMTP-Daten liegen in der `backend/.env`.

## 10) Preislogik kurz erklaert

- Es wird immer serverseitig gerechnet
- Wochenpreis (7 Tage) wird zuerst verwendet
- Danach 3-Tages-Preis
- Restliche Tage als Tagespreis
- Versicherung ist standardmaessig Pflicht (10%)
- Kaution/Reinigungsgebuehr kommen separat dazu

## 11) Typische Fehler

### Produkt erscheint nicht im Frontend
- Produkt evtl. `Aktiv = false`
- Kategorie evtl. `Aktiv = false`
- Pflichtfelder unvollstaendig

### Anfrage kommt ohne E-Mail an
- Anfrage ist trotzdem gespeichert
- `ENABLE_EMAIL_SENDING` und SMTP in `backend/.env` pruefen

### Bild wird nicht angezeigt
- Medien-Eintrag vorhanden?
- Dateityp Bild?
- Backend laeuft unter richtiger URL?
