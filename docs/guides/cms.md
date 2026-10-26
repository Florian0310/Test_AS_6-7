# Payload CMS: Bedienung und Rollen

Das CMS läuft lokal unter <http://localhost:3001/admin>. Es verwendet die vorhandenen Collections und Globals sowie die Designfarben und Schriftfamilie der Website. Die gemeinsame Farbpalette wird vor Backend-Start/Build aus `frontend/styles/tokens.css` erzeugt; `backend/src/app/admin.css` enthält ausschließlich CMS-Anpassungen. Die generierte Token-Datei nicht bearbeiten.

## Rollen und Freigaben

| Bereich | Administrator (`admin`) | Benutzer (`user`) |
|---|---|---|
| Produkte/Artikel | Erstellen, lesen, bearbeiten, löschen | Erstellen, lesen, bearbeiten, löschen |
| Anfragen | Vollständige Verwaltung | Lesen und offene Anfragen annehmen |
| Kunden-/Preis-/Produkt-Snapshots einer Anfrage | Verwalten | Nur lesen |
| Anfrage-Versandprotokoll | Lesen | Kein Zugriff |
| Medien | Vollständige Verwaltung | Lesen, hochladen, bearbeiten; nicht löschen |
| Kategorien | Vollständige Verwaltung | Für die Produktauswahl lesen; kein Verwaltungsmenü |
| Benutzer und Rollen | Konten erstellen, Rollen zuweisen, bearbeiten, löschen | Keine Verwaltung anderer Konten |
| Eigenes Konto | Profil und Passwort pflegen | Eigenes Profil und Passwort pflegen; Rolle gesperrt |
| Website-/Kontakt-/Rechts-/Vermietungseinstellungen | Lesen und bearbeiten | Kein Zugriff |
| Übersicht | Alle freigegebenen Bereiche | Produkte, Medien und Anfragen; berechtigte Kennzahlen |

Die zwei Rollen haben feste, zentral im Code definierte Rechte. Administratoren verwalten deren Zuweisung im Benutzerformular. Es gibt keinen zusätzlichen frei konfigurierbaren Berechtigungseditor.

Neue Konten erhalten standardmäßig **Benutzer**. Ein Admin wählt bei Bedarf ausdrücklich die Administratorrolle. Das letzte Administratorkonto kann weder gelöscht noch herabgestuft werden. Eigene Rollenänderungen durch Benutzer und Änderungen an anderen Konten werden auch direkt über die API abgewiesen.

## Anfragen bearbeiten

Benutzer öffnen eine Anfrage und verwenden **Anfrage annehmen**. Erlaubt ist ausschließlich der Wechsel auf `accepted`; abgelehnte oder abgeschlossene Anfragen bleiben geschützt. Kundenangaben, Produktbezug, Preisstände und Nachrichten sind für Benutzer nicht bearbeitbar. Die Aktion speichert den internen Status; sie versendet keine automatische Vertragsbestätigung oder Kundennachricht.

Admins verwenden zusätzlich die vollständigen Status- und Bearbeitungsfelder. Die bisherige öffentliche Website erzeugt weiterhin unverbindliche Anfragen mit serverseitiger Preisberechnung.

## Vorhandene lokale Installation aktualisieren

Vor dem ersten Start dieser CMS-Version den Backend-Prozess stoppen. Die Rollen-Datenmigration muss vor einer automatischen Entwicklungsschema-Anpassung erfolgen:

```powershell
npm --prefix backend run upgrade:cms
npm --prefix backend run dev
```

Der Helfer unterstützt lokale SQLite-Dateien unter `backend/data/` und benötigt Python. Er prüft, dass der lokale Backendport frei ist, erstellt eine konsistente SQLite-Sicherung und führt die versionierten Migrationen aus. Bei bisherigen Dev-Datenbanken entfernt er nach der Sicherung ausschließlich deren Entwicklungsmarker, damit die vorhandene Baseline den Bestand übernehmen kann. Anschließend vergleicht er alle zuvor vorhandenen Felder der Benutzer-, Produkt-, Kategorie-, Medien- und Anfragedatensätze mit der Sicherung. Scheitert ein Schritt, bleibt das Backend gestoppt und die Sicherung erhalten.

Alle Konten aus Installationen ohne Rollenfeld hatten bisher Vollzugriff und werden einmalig als Admin übernommen. Bereits vorhandene Rollen werden nicht pauschal hochgestuft. Existiert ein Rollenfeld ohne zugehörige Migration, verweigert der Helfer eine automatische Rechtevergabe; dann die Sicherung wiederherstellen und vor dem Dev-Start korrekt migrieren.

Für eine neue Installation gelten die normalen Migrationen und der ausdrücklich konfigurierte einmalige Admin-Bootstrap. Produktive oder externe Datenbanken benötigen die kontrollierte [Deployment-Prozedur](deployment.md), eine eigene Sicherung und `npm --prefix backend run migrate`; der lokale Helfer veröffentlicht nichts. Ein automatischer Rückbau entfernt keine Rollen: für einen Rollback die verifizierte Sicherung zusammen mit der vorherigen Anwendungsversion verwenden.

## Sicherheitsgrenzen und Tests

Collection-, Global- und Feldzugriffe bilden die zentrale serverseitige Freigabe. Zusätzliche Hooks prüfen den unveränderten ursprünglichen Request-Payload, bevor geschützte Felder verworfen werden könnten. SQL-Trigger sichern das letzte Admin-Konto auch bei konkurrierenden Änderungen. Die JWT-Authentifizierung lädt die aktuelle Benutzerrolle aus der Datenbank; eine Herabstufung greift auch mit bereits ausgegebenem Token. Nach Rollenänderungen die Oberfläche neu laden, damit auch deren Menüs aktualisiert werden.

`npm run test:cms` benötigt einen vorherigen Produktionsbuild und Chrome. Es migriert eine **Kopie** der lokalen Datenbank, verwendet separate Medien und zufällige Testpasswörter und startet den Produktionsserver auf Port 3002. Sämtliche Benutzer-, Produkt-, Anfrage- und Upload-Tests verändern ausschließlich diese Kopie. In CI wird die frische Seed-Datenbank über `CMS_TEST_SOURCE` ausgewählt. E-Mail-Versand bleibt in diesen Tests ausgeschaltet.

Bekannte externe Voraussetzung: Für echte Passwort-Reset-E-Mails fehlen weiterhin produktive SMTP-Konfiguration und Payload-Auth-Mailadapter. Login/Logout wurden tatsächlich geprüft; eine reale Reset-Mail-Zustellung wurde nicht behauptet.
