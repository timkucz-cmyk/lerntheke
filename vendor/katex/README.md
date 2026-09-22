# KaTeX (lokale Kopie)

Hier liegt die Formelsatz-Bibliothek **KaTeX v0.18.7**, bewusst als Kopie im Repository:
Aus Datenschutzgründen wird **kein CDN** eingebunden, die App lädt zur Laufzeit nur eigene Dateien.

```
katex.min.js      aus dem offiziellen Release-Paket
katex.min.css     "
fonts/            40 Dateien (.woff2 und .woff)
```

Die `.ttf`-Varianten aus dem Release sind nicht übernommen; sie werden nur von sehr alten
Browsern gebraucht und hätten das Repository um ein halbes Megabyte vergrößert.
Quelle: <https://github.com/KaTeX/KaTeX/releases> (Paket `katex.zip`, nicht der Quellcode).

## Aktualisieren

1. Neues `katex.zip` vom Release herunterladen und entpacken.
2. `katex.min.js`, `katex.min.css` sowie den Inhalt von `fonts/` (nur `.woff2`/`.woff`) hierher kopieren.
3. Seite neu laden und eine Lösung mit Formeln öffnen – erscheint sie sauber gesetzt, passt alles.

## Wenn diese Dateien fehlen

Die App prüft beim Start, ob `vendor/katex/katex.min.js` erreichbar ist. Fehlt die Datei,
setzt sie Formeln mit einer eingebauten Ersatzdarstellung (`app/render.js`, Funktion `texZuHtml`):
Brüche, Wurzeln, Hoch- und Tiefstellung, Integral- und Summenzeichen, griechische Buchstaben
sowie die üblichen Relations- und Operatorzeichen. Das reicht für Schulmathematik, sieht aber
schlichter aus. Unbekannte Befehle erscheinen dort farblich markiert als `\befehl` – ein
nützlicher Hinweis beim Schreiben neuer Lösungen.
