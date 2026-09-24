# Lerntheke

Statische Web-App für Lerntheken und Trainingsphasen im Mathe- und Physikunterricht.
Die Schülerinnen und Schüler wählen Klassenstufe und Thema, schätzen sich selbst ein, arbeiten
die Stationen ab, sehen danach die Lösungen, tragen ihre Punkte ein und bekommen eine Auswertung.

**Neue Inhalte entstehen ausschließlich über Dateien – am Programmcode muss nichts geändert werden.**

**Live: <https://timkucz-cmyk.github.io/lerntheke/>**

- kein Build-Schritt, reines HTML/CSS/JS (ES-Module)
- läuft auf GitHub Pages
- keine Serververbindung zur Laufzeit, alle Eingaben bleiben im `localStorage` des Geräts
  (Schlüssel `lerntheke:<stufe>:<thema>`)

---

## 1. Lokal ansehen

**Doppelklick auf `start.cmd`** – das startet einen kleinen Webserver im Projektordner und öffnet
die Lerntheke im Browser. Das Fenster offen lassen, beenden mit `Strg + C`.

Ein Doppelklick auf `index.html` funktioniert dagegen **nicht**: Beim Öffnen über `file://`
blockieren Browser sowohl ES-Module als auch das Laden der Inhalte. Die Seite sagt das
inzwischen selbst, statt ewig „Lade …“ anzuzeigen.

Wer lieber selbst tippt, erreicht dasselbe mit:

```bash
python -m http.server 8000
```

und dann `http://localhost:8000` im Browser.

## 2. Veröffentlichen und aktualisieren

Die Seite liegt unter <https://timkucz-cmyk.github.io/lerntheke/>.

**Etwas geändert?** In GitHub Desktop die Änderung committen und auf „Push origin" klicken.
GitHub Pages baut automatisch neu; nach ein bis zwei Minuten ist der Stand online. Auf den
iPads reicht danach ein Neuladen der Seite – der Fortschritt der SuS bleibt erhalten, weil er
im Browser des Geräts liegt und nicht an der Seite hängt.

### Erstmalige Einrichtung (ist erledigt)

1. Repository anlegen und den Inhalt dieses Ordners hineinlegen (`index.html` muss im Wurzelverzeichnis liegen).
2. Im Repository: **Settings → Pages → Source: Deploy from a branch**, Branch `main`, Ordner `/ (root)`.
3. Nach ein bis zwei Minuten ist die App unter `https://<benutzername>.github.io/<repository>/` erreichbar.
4. Der Link lässt sich als QR-Code an die Tafel werfen; auf dem iPad kann er über „Zum Home-Bildschirm“
   wie eine App abgelegt werden.

Die Datei `.nojekyll` sorgt dafür, dass GitHub Pages alle Ordner unverändert ausliefert.

---

## 3. Neues Thema anlegen – Schritt für Schritt

Beispiel: Physik, E-Phase, Thema „Würfe“.

**1. Ordner kopieren**

```
inhalte/q1/integralrechnung/   →   inhalte/e/wuerfe/
```

Im neuen Ordner die alten PDFs und Bilder löschen, die Unterordner `pdf/` und `img/` behalten.
Ordnernamen bitte klein, ohne Leerzeichen und ohne Umlaute (`e`, `wuerfe`).

**2. Arbeitsblätter ablegen**

PDFs nach `inhalte/e/wuerfe/pdf/` legen, Lösungsgrafiken (PNG oder SVG) nach `inhalte/e/wuerfe/img/`.

**3. `thema.json` ausfüllen**

Das ist die eigentliche Arbeit: Checkliste, Stationen, Aufgaben, Lösungen (Aufbau siehe Abschnitt 4).

**4. Thema in `inhalte/katalog.json` eintragen**

```json
{ "id": "wuerfe", "name": "Würfe – Training", "fach": "physik", "aktiv": true }
```

Gibt es die Stufe noch nicht, einen neuen Block `{ "id": "e", "name": "E-Phase", "themen": [ … ] }` ergänzen.
Mit `"aktiv": false` bleibt ein Thema in Arbeit und taucht für die Klasse noch nicht auf.

**5. Prüfen**

```bash
node tools/validate.mjs
```

oder, falls kein Node installiert ist:

```bash
python tools/validate.py
```

Die Prüfung meldet fehlende Pflichtfelder, doppelte IDs, fehlende PDF- oder Bilddateien, ungültige
Checklisten-Verweise und gibt die Punktsumme jeder Station aus.

**6. Hochladen**

```bash
git add .
git commit -m "Thema Würfe ergänzt"
git push
```

---

## 4. Aufbau von `thema.json`

```jsonc
{
  "version": 1,
  "titel": "Würfe – Trainingsstunde",
  "fach": "physik",              // mathe | physik  (bestimmt die Farbe)
  "anrede": "sie",               // du (Sek I) | sie (ab E-Phase)
  "hinweis": "optionaler Satz, der oben auf der Übersicht steht",

  "checkliste": [
    { "id": "c1", "text": "Waagerechten Wurf in Teilbewegungen zerlegen" },
    { "id": "c2", "text": "Den schiefen Wurf zerlegen", "spaeter": true }   // noch nicht unterrichtet
  ],

  "stationen": [
    {
      "id": "P1",                        // erscheint als Kennung, z. B. "P1"
      "titel": "Waagerechter Wurf",
      "typ": "pflicht",                  // pflicht | wahl
      "sozialform": "einzel",            // einzel | partner | gruppe
      "dauer_min": 15,
      "hilfsmittel": "GTR",
      "checkliste": ["c1"],              // Bezug zur Checkliste (steuert die Empfehlung)
      "bild": "img/st_P1.svg",           // optional: kleines Bild auf der Kachel
      "pdf": "pdf/P1_Waagerechter_Wurf.pdf",
      "aufgaben": [
        {
          "id": "P1-1",                  // im ganzen Thema eindeutig
          "label": "1a",                 // Nummer auf dem Arbeitsblatt
          "punkte": 2,                   // ganze oder halbe Punkte
          "afb": "I",                    // I | II | III
          "loesung": "Markdown mit $\\LaTeX$ …",
          "loesung_bild": "img/P1-1.svg" // optional
        }
      ]
    }
  ]
}
```

**Wichtig**

- IDs (`c…`, Stations-ID, Aufgaben-ID) nach dem Verteilen nicht mehr ändern – daran hängt der
  gespeicherte Fortschritt. Wird eine Aufgabe entfernt, ignoriert die App den alten Eintrag einfach.
- `"sozialform": "tandem"` schaltet auf die Tandemstation um (zwei SuS, zwei Tablets, kein Papier).
  Der Aufbau dieser Stationen steht in Abschnitt 4a.
- Wahlstationen werden als **„empfohlen“** markiert, wenn ein zugehöriger Checklistenpunkt in der
  Eingangsdiagnose mit 😕 oder 😐 bewertet wurde. Ohne `checkliste`-Bezug funktioniert das nicht.
- Pflichtstationen stehen in der Übersicht oben, Wahlstationen darunter – jeweils in der
  Reihenfolge aus der Datei.
- `"spaeter": true` an einem Checklistenpunkt heißt: gehört zum Thema, ist aber noch nicht
  dran. Der Punkt steht ausgegraut im Lernweg und taucht **nicht** in der Selbsteinschätzung
  und im Vorher/Nachher-Vergleich auf – man kann nichts einschätzen, was man noch nicht hatte.
  So lässt sich ein Zwischentraining zeigen, ohne den späteren Stoff zu verschweigen.
  Sobald das Thema unterrichtet ist, genügt es, das Feld zu entfernen.
- `bild` ist optional und erscheint als Vorschau auf der Stationskachel. Am besten eine
  schlichte SVG-Skizze im Format 16:7, die zeigt, worum es geht – idealerweise dieselbe
  Abbildung, die die Klasse aus dem Unterricht kennt. Fehlt das Feld, steht dort das
  Symbol der Sozialform.

## 4b. Lernweg (optional)

Ergänzt man im `thema.json` ein Feld `phasen`, erscheint über den Stationen ein Überblick:
Die Kompetenzen der Checkliste werden zu Abschnitten gebündelt, jede Phase zeigt ihre
Stationen und den eigenen Punktestand. So sehen die SuS, wo sie im Thema stehen.

```jsonc
"phasen": [
  {
    "id": "p1",
    "name": "Das Integral",
    "untertitel": "Grundlagen",        // optional
    "farbe": "blau",                   // blau | orange | gruen | rot | neutral
    "checkliste": ["c1", "c2", "c3", "c4"]
  },
  { "id": "p2", "name": "Anwendung der Integralrechnung", "farbe": "orange", "checkliste": ["c5", "c6", "c7"] }
],
"abschluss": "Klausur 1"               // optional: das Ziel am Ende des Wegs
```

Welche Station zu welcher Phase gehört, ergibt sich aus ihrem **ersten** Checklistenpunkt.
Deckt eine Station mehrere Kompetenzen ab, entscheidet also die Reihenfolge in `checkliste`.

Fehlt `phasen`, entfällt der Abschnitt ersatzlos. Die Prüfung meldet Verweise auf
Kompetenzen, die es nicht gibt, sowie Kompetenzen, die in keiner Phase auftauchen.

## 4a. Tandemstationen

Zwei Schülerinnen oder Schüler, zwei Tablets, kein Papier: Bei jeder Nummer löst eine Person
laut, die andere hat die Lösung, gibt bei Bedarf den Tipp und meldet zurück, ob es gestimmt hat.
Danach wird gewechselt. Die Geräte sind **nicht** miteinander gekoppelt – den Takt halten die
beiden über die große Nummer, die auf beiden Geräten gleich stehen muss.

```jsonc
{
  "id": "T1",
  "titel": "Stammfunktionen im Tandem",
  "typ": "pflicht",
  "sozialform": "tandem",       // schaltet die Tandemansicht ein
  "dauer_min": 20,
  "hilfsmittel": "keine",
  "checkliste": ["c2", "c3"],
  "pdf_optional": true,         // Druckfassung ist eine Zugabe; ohne "pdf" bleibt der Bereich leer
  "aufgaben": [
    {
      "id": "T1-1", "label": "1",
      "partner": "A",           // A oder B – wem gehört diese Nummer?
      "punkte": 2, "afb": "I",
      "aufgabe": "Gib eine Stammfunktion von $f(x) = 6x^2 - 4x$ an.",   // steht in der App
      "tipp": "Exponent um 1 erhöhen, dann durch den neuen Exponenten teilen.",
      "loesung": "$$F(x) = 2x^3 - 2x^2 + C$$"
    },
    { "id": "T1-2", "label": "2", "partner": "B", "…": "…" }
  ]
}
```

**Ablauf in der App**

1. Beim Öffnen wählt jede Person ihre Rolle („Ich bin Partner A/B“). Die Rolle wird gespeichert
   und lässt sich mit Rückfrage wechseln; die Eingaben bleiben dabei erhalten.
2. Die Nummern laufen in der Reihenfolge aus der Datei. Groß angezeigt, dazu eine Reihe von
   Nummernknöpfen (durchgezogen = eigene Nummer, gestrichelt = Kontrollkarte, grün = erledigt).
3. **Eigene Nummer:** Aufgabentext → „Ich habe laut gelöst“ → Selbsteinschätzung → Rückmeldung
   des Gegenübers: *richtig* (volle Punkte), *mit Tipp richtig* (halbe Punkte), *falsch* (0).
   Erst danach erscheint die Lösung zum Nachlesen. Die Rückmeldung ist später korrigierbar.
4. **Nummer des Gegenübers:** Kontrollkarte mit Aufgabe, Lösung und ausklappbarem Tipp –
   ohne Punkteingabe, zählt nicht in die eigene Auswertung.
5. In die Auswertung gehen nur die eigenen Nummern ein; die Maximalpunktzahl richtet sich
   entsprechend nach der gewählten Rolle.

**Beim Schreiben beachten**

- Nummern abwechselnd auf A und B verteilen, damit beide gleich oft dran sind.
- Beide Rollen sollten dieselbe Punktzahl erreichen können – die Prüfung meldet eine Schieflage.
- `aufgabe` und `loesung` sind Pflicht, `tipp` ist dringend zu empfehlen (sonst kann das
  Gegenüber nicht helfen). Für halbe Punkte bei „mit Tipp richtig“ eignen sich gerade Punktzahlen.

## 5. Lösungen schreiben

Lösungstexte sind Markdown mit Mathematik in `$…$` (im Text) und `$$…$$` (abgesetzt):

```
Aus $U = R \cdot I$ folgt

$$I = \frac{U}{R} = \frac{12\,\mathrm{V}}{60\,\Omega} = 0{,}2\,\mathrm{A}.$$

**Merke:** In der Reihenschaltung ist die Stromstärke überall gleich.
```

Unterstützt werden Absätze, Überschriften (`##`), Aufzählungen (`-`), nummerierte Listen,
Tabellen (`| a | b |`), **fett**, *kursiv* und `Code`.

In JSON muss jeder Backslash doppelt geschrieben werden: `\\frac`, `\\cdot`, `\\mathrm`.
Zeilenumbrüche innerhalb einer Lösung werden als `\n` notiert. Für Dezimalzahlen in Formeln
hat sich `0{,}5` bewährt – dann bleibt der Abstand hinter dem Komma korrekt.

## 6. KaTeX

Der Formelsatz läuft mit **KaTeX v0.18.7**, das als lokale Kopie unter `vendor/katex/` im
Repository liegt (kein CDN, keine externen Anfragen). Es muss nichts eingerichtet werden;
zum Aktualisieren siehe `vendor/katex/README.md`.

Fehlt der Ordner einmal, stürzt nichts ab: Die App erkennt das beim Start und setzt Formeln
mit einer eingebauten, schlichteren Ersatzdarstellung.

## 6a. Gestaltung

Die App folgt dem **LMG-Unterricht-Design-System** (`Schule/2526/Claude_Design/`):

- **Farben** aus `colors_and_type.css`: warm-neutrales Off-White als Fläche, kühle Grautöne
  für Text und Linien, Fachakzent Mathematik `#B61E33`, Physik `#2C5282`. Welche Fachfarbe
  gilt, entscheidet das Feld `fach` im Thema; die App setzt daraus `data-fach` am
  `<html>`-Element, alles Weitere hängt an CSS-Variablen.
- **Schrift** Source Sans 3, lokal unter `vendor/fonts/` (siehe dortige README).
- **Symbole** aus dem Icon-Satz des Design-Systems, als Inline-SVG in `app/icons.js`.
  Sie erben Farbe und Größe vom Text und sind rein dekorativ – die Bedeutung steht immer
  auch als Wort daneben.
- **Dunkelmodus** über `prefers-color-scheme`: eigene, abgedunkelte Tonwerte; die
  Fachfarben werden aufgehellt, damit der Kontrast stimmt.

Für ein neues Thema muss an der Gestaltung nichts angepasst werden. Soll ein weiteres Fach
eine eigene Farbe bekommen, genügt ein Block `html[data-fach="…"]` in `app/style.css`
(hell und dunkel).

## 7. Datenschutz

- Es werden keinerlei Daten an einen Server geschickt; die App lädt zur Laufzeit nur Dateien
  aus dem eigenen Repository.
- Fortschritt, Selbsteinschätzung und der optional eingetippte Name liegen ausschließlich im
  `localStorage` des jeweiligen Geräts.
- Über **Auswertung → Sicherung** lässt sich der Stand als JSON-Datei exportieren und wieder
  importieren, z. B. beim Wechsel des iPads. Dort liegt auch „Fortschritt zurücksetzen“.
- Der Name ist freiwillig und nur für den Screenshot bzw. die Abgabe gedacht.

## 8. Ordnerstruktur

```
index.html                 Einstieg (Stufe → Thema)
start.cmd                  lokalen Server starten (Doppelklick)
app/
  app.js                   Ablauf, Ansichten, Auswertung
  store.js                 localStorage, Export/Import
  render.js                Markdown + Mathematik (KaTeX oder Ersatz)
  icons.js                 Symbole als Inline-SVG
  style.css                Gestaltung, Hell/Dunkel, Druckansicht
vendor/katex/              lokale KaTeX-Kopie (v0.18.7, gehört mit ins Repo)
vendor/fonts/              Source Sans 3, lokal (gehört mit ins Repo)
inhalte/
  katalog.json             Stufen und Themen
  q1/integralrechnung/     Integralrechnung Q1 (echtes Material)
  9/stromkreise/           Beispielthema Physik
tools/
  validate.mjs             Prüfung der Inhalte (Node)
  validate.py              dieselbe Prüfung ohne Node
```

Die beiden mitgelieferten Themen sind Beispielinhalte zum Testen; die PDFs darin sind Platzhalter.
Sie können gelöscht werden, sobald eigene Themen vorhanden sind – dann auch die Einträge in
`katalog.json` entfernen.

## 9. Ablauf in der App

1. Stufe und Thema wählen (zuletzt geöffnetes Thema wird oben angeboten).
2. Selbsteinschätzung zu den Checklistenpunkten (überspringbar).
3. Stationsübersicht mit Fortschritt, Status und Empfehlungen.
4. Station: Arbeitsblatt öffnen oder herunterladen.
5. Je Aufgabe fest in dieser Reihenfolge: bearbeiten → „Aufgabe ist bearbeitet“ → Selbsteinschätzung
   → Lösung erscheint → Punkte eintragen. Punkte lassen sich später korrigieren, die Einschätzung
   bleibt bewusst stehen. Tandemstationen laufen nach dem Ablauf aus Abschnitt 4a.
6. Auswertung: Punkte gesamt, je Station, je Anforderungsbereich; Vergleich von Einschätzung und
   Ergebnis; Selbstdiagnose am Ende mit Vorher/Nachher; Zusammenfassung zum Drucken.
