# Lerntheke – Projektüberblick

Stand: 25. September 2026 · Live unter <https://timkucz-cmyk.github.io/lerntheke/> ·
Repository `timkucz-cmyk/lerntheke` · lokal in `OneDrive\Schule\Claude_Code\lerntheke`

Diese Datei fasst zusammen, was die App tut, wie sie aufgebaut ist und warum sie so
aussieht, wie sie aussieht. Die **Anleitung zum Anlegen neuer Themen** steht in der
[README.md](README.md); hier geht es um das Gesamtbild.

---

## 1. Worum es geht

Eine statische Web-App für Lerntheken und Trainingsphasen im Mathe- und Physikunterricht
der Oberstufe. Die Klasse arbeitet an Stationen mit Arbeitsblättern auf Papier; die App
führt durch den Ablauf, gibt die Lösungen erst nach der Selbsteinschätzung frei, sammelt
die Punkte und wertet am Ende aus.

**Der Kerngedanke:** Neue Inhalte entstehen ausschließlich über Dateien. Ein neues Thema
heißt: Ordner kopieren, `thema.json` ausfüllen, PDFs ablegen, im Katalog eintragen,
prüfen, pushen. Am Programmcode ändert sich nichts.

**Rahmenbedingungen**, die alles andere geprägt haben:

- GitHub Pages, **kein Build-Schritt** – reines HTML, CSS und ES-Module
- **keine externen Anfragen zur Laufzeit** (DSGVO): KaTeX und die Schriften liegen im Repo
- **keine Daten an Server**: Fortschritt nur im `localStorage` des Geräts,
  Schlüssel `lerntheke:<stufe>:<thema>`
- iPad und Smartphone zuerst, Desktop zweitrangig, Touch-Ziele ≥ 44 px

---

## 2. Ablauf für die Schülerinnen und Schüler

1. **Start:** Klassenstufe und Thema wählen; das zuletzt geöffnete Thema steht oben.
2. **Selbsteinschätzung (Eingang):** je Kompetenz eine Nadel auf der Farbskala. Überspringbar.
3. **Stationsübersicht:** Lernweg, Fortschritt und die Stationen als Kacheln mit Abbildung.
   Wahlstationen zu unsicher eingeschätzten Kompetenzen tragen die Marke *empfohlen*.
4. **Station:**
   - Arbeitsblatt öffnen oder herunterladen, **alle** Aufgaben auf Papier bearbeiten
   - „Fertig – Lösungen freischalten" → **eine** Einschätzung für die ganze Station
   - erst danach erscheinen alle Lösungen untereinander
   - je Aufgabe Punkte eintragen **oder** „nicht bearbeitet" setzen
   - „Station abschließen"
5. **Auswertung:** Punkte gesamt, je Station, je Anforderungsbereich; Vergleich von
   Einschätzung und Quote **je Station**; Selbsteinschätzung am Ende mit Vorher/Nachher;
   Zusammenfassung mit optionalem Namen, Druckansicht.
6. **Sicherung:** Export und Import als JSON, Zurücksetzen mit Rückfrage.

### Tandemstationen

Zwei Personen, zwei Tablets, kein Papier. Beim Öffnen wählt jede ihre Rolle (A oder B).
Die Nummern laufen in fester Reihenfolge, groß angezeigt, damit beide Geräte im Takt
bleiben – gekoppelt wird nichts. Wer die Nummer hat, löst laut; das Gegenüber sieht die
Lösung und einen ausklappbaren Tipp und meldet zurück: *richtig* (volle Punkte),
*mit Tipp richtig* (halbe), *falsch* (0). Erst danach erscheint die Lösung zum Nachlesen.
In die eigene Auswertung zählen nur die eigenen Nummern. Die Selbsteinschätzung kommt
einmal am Ende der Station.

---

## 3. Aufbau

```
index.html                 Einstieg, Kopfzeile, Notfallhinweis ohne Webserver
start.cmd                  lokalen Server starten (Doppelklick)
app/
  app.js      (1488 Z.)    Ablauf, Ansichten, Auswertung, Lernweg
  store.js     (241 Z.)    localStorage, Normalisierung, Export/Import
  render.js    (403 Z.)    Markdown + Mathematik (KaTeX oder Ersatz)
  icons.js      (63 Z.)    Symbole und Gesichter als Inline-SVG
  style.css    (805 Z.)    Gestaltung, Hell/Dunkel, Druckansicht
vendor/katex/              KaTeX 0.18.7 (lokal)
vendor/fonts/              Source Sans 3 (lokal, 137 KB)
inhalte/
  katalog.json             Stufen und Themen
  q1/integralrechnung/     thema.json, pdf/, img/
  9/stromkreise/           Beispielthema Physik
tools/validate.mjs|.py     Inhaltsprüfung (Node bzw. Python)
```

87 Dateien, zusammen 16 MB – davon 5,6 MB Inhalte (überwiegend die acht Arbeitsblätter)
und 1,1 MB KaTeX und Schriften.

**Datenfluss:** `katalog.json` → Themenliste. Beim Öffnen eines Themas lädt die App
`inhalte/<stufe>/<thema>/thema.json` und zeichnet daraus alle Ansichten. Eingaben gehen
über `store.js` in den `localStorage`; jeder gelesene Stand wird normalisiert, unbekannte
oder beschädigte Felder fliegen raus statt zum Absturz zu führen.

---

## 4. Gestaltung

Die App folgt dem **LMG-Unterricht-Design-System** (`Schule\2526\Claude_Design`):

- Farben aus `colors_and_type.css`: warm-neutrales Off-White, kühle Grautöne,
  Fachakzent Mathematik `#B61E33`, Physik `#2C5282`
- Schrift **Source Sans 3**, lokal eingebunden (variabel, vier Dateien)
- Symbole aus dem Icon-Satz des Design-Systems, inline in `app/icons.js`
- Kopfzeile mit LMG-Monogramm, Fachfarbe als Akzentlinie
- eigener, abgedunkelter Farbsatz für `prefers-color-scheme: dark`

**Stationskacheln** zeigen eine kleine Abbildung, die Kennung in Fachrot, Dauer,
Sozialform, Hilfsmittel und den Punktestand. Auf dem Handy steht das Bild links neben dem
Text, ab Tabletbreite stehen zwei Kacheln nebeneinander mit Bild oben.

**Der Lernweg** über den Stationen bündelt die Kompetenzen zu Phasen (Vorlage: das FigJam
„Lernprozess Q1 Mathe"), zeigt je Phase die Stationen und den Punktestand und endet beim
Ziel („Klausur 1"). Noch nicht unterrichtete Kompetenzen stehen ausgegraut mit der Marke
*später*.

**Die Selbsteinschätzung** ist ein schmaler Farbverlauf von Rot nach Grün, auf dem eine
Pinnadel gesetzt wird. Dahinter liegen unsichtbar fünf Stufen; sie tauchen erst im
Vorher/Nachher-Vergleich als Gesichter von Rot über Gelb nach Grün auf.

---

## 5. Entscheidungen, die nicht offensichtlich sind

| Entscheidung | Grund |
|---|---|
| Schieberegler als Skala | Finger, Maus und Tastatur funktionieren dadurch ohne Eigenbau, Screenreader lesen die Stufe vor |
| Gesichter als SVG statt Emoji | Emojis lassen sich nicht einfärben; rot/gelb/grün wäre sonst unmöglich |
| Stationsbilder als SVG | 2 KB statt 30 KB, auf jedem Display scharf, passen sich über eine Medienabfrage dem Dunkelmodus an |
| KaTeX und Schriften lokal | „keine externen Anfragen" aus dem Auftrag; ein Google-Fonts-Import wäre ein Verstoß |
| Ersatz-Renderer für Mathematik | Fehlt KaTeX, setzt die App Formeln selbst – die Lerntheke fällt nie ganz aus |
| PDFs ohne Erwartungshorizont | Die Arbeitsblätter tragen die Lösungen im zweiten Teil; ausgeliefert wird nur der Aufgabenteil, die Lösungen stehen in der `thema.json` |
| Tandembogen ohne PDF | Das Papierblatt trägt beide Lösungsspalten (zum Knicken) und würde den Tandem-Ablauf aushebeln |
| Touch-Anpassungen | Auf dem iPad hob langes Tippen die Kachel als Ziehvorschau an; das sah aus wie ein Zoom |
| `start.cmd` | Über `file://` blockieren Browser ES-Module – die Seite erklärt das jetzt selbst |
| Prüfung auch in Python | Auf dem Arbeitsrechner ist kein Node installiert |

---

## 6. Inhalte

**Q1 Integralrechnung – Trainingswoche** (echtes Material):
9 Stationen, 62 Aufgaben, 115 Punkte, Checkliste mit 11 Kompetenzen (3 davon als *später*
markiert), drei Phasen im Lernweg.

| Station | Titel | Typ | Aufgaben |
|---|---|---|---|
| P1 | Flächen unter Graphen | Pflicht | 6 |
| P2 | Flächen zwischen Graphen | Pflicht | 6 |
| W1 | Ober- und Untersumme | Wahl | 5 |
| W2 | Tandembogen Stammfunktionen | Wahl, Tandem | 12 (6 je Rolle) |
| W3 | Der Hauptsatz | Wahl | 6 |
| W4 | Änderungsrate und Bestand: E-Auto | Wahl | 6 |
| W5 | Grafisch ableiten und integrieren | Wahl | 5 |
| W6 | Hilfsmittelfreier Teil | Wahl | 6 |
| W7 | Komplexaufgabe: Betonwelle im Skatepark | Wahl | 10 |

Dazu ein kleines **Beispielthema Physik** (Klasse 9, Stromkreise) mit Platzhalter-PDFs –
es zeigt die zweite Fachfarbe und die Anrede „du" und kann gelöscht werden.

---

## 7. Qualitätssicherung

- **Inhaltsprüfung** (`python tools/validate.py` oder `node tools/validate.mjs`):
  Pflichtfelder, eindeutige IDs, vorhandene PDF-, Bild- und Stationsbilddateien,
  Punktsummen, Checklisten- und Phasenverweise, Tandem-Regeln (Rollen, gleiche Punktzahl),
  `spaeter`-Logik. Rückgabewert 1 bei Fehlern – taugt für einen Pre-Push-Hook.
- **Robustheit:** beschädigte oder fremde `localStorage`-Einträge führen zu einem frischen
  Start statt zum Absturz; entfernte Aufgaben werden ignoriert; ältere Stände werden
  beim Laden umgerechnet.
- **Barrierearmut:** Skalenstufen als Text für Screenreader, Tastaturbedienung,
  Fokusrahmen, ausreichender Kontrast in beiden Farbschemata.
- Geprüft wurde jeweils in Hell und Dunkel bei 375 px, 768 px und Desktopbreite.

---

## 8. Entstehung

| Commit | Schritt |
|---|---|
| `d524749` | erste Fassung der App mit Beispielthema |
| `9019a5b` | echte Inhalte: Integralrechnung Q1, acht Arbeitsblätter als Schüler-PDF |
| `4bbdbdd` | Gestaltung nach dem LMG-Design-System, Schriften lokal |
| `e3f6174` | `start.cmd` und Hinweis statt endlosem „Lade …" |
| `c0d612f` `7bf263a` | Selbsteinschätzung: erst dreistufig, dann Farbverlauf mit Pinnadel |
| `8d66daa` | Stationsübersicht als Kacheln mit Abbildungen |
| `5dbd403` | Lernweg nach dem FigJam-Board |
| `dfab16e` | noch nicht unterrichtete Kompetenzen ausgegraut |
| `8cf9fc7` | Touch-Verhalten auf dem Tablet, vier neue Stationsbilder |
| `6f8fa57` | eine Selbsteinschätzung je Station statt je Aufgabe, „nicht bearbeitet" |

---

## 9. Offene Punkte

- **Zwei Commits warten auf „Push origin"** (Stand dieser Datei).
- **PDF-Größe:** Die acht Arbeitsblätter wiegen zusammen 5,3 MB, weil Word die Schriften
  vollständig einbettet. Beim Export mit „Minimale Größe (Onlineveröffentlichung)" wären
  es 100–200 KB je Datei – spürbar im Schul-WLAN.
- **Mittelwerte und Integralfunktion** sind als Kompetenzen angelegt, aber noch nicht
  unterrichtet. Sobald es soweit ist: `"spaeter": true` entfernen und Stationen ergänzen.
- **Lösungs-PDFs** wurden bewusst nicht erzeugt – die Lösungen stehen bereits in der
  `thema.json` und erscheinen in der App nach der Selbsteinschätzung.
- Der **Tandembogen als Druckvorlage** liegt neben den Word-Dateien im Stationstraining-
  Ordner, nicht im Repo.
