# Projektstruktur bereinigt

Stand: 26.10.2026. Ziel dieses Auftrags ist die Organisation des bestehenden Projekts ohne Änderung seiner Funktionen.

## Änderungen

| Vorher | Jetzt | Zweck |
|---|---|---|
| Öffentliche HTML-Routen, CSS und Sitemap im Repository-Root | ausschließlich generiert unter `dist/` | Quellen und veröffentlichbare Ausgabe trennen |
| Browsercode direkt unter `frontend/` | `frontend/src/` | eindeutiger Einstieg für Anwendungscode |
| Root-Assets und öffentliche Skripte/Konfiguration | `frontend/public/` | statische Eingaben an einer Stelle |
| `tools/templates/` und Root-`locales/` | `frontend/templates/` und `frontend/locales/` | alle Frontend-Quellen bündeln |
| Gemischte `tools/*.mjs` | `scripts/build/`, `check/`, `dev/`, `perf/`, `lib/` | Werkzeuge nach Aufgabe ordnen |
| Backend-Start/Paketierung in Root-Tools | `backend/scripts/` | Backend-eigene Werkzeuge beim Backend |
| Berichte im Root und doppelte Checklisten | `docs/guides/`, `reports/`, `archive/` und eine maßgebliche Go-Live-Matrix | aktuelle Anleitungen von Nachweisen unterscheiden |

Build und Export verwenden zentrale Projektpfade; der lokale Server liefert nur `dist/` aus. npm-Skripte, Backend-Paketierung, Frontend-Tests und CI folgen den neuen Pfaden. Die öffentliche Ausgabe behält alle bisherigen URLs, einschließlich der alten kleinen Skript-Einstiege. Generierte Dateien werden nicht mehr mit den Quellen versioniert. Eine zusätzliche Dokumentationsprüfung und CSS-Ressourcenprüfung sichern verschobene Verweise ab.

Entfernt wurden die ungenutzte Testabhängigkeit `supertest` samt 36 nicht mehr benötigten Paketen, das überholte einmalige Baseline-Skript und die nie eingelesene Root-Umgebungsvorlage. Historische Berichte und Abhängigkeits-Snapshots wurden erhalten und gekennzeichnet. Ein veralteter verschachtelter Next-Buildcache wurde aus dem Backend entfernt; Build-/Umgebungsdateien werden einheitlich ignoriert. Alte lokale Ausgaben liegen bei Bedarf im ignorierten `artifacts/structure-original-output/`; sie sind keine zweite gepflegte Quelle.

Bewusst erhalten: bestehende Bilder und Asset-Namen wegen ihrer URLs, sämtliche CMS-Daten/Migrationen, vorhandene Testwerkzeuge für ältere Sicherungen sowie der Payload-ImportMap-Reexport. Letzterer verbindet den tatsächlichen Admin-Einstieg mit der generierten Map und ist keine entbehrliche Dublette. Bestehende Backend-Namenskonventionen für Komponenten und Services bleiben erhalten.

## Prüfung

- Ausgangszustand: Build, Lint, 27 statische Seiten, 4 Frontend-Tests, 44 Backend-Tests und Typprüfung erfolgreich.
- Nach dem Umbau: alle **74** verglichenen öffentlichen Dateien bytegenau identisch mit dem Ausgangsstand; darunter HTML, CSS, JavaScript, Konfiguration und sämtliche statischen Assets. Ergebnis: `artifacts/structure-output-comparison.json`.
- Vollständige Chrome-Suite: **16 Tests bestanden**, einschließlich Suche/Filter, URL-Zustand, Formulare, Consent, DE/EN, neun Bildschirmbreiten und Axe auf 27 Seiten.
- Backend: **44 Tests**, Typprüfung und Produktionsbuild erfolgreich. Standalone-Start über den neuen Pfad mit **7 Produktionsprüfungen** auf einer Datenbankkopie erfolgreich; keine gültigen Testanfragen im Arbeitsbestand gespeichert.
- Lint sowie statische Prüfung von **27 Seiten** einschließlich CSS-Ressourcen und aller Browser-Module erfolgreich. Dokumentationsprüfung: **16 Markdown-Dateien**, keine fehlerhaften lokalen Links.
- **19 HTTP-Prüfungen** für private Pfade, Zugriffsschutz, ungültige Eingaben, Header und Kompression erfolgreich. Die neuen Source-/Template-/Scriptpfade sind ebenfalls nicht öffentlich erreichbar.
- Root- und Backend-Abhängigkeitsaudit: jeweils **0 gemeldete Schwachstellen**. Export mit isolierter Beispieladresse erfolgreich; veraltete Ausgabedateien und die Beispielkonfiguration gelangen nicht in das neue Paket. Anschließend wurde die lokale Konfiguration wiederhergestellt. Keine Veröffentlichung.

Die Bestandszahlen sind vor/nach dem Auftrag identisch: 1 Benutzer, 4 Produkte, 13 Kategorien, 2 Medien und 2 Anfragen. Es gibt keine Collection-/Modelländerung und keine Migration im Rahmen dieser Bereinigung. Lokale Browser-/Produktionsprüfungen ersetzen keine Remote-CI oder produktive Betriebsabnahme. Es wurde nichts committed, gepusht oder veröffentlicht. Der bestehende Go-Live-Status bleibt unverändert.

Neue Entwickler starten mit der [README](../../README.md) und dem [Entwicklungsleitfaden](../guides/development.md). Wichtigste Änderung im Ablauf: nach jeder Frontend-Quellenänderung `npm run build` ausführen, da der Server ausschließlich die erzeugte `dist/`-Ausgabe ausliefert.
