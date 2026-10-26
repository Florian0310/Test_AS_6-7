# Deployment und Betrieb

**Vorbereitet, nicht veröffentlicht.** Vor Produktion die [Go-Live-Checkliste](GO_LIVE_CHECKLIST.md) abarbeiten und diese Anleitung an die tatsächlich gewählten Anbieter anpassen.

## Frontend

```powershell
$env:BACKEND_PUBLIC_URL='https://cms.ihre-tatsaechliche-domain.at'
npm run export
```

Beispieladresse ersetzen. Der Export verlangt HTTPS außerhalb localhost und erzeugt `dist/` mit Frontend-Modulen und öffentlicher Konfiguration. Nur `dist/` veröffentlichen; Repository, Backend, `.env`, Datenbank, Tools und interne Dokumente bleiben außerhalb des Webroots. Der Export entfernt nach Pfadprüfung die alte generierte dist-Ausgabe, damit keine veralteten Assets zurückbleiben. Eigene Dateien nicht in dist speichern.

Verzeichnis- und `.html`-URLs erhalten, `404.html` mit Status 404 ausliefern, HTTPS und Kompression aktivieren. JavaScript-Module benötigen den korrekten MIME-Typ. Unversionierte HTML-/Konfigurations-/Moduldateien bei Releases revalidieren statt dauerhaft unveränderlich zu cachen.

Die vorhandenen Vorlagen unter `deploy/` und die Header in `tools/serve.mjs` an echte Domains anpassen. CSP, CORS, Preview-Frames und Turnstile müssen zur produktiven Konfiguration passen. Der lokale Dateiserver ersetzt keine verwaltete Produktionsinfrastruktur.

## Backend

1. Mit unterstütztem Node und Backend-Lockfile installieren. Eigenes starkes Secret bereitstellen und lokale/Bootstrap-Zugangsdaten ersetzen.
2. Expliziten persistenten `DATABASE_URI` und dauerhaften Medienpfad (`MEDIA_DIR`) außerhalb austauschbarer Releases festlegen.
3. Konsistente Datenbank- und Mediensicherung erstellen. Migrationen zuerst auf einer Kopie prüfen; keine destruktiven frischen Migrationen/Seeds auf Bestandsdaten. Dieses Refactoring benötigt keine neue Migration.
4. `npm --prefix backend run build` erzeugt das Standalone-Paket; `postbuild` ergänzt Assets/native Bibliotheken und schließt dotenv aus. `npm --prefix backend run start` nutzt den vorgesehenen Wrapper. Secrets aus geschützter Backend-Konfiguration oder Dienst-Umgebung laden.
5. Öffentliche Backend-/Frontend-/Preview-URLs und erlaubte Origins auf exakte HTTPS-Ziele begrenzen. Backendport nur hinter dem Proxy verfügbar machen. Forwarded-Header nur bei einem vertrauenswürdigen überschreibenden Proxy akzeptieren.
6. Bootstrap ausschalten, Schreibrechte begrenzen und Dienstneustart/Logs prüfen.

SQLite benötigt zuverlässigen persistenten Speicher. Mehrere Instanzen erfordern eine abgestimmte Datenbank-/Medienstrategie und gemeinsame Rate-Limits.

## E-Mail, Datenschutz und Abnahme

Vor `ENABLE_EMAIL_SENDING` SMTP/TLS, Absenderdomain, SPF/DKIM/DMARC und Empfängerprozess einrichten und tatsächlich prüfen. Der noch fehlende Payload-Auth-Mailadapter für Passwort-Reset ist separat erforderlich. Konsolenausgaben weisen keine Zustellung nach.

Turnstile produktiv konfigurieren, Entwicklungsbypass deaktivieren. Tracking bleibt im Export ohne Kennungen ausgeschaltet. Vor Aktivierung Anbieter-/Datenschutzangaben und echte Einwilligungstests abschließen. Rechts-/Steuertexte, Preise und Mietbedingungen betrieblich freigeben.

Auf der echten Domain Katalog, Filter, Galerie, DE/EN, Consent, beide Formulare, Preisberechnung, CMS-Login/Passwort-Reset, Medien, 404 und private Pfade prüfen. Eine erlaubte Testanfrage muss nach Dienstneustart erhalten bleiben und ihre Benachrichtigung tatsächlich ankommen.

## Backup, Rückkehr und Monitoring

Vorige Release-Artefakte aufbewahren. SQLite und Medien gemeinsam extern sichern; Zugriff, Verschlüsselung und Aufbewahrung festlegen. Isolierte Wiederherstellung einschließlich Medien und Anfragen nachweisen. Bei Rückkehr Datenbankkompatibilität bewerten; niemals ältere Daten unkontrolliert über neue Anfragen kopieren. Hier bleiben Modelle kompatibel.

Verfügbarkeit, Speicherplatz, fehlgeschlagene Anfragen/E-Mails und Sicherungen überwachen. Updates zuerst in einer Testumgebung prüfen. Reale P75-CWV/INP sind erst im tatsächlichen Betrieb messbar. Hosting, Alarmziel, Wiederanlauf und externe Recovery sind noch nicht abgenommen.
