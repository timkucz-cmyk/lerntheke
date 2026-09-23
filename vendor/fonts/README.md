# Schriften (lokale Kopie)

Hier liegt **Source Sans 3**, die Hausschrift des LMG-Unterricht-Design-Systems –
bewusst als Kopie im Repository. Google Fonts wird **nicht** eingebunden, damit zur Laufzeit
keine Verbindung zu externen Servern entsteht.

```
sourcesans3-normal-latin.woff2       Standardschnitt, westeuropäisch
sourcesans3-normal-latin-ext.woff2   Standardschnitt, osteuropäische Zeichen
sourcesans3-italic-latin.woff2       Kursive
sourcesans3-italic-latin-ext.woff2   Kursive, osteuropäische Zeichen
```

Es sind **variable Schriften**: Eine Datei deckt alle Strichstärken von 200 bis 900 ab.
Deshalb gibt es je Schnitt nur eine Datei und nicht eine pro Gewicht.

Geladen wird immer nur, was gebraucht wird: Für deutschen Text holt der Browser die
`latin`-Datei (29 KB); `latin-ext` und die Kursive kommen nur dazu, wenn entsprechende
Zeichen vorkommen. Die Einbindung steht am Anfang von `app/style.css`.

## Herkunft und Lizenz

Source Sans 3 steht unter der SIL Open Font License 1.1 und darf mitgeliefert werden.
Quelle: <https://fonts.google.com/specimen/Source+Sans+3> bzw.
<https://github.com/adobe-fonts/source-sans>.

## Aktualisieren

Die vier Dateien neu herunterladen und ersetzen; die `@font-face`-Regeln in `app/style.css`
müssen nur angefasst werden, wenn sich die Dateinamen ändern.

Fehlen die Dateien, greift die Schriftkaskade (System-Schrift des Geräts). Die App bleibt
benutzbar, sieht aber nicht nach LMG aus.
