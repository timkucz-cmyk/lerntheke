/* Lerntheke – Ablaufsteuerung und Ansichten
   Reines Vanilla-JS (ES-Module), kein Build-Schritt, keine externen Adressen. */

import * as store from './store.js';
import { markdown, esc, mathematikVorbereiten } from './render.js';
import { symbol, sozialformSymbol, gesicht } from './icons.js';

const BASIS = new URL('../', import.meta.url);
const INHALTE = new URL('inhalte/', BASIS);

/* Die Skala läuft von 1 (unsicher) bis 5 (sicher). Sichtbar ist ein Farbverlauf;
   in welchen der fünf Bereiche die Nadel fällt, zeigt erst der Vorher/Nachher-Vergleich. */
const STUFEN = [
  { n: 1, wort: 'sehr unsicher' },
  { n: 2, wort: 'eher unsicher' },
  { n: 3, wort: 'mittel' },
  { n: 4, wort: 'eher sicher' },
  { n: 5, wort: 'sehr sicher' }
];

/** Lage der Nadel (0 bis 100) zur Stufe 1 bis 5. */
function stufeAusLage(lage) {
  return grenze(Math.floor(lage / 20) + 1, 1, 5);
}

/** Mitte des Bereichs – für Stände ohne gespeicherte Nadelposition. */
function lageAusStufe(stufe) {
  return (grenze(stufe, 1, 5) - 1) * 20 + 10;
}

function stufenWort(stufe) {
  const st = STUFEN.find((x) => x.n === Number(stufe));
  return st ? st.wort : '';
}

const TEXTE = {
  diagnoseIntro: {
    du: 'Schätze zuerst ein, wie sicher du dich bei den folgenden Punkten fühlst. Danach siehst du, welche Wahlstationen für dich besonders sinnvoll sind.',
    sie: 'Schätzen Sie zuerst ein, wie sicher Sie sich bei den folgenden Punkten fühlen. Danach sehen Sie, welche Wahlstationen für Sie besonders sinnvoll sind.'
  },
  stationVorher: {
    du: 'Bearbeite zuerst alle Aufgaben auf dem Blatt. Danach schaltest du die Lösungen frei.',
    sie: 'Bearbeiten Sie zuerst alle Aufgaben auf dem Blatt. Danach schalten Sie die Lösungen frei.'
  },
  freischaltenBtn: { du: 'Fertig – Lösungen freischalten', sie: 'Fertig – Lösungen freischalten' },
  stationFrage: {
    du: 'Wie sicher warst du bei dieser Station?',
    sie: 'Wie sicher waren Sie bei dieser Station?'
  },
  stationFrageHinweis: {
    du: 'Schätze dich ein, bevor du die Lösungen siehst. Danach werden sie freigeschaltet.',
    sie: 'Schätzen Sie sich ein, bevor Sie die Lösungen sehen. Danach werden sie freigeschaltet.'
  },
  stationFrageSpaeter: {
    du: 'Gemeint ist deine Einschätzung vor dem Blick in die Lösungen. Ändern kannst du sie trotzdem.',
    sie: 'Gemeint ist Ihre Einschätzung vor dem Blick in die Lösungen. Ändern können Sie sie trotzdem.'
  },
  stationFertigBtn: { du: 'Station abschließen', sie: 'Station abschließen' },
  wieSicherJetzt: { du: 'Wie sicher fühlst du dich?', sie: 'Wie sicher fühlen Sie sich?' },
  nameLabel: { du: 'Dein Name (bleibt auf diesem Gerät):', sie: 'Ihr Name (bleibt auf diesem Gerät):' },
  resetFrage: {
    du: 'Wirklich den gesamten Fortschritt zu diesem Thema löschen? Das lässt sich nicht rückgängig machen.',
    sie: 'Wirklich den gesamten Fortschritt zu diesem Thema löschen? Das lässt sich nicht rückgängig machen.'
  },
  ueberschaetzt: {
    du: 'Hier hast du dich sicherer gefühlt, als es die Punkte zeigen. Schau dir diese Aufgaben noch einmal an.',
    sie: 'Hier fühlten Sie sich sicherer, als es die Punkte zeigen. Sehen Sie sich diese Aufgaben noch einmal an.'
  },
  unterschaetzt: {
    du: 'Hier hast du dich unterschätzt – das kannst du besser, als du dachtest.',
    sie: 'Hier haben Sie sich unterschätzt – das können Sie besser, als Sie dachten.'
  },
  passend: {
    du: 'Deine Einschätzung passt gut zu deinem Ergebnis.',
    sie: 'Ihre Einschätzung passt gut zu Ihrem Ergebnis.'
  },
  tandemIntro: {
    du: 'Ihr arbeitet zu zweit mit zwei Geräten – ohne Papier. Bei jeder Nummer löst eine Person laut, die andere hat die Lösung und gibt bei Bedarf einen Tipp. Danach wechselt ihr.',
    sie: 'Sie arbeiten zu zweit mit zwei Geräten – ohne Papier. Bei jeder Nummer löst eine Person laut, die andere hat die Lösung und gibt bei Bedarf einen Tipp. Danach wird gewechselt.'
  },
  rolleFrage: {
    du: 'Wer bist du in diesem Tandem?',
    sie: 'Welche Rolle übernehmen Sie in diesem Tandem?'
  },
  taktHinweis: {
    du: 'Auf beiden Geräten muss dieselbe Zahl stehen. „Weiter“ schaltet nur dein eigenes Gerät.',
    sie: 'Auf beiden Geräten muss dieselbe Zahl stehen. „Weiter“ schaltet nur Ihr eigenes Gerät.'
  },
  partnerKarte: {
    du: 'Diese Nummer löst dein Gegenüber laut. Du hast die Lösung – hör zu, gib bei Bedarf den Tipp und sag am Ende, ob es gestimmt hat.',
    sie: 'Diese Nummer löst Ihr Gegenüber laut. Sie haben die Lösung – hören Sie zu, geben Sie bei Bedarf den Tipp und melden Sie am Ende zurück, ob es gestimmt hat.'
  },
  eigeneKarte: {
    du: 'Diese Nummer löst du laut. Die Lösung liegt bei deinem Gegenüber.',
    sie: 'Diese Nummer lösen Sie laut. Die Lösung liegt bei Ihrem Gegenüber.'
  },
  kontrolleFrage: {
    du: 'Was sagt dein Gegenüber?',
    sie: 'Was sagt Ihr Gegenüber?'
  },
  rolleWechselFrage: {
    du: 'Rolle wirklich wechseln? Deine bisherigen Eingaben in dieser Station bleiben erhalten.',
    sie: 'Rolle wirklich wechseln? Ihre bisherigen Eingaben in dieser Station bleiben erhalten.'
  },
  tandemFertig: {
    du: 'Alle Nummern sind durch. Räumt auf und schaut euch die Auswertung an.',
    sie: 'Alle Nummern sind durch. Sehen Sie sich zum Abschluss die Auswertung an.'
  },
  skalaTipp: {
    du: 'Tippe auf die Stelle der Linie, die passt.',
    sie: 'Tippen Sie auf die Stelle der Linie, die passt.'
  },
  loesungenGleich: {
    du: 'Die Lösungen zu # Aufgaben erscheinen, sobald du getippt hast.',
    sie: 'Die Lösungen zu # Aufgaben erscheinen, sobald Sie getippt haben.'
  },
  punkteFrage: { du: 'Wie viele Punkte hast du?', sie: 'Wie viele Punkte haben Sie?' },
  nichtBearbeitet: {
    du: 'Diese Aufgabe habe ich nicht bearbeitet',
    sie: 'Diese Aufgabe habe ich nicht bearbeitet'
  },
  legendeEigen: { du: 'Du löst laut', sie: 'Sie lösen laut' },
  legendePartner: { du: 'Du kontrollierst', sie: 'Sie kontrollieren' }
};

const KONTROLLEN = [
  { id: 'richtig', text: 'richtig', anteil: 1 },
  { id: 'tipp', text: 'mit Tipp richtig', anteil: 0.5 },
  { id: 'falsch', text: 'falsch', anteil: 0 }
];

const zahl = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });

let katalog = null;
let aktuell = null; // { stufe, themaId, thema, zustand }

/* ---------- kleine Helfer ---------- */

const $ = (sel, wurzel) => (wurzel || document).querySelector(sel);

function pkt(n) { return zahl.format(Math.round(n * 100) / 100); }

function anrede() {
  return aktuell && aktuell.thema && aktuell.thema.anrede === 'sie' ? 'sie' : 'du';
}

function t(schluessel) {
  const e = TEXTE[schluessel];
  return e ? (e[anrede()] || e.du) : '';
}

function grenze(x, min, max) { return Math.min(max, Math.max(min, x)); }

function meldung(text) {
  const el = $('#meldung');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(meldung._t);
  meldung._t = setTimeout(() => { el.hidden = true; }, 2600);
}

async function holeJSON(url) {
  const antwort = await fetch(url, { cache: 'no-cache' });
  if (!antwort.ok) throw new Error('HTTP ' + antwort.status + ' für ' + url);
  return antwort.json();
}

let letzterPfad = null;

/** Setzt den Seiteninhalt. Bei echtem Seitenwechsel wird gescrollt und der Fokus gesetzt,
    beim erneuten Zeichnen derselben Seite bleibt die Position erhalten. */
function zeichne(html) {
  const main = $('#inhalt');
  const wechsel = letzterPfad !== location.hash;
  main.innerHTML = html;
  if (wechsel) {
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }
  letzterPfad = location.hash;
}

function fehlerAnsicht(titel, details) {
  const dateiHinweis = location.protocol === 'file:'
    ? '<p class="hinweis hinweis-warn">Die Seite wurde direkt aus dem Dateisystem geöffnet. Browser blockieren dabei das Laden der Inhalte. Bitte einen kleinen Webserver starten, z.&nbsp;B. im Projektordner <code>python -m http.server 8000</code>, und dann <code>http://localhost:8000</code> aufrufen.</p>'
    : '';
  document.documentElement.dataset.fach = 'neutral';
  zeichne(
    '<div class="seite"><h1>' + esc(titel) + '</h1>' + dateiHinweis +
    '<p class="hinweis hinweis-warn">' + esc(details) + '</p>' +
    '<p><a class="btn" href="#/">Zurück zum Anfang</a></p></div>'
  );
}

/* ---------- Auswertungslogik ---------- */

function eintrag(z, id) {
  return z.aufgaben[id] || { bearbeitet: false, punkte: null, uebersprungen: false, kontrolle: null };
}

/** Stand einer Station: geöffnet, Lösungen freigeschaltet, Selbsteinschätzung. */
function stand(z, stationId) {
  return z.stationen[stationId] ||
    { geoeffnet: false, bereit: false, stufe: null, lage: null, rolle: null, schritt: 0 };
}

function standSchreiben(z, stationId) {
  if (!z.stationen[stationId]) {
    z.stationen[stationId] = { geoeffnet: true, bereit: false, stufe: null, lage: null, rolle: null, schritt: 0 };
  }
  return z.stationen[stationId];
}

/** Übersprungene Aufgaben zählen nirgends mit – weder im Zähler noch im Nenner. */
function zaehltMit(z, aufgabe) {
  return eintrag(z, aufgabe.id).uebersprungen !== true;
}

/** Checklistenpunkte, die schon unterrichtet sind – nur die lassen sich einschätzen. */
function aktiveCheckliste(thema) {
  return (thema.checkliste || []).filter((c) => c.spaeter !== true);
}

function istTandem(station) {
  return station.sozialform === 'tandem';
}

function rolleVon(station, z) {
  const s = z.stationen[station.id];
  return s && s.rolle ? s.rolle : null;
}

/** Aufgaben, die in die eigene Auswertung zählen.
    Bei Tandem sind das nur die Aufgaben der eigenen Rolle. */
function eigeneAufgaben(station, z) {
  if (!istTandem(station)) return station.aufgaben;
  const rolle = rolleVon(station, z);
  if (!rolle) return [];
  return station.aufgaben.filter((a) => (a.partner || 'A') === rolle);
}

function stationsWerte(station, z) {
  const aufgaben = eigeneAufgaben(station, z);
  const w = {
    max: 0, erreicht: 0,
    anzahl: aufgaben.length,   // alle Aufgaben der Station
    bearbeitet: 0,             // nicht übersprungene
    bewertet: 0,               // davon mit eingetragenen Punkten
    uebersprungen: 0
  };
  for (const a of aufgaben) {
    const e = eintrag(z, a.id);
    if (e.uebersprungen) { w.uebersprungen += 1; continue; }
    const maxA = Number(a.punkte) || 0;
    w.max += maxA;
    w.bearbeitet += 1;
    if (e.punkte !== null && e.punkte !== undefined) {
      w.erreicht += grenze(e.punkte, 0, maxA);
      w.bewertet += 1;
    }
  }
  return w;
}

function stationsStatus(station, z) {
  const w = stationsWerte(station, z);
  const s = stand(z, station.id);
  if (w.anzahl > 0 && s.stufe && w.bewertet === w.bearbeitet) return 'fertig';
  if (s.stufe || s.bereit || w.bewertet > 0 || w.uebersprungen > 0 || s.geoeffnet) return 'begonnen';
  return 'offen';
}

function gesamtWerteAufgaben(thema, z) {
  const alle = [];
  for (const st of thema.stationen) for (const a of eigeneAufgaben(st, z)) alle.push({ station: st, aufgabe: a });
  return alle;
}

/** Wahlstation empfohlen, wenn ein zugehöriger Punkt höchstens „mittel“ eingeschätzt wurde. */
/** Kategorie einer Station: "grundlagen", "vernetzen" oder "neu" (Standard, auch ohne Feld). */
function kategorieVon(station) {
  return station.kategorie === 'grundlagen' || station.kategorie === 'vernetzen' ? station.kategorie : 'neu';
}

/** Bezeichnung im Stationskopf. */
function stationsArt(station) {
  const k = kategorieVon(station);
  if (k === 'grundlagen') return 'Grundlagen';
  if (k === 'vernetzen') return 'Vernetzen';
  if (station.kategorie === 'neu') return 'Neue Themen';
  return station.typ === 'wahl' ? 'Wahlstation' : 'Pflichtstation';
}

function istEmpfohlen(station, z) {
  const refs = Array.isArray(station.checkliste) ? station.checkliste : [];
  return refs.some((id) => {
    const stufe = z.diagnose.eingang[id];
    return stufe && stufe <= 3;
  });
}

function gesamtWerte(thema, z) {
  const g = { max: 0, erreicht: 0, anzahl: 0, bearbeitet: 0, bewertet: 0, afb: {} };
  for (const { aufgabe: a } of gesamtWerteAufgaben(thema, z)) {
    g.anzahl += 1;
    if (!zaehltMit(z, a)) continue;           // übersprungen: zählt nirgends mit
    const maxA = Number(a.punkte) || 0;
    const afb = a.afb || '–';
    if (!g.afb[afb]) g.afb[afb] = { max: 0, erreicht: 0, bewertet: 0, anzahl: 0 };
    g.max += maxA;
    g.bearbeitet += 1;
    g.afb[afb].max += maxA;
    g.afb[afb].anzahl += 1;
    const e = eintrag(z, a.id);
    if (e.punkte !== null && e.punkte !== undefined) {
      const p = grenze(e.punkte, 0, maxA);
      g.erreicht += p;
      g.bewertet += 1;
      g.afb[afb].erreicht += p;
      g.afb[afb].bewertet += 1;
    }
  }
  return g;
}

/**
 * Kalibrierung je Station: die Selbsteinschätzung vor dem Lösungsvergleich
 * gegen die tatsächlich erreichte Quote derselben Station.
 * Wurde weniger als die Hälfte der Aufgaben bearbeitet, gibt es kein Urteil.
 */
function kalibrierung(thema, z) {
  const zeilen = [];
  for (const st of thema.stationen) {
    const s = stand(z, st.id);
    const w = stationsWerte(st, z);
    if (!s.stufe || w.bewertet === 0) continue;

    const quote = w.max > 0 ? w.erreicht / w.max : 0;
    const genug = w.anzahl > 0 && w.bearbeitet >= w.anzahl / 2;
    let urteil = 'zuwenig';
    if (genug) {
      urteil = 'passend';
      if (s.stufe >= 4 && quote < 0.5) urteil = 'ueberschaetzt';
      else if (s.stufe <= 2 && quote >= 0.8) urteil = 'unterschaetzt';
    }
    zeilen.push({ station: st, stufe: s.stufe, quote, werte: w, urteil });
  }
  return zeilen;
}

/* ---------- Bausteine ---------- */

function balken(anteil) {
  const p = grenze(Math.round(anteil * 100), 0, 100);
  return '<div class="balken" role="img" aria-label="' + p + " Prozent" + '"><i style="width:' + p + '%"></i></div>';
}

function balkenZeile(beschriftung, erreicht, max) {
  const anteil = max > 0 ? erreicht / max : 0;
  return '<div class="balken-zeile"><span>' + esc(beschriftung) + '</span>' + balken(anteil) +
    '<span class="wert">' + pkt(erreicht) + ' / ' + pkt(max) + '</span></div>';
}

/**
 * Farbverlauf mit Pinnadel. Angetippt wird irgendwo auf der Bahn; die fünf Bereiche
 * dahinter bleiben unsichtbar und tauchen erst im Vorher/Nachher-Vergleich auf.
 * Technisch ein Schieberegler – damit funktionieren Finger, Maus und Tastatur ohne Zutun.
 *
 * o = { feld, stufe, lage, frage, label, gesperrt }
 */
function skala(o) {
  const hatWert = o.stufe !== null && o.stufe !== undefined;
  const lage = hatWert ? (o.lage === null || o.lage === undefined ? lageAusStufe(o.stufe) : o.lage) : 50;
  const wort = hatWert ? stufenWort(o.stufe) : 'noch nicht eingeschätzt';

  return '<fieldset class="skala-gruppe" data-skalafeld="' + esc(o.feld) + '"' +
    (o.frage ? '' : ' aria-label="' + esc(o.label || 'Selbsteinschätzung') + '"') + '>' +
    (o.frage ? '<legend>' + esc(o.frage) + '</legend>' : '') +
    '<div class="skala-feld' + (hatWert ? '' : ' ist-leer') + (o.gesperrt ? ' ist-fest' : '') + '">' +
    '<span class="skala-rand stufe-1">' + gesicht(1) + '</span>' +
    '<span class="skala-bahn">' +
    '<input type="range" min="0" max="100" step="1" value="' + Math.round(lage) + '"' +
    ' data-skala="' + esc(o.feld) + '"' +
    (o.gesperrt ? ' disabled' : '') +
    ' aria-label="' + esc(o.frage || o.label || 'Selbsteinschätzung') + '"' +
    ' aria-valuetext="' + esc(wort) + '">' +
    '</span>' +
    '<span class="skala-rand stufe-5">' + gesicht(5) + '</span>' +
    '</div></fieldset>';
}

/** Gesicht mit Wort – für Tabellen und Rückblicke. */
function stufeZelle(stufe) {
  const n = Number(stufe);
  if (!n || !STUFEN.some((x) => x.n === n)) return '<span class="meta">–</span>';
  return '<span class="stufe-zelle">' + gesicht(n) +
    '<span class="stufe-wort">' + esc(stufenWort(n)) + '</span></span>';
}

function fachChip(fach) {
  const name = fach === 'mathe' ? 'Mathematik' : fach === 'physik' ? 'Physik' : fach || '';
  if (!name) return '';
  // Eigene Klasse je Fach: Auf der Startseite stehen mehrere Fächer nebeneinander,
  // dort gilt noch keine Themenfarbe.
  const klasse = fach === 'mathe' || fach === 'physik' ? ' chip-' + fach : '';
  return '<span class="chip chip-fach' + klasse + '">' + esc(name) + '</span>';
}

function statusChip(status) {
  if (status === 'fertig') return '<span class="chip chip-fertig">fertig</span>';
  if (status === 'begonnen') return '<span class="chip chip-begonnen">begonnen</span>';
  return '<span class="chip">offen</span>';
}

function sozialformText(s) {
  if (s === 'partner') return 'Partnerarbeit';
  if (s === 'gruppe') return 'Gruppenarbeit';
  if (s === 'tandem') return 'Tandem, zwei Geräte';
  return 'Einzelarbeit';
}

function themaPfad(stufe, thema) { return '#/t/' + encodeURIComponent(stufe) + '/' + encodeURIComponent(thema); }

/* ---------- Ansicht: Start ----------
   Gleicher Aufbau wie die Startseiten der anderen LMG-Plattformen (Simulationen,
   Spielesammlung): Klassenstufe → Fach → Thema. Alle Stufen stehen immer da;
   ohne Thema bleiben sie gedimmt. Die Stufen im Katalog werden über ihre ID
   zugeordnet, Groß-/Kleinschreibung egal („q1“ = „Q1“). */

const KLASSENSTUFEN = [
  { id: '5', zahl: '5', name: 'Klasse 5', gruppe: 'Sekundarstufe I' },
  { id: '6', zahl: '6', name: 'Klasse 6', gruppe: 'Sekundarstufe I' },
  { id: '7', zahl: '7', name: 'Klasse 7', gruppe: 'Sekundarstufe I' },
  { id: '8', zahl: '8', name: 'Klasse 8', gruppe: 'Sekundarstufe I' },
  { id: '9', zahl: '9', name: 'Klasse 9', gruppe: 'Sekundarstufe I' },
  { id: '10', zahl: '10', name: 'Klasse 10', gruppe: 'Sekundarstufe I' },
  { id: 'E', zahl: 'E', kurz: 'Einführung', name: 'Einführungs­phase', gruppe: 'Sekundarstufe II' },
  { id: 'Q1', zahl: 'Q1', kurz: 'Qualifikation', name: 'Qualifikations­phase 1', gruppe: 'Sekundarstufe II' },
  { id: 'Q2', zahl: 'Q2', kurz: 'Qualifikation', name: 'Qualifikations­phase 2', gruppe: 'Sekundarstufe II' }
];
const FAECHER = [
  { id: 'mathe', name: 'Mathematik', zeichen: '∫' },
  { id: 'physik', name: 'Physik', zeichen: 'λ' }
];
const START_MERK = 'lerntheke-start';
const PFEIL = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

let startWahl = null; // { stufe, fach } – Auswahl auf der Startseite

/** Alle Stufen der Startseite; Katalogstufen ohne feste Kachel kommen hinten dazu. */
function startStufen() {
  const liste = KLASSENSTUFEN.slice();
  for (const k of (katalog && katalog.stufen) || []) {
    const id = String(k.id);
    if (!liste.some((st) => st.id.toLowerCase() === id.toLowerCase())) {
      liste.push({ id, zahl: k.name || id, kurz: 'Kurs', name: k.name || id, gruppe: 'Weitere' });
    }
  }
  return liste;
}

/** Aktive Themen einer Stufe (optional nur eines Fachs), jeweils mit der Katalog-Stufe. */
function startThemen(stufeId, fach) {
  const treffer = [];
  for (const k of (katalog && katalog.stufen) || []) {
    if (String(k.id).toLowerCase() !== String(stufeId).toLowerCase()) continue;
    for (const th of k.themen || []) {
      if (th.aktiv === false) continue;
      if (fach && (th.fach || 'mathe') !== fach) continue;
      treffer.push({ stufe: k, thema: th });
    }
  }
  return treffer;
}

function themenAnzahl(n) { return n === 0 ? 'noch leer' : n === 1 ? '1 Thema' : n + ' Themen'; }
function ohneTrenner(text) { return String(text).replace(/­/g, ''); }

function startWahlLesen() {
  const q = new URLSearchParams(location.search);
  if (q.get('stufe')) return { stufe: q.get('stufe'), fach: q.get('fach') };
  try { return JSON.parse(localStorage.getItem(START_MERK)) || null; } catch (e) { return null; }
}

function startWahlMerken() {
  try { localStorage.setItem(START_MERK, JSON.stringify(startWahl)); } catch (e) { /* egal */ }
  try {
    const q = startWahl.stufe
      ? '?stufe=' + encodeURIComponent(startWahl.stufe) + (startWahl.fach ? '&fach=' + encodeURIComponent(startWahl.fach) : '')
      : location.pathname;
    history.replaceState(null, '', q + '#/');
  } catch (e) { /* egal */ }
}

function schrittHtml(nr, aktiv, letzter, frageId, frage, inhalt) {
  return '<section class="st-schritt' + (aktiv ? ' aktiv' : '') + '" id="schritt-' + nr + '" aria-labelledby="' + frageId + '">' +
    '<div class="st-leitung" aria-hidden="true"><span class="st-nr">' + nr + '</span>' +
    (letzter ? '' : '<span class="st-linie"></span>') + '</div>' +
    '<div class="st-inhalt"><h2 class="st-frage" id="' + frageId + '">' + esc(frage) + '</h2>' + inhalt + '</div>' +
    '</section>';
}

function ansichtStart(fokus) {
  document.documentElement.dataset.fach = 'neutral';
  document.body.classList.add('start');
  document.title = 'Lerntheke';

  if (startWahl === null) startWahl = startWahlLesen() || {};
  const stufen = startStufen();
  const stufe = stufen.find((st) => st.id === startWahl.stufe && startThemen(st.id).length);
  const fach = stufe && FAECHER.find((f) => f.id === startWahl.fach && startThemen(stufe.id, f.id).length);
  if (!stufe) startWahl = {};
  else if (!fach) startWahl = { stufe: stufe.id };

  let html = '<div class="st-seite">' +
    '<div class="st-kopf">' +
    '<div class="st-marke" aria-hidden="true"><i></i><i></i></div>' +
    '<div class="st-leiste"><div class="st-leiste-innen">' +
    '<span class="st-wortmarke">LMG</span><span class="st-trenner" aria-hidden="true"></span>' +
    '<span class="st-schule">Ludwig-Meyn-Gymnasium Uetersen</span></div></div>' +
    '<header class="st-held"><div class="st-held-innen">' +
    '<p class="st-kicker">Fachschaft Mathematik und Physik</p>' +
    '<h1 class="st-titel">Lerntheke</h1>' +
    '<p class="st-lead">Lerntheken und Trainingsphasen für Mathematik und Physik: Stationen bearbeiten, ' +
    'Lösungen freischalten und den eigenen Stand im Blick behalten. Wähle deine Klassenstufe, dein Fach und dein Thema.</p>' +
    '</div></header></div>' +
    '<div class="st-main">';

  const letztes = store.letztesThema();
  const kennt = letztes && findeThema(letztes.stufe, letztes.thema);
  if (kennt) {
    html += '<a class="st-weiter" href="' + themaPfad(letztes.stufe, letztes.thema) + '">' +
      '<span><span class="klein">Zuletzt geöffnet</span>' +
      '<span class="titel">' + esc(kennt.eintrag.name) + ' · ' + esc(kennt.stufe.name || kennt.stufe.id) + '</span></span>' +
      '<span class="pfeil">' + PFEIL + '</span></a>';
  }

  /* Schritt 1: Stufen */
  let kacheln = '', gruppe = null;
  for (const st of stufen) {
    if (st.gruppe !== gruppe) {
      if (gruppe !== null) kacheln += '</div></div>';
      gruppe = st.gruppe;
      kacheln += '<div><p class="st-gruppe">' + esc(gruppe) + '</p><div class="st-stufen">';
    }
    const n = startThemen(st.id).length;
    let punkte = '';
    for (const f of FAECHER) {
      if (startThemen(st.id, f.id).length) punkte += '<i style="background:var(--' + f.id + ')"></i>';
    }
    kacheln += '<button type="button" class="st-stufe" data-stufe="' + esc(st.id) + '"' +
      ' aria-pressed="' + Boolean(stufe && stufe.id === st.id) + '"' +
      (n ? '' : ' aria-disabled="true"') +
      ' aria-label="' + esc(ohneTrenner(st.name) + ', ' + themenAnzahl(n)) + '">' +
      '<span class="name">' + esc(st.kurz || 'Klasse') + '</span>' +
      '<span class="zahl">' + esc(st.zahl) + '</span>' +
      '<span class="anz">' + (punkte ? '<span class="punkte">' + punkte + '</span>' : '') +
      '<span>' + themenAnzahl(n) + '</span></span></button>';
  }
  if (gruppe !== null) kacheln += '</div></div>';
  html += schrittHtml(1, true, false, 'h-stufe', 'In welcher Klassenstufe bist du?',
    '<div class="st-gruppen">' + kacheln + '</div>');

  /* Schritt 2: Fach */
  let faecher = '<div class="st-platzhalter">Wähle zuerst deine Klassenstufe.</div>';
  if (stufe) {
    faecher = '<div class="st-faecher">';
    for (const f of FAECHER) {
      const n = startThemen(stufe.id, f.id).length;
      faecher += '<button type="button" class="st-fach fach-' + f.id + '" data-fach="' + f.id + '"' +
        ' aria-pressed="' + Boolean(fach && fach.id === f.id) + '"' + (n ? '' : ' aria-disabled="true"') + '>' +
        '<span class="symbol" aria-hidden="true">' + f.zeichen + '</span>' +
        '<span class="text"><span class="titel">' + f.name + '</span><span class="anz">' + themenAnzahl(n) + '</span></span>' +
        '<span class="pfeil">' + PFEIL + '</span></button>';
    }
    faecher += '</div>';
  }
  html += schrittHtml(2, Boolean(stufe), false, 'h-fach',
    stufe ? ohneTrenner(stufe.name) + ': Welches Fach?' : 'Welches Fach?', faecher);

  /* Schritt 3: Thema */
  let themen = '<div class="st-platzhalter">' + (stufe ? 'Wähle dein Fach.' : 'Danach erscheinen hier die Themen.') + '</div>';
  if (fach) {
    themen = '<div class="st-liste fach-' + fach.id + '">';
    for (const { stufe: k, thema: th } of startThemen(stufe.id, fach.id)) {
      themen += '<a class="st-eintrag" href="' + themaPfad(k.id, th.id) + '">' +
        '<span><span class="titel">' + esc(th.name || th.id) + '</span>' +
        (th.beschreibung ? '<span class="anz">' + esc(th.beschreibung) + '</span>' : '') + '</span>' +
        '<span class="pfeil">' + PFEIL + '</span></a>';
    }
    themen += '</div>';
  }
  html += schrittHtml(3, Boolean(fach), true, 'h-thema',
    fach ? fach.name + ' · ' + ohneTrenner(stufe.name) + ': Welches Thema?' : 'Welches Thema?', themen);

  if (store.speicherIstFluechtig()) {
    html += '<p class="hinweis hinweis-warn st-hinweis">Dieser Browser erlaubt kein dauerhaftes Speichern (z.&nbsp;B. privater Modus). Der Fortschritt geht beim Schließen des Tabs verloren.</p>';
  }

  html += '</div>' +
    '<footer class="st-fuss"><div class="st-fuss-innen"><span>Ludwig-Meyn-Gymnasium Uetersen</span>' +
    '<span>Alle Eingaben bleiben auf diesem Gerät. Es werden keine Daten übertragen.</span></div></footer>' +
    '</div>';

  zeichne(html);

  const main = $('#inhalt');
  main.querySelectorAll('.st-stufe:not([aria-disabled])').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.dataset.stufe;
      startWahl = startWahl.stufe === id ? {} : { stufe: id };
      startWahlMerken();
      ansichtStart({ sel: '.st-stufe[data-stufe="' + id + '"]', weiter: startWahl.stufe ? 'schritt-2' : null });
    });
  });
  main.querySelectorAll('.st-fach:not([aria-disabled])').forEach((b) => {
    b.addEventListener('click', () => {
      startWahl = { stufe: startWahl.stufe, fach: b.dataset.fach };
      startWahlMerken();
      ansichtStart({ sel: '.st-fach[data-fach="' + b.dataset.fach + '"]', weiter: 'schritt-3' });
    });
  });

  // Nach einem Klick den Fokus halten und den nächsten Schritt nur ins Bild holen,
  // wenn er unterhalb des sichtbaren Bereichs liegt.
  if (fokus) {
    const b = fokus.sel && main.querySelector(fokus.sel);
    if (b) b.focus({ preventScroll: true });
    const ziel = fokus.weiter && document.getElementById(fokus.weiter);
    if (ziel && ziel.getBoundingClientRect().top > window.innerHeight - 160) {
      const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      ziel.scrollIntoView({ behavior: ruhig ? 'auto' : 'smooth', block: 'start' });
    }
  }
}

function findeThema(stufeId, themaId) {
  for (const stufe of (katalog && katalog.stufen) || []) {
    for (const th of stufe.themen || []) {
      if (String(stufe.id) === String(stufeId) && String(th.id) === String(themaId)) {
        return { stufe, eintrag: th };
      }
    }
  }
  return null;
}

/* ---------- Thema laden ---------- */

async function themaLaden(stufeId, themaId) {
  if (aktuell && aktuell.stufe === stufeId && aktuell.themaId === themaId) {
    aktuell.zustand = store.laden(stufeId, themaId);
    return aktuell;
  }
  const treffer = findeThema(stufeId, themaId);
  if (!treffer) throw new Error('Das Thema steht nicht im Katalog.');
  const ordner = new URL(encodeURIComponent(stufeId) + '/' + encodeURIComponent(themaId) + '/', INHALTE);
  const thema = await holeJSON(new URL('thema.json', ordner));
  thema.stationen = Array.isArray(thema.stationen) ? thema.stationen : [];
  thema.checkliste = Array.isArray(thema.checkliste) ? thema.checkliste : [];
  for (const st of thema.stationen) st.aufgaben = Array.isArray(st.aufgaben) ? st.aufgaben : [];

  aktuell = {
    stufe: stufeId,
    themaId,
    ordner,
    thema,
    katalogEintrag: treffer.eintrag,
    stufeName: treffer.stufe.name || treffer.stufe.id,
    zustand: store.laden(stufeId, themaId)
  };
  store.merkeThema(stufeId, themaId, thema.titel || treffer.eintrag.name);
  return aktuell;
}

function kopfSetzen() {
  document.documentElement.dataset.fach = aktuell.thema.fach || 'neutral';
  document.title = (aktuell.thema.titel || 'Lerntheke') + ' – Lerntheke';
}

function speichereZustand() {
  store.speichern(aktuell.zustand);
}

function markdownZeile(text) {
  const html = markdown(text);
  return html.replace(/^<p>/, '').replace(/<\/p>$/, '');
}

function fachName(fach) {
  return fach === 'physik' ? 'Physik' : fach === 'mathe' ? 'Mathematik' : fach || '';
}

function uebersichtPfad() { return themaPfad(aktuell.stufe, aktuell.themaId); }
function stationsPfad(id) { return uebersichtPfad() + '/s/' + encodeURIComponent(id); }

/* ---------- Kopfband ----------
   Dunkler Kopf mit Verlauf aus der Fachfarbe in Tinte – wie die Startseiten der
   LMG-Plattformen, nur je Fach in einer Farbe (Tim, 17.11.2026).
   o = { unter, titel, rechts, lead, unten }                                  */

const ZURUECK = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
const WEITER = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
const FAHNE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21V4M4 4h12l-2 4 2 4H4"/></svg>';

function band(o) {
  const ort = esc(aktuell.stufeName) + ' ' + esc(fachName(aktuell.thema.fach));
  return '<header class="band"><div class="band-innen">' +
    '<div class="band-leiste">' +
    '<a class="band-marke" href="' + uebersichtPfad() + '"><span class="lmg" aria-hidden="true">LMG</span>' +
    '<span>Lerntheke · ' + ort + '</span></a>' +
    '<a class="band-link" href="#/">Thema wechseln</a></div>' +
    '<div class="band-held"><div class="band-text">' +
    (o.unter ? '<p class="band-unter">' + o.unter + '</p>' : '') +
    '<h1>' + o.titel + '</h1>' +
    (o.lead ? '<p class="band-lead">' + o.lead + '</p>' : '') +
    '</div>' + (o.rechts ? '<div class="band-rechts">' + o.rechts + '</div>' : '') + '</div>' +
    (o.unten || '') +
    '</div></header>';
}

/** Kompakter Kopf für Stationen: zurück, Kennung, Titel, rechts Arbeitsblatt oder Rolle. */
function stationsBand(station, rechts) {
  const unter = [
    esc(aktuell.thema.titel || ''),
    station.dauer_min ? esc(String(station.dauer_min)) + ' min' : '',
    esc(sozialformText(station.sozialform)),
    station.hilfsmittel ? esc(station.hilfsmittel) : ''
  ].filter(Boolean).join(' · ');
  return '<header class="band band-kompakt"><div class="band-innen">' +
    '<a class="band-zurueck" href="' + uebersichtPfad() + '" aria-label="Zur Stationsübersicht">' + ZURUECK + '</a>' +
    '<span class="kennung kat-' + katVon(station) + '">' + esc(station.id) + '</span>' +
    '<div class="band-text"><p class="band-unter">' + unter + '</p>' +
    '<h1>' + esc(station.titel || station.id) + '</h1></div>' +
    (rechts ? '<div class="band-rechts">' + rechts + '</div>' : '') +
    '</div></header>';
}

/** Kategorie für Farbe und Form der Kennung. Ohne Kategorien: Pflicht gefüllt, Wahl umrandet. */
function katVon(station) {
  if ('kategorie' in station) return kategorieVon(station);
  return station.typ === 'wahl' ? 'wahl' : 'pflicht';
}

/* ---------- Ansicht: Selbsteinschätzung (Eingang) ---------- */

function ansichtDiagnose() {
  kopfSetzen();
  const z = aktuell.zustand;
  const thema = aktuell.thema;
  const punkte = aktiveCheckliste(thema);
  const gesetzt = punkte.filter((c) => z.diagnose.eingang[c.id]).length;

  let html = band({
    unter: esc(thema.titel || ''),
    titel: 'Selbsteinschätzung',
    // Mit Kategorien gibt es keine Wahlstationen mehr (Tim, 16.11.2026)
    lead: esc(thema.stationen.some((s) => 'kategorie' in s)
      ? t('diagnoseIntro').replace('Wahlstationen', 'Stationen')
      : t('diagnoseIntro')),
    rechts: '<p class="band-zahl"><span>eingeschätzt</span><b id="ck-zaehler">' + gesetzt + '</b> von ' + punkte.length + '</p>'
  });
  html += '<div class="seite">';

  if (!punkte.length) {
    html += '<p class="hinweis">Für dieses Thema ist keine Checkliste hinterlegt.</p>';
  } else {
    html += '<p class="ck-legende" aria-hidden="true">' + gesicht(1) + 'unsicher<span class="ck-linie"></span>sicher' + gesicht(5) + '</p>';
  }

  // Gruppen nach den Phasen des Lernwegs; was keiner Phase angehört, kommt ans Ende.
  const phasen = Array.isArray(thema.phasen) ? thema.phasen : [];
  const vergeben = new Set();
  const gruppen = phasen.map((p, i) => {
    const liste = punkte.filter((c) => (p.checkliste || []).includes(c.id) && !vergeben.has(c.id));
    liste.forEach((c) => vergeben.add(c.id));
    return { nr: String(i + 1), name: p.name || p.id, unter: p.untertitel || '', punkte: liste };
  }).filter((g) => g.punkte.length);
  const rest = punkte.filter((c) => !vergeben.has(c.id));
  if (rest.length) gruppen.push({ nr: gruppen.length ? '+' : '', name: gruppen.length ? 'Weitere Punkte' : '', unter: '', punkte: rest });

  for (const g of gruppen) {
    html += '<section class="karte ck-gruppe">' +
      (g.name ? '<div class="ck-kopf"><span class="ck-nr">' + esc(g.nr) + '</span><h2>' + esc(g.name) + '</h2>' +
        (g.unter ? '<span class="meta">' + esc(g.unter) + '</span>' : '') + '</div>' : '') +
      g.punkte.map((c) => '<div class="ck-zeile"><p>' + markdownZeile(c.text) + '</p>' +
        skala({
          feld: 'eingang-' + c.id,
          stufe: z.diagnose.eingang[c.id],
          lage: z.diagnoseLage.eingang[c.id],
          label: c.text
        }).replace('<fieldset', '<fieldset data-diagnose="eingang" data-id="' + esc(c.id) + '"') +
        '</div>').join('') +
      '</section>';
  }

  html += '<div class="btn-reihe">' +
    '<a class="btn btn-primaer btn-gross-b" href="' + uebersichtPfad() + '">Weiter zu den Stationen</a>' +
    '<a class="btn btn-gross-b" href="' + uebersichtPfad() + '">Überspringen</a>' +
    '</div></div>';
  zeichne(html);
}

/* ---------- Ansicht: Stationsübersicht ---------- */

let filterWahl = 'alle';

function ansichtStationen() {
  kopfSetzen();
  const z = aktuell.zustand;
  const thema = aktuell.thema;
  const g = gesamtWerte(thema, z);
  const diagnoseGemacht = Object.keys(z.diagnose.eingang).length > 0;

  const grundlagen = thema.stationen.filter((s) => kategorieVon(s) === 'grundlagen');
  const vernetzen = thema.stationen.filter((s) => kategorieVon(s) === 'vernetzen');
  const neu = thema.stationen.filter((s) => kategorieVon(s) === 'neu');
  const mitKategorien = thema.stationen.some((s) => 'kategorie' in s);

  let html = band({
    unter: aktuell.katalogEintrag.beschreibung ? esc(aktuell.katalogEintrag.beschreibung) : '',
    titel: esc(thema.titel || aktuell.katalogEintrag.name),
    rechts: '<p class="band-zahl"><span>' + (anrede() === 'sie' ? 'Ihr' : 'Dein') + ' Stand</span><b>' + pkt(g.erreicht) +
      '</b> / ' + pkt(g.max) + ' P</p>',
    unten: lernpfad(thema, z)
  });

  html += '<div class="seite">';

  const naechste = naechsteStation(thema, z, mitKategorien ? grundlagen.concat(neu, vernetzen) : thema.stationen);
  if (naechste) html += naechsteKarte(naechste, z);

  if (thema.hinweis) html += '<p class="hinweis">' + markdownZeile(thema.hinweis) + '</p>';
  if (!diagnoseGemacht && aktiveCheckliste(thema).length) {
    html += '<p class="hinweis">Noch keine Selbsteinschätzung. Sie hilft dabei, die passenden ' +
      (mitKategorien ? 'Stationen' : 'Wahlstationen') + ' zu erkennen.</p>';
  }

  // Werkzeugleiste: Filter (nur mit Kategorien), Auswertung, Selbsteinschätzung
  const filter = mitKategorien
    ? '<div class="filter" role="group" aria-label="Stationen filtern">' +
      [['alle', 'Alle ' + thema.stationen.length], ['grundlagen', 'Grundlagen'], ['neu', 'Neue Themen'], ['vernetzen', 'Vernetzen']]
        .map(([id, text]) => '<button type="button" data-aktion="filter" data-wert="' + id + '" aria-pressed="' +
          (filterWahl === id) + '">' + text + '</button>').join('') + '</div>'
    : '<span></span>';
  html += '<div class="werkzeuge">' + filter + '<div class="btn-reihe">' +
    '<a class="btn" href="' + uebersichtPfad() + '/auswertung">' + symbol('ergebnis') + 'Auswertung</a>' +
    '<a class="btn" href="' + uebersichtPfad() + '/diagnose">' + (diagnoseGemacht ? 'Selbsteinschätzung ansehen' : 'Selbsteinschätzung') + '</a>' +
    '</div></div>';

  const abschnitt = (id, titel, erkl, stn) => stn.length
    ? '<section class="gruppe" data-gruppe="' + id + '"' + (filterWahl !== 'alle' && filterWahl !== id ? ' hidden' : '') + '>' +
      '<div class="gruppe-kopf"><h2>' + titel + '</h2>' + (erkl ? '<span>' + erkl + '</span>' : '') + '</div>' +
      '<ul class="karten">' + stn.map((s) => stationsKarte(s, z)).join('') + '</ul></section>'
    : '';

  if (mitKategorien) {
    // Mit Kategorien keine Trennung Pflicht/Wahl: alles ist prüfungsrelevant (Tim, 16.11.2026).
    html += abschnitt('grundlagen', 'Grundlagen', 'Vorwissen auffrischen – am besten vor den neuen Themen', grundlagen);
    html += abschnitt('neu', 'Neue Themen', 'in der Reihenfolge des Lernwegs', neu);
    html += abschnitt('vernetzen', 'Vernetzen', 'nach jeder Phase eine Aufgabe, die alles verbindet', vernetzen);
  } else {
    html += abschnitt('pflicht', 'Pflichtstationen', '', neu.filter((s) => s.typ !== 'wahl'));
    html += abschnitt('wahl', 'Wahlstationen', '', neu.filter((s) => s.typ === 'wahl'));
  }
  if (!thema.stationen.length) html += '<p class="hinweis">Dieses Thema enthält noch keine Stationen.</p>';

  const details = lernwegKarte(thema, z);
  if (details) {
    html += '<details class="lernweg-details"><summary>Was in den Phasen drankommt</summary>' + details + '</details>';
  }

  html += '</div>';
  zeichne(html);
}

/** Erste begonnene Station im Lernweg, sonst die erste offene. */
function naechsteStation(thema, z, reihenfolge) {
  return reihenfolge.find((s) => stationsStatus(s, z) === 'begonnen') ||
    reihenfolge.find((s) => stationsStatus(s, z) === 'offen') || null;
}

function naechsteKarte(station, z) {
  const status = stationsStatus(station, z);
  const s = stand(z, station.id);
  const w = stationsWerte(station, z);
  let zustand = 'noch nicht begonnen';
  if (status === 'begonnen') {
    if (istTandem(station)) zustand = 'begonnen';
    else if (!s.bereit && !s.stufe) zustand = 'geöffnet';
    else if (!s.stufe) zustand = 'Einschätzung fehlt noch';
    else zustand = 'noch ' + (w.bearbeitet - w.bewertet) + ' Aufgabe' + (w.bearbeitet - w.bewertet === 1 ? '' : 'n') + ' auswerten';
  }
  const meta = [zustand, station.dauer_min ? station.dauer_min + ' min' : '', station.hilfsmittel || '']
    .filter(Boolean).map(esc).join(' · ');
  return '<a class="naechste" href="' + stationsPfad(station.id) + '">' +
    '<span class="kennung kennung-gross kat-' + katVon(station) + '">' + esc(station.id) + '</span>' +
    '<span class="naechste-text"><span class="naechste-marke">Als Nächstes</span>' +
    '<span class="naechste-titel">' + esc(station.titel || '') + '</span>' +
    '<span class="meta">' + meta + '</span></span>' +
    '<span class="btn btn-primaer btn-gross-b">' + (status === 'begonnen' ? 'Fortsetzen' : 'Starten') + PFEIL + '</span></a>';
}

/* ---------- Lernpfad ----------
   Die Phasen stehen im thema.json. Sie ordnen die Kompetenzen der Checkliste
   zu Abschnitten. Im Kopf erscheinen sie als Pfad mit den Stationen je Phase;
   eine Phase gilt als erledigt, wenn alle ihre Stationen fertig sind. */

/** Phase, zu der eine Station gehört: entscheidend ist ihr erster Checklistenpunkt. */
function phaseVonStation(station, phasen) {
  const refs = station.checkliste || [];
  if (!refs.length) return null;
  const erste = phasen.find((p) => (p.checkliste || []).includes(refs[0]));
  if (erste) return erste;
  return phasen.find((p) => refs.some((r) => (p.checkliste || []).includes(r))) || null;
}

function stationenJePhase(thema) {
  const phasen = Array.isArray(thema.phasen) ? thema.phasen : [];
  const zuordnung = new Map(phasen.map((p) => [p.id, []]));
  for (const st of thema.stationen) {
    const p = phaseVonStation(st, phasen);
    if (p && zuordnung.has(p.id)) zuordnung.get(p.id).push(st);
  }
  return { phasen, zuordnung };
}

function lernpfad(thema, z) {
  const { phasen, zuordnung } = stationenJePhase(thema);
  if (!phasen.length) return '';

  const fertig = phasen.map((p) => {
    const stn = zuordnung.get(p.id) || [];
    return stn.length > 0 && stn.every((s) => stationsStatus(s, z) === 'fertig');
  });
  let jetzt = fertig.findIndex((f) => !f);
  if (jetzt < 0) jetzt = phasen.length;

  const n = phasen.length + (thema.abschluss ? 1 : 0);
  const knoten = phasen.map((p, i) => {
    const art = fertig[i] ? 'fertig' : i === jetzt ? 'jetzt' : 'offen';
    const stn = zuordnung.get(p.id) || [];
    return '<li class="pfad-phase pfad-' + art + '"' + (art === 'jetzt' ? ' aria-current="step"' : '') + '>' +
      '<span class="pfad-knoten">' + (art === 'fertig' ? symbol('haken') : (i + 1)) + '</span>' +
      '<span class="pfad-name">' + esc(p.name || p.id) + '</span>' +
      (stn.length ? '<span class="pfad-stationen">' + stn.map((s) => {
        const st = stationsStatus(s, z);
        return '<a href="' + stationsPfad(s.id) + '" class="pfad-st pfad-st-' + st + '" aria-label="' +
          esc(s.id + ' ' + (s.titel || '') + ', ' + st) + '">' + esc(s.id) + '</a>';
      }).join('') + '</span>' : '') +
      '</li>';
  }).join('') +
    (thema.abschluss
      ? '<li class="pfad-phase pfad-' + (jetzt >= phasen.length ? 'jetzt' : 'offen') + '"><span class="pfad-knoten">' + FAHNE + '</span>' +
        '<span class="pfad-name">' + esc(thema.abschluss) + '</span></li>'
      : '');

  const halb = 50 / n;
  const fortschritt = Math.min(jetzt, n - 1) * (100 / n);
  return '<nav class="pfad" aria-label="Lernweg"><ol style="--n:' + n + '">' +
    '<li class="pfad-linie" aria-hidden="true" style="left:' + halb + '%;right:' + halb + '%"></li>' +
    '<li class="pfad-linie pfad-linie-voll" aria-hidden="true" style="left:' + halb + '%;width:' + fortschritt + '%"></li>' +
    knoten + '</ol></nav>';
}

/** Ausführliche Phasen mit Kompetenzen – aufklappbar unter den Stationen. */
function lernwegKarte(thema, z) {
  const { phasen, zuordnung } = stationenJePhase(thema);
  if (!phasen.length) return '';

  const abschnitte = phasen.map((p, i) => {
    const stationen = zuordnung.get(p.id) || [];
    let max = 0;
    let erreicht = 0;
    for (const st of stationen) {
      const w = stationsWerte(st, z);
      max += w.max;
      erreicht += w.erreicht;
    }
    const punkte = (p.checkliste || [])
      .map((id) => thema.checkliste.find((c) => c.id === id))
      .filter(Boolean);

    return '<li class="phase">' +
      '<p class="phase-kopf"><span class="phase-nr">' + (i + 1) + '</span>' +
      '<span><span class="phase-name">' + esc(p.name || p.id) + '</span>' +
      (p.untertitel ? '<span class="phase-unter">' + esc(p.untertitel) + '</span>' : '') +
      '</span></p>' +
      '<ul class="phase-ziele">' + punkte.map((c) =>
        '<li' + (c.spaeter ? ' class="ist-spaeter"' : '') + '><span class="phase-punkt"></span>' +
        markdownZeile(c.text) +
        (c.spaeter ? '<span class="chip chip-spaeter">später</span>' : '') + '</li>'
      ).join('') + '</ul>' +
      (max > 0 ? balkenZeile('Punkte', erreicht, max) : '') +
      '</li>';
  }).join('');

  return '<ol class="lernweg">' + abschnitte + '</ol>';
}

function stationsKarte(station, z) {
  const w = stationsWerte(station, z);
  const status = stationsStatus(station, z);
  const empfohlen = (station.typ === 'wahl' || 'kategorie' in station) && istEmpfohlen(station, z);
  const rolle = rolleVon(station, z);
  const tandemOhneRolle = istTandem(station) && !rolle;
  const anteil = w.max > 0 ? Math.round((w.erreicht / w.max) * 100) : 0;

  return '<li><a class="s-karte" href="' + stationsPfad(station.id) + '">' +
    '<span class="s-kopf"><span class="kennung kat-' + katVon(station) + '">' + esc(station.id) + '</span>' +
    '<span class="s-marken">' +
    (empfohlen ? '<span class="chip chip-empf">' + symbol('empfohlen') + 'empfohlen</span>' : '') +
    statusChip(status) + '</span></span>' +
    '<span class="s-titel">' + esc(station.titel || '') + '</span>' +
    '<span class="meta meta-reihe">' +
    (station.dauer_min ? '<span>' + symbol('dauer') + esc(String(station.dauer_min)) + ' min</span>' : '') +
    '<span>' + sozialformSymbol(station.sozialform) + esc(sozialformText(station.sozialform)) + '</span>' +
    (station.hilfsmittel ? '<span>' + symbol('hilfsmittel') + esc(station.hilfsmittel) + '</span>' : '') +
    '</span>' +
    (station.bild ? '<img class="s-bild" src="' + esc(new URL(station.bild, aktuell.ordner).href) + '" alt="" decoding="async">' : '') +
    (tandemOhneRolle
      ? '<span class="s-fuss meta">' + station.aufgaben.length + ' Nummern zu zweit · Rolle noch nicht gewählt</span>'
      : '<span class="s-fuss"><span class="balken" aria-hidden="true"><i style="width:' + anteil + '%"></i></span>' +
        '<span class="s-punkte"><b>' + pkt(w.erreicht) + '</b> / ' + pkt(w.max) + ' P</span></span>') +
    '</a></li>';
}

/* ---------- Ansicht: Station ---------- */

function pdfAdresse(station) {
  return station.pdf ? new URL(station.pdf, aktuell.ordner).href : null;
}

function pdfKnoepfe(pdfURL) {
  return '<div class="btn-reihe">' +
    '<a class="btn btn-primaer" href="' + esc(pdfURL) + '" target="_blank" rel="noopener">' +
    symbol('arbeitsblatt') + 'Arbeitsblatt öffnen</a>' +
    '<a class="btn" href="' + esc(pdfURL) + '" download>Herunterladen</a>' +
    '</div>';
}

function bandPdf(pdfURL) {
  return '<a class="band-knopf" href="' + esc(pdfURL) + '" target="_blank" rel="noopener">' +
    symbol('arbeitsblatt') + 'Arbeitsblatt</a>';
}

/**
 * Arbeitsblatt im Kopf. Bei "pdf_optional": true erscheint der Knopf erst, wenn die Datei
 * wirklich existiert – Tandemstationen kommen ohne Papier aus.
 */
function pdfImBand(station) {
  const url = pdfAdresse(station);
  if (!url) return '';
  if (station.pdf_optional) {
    pruefePdfNach(url);
    return '<span id="pdf-platz"></span>';
  }
  return bandPdf(url);
}

function pruefePdfNach(pdfURL) {
  fetch(pdfURL, { method: 'HEAD' })
    .then((antwort) => {
      const platz = document.getElementById('pdf-platz');
      if (antwort.ok && platz) platz.innerHTML = bandPdf(pdfURL);
    })
    .catch(() => { /* ohne Datei bleibt der Bereich leer */ });
}

/** Ablauf einer Station in drei Schritten; aktiv ist 1, 2 oder 3. */
function ablaufLeiste(aktiv) {
  const schritte = ['Blatt bearbeiten', 'Einschätzen', 'Lösungen und Punkte'];
  return '<nav class="ablauf" aria-label="Ablauf der Station"><ol>' + schritte.map((text, i) => {
    const nr = i + 1;
    const art = nr < aktiv ? 'fertig' : nr === aktiv ? 'jetzt' : 'offen';
    return (i ? '<li class="ablauf-linie ablauf-linie-' + (nr <= aktiv ? 'fertig' : 'offen') + '" aria-hidden="true"></li>' : '') +
      '<li class="ablauf-schritt ablauf-' + art + '"' + (art === 'jetzt' ? ' aria-current="step"' : '') + '>' +
      '<span class="ablauf-nr">' + (art === 'fertig' ? symbol('haken') : nr) + '</span>' + text + '</li>';
  }).join('') + '</ol></nav>';
}

/** Darum geht es: die Checklistenpunkte der Station. */
function bezugHtml(station) {
  const bezug = (station.checkliste || [])
    .map((id) => (aktuell.thema.checkliste.find((c) => c.id === id) || {}).text)
    .filter(Boolean);
  return bezug.length
    ? '<p class="meta meta-bezug">Darum geht es: ' + bezug.map((b) => markdownZeile(b)).join(' · ') + '</p>'
    : '';
}

/** Seitenleiste vor den Lösungen: was auf dem Blatt steht. */
function blattListe(station) {
  if (!station.aufgaben.length) return '';
  return '<section class="karte"><p class="lbl">Auf dem Blatt</p><ul class="blatt-liste">' +
    station.aufgaben.map((a) => {
      const maxA = Number(a.punkte) || 0;
      return '<li><b>' + esc(a.label || a.id) + '</b><span class="chip">' + pkt(maxA) + ' P</span>' +
        (a.afb ? '<span class="chip">AFB ' + esc(a.afb) + '</span>' : '') + '</li>';
    }).join('') + '</ul></section>';
}

function ansichtStation(stationId) {
  kopfSetzen();
  const z = aktuell.zustand;
  const station = aktuell.thema.stationen.find((s) => String(s.id) === String(stationId));
  if (!station) {
    fehlerAnsicht('Station nicht gefunden', 'Die Station "' + stationId + '" steht nicht in thema.json.');
    return;
  }
  if (!z.stationen[station.id] || !z.stationen[station.id].geoeffnet) {
    standSchreiben(z, station.id).geoeffnet = true;
    speichereZustand();
  }

  if (istTandem(station)) { ansichtTandem(station); return; }

  const s = stand(z, station.id);
  const schritt = s.stufe ? 3 : s.bereit ? 2 : 1;
  const pdfURL = pdfAdresse(station);

  let html = stationsBand(station, pdfURL ? bandPdf(pdfURL) : '') + ablaufLeiste(schritt);
  html += '<div class="seite"><div class="zweispaltig">';

  if (schritt === 1) {
    html += '<section class="karte karte-gross"><p class="lbl lbl-fach">Schritt 1 von 3</p>' +
      '<h2>Blatt bearbeiten</h2><p>' + esc(t('stationVorher')) + '</p>' +
      (pdfURL ? pdfKnoepfe(pdfURL) : '<p class="hinweis hinweis-warn">Zu dieser Station ist kein Arbeitsblatt hinterlegt.</p>') +
      (station.hinweis ? '<p class="hinweis">' + markdownZeile(station.hinweis) + '</p>' : '') +
      bezugHtml(station) +
      '<div class="btn-reihe karte-fuss"><button type="button" class="btn btn-primaer btn-gross-b" ' +
      'data-aktion="freischalten" data-id="' + esc(station.id) + '">' +
      symbol('loesung') + esc(t('freischaltenBtn')) + '</button></div></section>' +
      '<aside class="seitenleiste">' + blattListe(station) + '</aside>';
  } else if (schritt === 2) {
    html += '<section class="karte karte-gross karte-fach station-einschaetzung"><p class="lbl lbl-fach">Schritt 2 von 3</p>' +
      '<h2 class="frage-gross">' + esc(t('stationFrage')) + '</h2>' +
      '<p>' + esc(t('stationFrageHinweis')) + '</p>' +
      '<div class="skala-gross">' +
      skala({ feld: 'station-' + station.id, stufe: null, lage: null, label: t('stationFrage') })
        .replace('<fieldset', '<fieldset data-stationskala="' + esc(station.id) + '"') +
      '<p class="meta skala-tipp">' + esc(t('skalaTipp')) + '</p></div>' +
      '<p class="karte-fuss meta">' + symbol('loesung') + esc(t('loesungenGleich').replace('#', String(station.aufgaben.length))) + '</p>' +
      '</section>' +
      '<aside class="seitenleiste">' +
      (station.hinweis ? '<section class="karte"><p class="lbl">Hinweis zur Station</p><p>' + markdownZeile(station.hinweis) + '</p></section>' : '') +
      blattListe(station) + '</aside>';
  } else {
    html = html.replace('<div class="seite"><div class="zweispaltig">', '');
    html += fokusAnsicht(station, z, s);
    zeichne(html);
    return;
  }

  html += '</div></div>';
  zeichne(html);
}

/** Nach dem Freischalten: eine Aufgabe nach der anderen (Tim, 17.11.2026). */
function fokusAnsicht(station, z, s) {
  const n = station.aufgaben.length;
  const w = stationsWerte(station, z);
  if (!n) return '<div class="seite"><p class="hinweis hinweis-warn">Diese Station enthält keine Aufgaben.</p></div>';
  const i = grenze(s.schritt || 0, 0, n - 1);
  const a = station.aufgaben[i];

  const leiste = '<nav class="aufgaben-leiste" aria-label="Aufgaben"><div class="aufgaben-leiste-innen">' +
    '<ol>' + station.aufgaben.map((x, k) => {
      const e = eintrag(z, x.id);
      const art = k === i ? 'jetzt' : e.uebersprungen ? 'weg' : (e.punkte !== null && e.punkte !== undefined) ? 'fertig' : 'offen';
      return '<li><button type="button" class="pille pille-' + art + '" data-aktion="takt-zu" data-wert="' + k + '"' +
        (k === i ? ' aria-current="step"' : '') + ' aria-label="Aufgabe ' + esc(x.label || x.id) +
        (art === 'fertig' ? ', ausgewertet' : art === 'weg' ? ', nicht bearbeitet' : '') + '">' +
        (art === 'fertig' ? symbol('haken') : '') + esc(x.label || x.id) + '</button></li>';
    }).join('') + '</ol>' +
    '<p class="aufgaben-stand" id="station-stand">' + standZeile(w) + '</p></div></nav>';

  const vor = i > 0 ? station.aufgaben[i - 1] : null;
  const nach = i < n - 1 ? station.aufgaben[i + 1] : null;
  const nav = '<div class="fokus-nav">' +
    (vor
      ? '<button type="button" class="btn btn-gross-b" data-aktion="takt-zurueck">' + ZURUECK + esc(vor.label || vor.id) + '</button>'
      : '<span></span>') +
    (nach
      ? '<button type="button" class="btn btn-primaer btn-gross-b" data-aktion="takt-weiter">Weiter zu ' + esc(nach.label || nach.id) + WEITER + '</button>'
      : '<a class="btn btn-primaer btn-gross-b" href="' + uebersichtPfad() + '">' + symbol('haken') + esc(t('stationFertigBtn')) + '</a>') +
    '</div>';

  const seite = '<aside class="seitenleiste">' +
    '<section class="karte station-einschaetzung"><h2 class="h-klein">' + esc(t('stationFrage')) + '</h2>' +
    skala({ feld: 'station-' + station.id, stufe: s.stufe, lage: s.lage, label: t('stationFrage') })
      .replace('<fieldset', '<fieldset data-stationskala="' + esc(station.id) + '"') +
    '<p class="meta">' + esc(t('stationFrageSpaeter')) + '</p></section>' +
    (station.hinweis ? '<section class="karte"><p class="lbl">Hinweis zur Station</p><p>' + markdownZeile(station.hinweis) + '</p></section>' : '') +
    '<a class="btn btn-voll" href="' + uebersichtPfad() + '/auswertung">' + symbol('ergebnis') + 'Auswertung</a>' +
    '</aside>';

  return leiste + '<div class="seite"><div class="zweispaltig">' +
    '<section class="karte karte-gross fokus">' + aufgabeFokus(a, z) + nav + '</section>' +
    seite + '</div></div>';
}

/** Eine Aufgabe mit Lösung, Punkten und dem Schalter „nicht bearbeitet“. */
function aufgabeFokus(a, z) {
  const e = eintrag(z, a.id);
  const maxA = Number(a.punkte) || 0;
  const uebersprungen = e.uebersprungen === true;
  const hatPunkte = e.punkte !== null && e.punkte !== undefined;

  let html = '<div class="aufgabe' + (uebersprungen ? ' ist-uebersprungen' : '') + '" id="a-' + esc(a.id) + '">' +
    '<div class="aufgabe-kopf"><h2>Aufgabe ' + esc(a.label || a.id) + '</h2>' +
    '<span class="chip">' + pkt(maxA) + ' ' + (maxA === 1 ? 'Punkt' : 'Punkte') + '</span>' +
    (a.afb ? '<span class="chip">AFB ' + esc(a.afb) + '</span>' : '') + '</div>' +
    '<div class="loesung"><p class="loesung-marke">' + symbol('loesung') + 'Lösung</p>' +
    (a.loesung ? markdown(a.loesung) : '<p>Für diese Aufgabe ist keine Lösung hinterlegt.</p>') +
    bildHtml(a) + '</div>';

  // Bis 4 Punkte Tasten in halben Punkten, darüber der Stepper (Tim, 17.11.2026).
  if (maxA > 0 && maxA <= 4) {
    const werte = [];
    for (let v = 0; v <= maxA + 1e-9; v += 0.5) werte.push(v);
    html += '<fieldset class="punkte-wahl"' + (uebersprungen ? ' disabled' : '') + '><legend>' + esc(t('punkteFrage')) + '</legend>' +
      '<div class="punkte-tasten" style="--n:' + werte.length + '">' + werte.map((v) => {
        const an = hatPunkte && !uebersprungen && Math.abs(grenze(e.punkte, 0, maxA) - v) < 1e-9;
        return '<button type="button" class="punkte-taste" data-aktion="punkte-setzen" data-id="' + esc(a.id) +
          '" data-wert="' + v + '" aria-pressed="' + an + '">' + pkt(v) + '</button>';
      }).join('') + '</div></fieldset>';
  } else {
    const wert = hatPunkte ? pkt(grenze(e.punkte, 0, maxA)) : '';
    html += '<div class="punkte-wahl"><p class="legende">' + esc(t('punkteFrage')) + '</p><div class="stepper">' +
      '<button type="button" class="btn" data-aktion="punkte-minus" data-id="' + esc(a.id) + '"' +
      (uebersprungen ? ' disabled' : '') + ' aria-label="Halben Punkt abziehen">−</button>' +
      '<input type="text" inputmode="decimal" value="' + esc(wert) + '" data-punkte="' + esc(a.id) + '"' +
      (uebersprungen ? ' disabled' : '') +
      ' aria-label="Erreichte Punkte für Aufgabe ' + esc(a.label || a.id) + ', maximal ' + pkt(maxA) + '">' +
      '<button type="button" class="btn" data-aktion="punkte-plus" data-id="' + esc(a.id) + '"' +
      (uebersprungen ? ' disabled' : '') + ' aria-label="Halben Punkt hinzufügen">+</button>' +
      '<span class="max">von ' + pkt(maxA) + '</span></div></div>';
  }

  html += '<label class="schalter"><input type="checkbox" data-uebersprungen="' + esc(a.id) + '"' +
    (uebersprungen ? ' checked' : '') + '><span>' + esc(t('nichtBearbeitet')) + '</span></label>';
  return html + '</div>';
}

/** „x von y Aufgaben ausgewertet“, übersprungene getrennt ausgewiesen. */
function aufgabenZeile(g) {
  const offen = g.anzahl - g.bearbeitet;
  return g.bewertet + ' von ' + g.bearbeitet + ' Aufgaben ausgewertet' +
    (offen > 0 ? ' · ' + offen + ' nicht bearbeitet' : '');
}

/** Zwischenstand einer Station als Satz. */
function standZeile(w) {
  return pkt(w.erreicht) + ' von ' + pkt(w.max) + ' Punkten eingetragen' +
    (w.uebersprungen > 0 ? ' · ' + w.bearbeitet + ' von ' + w.anzahl + ' Aufgaben bearbeitet' : '');
}

/* ---------- Ansicht: Tandemstation ----------
   Zwei Geräte, kein Papier: Beide sehen dieselbe Nummer. Wer die Aufgabe hat, löst laut;
   das Gegenüber sieht die Lösung, gibt bei Bedarf den Tipp und meldet zurück.
   Gekoppelt wird nichts – den Takt halten die beiden selbst über die große Nummer. */

function ansichtTandem(station) {
  const z = aktuell.zustand;
  const st = stand(z, station.id);
  const rolle = st.rolle;

  const rechts = pdfImBand(station) + (rolle
    ? '<span class="band-rolle">Partner ' + esc(rolle) +
      '<button type="button" data-aktion="rolle-wechseln">wechseln</button></span>'
    : '');
  let html = stationsBand(station, rechts);

  if (!rolle) {
    html += '<div class="seite"><section class="karte karte-gross"><h2>' + esc(t('rolleFrage')) + '</h2>' +
      '<p>' + esc(t('tandemIntro')) + '</p>' +
      '<div class="btn-reihe">' +
      '<button type="button" class="btn btn-primaer btn-gross" data-aktion="rolle" data-wert="A">Ich bin Partner A</button>' +
      '<button type="button" class="btn btn-primaer btn-gross" data-aktion="rolle" data-wert="B">Ich bin Partner B</button>' +
      '</div>' +
      '<p class="meta">Wichtig: Einigt euch vorher, wer A und wer B ist – sonst habt ihr beide dieselben Aufgaben.</p>' +
      '</section></div>';
    zeichne(html);
    return;
  }

  const anzahl = station.aufgaben.length;
  const schritt = grenze(st.schritt || 0, 0, Math.max(0, anzahl - 1));
  const a = station.aufgaben[schritt];
  const w = stationsWerte(station, z);

  html += '<section class="takt"><div class="takt-innen">' +
    '<p class="takt-zahl"><b aria-hidden="true">' + (schritt + 1) + '</b>' +
    '<span><strong>Nummer ' + (schritt + 1) + ' von ' + anzahl + '</strong><br>' + esc(t('taktHinweis')) + '</span></p>' +
    taktPunkte(station, z, rolle, schritt) +
    '<p class="takt-legende" aria-hidden="true"><span><i class="l-eigen"></i>' + esc(t('legendeEigen')) + '</span>' +
    '<span><i class="l-partner"></i>' + esc(t('legendePartner')) + '</span></p>' +
    '</div></section>';

  const eigen = a ? (a.partner || 'A') === rolle : false;
  let karte;
  if (!a) karte = '<p class="hinweis hinweis-warn">Diese Station enthält keine Aufgaben.</p>';
  else if (eigen) karte = tandemEigene(a, z, schritt);
  else karte = tandemKontrolle(a, schritt, rolle);

  const nav = '<div class="fokus-nav">' +
    '<button type="button" class="btn btn-gross-b" data-aktion="takt-zurueck"' + (schritt === 0 ? ' disabled' : '') + '>' +
    ZURUECK + 'Nummer ' + Math.max(1, schritt) + '</button>' +
    (schritt < anzahl - 1
      ? '<button type="button" class="btn btn-primaer btn-gross-b" data-aktion="takt-weiter">Weiter zu Nummer ' + (schritt + 2) + WEITER + '</button>'
      : '<a class="btn btn-primaer btn-gross-b" href="' + uebersichtPfad() + '/auswertung">Zur Auswertung' + WEITER + '</a>') +
    '</div>';

  let seite = '<aside class="seitenleiste">' +
    '<section class="karte"><p class="lbl">Eigene Punkte</p><p class="gross-zahl"><b>' + pkt(w.erreicht) + '</b> von ' + pkt(w.max) + '</p>' +
    '<p class="meta">Nur die Nummern, die Sie selbst lösen, zählen.</p></section>';
  if (schritt === anzahl - 1) {
    // Die Selbsteinschätzung wird bei Tandem einmal am Ende abgefragt.
    seite += '<section class="karte station-einschaetzung"><h2 class="h-klein">' + esc(t('stationFrage')) + '</h2>' +
      skala({ feld: 'station-' + station.id, stufe: st.stufe, lage: st.lage, label: t('stationFrage') })
        .replace('<fieldset', '<fieldset data-stationskala="' + esc(station.id) + '"') +
      '</section><p class="hinweis">' + esc(t('tandemFertig')) + '</p>';
  }
  seite += '</aside>';
  if (anrede() === 'du') seite = seite.replace('Nur die Nummern, die Sie selbst lösen, zählen.', 'Nur die Nummern, die du selbst löst, zählen.');

  html += '<div class="seite"><div class="zweispaltig">' +
    '<section class="karte karte-gross fokus' + (eigen ? ' karte-eigen' : ' karte-partner') + '">' + karte + nav + '</section>' +
    seite + '</div></div>';
  zeichne(html);
}

function taktPunkte(station, z, rolle, schritt) {
  return '<ol class="takt-punkte">' + station.aufgaben.map((a, i) => {
    const eigen = (a.partner || 'A') === rolle;
    const e = eintrag(z, a.id);
    const klassen = ['takt-punkt'];
    if (eigen) klassen.push('ist-eigen'); else klassen.push('ist-partner');
    if (i === schritt) klassen.push('ist-aktuell');
    if (eigen && e.kontrolle) klassen.push('ist-fertig');
    return '<li class="' + klassen.join(' ') + '">' +
      '<button type="button" data-aktion="takt-zu" data-wert="' + i + '"' +
      (i === schritt ? ' aria-current="step"' : '') +
      ' aria-label="Zu Nummer ' + (i + 1) + (eigen ? ' – eigene Aufgabe' : ' – Kontrollkarte') + '">' +
      (i + 1) + '</button></li>';
  }).join('') + '</ol>';
}

function tandemEigene(a, z, schritt) {
  const e = eintrag(z, a.id);
  const maxA = Number(a.punkte) || 0;

  let html = '<div class="aufgabe" id="a-' + esc(a.id) + '">' +
    '<div class="aufgabe-kopf"><span class="rolle-marke rolle-eigen">' + esc(t('legendeEigen')) + '</span>' +
    '<span class="chip">' + pkt(maxA) + ' ' + (maxA === 1 ? 'Punkt' : 'Punkte') + '</span>' +
    (a.afb ? '<span class="chip">AFB ' + esc(a.afb) + '</span>' : '') +
    '</div>' +
    '<p class="meta">' + esc(t('eigeneKarte')) + '</p>' +
    '<div class="aufgabentext">' + (a.aufgabe ? markdown(a.aufgabe) : '<p class="m-fehler">Für diese Nummer fehlt der Aufgabentext.</p>') + '</div>';

  if (!e.bearbeitet) {
    return html + '<div class="btn-reihe">' +
      '<button type="button" class="btn btn-primaer btn-gross-b" data-aktion="bearbeitet" data-id="' + esc(a.id) + '">Ich habe laut gelöst</button>' +
      '</div></div>';
  }

  html += '<fieldset class="punkte-wahl"><legend>' + esc(t('kontrolleFrage')) + '</legend>' +
    '<div class="punkte-tasten" style="--n:3">' +
    KONTROLLEN.map((k) => {
      const aktiv = e.kontrolle === k.id;
      return '<button type="button" class="punkte-taste kontroll-btn"' +
        ' data-aktion="kontrolle" data-id="' + esc(a.id) + '" data-wert="' + k.id + '"' +
        ' aria-pressed="' + (aktiv ? 'true' : 'false') + '">' +
        esc(k.text) + '<span class="kontroll-punkte">' + pkt(punkteFuerKontrolle(maxA, k.id)) + ' P</span></button>';
    }).join('') + '</div></fieldset>';

  if (e.kontrolle) {
    html += '<p class="meta">Eingetragen: ' + pkt(grenze(e.punkte || 0, 0, maxA)) + ' von ' + pkt(maxA) +
      ' Punkten. Korrigieren geht über die Knöpfe darüber.</p>' +
      '<div class="loesung"><p class="loesung-marke">' + symbol('loesung') + 'Lösung zum Nachlesen</p>' +
      (a.loesung ? markdown(a.loesung) : '<p>Für diese Aufgabe ist keine Lösung hinterlegt.</p>') +
      bildHtml(a) + '</div>';
  }

  return html + '</div>';
}

function tandemKontrolle(a, schritt, rolle) {
  const anderer = rolle === 'A' ? 'B' : 'A';
  return '<div class="aufgabe" id="a-' + esc(a.id) + '">' +
    '<div class="aufgabe-kopf"><span class="rolle-marke">' + esc(t('legendePartner')) + '</span>' +
    '<span class="chip">Kontrollkarte für Partner ' + esc(anderer) + ' · zählt nicht für die eigene Auswertung</span></div>' +
    '<p class="meta">' + esc(t('partnerKarte')) + '</p>' +
    '<div class="aufgabentext">' + (a.aufgabe ? markdown(a.aufgabe) : '<p class="m-fehler">Für diese Nummer fehlt der Aufgabentext.</p>') + '</div>' +
    '<div class="loesung"><p class="loesung-marke">' + symbol('loesung') + 'Lösung</p>' +
    (a.loesung ? markdown(a.loesung) : '<p>Für diese Aufgabe ist keine Lösung hinterlegt.</p>') +
    bildHtml(a) + '</div>' +
    (a.tipp
      ? '<details class="tipp"><summary>' + symbol('tipp') + 'Tipp geben</summary><div class="tipp-inhalt">' + markdown(a.tipp) + '</div></details>'
      : '<p class="meta">Für diese Nummer ist kein Tipp hinterlegt.</p>') +
    '</div>';
}

function bildHtml(a) {
  if (!a.loesung_bild) return '';
  const bild = new URL(a.loesung_bild, aktuell.ordner).href;
  // Bewusst ohne loading="lazy": Die Grafik erscheint ohnehin erst mit der Lösung,
  // und im Unterricht soll sie sofort da sein, statt erst beim Scrollen nachzuladen.
  return '<img src="' + esc(bild) + '" alt="Lösungsgrafik zu Aufgabe ' + esc(a.label || a.id) + '" decoding="async">';
}

function punkteFuerKontrolle(maxA, kontrolle) {
  const k = KONTROLLEN.find((x) => x.id === kontrolle);
  if (!k) return 0;
  return Math.round(maxA * k.anteil * 2) / 2;
}

/* ---------- Ansicht: Auswertung ---------- */

function ring(prozent) {
  const u = 2 * Math.PI * 60;
  const voll = Math.round((grenze(prozent, 0, 100) / 100) * u);
  return '<svg class="ring" viewBox="0 0 148 148" role="img" aria-label="' + prozent + ' Prozent der Punkte erreicht">' +
    '<circle cx="74" cy="74" r="60" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="16"/>' +
    (voll > 0 ? '<circle cx="74" cy="74" r="60" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" ' +
      'stroke-dasharray="' + voll + ' ' + Math.ceil(u) + '" transform="rotate(-90 74 74)"/>' : '') +
    '<text x="74" y="83" text-anchor="middle" font-size="28" font-weight="800" fill="#fff">' + prozent + ' %</text></svg>';
}

function ansichtAuswertung() {
  kopfSetzen();
  const z = aktuell.zustand;
  const thema = aktuell.thema;
  const g = gesamtWerte(thema, z);
  const prozent = g.max > 0 ? Math.round((g.erreicht / g.max) * 100) : 0;

  // Punkte je Kategorie als kleine Marken im Kopf
  let marken = '';
  if (thema.stationen.some((s) => 'kategorie' in s)) {
    marken = '<p class="band-marken">' + [['grundlagen', 'Grundlagen'], ['neu', 'Neue Themen'], ['vernetzen', 'Vernetzen']].map(([k, name]) => {
      let e = 0, m = 0;
      for (const st of thema.stationen.filter((s) => kategorieVon(s) === k)) {
        const w = stationsWerte(st, z); e += w.erreicht; m += w.max;
      }
      return m > 0 ? '<span>' + name + ' ' + pkt(e) + ' / ' + pkt(m) + '</span>' : '';
    }).join('') + '</p>';
  }

  let html = band({
    unter: esc(thema.titel || '') + (z.name ? ' · ' + esc(z.name) : ''),
    titel: 'Auswertung',
    lead: pkt(g.erreicht) + ' von ' + pkt(g.max) + ' Punkten · ' + aufgabenZeile(g),
    rechts: ring(prozent),
    unten: marken
  });

  html += '<div class="seite"><div class="auswertung">';
  html += kalibrierungsKarte(thema, z);

  html += '<section class="karte"><h2>Nach Stationen</h2>';
  for (const st of thema.stationen) {
    const w = stationsWerte(st, z);
    html += balkenZeile(st.id, w.erreicht, w.max);
  }
  html += '</section><div class="auswertung-rechts">';

  const afbSchluessel = Object.keys(g.afb).sort();
  if (afbSchluessel.length) {
    html += '<section class="karte"><h2>Nach Anforderungsbereich</h2>';
    for (const k of afbSchluessel) {
      html += balkenZeile('AFB ' + k, g.afb[k].erreicht, g.afb[k].max);
    }
    html += '</section>';
  }

  html += ausgangsKarte(thema, z);
  html += zusammenfassungsKarte(thema, z);
  html += sicherungsKarte();
  html += '</div></div></div>';

  zeichne(html);
}

const URTEILE = {
  ueberschaetzt: 'überschätzt',
  unterschaetzt: 'unterschätzt',
  passend: 'gut eingeschätzt',
  zuwenig: 'zu wenig bearbeitet'
};

function kalibrierungsKarte(thema, z) {
  const zeilen = kalibrierung(thema, z);
  let html = '<section class="karte karte-breit"><h2>Einschätzung und Ergebnis</h2>';
  if (!zeilen.length) {
    return html + '<p class="meta">Sobald eine Station eingeschätzt und bepunktet ist, ' +
      'erscheint hier der Vergleich.</p></section>';
  }

  const ueber = zeilen.filter((r) => r.urteil === 'ueberschaetzt');
  const unter = zeilen.filter((r) => r.urteil === 'unterschaetzt');
  const passend = zeilen.filter((r) => r.urteil === 'passend');

  const saetze = [];
  if (ueber.length) saetze.push(t('ueberschaetzt'));
  if (unter.length) saetze.push(t('unterschaetzt'));
  if (!saetze.length && passend.length) saetze.push(t('passend'));
  html += saetze.map((x) => '<p>' + esc(x) + '</p>').join('');

  html += '<div class="kalib" role="table" aria-label="Einschätzung und Ergebnis je Station">' +
    '<div class="kalib-zeile kalib-kopf" role="row"><span role="columnheader">Station</span><span role="columnheader">Einschätzung</span>' +
    '<span role="columnheader">Punkte</span><span role="columnheader">Urteil</span></div>' +
    zeilen.map((r) => {
      const prozent = Math.round(r.quote * 100);
      const s = stand(z, r.station.id);
      const lage = s.lage === null || s.lage === undefined ? lageAusStufe(r.stufe) : s.lage;
      return '<div class="kalib-zeile urteil-' + r.urteil + '" role="row">' +
        '<span class="kalib-station" role="cell"><b>' + esc(r.station.id) + '</b> · ' + esc(r.station.titel || '') +
        (r.werte.bearbeitet < r.werte.anzahl
          ? '<span class="kalib-hinweis">' + r.werte.bearbeitet + ' von ' + r.werte.anzahl + ' Aufgaben bearbeitet</span>'
          : '') + '</span>' +
        '<span role="cell" class="kalib-lage" aria-label="' + esc(stufenWort(r.stufe)) + '"><span class="mini-skala"><i style="left:' + Math.round(lage) + '%"></i></span></span>' +
        '<span class="kalib-quote" role="cell">' + (r.urteil === 'zuwenig' ? '–' : prozent + ' %') + '</span>' +
        '<span role="cell"><span class="urteil">' + esc(URTEILE[r.urteil]) + '</span></span>' +
        '</div>';
    }).join('') + '</div>';

  return html + '</section>';
}

function ausgangsKarte(thema, z) {
  const punkte = aktiveCheckliste(thema);
  if (!punkte.length) return '';
  let html = '<section class="karte"><h2>Selbsteinschätzung danach</h2>';
  for (const c of punkte) {
    html += '<div class="ausgang-punkt"><p class="ausgang-text">' + markdownZeile(c.text) + '</p>' +
      skala({
        feld: 'ausgang-' + c.id,
        stufe: z.diagnose.ausgang[c.id],
        lage: z.diagnoseLage.ausgang[c.id],
        label: 'Einschätzung: ' + c.text
      }).replace('<fieldset', '<fieldset data-diagnose="ausgang" data-id="' + esc(c.id) + '"') +
      '</div>';
  }

  html += '<h3>Vorher / Nachher</h3><div class="tab-umbruch"><table class="tab"><thead><tr>' +
    '<th>Kompetenz</th><th>vorher</th><th>nachher</th></tr></thead><tbody>';
  for (const c of punkte) {
    html += '<tr><td>' + markdownZeile(c.text) + '</td>' +
      '<td data-vorher="' + esc(c.id) + '">' + stufeZelle(z.diagnose.eingang[c.id]) + '</td>' +
      '<td data-nachher="' + esc(c.id) + '">' + stufeZelle(z.diagnose.ausgang[c.id]) + '</td></tr>';
  }
  return html + '</tbody></table></div></section>';
}

function zusammenfassungsKarte(thema, z) {
  return '<section class="karte"><h2>Zusammenfassung</h2>' +
    '<label class="feld nicht-drucken"><span>' + esc(t('nameLabel')) + '</span>' +
    '<input type="text" value="' + esc(z.name || '') + '" data-name autocomplete="off" maxlength="80"></label>' +
    '<p class="meta">Für Screenshot oder Abgabe: Diese Seite lässt sich als Ganzes drucken oder als PDF sichern.</p>' +
    '<div class="btn-reihe nicht-drucken"><button type="button" class="btn" data-aktion="drucken">Drucken / als PDF sichern</button></div>' +
    '</section>';
}

function sicherungsKarte() {
  return '<section class="karte nicht-drucken"><h2>Sicherung</h2>' +
    '<p class="meta">Der Fortschritt liegt nur in diesem Browser. Vor dem Wechsel des Geräts oder dem Löschen der Browserdaten hilft ein Export.</p>' +
    '<div class="btn-reihe">' +
    '<button type="button" class="btn" data-aktion="export">Als Datei exportieren</button>' +
    '<button type="button" class="btn" data-aktion="import">Datei importieren</button>' +
    '<button type="button" class="btn btn-schlicht" data-aktion="reset">Fortschritt zurücksetzen</button>' +
    '</div>' +
    '<input type="file" accept="application/json,.json" data-importfeld hidden>' +
    '</section>';
}

/* ---------- Aktionen ---------- */

function setzePunkte(id, wert) {
  const a = findeAufgabe(id);
  if (!a) return;
  const maxA = Number(a.punkte) || 0;
  const z = aktuell.zustand;
  const e = z.aufgaben[id] || (z.aufgaben[id] = { bearbeitet: true, smiley: null, punkte: null });
  e.punkte = wert === null ? null : grenze(Math.round(wert * 2) / 2, 0, maxA);
  speichereZustand();
}

/**
 * Übernimmt die Position der Nadel: Stufe 1 bis 5 plus die genaue Lage,
 * damit die Nadel später wieder dort steht, wo sie gesetzt wurde.
 */
function uebernimmSkala(regler) {
  const lage = grenze(Number(regler.value), 0, 100);
  const stufe = stufeAusLage(lage);
  const feld = regler.closest('.skala-feld');
  if (feld) feld.classList.remove('ist-leer');
  regler.setAttribute('aria-valuetext', stufenWort(stufe));

  const gruppeStation = regler.closest('[data-stationskala]');
  if (gruppeStation) {
    const sid = gruppeStation.dataset.stationskala;
    const st = standSchreiben(aktuell.zustand, sid);
    const neu = !st.stufe;          // erste Einschätzung schaltet die Lösungen frei
    st.stufe = stufe;
    st.lage = lage;
    st.bereit = true;
    speichereZustand();
    if (neu) {
      route().then(() => {
        const ziel = document.getElementById('station-stand');
        if (ziel) ziel.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    }
    return;
  }

  const gruppeAufgabe = regler.closest('[data-stufe]');
  if (gruppeAufgabe) {
    const id = gruppeAufgabe.dataset.stufe;
    const z = aktuell.zustand;
    const e = z.aufgaben[id] ||
      (z.aufgaben[id] = { bearbeitet: true, stufe: null, lage: null, punkte: null, kontrolle: null });
    if (e.stufe) return;   // einmal gesetzt, bleibt die Einschätzung stehen
    e.stufe = stufe;
    e.lage = lage;
    speichereZustand();
    route().then(() => {
      const karte = document.getElementById('a-' + id);
      if (karte) karte.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
    return;
  }

  const gruppeDiagnose = regler.closest('[data-diagnose]');
  if (gruppeDiagnose) {
    const phase = gruppeDiagnose.dataset.diagnose;
    const punktId = gruppeDiagnose.dataset.id;
    aktuell.zustand.diagnose[phase][punktId] = stufe;
    aktuell.zustand.diagnoseLage[phase][punktId] = lage;
    speichereZustand();
    // Die Vorher/Nachher-Tabelle steht auf derselben Seite und zieht sofort mit.
    const spalte = phase === 'eingang' ? 'vorher' : 'nachher';
    const zelle = document.querySelector('[data-' + spalte + '="' + punktId + '"]');
    if (zelle) zelle.innerHTML = stufeZelle(stufe);
    const zaehler = document.getElementById('ck-zaehler');
    if (zaehler && phase === 'eingang') {
      const ids = new Set(aktiveCheckliste(aktuell.thema).map((c) => c.id));
      zaehler.textContent = Object.keys(aktuell.zustand.diagnose.eingang).filter((k) => ids.has(k)).length;
    }
  }
}

/** Stations-ID aus der aktuellen Adresse, z. B. #/t/q1/thema/s/T1 → "T1". */
function stationAusPfad() {
  const teile = pfadTeile();
  return teile[3] === 's' && teile[4] ? teile[4] : null;
}

function findeAufgabe(id) {
  for (const st of aktuell.thema.stationen) {
    const a = st.aufgaben.find((x) => String(x.id) === String(id));
    if (a) return a;
  }
  return null;
}

function aktuellePunkte(id) {
  const e = eintrag(aktuell.zustand, id);
  return e.punkte === null || e.punkte === undefined ? 0 : e.punkte;
}

function exportieren() {
  const daten = store.exportDaten(aktuell.zustand, aktuell.thema.titel);
  const blob = new Blob([JSON.stringify(daten, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const datum = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = 'lerntheke_' + aktuell.stufe + '_' + aktuell.themaId + '_' + datum + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  meldung('Datei wurde erstellt.');
}

function importieren(datei) {
  const leser = new FileReader();
  leser.onload = () => {
    const erg = store.importDaten(String(leser.result), aktuell.stufe, aktuell.themaId);
    if (!erg.ok) { meldung(erg.fehler); return; }
    if (!window.confirm('Der gespeicherte Fortschritt zu diesem Thema wird durch die Datei ersetzt. Fortfahren?')) return;
    aktuell.zustand = erg.zustand;
    speichereZustand();
    meldung('Fortschritt übernommen.');
    route();
  };
  leser.onerror = () => meldung('Die Datei konnte nicht gelesen werden.');
  leser.readAsText(datei);
}

/* ---------- Ereignisse ---------- */

function aktionenVerdrahten() {
  const main = $('#inhalt');

  main.addEventListener('click', (ev) => {
    // Tippt jemand genau auf die verborgene Nadel, ändert sich der Wert nicht
    // und es gibt kein input-Ereignis. Dieser Klick setzt sie trotzdem.
    const leereSkala = ev.target.closest('.skala-feld.ist-leer');
    if (leereSkala) {
      const regler = leereSkala.querySelector('[data-skala]');
      if (regler && !regler.disabled) { uebernimmSkala(regler); return; }
    }

    const el = ev.target.closest('[data-aktion]');
    if (!el) return;
    const aktion = el.dataset.aktion;
    const id = el.dataset.id;

    if (aktion === 'bearbeitet') {
      const z = aktuell.zustand;
      const e = z.aufgaben[id] || (z.aufgaben[id] = { bearbeitet: false, smiley: null, punkte: null });
      e.bearbeitet = true;
      speichereZustand();
      route().then(() => {
        const karte = document.getElementById('a-' + id);
        if (!karte) return;
        const ersterRadio = karte.querySelector('input[type="radio"]');
        if (ersterRadio) ersterRadio.focus({ preventScroll: true });
        karte.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      return;
    }

    if (aktion === 'punkte-plus' || aktion === 'punkte-minus') {
      const schritt = aktion === 'punkte-plus' ? 0.5 : -0.5;
      setzePunkte(id, aktuellePunkte(id) + schritt);
      route();
      return;
    }

    if (aktion === 'punkte-setzen') {
      setzePunkte(id, Number(el.dataset.wert));
      route();
      return;
    }

    if (aktion === 'filter') {
      // Nur ein- und ausblenden, ohne neu zu zeichnen
      filterWahl = el.dataset.wert || 'alle';
      main.querySelectorAll('[data-aktion="filter"]').forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.wert === filterWahl)));
      main.querySelectorAll('[data-gruppe]').forEach((g) => {
        g.hidden = filterWahl !== 'alle' && g.dataset.gruppe !== filterWahl;
      });
      return;
    }

    if (aktion === 'freischalten') {
      const st = standSchreiben(aktuell.zustand, id);
      st.bereit = true;
      speichereZustand();
      route().then(() => {
        const feld = document.querySelector('[data-stationskala] input[type="range"]');
        if (feld) feld.focus({ preventScroll: true });
        const karte = document.querySelector('.station-einschaetzung');
        if (karte) karte.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      return;
    }

    if (aktion === 'rolle' || aktion === 'rolle-wechseln') {
      const sid = stationAusPfad();
      if (!sid) return;
      if (aktion === 'rolle-wechseln' && !window.confirm(t('rolleWechselFrage'))) return;
      const st = standSchreiben(aktuell.zustand, sid);
      st.rolle = aktion === 'rolle' ? el.dataset.wert : null;
      speichereZustand();
      route();
      return;
    }

    if (aktion === 'takt-weiter' || aktion === 'takt-zurueck' || aktion === 'takt-zu') {
      const sid = stationAusPfad();
      const station = sid && aktuell.thema.stationen.find((s) => String(s.id) === sid);
      if (!station) return;
      const st = standSchreiben(aktuell.zustand, sid);
      const letzte = Math.max(0, station.aufgaben.length - 1);
      const jetzt = grenze(st.schritt || 0, 0, letzte);
      const ziel = aktion === 'takt-zu' ? Number(el.dataset.wert)
        : aktion === 'takt-weiter' ? jetzt + 1 : jetzt - 1;
      st.schritt = grenze(isFinite(ziel) ? ziel : 0, 0, letzte);
      speichereZustand();
      route().then(() => {
        // Nur zurückscrollen, wenn die Aufgabe oben aus dem Bild gerutscht ist
        const ziel = document.querySelector('.fokus');
        if (ziel && ziel.getBoundingClientRect().top < 0) {
          const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          ziel.scrollIntoView({ block: 'start', behavior: ruhig ? 'auto' : 'smooth' });
        }
      });
      return;
    }

    if (aktion === 'kontrolle') {
      const a = findeAufgabe(id);
      if (!a) return;
      const z = aktuell.zustand;
      const e = z.aufgaben[id] || (z.aufgaben[id] = { bearbeitet: true, smiley: null, punkte: null, kontrolle: null });
      e.kontrolle = el.dataset.wert;
      e.punkte = punkteFuerKontrolle(Number(a.punkte) || 0, e.kontrolle);
      speichereZustand();
      route();
      return;
    }

    if (aktion === 'drucken') { window.print(); return; }
    if (aktion === 'export') { exportieren(); return; }
    if (aktion === 'import') { main.querySelector('[data-importfeld]').click(); return; }
    if (aktion === 'reset') {
      if (!window.confirm(t('resetFrage'))) return;
      store.zuruecksetzen(aktuell.stufe, aktuell.themaId);
      aktuell.zustand = store.laden(aktuell.stufe, aktuell.themaId);
      meldung('Fortschritt wurde zurückgesetzt.');
      location.hash = themaPfad(aktuell.stufe, aktuell.themaId);
      route();
    }
  });

  main.addEventListener('change', (ev) => {
    const ziel = ev.target;

    if (ziel.matches('[data-importfeld]')) {
      if (ziel.files && ziel.files[0]) importieren(ziel.files[0]);
      ziel.value = '';
      return;
    }

    if (ziel.matches('[data-skala]')) { uebernimmSkala(ziel); return; }

    if (ziel.matches('[data-uebersprungen]')) {
      const id = ziel.dataset.uebersprungen;
      const z = aktuell.zustand;
      const e = z.aufgaben[id] ||
        (z.aufgaben[id] = { bearbeitet: false, punkte: null, uebersprungen: false, kontrolle: null });
      e.uebersprungen = ziel.checked;
      if (ziel.checked) e.punkte = null;      // übersprungen heißt: keine Punkte
      speichereZustand();
      route();
      return;
    }

    if (ziel.matches('[data-punkte]')) {
      const id = ziel.dataset.punkte;
      const roh = ziel.value.trim().replace(',', '.');
      if (roh === '') { setzePunkte(id, null); route(); return; }
      const n = Number(roh);
      if (!isFinite(n)) { meldung('Bitte eine Zahl eintragen.'); ziel.value = ''; return; }
      setzePunkte(id, n);
      route();
    }
  });

  main.addEventListener('input', (ev) => {
    if (ev.target.matches('[data-name]')) {
      aktuell.zustand.name = ev.target.value.slice(0, 80);
      speichereZustand();
      return;
    }
    if (ev.target.matches('[data-skala]')) {
      // Beim Ziehen nur die Nadel zeigen; gespeichert wird erst beim Loslassen.
      const feld = ev.target.closest('.skala-feld');
      if (feld) feld.classList.remove('ist-leer');
      ev.target.setAttribute('aria-valuetext', stufenWort(stufeAusLage(Number(ev.target.value))));
    }
  });
}

/* ---------- Router ---------- */

function pfadTeile() {
  const h = location.hash.replace(/^#\/?/, '');
  return h.split('/').filter((x) => x !== '').map(decodeURIComponent);
}

async function route() {
  const teile = pfadTeile();
  document.body.classList.remove('start');
  try {
    if (!katalog) katalog = await holeJSON(new URL('katalog.json', INHALTE));

    if (teile[0] !== 't') { ansichtStart(); return; }

    const [, stufe, thema, unter, wert] = teile;
    if (!stufe || !thema) { ansichtStart(); return; }

    await themaLaden(stufe, thema);

    if (unter === 'diagnose') ansichtDiagnose();
    else if (unter === 'auswertung') ansichtAuswertung();
    else if (unter === 's' && wert) ansichtStation(wert);
    else ansichtStationen();
  } catch (e) {
    console.error(e);
    fehlerAnsicht('Inhalt konnte nicht geladen werden', e && e.message ? e.message : String(e));
  }
}

/* ---------- Start ---------- */

async function start() {
  aktionenVerdrahten();
  window.addEventListener('hashchange', route);
  try {
    await mathematikVorbereiten();
  } catch (e) { /* Ersatzdarstellung genügt */ }
  await route();
}

start();
