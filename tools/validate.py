#!/usr/bin/env python3
"""Lerntheke - Inhalte pruefen (gleiche Pruefungen wie tools/validate.mjs).

Aufruf im Projektordner:  python tools/validate.py
Fuer Rechner ohne Node. Rueckgabewert 1, sobald ein Fehler gefunden wurde.
"""

import json
import os
import sys

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INHALTE = os.path.join(WURZEL, "inhalte")

AFB_ERLAUBT = ["I", "II", "III"]
SOZIALFORM_ERLAUBT = ["einzel", "partner", "gruppe", "tandem"]
TYP_ERLAUBT = ["pflicht", "wahl"]
ROLLEN = ["A", "B"]

fehler = []
warnungen = []


def f(ort, text):
    fehler.append("%s: %s" % (ort, text))


def w(ort, text):
    warnungen.append("%s: %s" % (ort, text))


def ist_text(x):
    return isinstance(x, str) and x.strip() != ""


def ist_zahl(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def lies_json(pfad, ort):
    try:
        with open(pfad, encoding="utf-8") as fh:
            return json.load(fh)
    except Exception as e:  # noqa: BLE001
        f(ort, "Datei fehlt oder ist kein gueltiges JSON (%s)" % e)
        return None


def zahl_text(x):
    return ("%g" % x).replace(".", ",")


def pruefe_aufgabe(a, ort, aufgaben_ids, tandem=False):
    if not ist_text(a.get("id")):
        f(ort, 'Aufgabe ohne "id"')
        return 0
    o = "%s > Aufgabe %s" % (ort, a["id"])
    if a["id"] in aufgaben_ids:
        f(o, "doppelte Aufgaben-ID")
    aufgaben_ids.add(a["id"])

    if tandem:
        if a.get("partner") not in ROLLEN:
            f(o, '"partner" muss "A" oder "B" sein (Tandemstation)')
        if not ist_text(a.get("aufgabe")):
            f(o, 'kein "aufgabe"-Text - bei Tandem steht die Aufgabe in der App, nicht auf Papier')
        if not ist_text(a.get("tipp")):
            w(o, 'kein "tipp" - das Gegenueber kann dann nicht helfen')
    elif "partner" in a or "aufgabe" in a:
        w(o, '"partner"/"aufgabe" wirken nur bei "sozialform": "tandem"')

    summe = 0
    if not ist_text(a.get("label")):
        w(o, 'kein "label" (Nummer auf dem Arbeitsblatt)')
    p = a.get("punkte")
    if not ist_zahl(p) or p <= 0:
        f(o, '"punkte" muss eine Zahl groesser 0 sein')
    else:
        if round(p * 2) != p * 2:
            w(o, '"punkte" ist kein Vielfaches von 0,5')
        summe = p
    if a.get("afb") not in AFB_ERLAUBT:
        f(o, '"afb" muss I, II oder III sein (ist: %r)' % a.get("afb"))
    if not ist_text(a.get("loesung")) and not ist_text(a.get("loesung_bild")):
        f(o, 'weder "loesung" noch "loesung_bild" vorhanden')
    return summe


def pruefe_station(st, ort, ordner, stations_ids, aufgaben_ids, checklisten_ids):
    if not ist_text(st.get("id")):
        f(ort, 'Station ohne "id"')
        return
    o = "%s > Station %s" % (ort, st["id"])
    if st["id"] in stations_ids:
        f(o, "doppelte Stations-ID")
    stations_ids.add(st["id"])

    if not ist_text(st.get("titel")):
        f(o, 'kein "titel"')
    if st.get("typ") not in TYP_ERLAUBT:
        f(o, '"typ" muss "pflicht" oder "wahl" sein (ist: %r)' % st.get("typ"))
    if "sozialform" in st and st["sozialform"] not in SOZIALFORM_ERLAUBT:
        f(o, '"sozialform" muss einzel, partner oder gruppe sein')
    if "dauer_min" in st and not (ist_zahl(st["dauer_min"]) and st["dauer_min"] > 0):
        f(o, '"dauer_min" muss eine Zahl groesser 0 sein')
    if not ist_text(st.get("hilfsmittel")):
        w(o, 'kein "hilfsmittel" angegeben')

    refs = st.get("checkliste") or []
    for ref in refs:
        if ref not in checklisten_ids:
            f(o, 'Checklisten-Verweis "%s" gibt es nicht' % ref)
    if not refs:
        w(o, "kein Bezug zur Checkliste - die Empfehlung von Wahlstationen funktioniert dann nicht")

    tandem = st.get("sozialform") == "tandem"

    if ist_text(st.get("bild")) and not os.path.isfile(
            os.path.join(ordner, st["bild"].replace("/", os.sep))):
        f(o, "Stationsbild fehlt: %s" % st["bild"])

    if ist_text(st.get("pdf")):
        if not os.path.isfile(os.path.join(ordner, st["pdf"].replace("/", os.sep))):
            if st.get("pdf_optional"):
                w(o, "PDF fehlt: %s - die Knoepfe bleiben ausgeblendet" % st["pdf"])
            else:
                f(o, "PDF fehlt: %s" % st["pdf"])
    elif not st.get("pdf_optional") and not tandem:
        w(o, 'kein "pdf" hinterlegt')

    aufgaben = st.get("aufgaben")
    if not isinstance(aufgaben, list) or not aufgaben:
        f(o, "keine Aufgaben")
        return

    summe = 0
    je_rolle = {"A": 0, "B": 0}
    for a in aufgaben:
        summe += pruefe_aufgabe(a, o, aufgaben_ids, tandem)
        if tandem and a.get("partner") in ROLLEN and ist_zahl(a.get("punkte")):
            je_rolle[a["partner"]] += a["punkte"]
        bild = a.get("loesung_bild")
        if ist_text(bild) and not os.path.isfile(os.path.join(ordner, bild.replace("/", os.sep))):
            f("%s > Aufgabe %s" % (o, a.get("id")), "Bild fehlt: %s" % bild)

    if ist_zahl(st.get("punkte_gesamt")) and st["punkte_gesamt"] != summe:
        f(o, '"punkte_gesamt" (%s) passt nicht zur Summe der Aufgaben (%s)'
          % (zahl_text(st["punkte_gesamt"]), zahl_text(summe)))

    if tandem:
        for r in ROLLEN:
            if je_rolle[r] == 0:
                f(o, "Partner %s hat keine eigene Aufgabe" % r)
        if je_rolle["A"] != je_rolle["B"] and je_rolle["A"] > 0 and je_rolle["B"] > 0:
            w(o, "ungleiche Punktzahl: Partner A %s, Partner B %s"
              % (zahl_text(je_rolle["A"]), zahl_text(je_rolle["B"])))
        print("    %-6s %d Nummern, Tandem: A %s P / B %s P%s"
              % (st["id"], len(aufgaben), zahl_text(je_rolle["A"]), zahl_text(je_rolle["B"]),
                 "  (Wahl)" if st.get("typ") == "wahl" else ""))
        return

    print("    %-6s %d Aufgaben, %s Punkte%s"
          % (st["id"], len(aufgaben), zahl_text(summe), "  (Wahl)" if st.get("typ") == "wahl" else ""))


def pruefe_thema(stufe_id, thema_id):
    ordner = os.path.join(INHALTE, stufe_id, thema_id)
    ort = "%s/%s/thema.json" % (stufe_id, thema_id)
    print("  " + ort)

    th = lies_json(os.path.join(ordner, "thema.json"), ort)
    if th is None:
        return

    if not ist_text(th.get("titel")):
        f(ort, 'kein "titel"')
    if not ist_text(th.get("fach")):
        f(ort, 'kein "fach"')
    elif th["fach"] not in ("mathe", "physik"):
        w(ort, 'unbekanntes "fach" - es gibt keine Fachfarbe dafuer')
    if th.get("anrede") not in ("du", "sie"):
        f(ort, '"anrede" muss "du" oder "sie" sein')

    checklisten_ids = set()
    for c in th.get("checkliste") or []:
        if not ist_text(c.get("id")) or not ist_text(c.get("text")):
            f(ort, 'Checklistenpunkt braucht "id" und "text"')
            continue
        if c["id"] in checklisten_ids:
            f(ort, "doppelte Checklisten-ID: %s" % c["id"])
        checklisten_ids.add(c["id"])
    if not checklisten_ids:
        w(ort, "keine Checkliste - die Selbstdiagnose entfaellt")

    phasen = th.get("phasen")
    if phasen is not None:
        if not isinstance(phasen, list) or not phasen:
            f(ort, '"phasen" ist leer - dann lieber ganz weglassen')
            phasen = []
        phasen_ids = set()
        in_phase = set()
        for ph in phasen:
            if not ist_text(ph.get("id")) or not ist_text(ph.get("name")):
                f(ort, 'Phase braucht "id" und "name"')
                continue
            if ph["id"] in phasen_ids:
                f(ort, "doppelte Phasen-ID: %s" % ph["id"])
            phasen_ids.add(ph["id"])
            refs = ph.get("checkliste") or []
            if not refs:
                w(ort, 'Phase "%s" enthaelt keinen Checklistenpunkt' % ph["id"])
            for ref in refs:
                if ref not in checklisten_ids:
                    f(ort, 'Phase "%s": Checklisten-Verweis "%s" gibt es nicht' % (ph["id"], ref))
                if ref in in_phase:
                    w(ort, 'Checklistenpunkt "%s" steht in mehreren Phasen' % ref)
                in_phase.add(ref)
        for cid in sorted(checklisten_ids - in_phase):
            w(ort, 'Checklistenpunkt "%s" gehoert zu keiner Phase des Lernwegs' % cid)

    stationen = th.get("stationen")
    if not isinstance(stationen, list) or not stationen:
        f(ort, "keine Stationen")
        return

    stations_ids, aufgaben_ids = set(), set()
    for st in stationen:
        pruefe_station(st, ort, ordner, stations_ids, aufgaben_ids, checklisten_ids)

    benutzt = set()
    for st in stationen:
        for ref in st.get("checkliste") or []:
            benutzt.add(ref)
    for cid in sorted(checklisten_ids):
        if cid not in benutzt:
            w(ort, 'Checklistenpunkt "%s" wird von keiner Station abgedeckt' % cid)


def main():
    print("Pruefe Inhalte in %s\n" % INHALTE)
    katalog = lies_json(os.path.join(INHALTE, "katalog.json"), "katalog.json")
    if katalog is None:
        return ausgabe()

    stufen = katalog.get("stufen")
    if not isinstance(stufen, list) or not stufen:
        f("katalog.json", 'keine "stufen"')
        return ausgabe()

    stufen_ids = set()
    for stufe in stufen:
        if not ist_text(stufe.get("id")):
            f("katalog.json", 'Stufe ohne "id"')
            continue
        if stufe["id"] in stufen_ids:
            f("katalog.json", "doppelte Stufen-ID: %s" % stufe["id"])
        stufen_ids.add(stufe["id"])
        if not ist_text(stufe.get("name")):
            w("katalog.json", 'Stufe "%s" ohne "name"' % stufe["id"])

        themen_ids = set()
        for th in stufe.get("themen") or []:
            if not ist_text(th.get("id")):
                f("katalog.json", 'Thema ohne "id" in Stufe %s' % stufe["id"])
                continue
            if th["id"] in themen_ids:
                f("katalog.json", "doppelte Thema-ID: %s/%s" % (stufe["id"], th["id"]))
            themen_ids.add(th["id"])
            if not ist_text(th.get("name")):
                f("katalog.json", 'Thema %s/%s ohne "name"' % (stufe["id"], th["id"]))
            if not ist_text(th.get("fach")):
                f("katalog.json", 'Thema %s/%s ohne "fach"' % (stufe["id"], th["id"]))
            if th.get("aktiv") is False:
                print("  %s/%s (nicht aktiv - wird trotzdem geprueft)" % (stufe["id"], th["id"]))
            pruefe_thema(stufe["id"], th["id"])
    return ausgabe()


def ausgabe():
    print("")
    for x in warnungen:
        print("  Hinweis  " + x)
    for x in fehler:
        print("  FEHLER   " + x)
    print("")
    if not fehler and not warnungen:
        print("Alles in Ordnung.")
    else:
        print("%d Fehler, %d Hinweise." % (len(fehler), len(warnungen)))
    sys.exit(1 if fehler else 0)


if __name__ == "__main__":
    main()
