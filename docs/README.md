# Dokumentation

## Aktuelle Einstiege

- [Architektur](guides/architecture.md): Komponenten, Datenzugriff und Build.
- [Entwicklung](guides/development.md): Einrichtung, Quellen und Prüfungen.
- [CMS und Rollen](guides/cms.md): Freigaben, Bedienung und Bestandsupgrade.
- [CMS-/CI-Bericht](reports/cms-rbac.md): Implementierung, Tests und GitHub-Fehlerursache.
- [Deployment](guides/deployment.md): öffentlicher Export, Backend und Betrieb.
- [Go-Live-Checkliste](go-live-checklist.md): maßgebliche Freigabematrix.
- [Strukturänderungen](reports/structure-cleanup.md): dieser Aufräumauftrag und seine Nachweise.
- [Refactoring-Bericht](reports/refactoring.md): vorangehende Funktions-/UI-Überarbeitung.
- [Rechtliche Gap-Analyse](reports/legal-compliance.md): weiterhin offene Betreiber-/Betriebsangaben.

## Historische Nachweise

`archive/` enthält ausdrücklich historische Anleitungen und Audits. Diese Dateien dienen als Nachweis des früheren Stands und sind keine aktuellen Setup-Anweisungen. Abweichende Theme-/Suchabläufe und Pfadangaben darin wurden durch die aktuelle Architektur ersetzt. `reports/dependencies/` bewahrt die damaligen Audit-Snapshots; aktuelle Schwachstellenprüfungen erfolgen über die Lockfiles und `npm audit`.

Aktuelle Prüfberichte und Screenshots werden unter `artifacts/` erzeugt und nicht versioniert. Die originale Bildnachweis-HTML im Archiv ist eine historische Vorlage; die aktuelle öffentliche Seite entsteht aus den Sprachdateien.
