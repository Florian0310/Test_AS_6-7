# Entwicklung und Tests

Node 24.22.1, npm und Chrome verwenden. Root und Backend besitzen getrennte Lockfiles; jeweils `npm ci` ausführen. Bestehende `.env`, Datenbank und Medien erhalten.

## Neue lokale Umgebung

Nur für eine neue, leere Datenbank:

1. `backend/.env.example` nach `backend/.env` kopieren. Eigenes zufälliges `PAYLOAD_SECRET` mit mindestens 32 Zeichen setzen.
2. Datenbankpfad, Origins und lokale URLs kontrollieren; E-Mail ist standardmäßig deaktiviert.
3. `npm --prefix backend run migrate`; optional `npm --prefix backend run seed` ausschließlich auf neuen Testdaten verwenden.
4. Ein Administratorkonto gegebenenfalls bewusst über Bootstrap einrichten und Bootstrap anschließend deaktivieren.

Frontend mit `npm run dev`, Backend in einem zweiten Terminal mit `npm --prefix backend run dev` starten. Ports: 8000 und 3001. Beide Dienste während der Browserprüfung geöffnet lassen. Keine Seeds oder `migrate:fresh` auf Bestandsdaten ausführen.

## Änderungen platzieren

- Header/Footer: `tools/templates/shell.mjs`; Routen: `frontend/config/routes.js`.
- Redaktionelle Start-/Kontakt-/deutsche Inhaltsseiten: `tools/templates/pages/`. Rechtliches und englische Textseiten: `locales/*.json` und `tools/build-content.mjs`.
- Katalog-HTML: `tools/templates/catalog.mjs`; Interaktionen: `frontend/pages/catalog.js`; reine Zustandslogik: `frontend/lib/catalog-state.js`.
- Produktkarten zentral ändern; Galerie/Anfrage im Produktmodul.
- UI-Texte in beiden Sprachdateien unter `ui`, mit Platzhaltern `{0}`, `{1}` usw.
- Styles unter `frontend/styles/`, nicht in generierter Root-CSS.
- Preise und Anfragevalidierung ausschließlich serverseitig ändern.

Nach Quellenänderungen `npm run build`. Identische Quellen erzeugen identische Ausgaben. Neue Routen brauchen Vorlage/Generierung, Sprachzuordnung und öffentlichen Server-/Exportumfang.

## Prüfungen

| Prüfung | Aufruf |
|---|---|
| Frontend-Build | `npm run build` |
| Lint / Links / Module | `npm run lint`, `npm run test:static` |
| Reiner Katalogzustand | `npm run test:frontend` |
| Backend / Typen | `npm --prefix backend test`, `npm --prefix backend run typecheck` |
| Chrome-Browser | `npm run test:e2e` – Preflight prüft beide Dienste |
| Produktionsbuild | `npm --prefix backend run build` mit gültigem Secret |
| Produktion auf Kopie | `node tools/production-smoke.mjs` – Windows, Python/SQLite |
| Zugriffsregeln | `node tools/verify-api.mjs` |
| Abhängigkeiten | `npm audit --audit-level=moderate` in beiden Paketen |
| Labor-Messung | `node tools/measure.mjs <label>` |

Browser-Fixtures mit 27 Produkten prüfen Seitenwechsel, kombinierte Filter, Sortierung und verspätete Antworten. Weitere Flows verwenden den erhaltenen lokalen/gesäten Beispielkatalog mit dem Hilti-Slug. Formular-POSTs werden im Browser abgefangen. Der Produktions-Smoke-Test speichert eine gültige Anfrage ausschließlich in einer frisch erzeugten SQLite-Kopie; keine echten Empfänger werden benachrichtigt.

Responsive Matrix: 320, 375, 390, 430, 768, 1024, 1280, 1440 und 1920 Pixel über vier Hauptseiten. Axe prüft alle 27 Seiten. Das ersetzt keine vollständige manuelle WCAG-/Screenreader-Abnahme. Die Remote-CI enthält Build, Lint, Zustandstests, Backend, Audit und Browser; ein Remote-Lauf wurde ohne Push nicht ausgeführt.

Artefakte liegen in `artifacts/` und werden nicht veröffentlicht. Fehlende CSS-/Textänderungen erfordern einen erneuten Build. „Backend unavailable“ erfordert einen laufenden Backend-Prozess; der erste Aufruf kann noch kompilieren. Fehlende Bilder im CMS korrigieren; Platzhalter ersetzen keine redaktionelle Bildfreigabe.
