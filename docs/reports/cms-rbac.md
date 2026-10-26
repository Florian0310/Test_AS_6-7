# CMS-Überarbeitung und CI-Korrektur

Stand: 26.10.2026. Keine Veröffentlichung, kein Commit oder Push durch den Agenten.

## Analyse und Umsetzung

Vorher genügte `Boolean(req.user)` für Benutzerverwaltung, Anfragen und Einstellungen. Das CMS hatte keine Rollen und verwendete teilweise abweichendes Branding. Jetzt erhalten Benutzer ein erforderliches Rollenfeld mit den festen Werten `admin` und `user`, Standard `user`.

Zentrale Zugriffshelfer in `backend/src/utils/access.ts` sichern Collections, Globals und Felder. Separate Hooks schützen Rollenvergabe, Anfragenannahme und das letzte Admin-Konto. User sehen die freigegebenen Menüs automatisch über Payloads Berechtigungen; eigene Komponenten prüfen die Rolle zusätzlich. Anfrage-Updates durch User akzeptieren ausschließlich `{status: 'accepted'}` und keine zusätzlichen Felder. Administrative Einstellungen bleiben auch bei direktem API-Aufruf gesperrt.

Die Payload-Standardansichten und CRUD-Abläufe bleiben erhalten. Login, Markenlogo, Buttons, Profilanzeige, Dashboard-Schnellzugriffe und Kennzahlen verwenden die bestehende Blau-/Weiß-/Orange-Palette. Die Palette wird für den Backend-Build aus derselben Frontend-Quelle erzeugt. Deutsch ist die Standardsprache, Englisch bleibt verfügbar. Ein lokaler Avatar ersetzt externe Gravatar-Abrufe. Mobile Breadcrumbs und Metadaten können sich ohne Seitenüberlauf anpassen. Die Rollenmatrix und Bedienung stehen im [CMS-Leitfaden](../guides/cms.md).

## Migration und Bestand

`20261026_163132_cms_roles` ergänzt ausschließlich das Rollenfeld und zwei Schutztrigger. Die Anpassung läuft auf SQLite atomar. Frühere Konten behalten ihren bisherigen Vollzugriff als Admin; neue Konten werden User. Der lokal verwendete Upgrade-Helfer sichert die Datenbank vorab und verifiziert die bisherigen Felder von Benutzern, Produkten, Kategorien, Medien und Anfragen. Es werden keine Benutzerpasswörter geändert oder Testkonten im Arbeitsbestand angelegt.

Die Migration wurde auf einer Bestandskopie und einer frischen Datenbank geprüft. Auch die bestehenden Fresh-/Upgrade-Migrationstests bestehen. Der Arbeitsbestand wurde nach Sicherung migriert; die bisherigen Datensätze und Anmeldedaten sind erhalten. Automatischer Rollen-Downgrade wird zugunsten einer kontrollierten Wiederherstellung verweigert.

## Qualitätssicherung

- Produktionsbuild einschließlich eigener Theme-Erzeugung, ImportMap und Standalone-Paket erfolgreich.
- Backend: 59 Tests einschließlich 15 neuer RBAC-Fälle; Typprüfung und Lint erfolgreich.
- CMS: 10 echte Browser-/API-Tests für beide Rollen, Login/Logout, CRUD, Upload, Einstellungen, unerlaubte Schreibzugriffe, bestehende JWTs nach Rollenänderung und letztes Admin-Konto.
- Responsive Prüfung für Login und beide Dashboards zwischen 320 und 1920 Pixeln, zusätzlich mobile Anfrageansicht.
- Login und eigene Dashboard-Komponenten ohne Axe-AA-Befund. **Offen:** Payload 3.92 meldet im nativen Dashboard-Layout-Wähler eine unbeschriftete Combobox und ein fokussierbares `aria-hidden`-Element. Diese beiden genau begrenzten Fremdkomponenten-Befunde werden im Testbericht aufgezeichnet; zusätzliche Befunde lassen Tests fehlschlagen. Keine vollständige WCAG-Konformität des CMS behauptet.
- Öffentliche Website: vollständige bestehende 16er-Browserprüfung mit frischen Seed-Daten ausgeführt. Die öffentlichen Geschäftsabläufe bleiben erhalten.

Nachweise liegen unter `artifacts/`: `cms-e2e-results.json`, `cms-axe.json`, `cms-*.png`, `cms-migration.log`, `e2e-results.json` und `migrations.json`. Datenbank- und Medienkopien bleiben außerhalb öffentlicher Ausgaben.

## GitHub-Actions-Fehler

Die beiden fehlgeschlagenen Läufe [#2](https://github.com/Florian0310/Test_AS_6-7/actions/runs/40355514452) und [#3](https://github.com/Florian0310/Test_AS_6-7/actions/runs/40358434440) scheiterten am selben Test: Nach dem Löschen des Suchbegriffs wurden vier Produktkarten erwartet. Vier Produkte existierten nur im lokalen Bestand; die regulären Seeds erzeugen zwei. Build, Typprüfung, Audit und alle anderen Browsertests waren dort erfolgreich.

Die Erwartung wird jetzt aus der tatsächlichen Katalogantwort und der Seitengröße abgeleitet. Die vollständige Website-Suite wurde lokal mit einer neuen Datenbank und genau den zwei regulären Seed-Produkten erfolgreich reproduziert. Die CI führt zusätzlich die isolierte CMS-Suite aus und bewahrt bei Fehlern Prüfberichte/Screenshots/Traces auf. Ein grüner neuer GitHub-Lauf ist erst nach einem autorisierten Commit/Push dieser Änderungen nachweisbar; die alten fehlgeschlagenen Läufe wurden nicht als erfolgreich dargestellt oder sinnlos erneut gestartet.

## Verbleibende Freigaben

Produktive Secrets, Hosting, SMTP/Passwort-Reset, rechtliche/steuerliche Angaben, Produkt-/Bildfreigabe und Betriebsabnahme bleiben entsprechend der [Go-Live-Checkliste](../go-live-checklist.md) offen. Die native Payload-Layout-Auswahl benötigt eine gesonderte Accessibility-Korrektur. Diese Arbeiten sind keine Voraussetzung für den belegten lokalen Rollen- und CRUD-Test, aber werden nicht als erledigt ausgegeben.

Grundlage der Integration: [Payload Access Control](https://payloadcms.com/docs/access-control/overview), [Feldzugriffe](https://payloadcms.com/docs/access-control/fields), [CSS-Anpassungen](https://payloadcms.com/docs/admin/customizing-css) und [Migrationen](https://payloadcms.com/docs/database/migrations).
