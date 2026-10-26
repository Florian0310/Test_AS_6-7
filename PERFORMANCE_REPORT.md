# Performancebericht

Prüfdatum 26.10.2026. Vergleich: EN-Startseite auf localhost:8000, Chrome/Lighthouse 13, Standard-Mobile-Profil und simulierte Drosselung, frische Browserumgebung. Backend und Frontend lokal. Keine Feldmessung und kein P75-/INP-Nachweis.

| Messwert | Vorher | Nach Optimierung |
|---|---:|---:|
| Lighthouse Performance | 75 | 98 |
| Accessibility | 92 | 100 |
| Best Practices | 96 | 100 |
| SEO | 100 | 100 |
| LCP | 20,60 s | 2,48 s |
| CLS | 0,00165 | 0,00336 |
| Total Blocking Time | 0 ms | 0 ms |
| Übertragene Daten | 4.112.111 Bytes | 903.779 Bytes |

Einzelne lokale Laborläufe, keine zugesicherten Produktionswerte. Mehrere Zwischenläufe während der Optimierung lagen bei 87–98 Performance-Punkten und 2,48–3,76 s LCP. Die Verbesserungen sind nachvollziehbar; die Produktionsverteilung muss gesondert gemessen werden. TBT ist kein Ersatz für INP.

## Implementierte Optimierungen

- Hero-Foto: Original 2.041.196 Bytes; Desktop-WebP 99.132 Bytes. Eigene kleinere mobile Variante mit passendem Preload.
- Weitere große lokale Fotos in WebP überführt; Originaldateien für Herkunft/Archiv erhalten. Vorteils-Icons auf angemessene Auflösung verkleinert, Seitenverhältnis per object-fit erhalten.
- Bilder unterhalb des sichtbaren Bereichs laden verzögert und werden asynchron dekodiert. Hero wird früh mit hoher Priorität angefordert.
- Gemeinsame Skripte laufen mit defer; nur die kleine Theme-Auflösung bleibt vor CSS synchron, um Theme-Flashes zu verhindern.
- Textressourcen werden vom begrenzten Frontend-Server mit Gzip übertragen; Nginx-Vorlage enthält entsprechende Kompression.
- Gemeinsame Site-Konfiguration wird innerhalb einer Seitenansicht wiederverwendet. Kategorien werden bei Filterwechsel nicht erneut abgefragt. Kategorieanzahlen benötigen zwei Abfragen statt einer zusätzlichen Abfrage je Kategorie.
- Suchrequests sind debounced, veraltete Requests werden abgebrochen; kein neues Such-Framework im Client. API-Timeouts verhindern endlose Ladezustände.
- Neue CMS-Vorschaubilder werden als WebP und ohne Hochskalierung erzeugt. Bereits vorhandene PNG-Derivate bleiben erhalten; ihre einmalige Neuerzeugung ist vor Go-live ein redaktioneller/betrieblicher Schritt.

## Noch zu prüfen

Reale Hosting-Latenzen, CDN/Cache-Konfiguration, mobile Geräte, lange Sessions, INP unter Benutzung und P75-Core-Web-Vitals. Große bestehende CMS-Screenshots sind weiter ein unnötiger Teil der Nutzlast. Die Suche ist für den kleinen Bestand begrenzt; ab mehr als 1000 Produkten ist indizierte Suche erforderlich. Last-/Dauertests der SQLite-Datenbank und echte Nutzertelemetrie wurden nicht durchgeführt.

Rohdaten: artifacts/lighthouse-before.json, artifacts/lighthouse-after.json. Reproduktion bei laufenden Diensten: `node tools/measure.mjs before` bzw. `after` (überschreibt die jeweilige lokale Rohdatei).
