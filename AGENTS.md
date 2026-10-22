# AGENTS.md – Lerntheke

Statische Web-App (GitHub Pages, Repo `timkucz-cmyk/lerntheke`) für Lerntheken und
Trainingsphasen im Mathe-/Physikunterricht am LMG Uetersen. Kein Build, keine Frameworks.
Gilt für alle KI-Agenten (Codex, Claude Code, Jules, …) und für Beiträge von Kolleg:innen.

## Was ein Beitrag ändern darf

- **Nur Inhalte:** `inhalte/<stufe>/<thema>/` (`thema.json`, `pdf/`, `img/`) und der
  zugehörige Eintrag in `inhalte/katalog.json`.
- **Nicht anfassen:** `app/`, `vendor/`, `tools/`, `index.html`, `.github/`, `README.md`,
  `PROJEKT.md`, `AGENTS.md`. Die GitHub-Prüfung lehnt Pull Requests von Kolleg:innen ab,
  die Dateien außerhalb von `inhalte/` ändern.
- **Fremde Themen nicht ändern.** Ein Beitrag legt ein neues Thema an oder ändert nur das
  eigene.
- **Nie direkt auf `main`.** Eigener Branch `thema/<stufe>-<thema>`, dann Pull Request.
  `main` geht sofort live.

## Neues Thema

Ablauf und Aufbau von `thema.json`: `README.md`, Abschnitte 3 bis 5. Kurzfassung:

1. Ordner `inhalte/<stufe>/<thema>/` mit `thema.json`, `pdf/`, `img/` anlegen. Vorlage:
   `inhalte/9/stromkreise/thema.json` (einfach) bzw. `inhalte/q1/integralrechnung/thema.json`
   (mit Lernweg und Tandem).
2. Ordnernamen klein, ohne Leerzeichen und Umlaute: `9/quadratische-funktionen`.
   Stufen-IDs: `5` … `10`, `e`, `q1`, `q2`.
3. Eintrag in `inhalte/katalog.json` unter der passenden Stufe, **mit `"aktiv": false`**.
   Tim schaltet das Thema nach der Durchsicht frei. Fehlt die Stufe, neuen Block ergänzen.
4. Prüfen: `node tools/validate.mjs` (oder `python tools/validate.py`). Erst bei
   „Alles in Ordnung.“ den Pull Request öffnen. Warnungen im PR-Text erwähnen.

## Inhaltliche Regeln

- `fach`: `mathe` oder `physik`. `anrede`: `du` bis Klasse 10, `sie` ab E-Phase.
- IDs (`c1`, `P1`, `P1-1`) sind dauerhaft; nach dem Verteilen nicht mehr ändern.
- Jede Station hat einen `checkliste`-Bezug; jede Aufgabe `punkte` (Vielfache von 0,5),
  `afb` (`I`/`II`/`III`) und `loesung`.
- Lösungen in Markdown mit `$…$` und `$$…$$`; in JSON jeden Backslash doppelt (`\\frac`),
  Zeilenumbrüche als `\n`, Dezimalkomma als `0{,}5`, Einheiten mit `\\,\\mathrm{m}`.
- Die PDFs enthalten **nur den Aufgabenteil** – die Lösungen stehen in `thema.json`.
  Eine Station ohne PDF ist ein Fehler (Ausnahme: Tandem mit `"pdf_optional": true`).
- PDFs möglichst unter 1 MB (Word: „Minimale Größe (Onlineveröffentlichung)“).
- Stationsbilder optional als schlichte SVG im Format 16:7.
- Texte auf Deutsch mit korrekten Umlauten und „deutschen Anführungszeichen“.

## Rechtliches

- Das Repo und die Seite sind **öffentlich**. Kein Verlagsmaterial, keine eingescannten
  Schulbuchseiten, keine fremden Abbildungen ohne freie Lizenz.
- **Keine Schülerdaten** – keine Namen, Fotos, Noten, auch nicht in Beispielen.

## Lokale Vorschau

`start.cmd` (Doppelklick) oder `python -m http.server 8000`. Ein inaktives Thema ist
nicht in der Auswahl, aber direkt erreichbar: `http://localhost:8000/#/t/<stufe>/<thema>`.
