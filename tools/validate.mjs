#!/usr/bin/env node
/* Lerntheke – Inhalte prüfen
   Aufruf im Projektordner:  node tools/validate.mjs
   Prüft katalog.json und alle thema.json: Pflichtfelder, eindeutige IDs,
   vorhandene PDF-/Bilddateien, Punktsummen je Station, gültige Checklisten-Verweise.
   Rückgabewert 1, sobald ein Fehler gefunden wurde (für CI oder Pre-Push-Hook). */

import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INHALTE = path.join(WURZEL, 'inhalte');

const AFB_ERLAUBT = ['I', 'II', 'III'];
const SOZIALFORM_ERLAUBT = ['einzel', 'partner', 'gruppe', 'tandem'];
const TYP_ERLAUBT = ['pflicht', 'wahl'];
const ROLLEN = ['A', 'B'];

const fehler = [];
const warnungen = [];

const f = (ort, text) => fehler.push(ort + ': ' + text);
const w = (ort, text) => warnungen.push(ort + ': ' + text);

async function existiert(p) {
  try { await access(p, constants.R_OK); return true; } catch { return false; }
}

async function liesJSON(p, ort) {
  try {
    return JSON.parse(await readFile(p, 'utf8'));
  } catch (e) {
    f(ort, 'Datei fehlt oder ist kein gültiges JSON (' + e.message + ')');
    return null;
  }
}

function istText(x) { return typeof x === 'string' && x.trim() !== ''; }

function pruefeAufgabe(a, ort, aufgabenIds, summe, tandem) {
  if (!istText(a.id)) { f(ort, 'Aufgabe ohne "id"'); return summe; }
  const o = ort + ' › Aufgabe ' + a.id;
  if (aufgabenIds.has(a.id)) f(o, 'doppelte Aufgaben-ID');
  aufgabenIds.add(a.id);

  if (tandem) {
    if (!ROLLEN.includes(a.partner)) f(o, '"partner" muss "A" oder "B" sein (Tandemstation)');
    if (!istText(a.aufgabe)) f(o, 'kein "aufgabe"-Text – bei Tandem steht die Aufgabe in der App, nicht auf Papier');
    if (!istText(a.tipp)) w(o, 'kein "tipp" – das Gegenüber kann dann nicht helfen');
  } else {
    if (a.partner !== undefined || a.aufgabe !== undefined) {
      w(o, '"partner"/"aufgabe" wirken nur bei "sozialform": "tandem"');
    }
  }

  if (!istText(a.label)) w(o, 'kein "label" (Nummer auf dem Arbeitsblatt)');
  if (typeof a.punkte !== 'number' || !(a.punkte > 0)) {
    f(o, '"punkte" muss eine Zahl größer 0 sein');
  } else {
    if (Math.round(a.punkte * 2) !== a.punkte * 2) w(o, '"punkte" ist kein Vielfaches von 0,5');
    summe += a.punkte;
  }
  if (!AFB_ERLAUBT.includes(a.afb)) f(o, '"afb" muss I, II oder III sein (ist: ' + JSON.stringify(a.afb) + ')');
  if (!istText(a.loesung) && !istText(a.loesung_bild)) f(o, 'weder "loesung" noch "loesung_bild" vorhanden');
  return summe;
}

async function pruefeStation(st, ort, ordner, stationsIds, aufgabenIds, checklistenIds) {
  if (!istText(st.id)) { f(ort, 'Station ohne "id"'); return; }
  const o = ort + ' › Station ' + st.id;
  if (stationsIds.has(st.id)) f(o, 'doppelte Stations-ID');
  stationsIds.add(st.id);

  if (!istText(st.titel)) f(o, 'kein "titel"');
  if (!TYP_ERLAUBT.includes(st.typ)) f(o, '"typ" muss "pflicht" oder "wahl" sein (ist: ' + JSON.stringify(st.typ) + ')');
  if (st.sozialform !== undefined && !SOZIALFORM_ERLAUBT.includes(st.sozialform)) {
    f(o, '"sozialform" muss einzel, partner oder gruppe sein');
  }
  if (st.dauer_min !== undefined && !(typeof st.dauer_min === 'number' && st.dauer_min > 0)) {
    f(o, '"dauer_min" muss eine Zahl größer 0 sein');
  }
  if (!istText(st.hilfsmittel)) w(o, 'kein "hilfsmittel" angegeben');

  for (const ref of st.checkliste || []) {
    if (!checklistenIds.has(ref)) f(o, 'Checklisten-Verweis "' + ref + '" gibt es nicht');
  }
  if (!Array.isArray(st.checkliste) || st.checkliste.length === 0) {
    w(o, 'kein Bezug zur Checkliste – die Empfehlung von Wahlstationen funktioniert dann nicht');
  }

  const tandem = st.sozialform === 'tandem';

  if (istText(st.bild) && !await existiert(path.join(ordner, st.bild))) {
    f(o, 'Stationsbild fehlt: ' + st.bild);
  }

  if (istText(st.pdf)) {
    if (!await existiert(path.join(ordner, st.pdf))) {
      if (st.pdf_optional) w(o, 'PDF fehlt: ' + st.pdf + ' – die Knöpfe bleiben ausgeblendet');
      else f(o, 'PDF fehlt: ' + st.pdf);
    }
  } else if (!st.pdf_optional && !tandem) {
    w(o, 'kein "pdf" hinterlegt');
  }

  if (!Array.isArray(st.aufgaben) || st.aufgaben.length === 0) {
    f(o, 'keine Aufgaben');
    return;
  }
  let summe = 0;
  const jeRolle = { A: 0, B: 0 };
  for (const a of st.aufgaben) {
    summe = pruefeAufgabe(a, o, aufgabenIds, summe, tandem);
    if (tandem && ROLLEN.includes(a.partner) && typeof a.punkte === 'number') jeRolle[a.partner] += a.punkte;
    if (istText(a.loesung_bild) && !await existiert(path.join(ordner, a.loesung_bild))) {
      f(o + ' › Aufgabe ' + a.id, 'Bild fehlt: ' + a.loesung_bild);
    }
  }
  if (typeof st.punkte_gesamt === 'number' && st.punkte_gesamt !== summe) {
    f(o, '"punkte_gesamt" (' + st.punkte_gesamt + ') passt nicht zur Summe der Aufgaben (' + summe + ')');
  }

  if (tandem) {
    for (const r of ROLLEN) {
      if (jeRolle[r] === 0) f(o, 'Partner ' + r + ' hat keine eigene Aufgabe');
    }
    if (jeRolle.A !== jeRolle.B && jeRolle.A > 0 && jeRolle.B > 0) {
      w(o, 'ungleiche Punktzahl: Partner A ' + jeRolle.A + ', Partner B ' + jeRolle.B);
    }
    console.log('    ' + st.id.padEnd(6) + st.aufgaben.length + ' Nummern, Tandem: A ' +
      String(jeRolle.A).replace('.', ',') + ' P / B ' + String(jeRolle.B).replace('.', ',') + ' P' +
      (st.typ === 'wahl' ? '  (Wahl)' : ''));
    return;
  }

  console.log('    ' + st.id.padEnd(6) + st.aufgaben.length + ' Aufgaben, ' +
    String(summe).replace('.', ',') + ' Punkte' + (st.typ === 'wahl' ? '  (Wahl)' : ''));
}

async function pruefeThema(stufeId, themaId) {
  const ordner = path.join(INHALTE, stufeId, themaId);
  const datei = path.join(ordner, 'thema.json');
  const ort = stufeId + '/' + themaId + '/thema.json';
  console.log('  ' + ort);

  const th = await liesJSON(datei, ort);
  if (!th) return;

  if (!istText(th.titel)) f(ort, 'kein "titel"');
  if (!istText(th.fach)) f(ort, 'kein "fach"');
  else if (!['mathe', 'physik'].includes(th.fach)) w(ort, 'unbekanntes "fach" – es gibt keine Fachfarbe dafür');
  if (!['du', 'sie'].includes(th.anrede)) f(ort, '"anrede" muss "du" oder "sie" sein');

  const checklistenIds = new Set();
  for (const c of th.checkliste || []) {
    if (!istText(c.id) || !istText(c.text)) { f(ort, 'Checklistenpunkt braucht "id" und "text"'); continue; }
    if (checklistenIds.has(c.id)) f(ort, 'doppelte Checklisten-ID: ' + c.id);
    checklistenIds.add(c.id);
  }
  if (checklistenIds.size === 0) w(ort, 'keine Checkliste – die Selbstdiagnose entfällt');

  if (th.phasen !== undefined) {
    const phasen = Array.isArray(th.phasen) ? th.phasen : [];
    if (!phasen.length) f(ort, '"phasen" ist leer – dann lieber ganz weglassen');
    const phasenIds = new Set();
    const inPhase = new Set();
    for (const ph of phasen) {
      if (!istText(ph.id) || !istText(ph.name)) { f(ort, 'Phase braucht "id" und "name"'); continue; }
      if (phasenIds.has(ph.id)) f(ort, 'doppelte Phasen-ID: ' + ph.id);
      phasenIds.add(ph.id);
      const refs = ph.checkliste || [];
      if (!refs.length) w(ort, 'Phase "' + ph.id + '" enthält keinen Checklistenpunkt');
      for (const ref of refs) {
        if (!checklistenIds.has(ref)) f(ort, 'Phase "' + ph.id + '": Checklisten-Verweis "' + ref + '" gibt es nicht');
        if (inPhase.has(ref)) w(ort, 'Checklistenpunkt "' + ref + '" steht in mehreren Phasen');
        inPhase.add(ref);
      }
    }
    for (const id of checklistenIds) {
      if (!inPhase.has(id)) w(ort, 'Checklistenpunkt "' + id + '" gehört zu keiner Phase des Lernwegs');
    }
  }

  if (!Array.isArray(th.stationen) || th.stationen.length === 0) {
    f(ort, 'keine Stationen');
    return;
  }

  const stationsIds = new Set();
  const aufgabenIds = new Set();
  for (const st of th.stationen) {
    await pruefeStation(st, ort, ordner, stationsIds, aufgabenIds, checklistenIds);
  }

  const benutzt = new Set();
  for (const st of th.stationen) for (const ref of st.checkliste || []) benutzt.add(ref);
  for (const id of checklistenIds) {
    if (!benutzt.has(id)) w(ort, 'Checklistenpunkt "' + id + '" wird von keiner Station abgedeckt');
  }
}

async function main() {
  console.log('Prüfe Inhalte in ' + INHALTE + '\n');
  const katalog = await liesJSON(path.join(INHALTE, 'katalog.json'), 'katalog.json');
  if (!katalog) { ausgabe(); return; }

  if (!Array.isArray(katalog.stufen) || katalog.stufen.length === 0) {
    f('katalog.json', 'keine "stufen"');
    ausgabe();
    return;
  }

  const stufenIds = new Set();
  for (const stufe of katalog.stufen) {
    if (!istText(stufe.id)) { f('katalog.json', 'Stufe ohne "id"'); continue; }
    if (stufenIds.has(stufe.id)) f('katalog.json', 'doppelte Stufen-ID: ' + stufe.id);
    stufenIds.add(stufe.id);
    if (!istText(stufe.name)) w('katalog.json', 'Stufe "' + stufe.id + '" ohne "name"');

    const themenIds = new Set();
    for (const th of stufe.themen || []) {
      if (!istText(th.id)) { f('katalog.json', 'Thema ohne "id" in Stufe ' + stufe.id); continue; }
      if (themenIds.has(th.id)) f('katalog.json', 'doppelte Thema-ID: ' + stufe.id + '/' + th.id);
      themenIds.add(th.id);
      if (!istText(th.name)) f('katalog.json', 'Thema ' + stufe.id + '/' + th.id + ' ohne "name"');
      if (!istText(th.fach)) f('katalog.json', 'Thema ' + stufe.id + '/' + th.id + ' ohne "fach"');
      if (th.aktiv === false) { console.log('  ' + stufe.id + '/' + th.id + ' (nicht aktiv – wird trotzdem geprüft)'); }
      await pruefeThema(stufe.id, th.id);
    }
  }
  ausgabe();
}

function ausgabe() {
  console.log('');
  for (const x of warnungen) console.log('  Hinweis  ' + x);
  for (const x of fehler) console.log('  FEHLER   ' + x);
  console.log('');
  if (fehler.length === 0 && warnungen.length === 0) console.log('Alles in Ordnung.');
  else console.log(fehler.length + ' Fehler, ' + warnungen.length + ' Hinweise.');
  process.exit(fehler.length ? 1 : 0);
}

main().catch((e) => {
  console.error('Unerwarteter Abbruch:', e);
  process.exit(2);
});
