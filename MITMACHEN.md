# Mitmachen: ein Thema für die Lerntheke erstellen

Anleitung für Kolleg:innen, die mit ihrer eigenen KI (ChatGPT, Gemini, Claude …) ein Thema
für die Lerntheke erstellen. Beispiel: Klasse 9, Quadratische Funktionen.

Ein Thema besteht nur aus Dateien – am Programm ändert sich nichts:

```
inhalte/9/quadratische-funktionen/
  thema.json        Checkliste, Stationen, Aufgaben, Punkte, Lösungen
  pdf/              die Arbeitsblätter (nur Aufgaben, keine Lösungen)
  img/              optional: Stationsbilder, Lösungsgrafiken
```

dazu ein Eintrag in `inhalte/katalog.json`.

**Zwei Regeln vorab**

- Das Repository und die Seite sind **öffentlich**. Kein Verlagsmaterial, keine eingescannten
  Schulbuchseiten, keine fremden Bilder ohne freie Lizenz.
- **Keine Schülerdaten** in die KI und in die Dateien – keine Namen, Fotos oder Noten.

---

## 1. Inhalte mit der KI erstellen

**Einmalig einrichten (empfohlen):** In ChatGPT ein *Projekt* „Lerntheke“ anlegen.
Den Prompt aus Abschnitt 4 in die Projekt-Anweisungen kopieren und als Dateien hochladen:

- `inhalte/9/stromkreise/thema.json` (kleines Beispiel)
- `inhalte/q1/integralrechnung/thema.json` (großes Beispiel mit Lernweg und Tandem)
- `tools/validate.py` (die Prüfung)

Alle drei gibt es auf <https://github.com/timkucz-cmyk/lerntheke> (Datei öffnen →
Download-Symbol). Ohne Projekt geht es auch: Prompt in einen neuen Chat kopieren und die
Dateien dort anhängen.

**Dann je Thema:** im Projekt einen Chat beginnen, z. B.

> Klasse 9, Mathe, Quadratische Funktionen, Trainingsstunde vor der Klassenarbeit.
> Inhalte: Scheitelpunktform, Verschieben/Strecken, Nullstellen mit pq-Formel.
> Zwei Pflicht-, vier Wahlstationen, je etwa 15 Minuten. Mein Skript-Auszug hängt an.

Die KI fragt bei Bedarf nach, erstellt die Arbeitsblätter als Word-Datei, schreibt die
`thema.json`, prüft sie und liefert alles als ZIP.

**Selbst prüfen** – die KI rechnet nicht immer richtig:

- Lösungen nachrechnen, Punkte und AFB ansehen
- die Word-Arbeitsblätter durchsehen, anpassen und **als PDF** speichern
  (Word: Speichern unter → PDF → „Minimale Größe (Onlineveröffentlichung)“).
  Die PDF-Dateinamen müssen zu den Angaben in `thema.json` passen.

## 2. Einreichen – drei Wege

### Weg A: an Tim schicken (ohne GitHub)

ZIP mit Ordner und Katalog-Eintrag per OneDrive-Freigabe oder Mail an Tim. Er prüft und
stellt das Thema online.

### Weg B: Pull Request im Browser

Voraussetzung: GitHub-Konto, von Tim als Mitarbeiter:in im Repository eingetragen.

1. <https://github.com/timkucz-cmyk/lerntheke> öffnen, in den Ordner `inhalte` wechseln.
2. **Add file → Upload files**, den entpackten Themenordner (z. B. `9`, darin
   `quadratische-funktionen`) ins Fenster ziehen. Die Ordnerstruktur bleibt erhalten.
3. Unten **„Create a new branch for this commit and start a pull request“** wählen,
   Branch z. B. `thema/9-quadratische-funktionen` → **Propose changes**.
4. Im neuen Branch `inhalte/katalog.json` öffnen, Stift-Symbol, den Katalog-Eintrag
   einfügen, **Commit changes** (im selben Branch).
5. **Create pull request**. Nach ein bis zwei Minuten erscheint die automatische Prüfung:
   grüner Haken = in Ordnung, rotes Kreuz = **Details** anklicken, dort steht, was fehlt.
   Korrigierte Dateien einfach erneut in denselben Branch hochladen.

Tim sieht sich den Pull Request an und übernimmt ihn.

### Weg C: direkt aus der KI (Codex, Claude Code, Jules)

Voraussetzung wie bei Weg B. In ChatGPT **Codex** öffnen, das GitHub-Konto verbinden und das
Repository `timkucz-cmyk/lerntheke` wählen. Auftrag z. B.:

> Lege das Thema „Quadratische Funktionen“ für Klasse 9 an, Inhalte aus dem angehängten
> ZIP. Halte dich an AGENTS.md und öffne einen Pull Request.

Codex liest die Regeln in `AGENTS.md` selbst, führt die Prüfung aus und öffnet den Pull
Request. Die PDFs am besten mit ins ZIP legen – erzeugte PDFs der KI vorher ansehen.

## 3. Nach dem Übernehmen

Neue Themen stehen zunächst auf `"aktiv": false`: Sie sind online, erscheinen aber noch
nicht in der Auswahl. Zum Ansehen den direkten Link nutzen:

`https://timkucz-cmyk.github.io/lerntheke/#/t/9/quadratische-funktionen`

Passt alles, schaltet Tim das Thema frei.

---

## 4. Prompt für die KI

Alles im Kasten kopieren.

````text
Du hilfst mir, ein Thema für die „Lerntheke“ zu erstellen – eine Web-App für
Trainingsstunden im Mathe-/Physikunterricht am Gymnasium in Schleswig-Holstein.
Die Klasse bearbeitet Stationen mit Arbeitsblättern auf Papier. Die App zeigt nach einer
Selbsteinschätzung die Lösungen, die Schüler:innen tragen ihre Punkte ein und erhalten
eine Auswertung. Ein Thema besteht ausschließlich aus Dateien.

## Ablauf
1. Kläre kurz, was fehlt: Klassenstufe, Fach, Themen-Inhalte, Zahl der Pflicht- und
   Wahlstationen, Dauer, Hilfsmittel, Material (Skript-Auszug). Stell höchstens eine
   Runde Rückfragen, dann schlage die Gliederung vor (Checkliste, Stationen mit Titel,
   Typ, Sozialform, Dauer, Aufgabenzahl, Punkte, AFB-Verteilung) und warte auf mein OK.
2. Erstelle je Station ein Arbeitsblatt als Word-Datei (.docx): Überschrift mit
   Kennung und Titel (z. B. „P1 – Scheitelpunktform“), Aufgaben mit Nummern („1a“),
   Punkten und Platz zum Rechnen. KEINE Lösungen auf dem Arbeitsblatt.
3. Schreibe die thema.json nach dem Schema unten. Die Aufgabentexte und die Nummern
   („label“) müssen exakt zum Arbeitsblatt passen. Rechne jede Lösung zweimal nach.
4. Prüfe, wenn du Code ausführen kannst: Baue diese Struktur auf und führe
   `python tools/validate.py` aus, korrigiere alle Fehler, bis „Alles in Ordnung.“ kommt:
      tools/validate.py                  (hochgeladene Datei)
      inhalte/katalog.json               (nur mit dem neuen Eintrag)
      inhalte/<stufe>/<thema>/thema.json
      inhalte/<stufe>/<thema>/pdf/<…>.pdf   (für die Prüfung genügen leere Platzhalter)
   Ohne Codeausführung: prüfe die Regeln unten von Hand und sag mir das.
5. Liefere eine ZIP-Datei mit dem Ordner `<stufe>/<thema>/` (thema.json, pdf/ leer,
   img/ falls Bilder) und den Word-Arbeitsblättern, dazu im Chat den Katalog-Eintrag
   und eine Liste: welche PDF-Datei ich aus welcher Word-Datei speichern muss.

## Namen
- Stufen-ID: 5, 6, 7, 8, 9, 10, e, q1, q2. Themen-ID klein, ohne Leerzeichen und Umlaute,
  Bindestriche erlaubt: „quadratische-funktionen“.
- Stations-IDs: Pflicht P1, P2, …; Wahl W1, W2, …; Aufgaben-IDs „P1-1“, „P1-2“, …
  (im ganzen Thema eindeutig). Checklisten-IDs c1, c2, …
- PDF-Namen: „pdf/P1_Scheitelpunktform.pdf“ (keine Umlaute, keine Leerzeichen).

## Katalog-Eintrag (für inhalte/katalog.json, Stufenblock „9“)
{ "id": "quadratische-funktionen", "name": "Quadratische Funktionen – Training",
  "fach": "mathe", "aktiv": false,
  "beschreibung": "Scheitelpunktform, Verschieben und Strecken, Nullstellen" }

## Schema thema.json
{
  "version": 1,
  "titel": "Quadratische Funktionen – Trainingsstunde",
  "fach": "mathe",                     // mathe | physik
  "anrede": "du",                      // du bis Klasse 10, sie ab E-Phase
  "hinweis": "optionaler Satz oben auf der Übersicht",
  "checkliste": [                      // „Ich kann …“-Kompetenzen, ohne „Ich kann“
    { "id": "c1", "text": "Den Scheitelpunkt aus der Scheitelpunktform ablesen" },
    { "id": "c2", "text": "…", "spaeter": true }   // gehört dazu, noch nicht unterrichtet
  ],
  "phasen": [                          // optional: Lernweg über den Stationen
    { "id": "p1", "name": "Grundlagen", "farbe": "blau", "checkliste": ["c1", "c2"] }
  ],                                   // farbe: blau | orange | gruen | rot | neutral
  "abschluss": "Klassenarbeit",        // optional: Ziel am Ende des Lernwegs
  "stationen": [
    {
      "id": "P1",
      "titel": "Scheitelpunktform",
      "typ": "pflicht",                // pflicht | wahl
      "sozialform": "einzel",          // einzel | partner | gruppe | tandem
      "dauer_min": 15,
      "hilfsmittel": "Taschenrechner", // oder „keine“, „GTR“, „Formelsammlung“
      "checkliste": ["c1"],            // Pflicht: mindestens ein Bezug
      "pdf": "pdf/P1_Scheitelpunktform.pdf",
      "aufgaben": [
        {
          "id": "P1-1",
          "label": "1a",               // Nummer auf dem Arbeitsblatt
          "punkte": 2,                 // Vielfache von 0,5
          "afb": "I",                  // I | II | III
          "loesung": "Markdown mit Mathematik"
        }
      ]
    }
  ]
}

## Tandemstation (optional, „sozialform“: „tandem“)
Zwei Schüler:innen, zwei Tablets, kein Papier. Abwechselnd löst eine Person laut, die
andere kontrolliert. Statt „pdf“: "pdf_optional": true. Jede Aufgabe zusätzlich mit
"partner": "A" oder "B" (abwechselnd, gleiche Punktsumme je Rolle),
"aufgabe": "Aufgabentext für die App" und "tipp": "kurzer Hinweis". Gerade Punktzahlen
(„mit Tipp richtig“ gibt die Hälfte).

## Lösungen
- Markdown: Absätze, **fett**, *kursiv*, Listen mit „-“, Tabellen. Mathematik in $…$
  (im Text) und $$…$$ (abgesetzt), KaTeX-Syntax.
- In JSON jeden Backslash doppelt: \\frac, \\cdot, \\sqrt, \\mathrm. Zeilenumbruch als \n.
- Dezimalkomma als 0{,}5. Einheiten: 12\\,\\mathrm{m}.
- Vollständiger Rechenweg mit Antwortsatz, so knapp wie ein Erwartungshorizont.

## Didaktik
- Je Station 3 bis 7 Aufgaben, AFB I bis III gemischt, Schwerpunkt AFB I/II.
- Pflichtstationen: Basiskompetenzen. Wahlstationen: Vertiefung, Anwendung, Sachkontext.
- Jede Kompetenz der Checkliste (ohne „spaeter“) kommt in mindestens einer Station vor.
- Sek I „du“, ab E-Phase „Sie“ – auf den Arbeitsblättern und in den Lösungen.
- Operatoren nach den Fachanforderungen Schleswig-Holstein (berechne, bestimme, begründe …).

## Verboten
- Lösungen auf den Arbeitsblättern.
- Material aus Schulbüchern oder anderen urheberrechtlich geschützten Quellen abschreiben.
- Namen oder andere Daten von Schüler:innen.
````
