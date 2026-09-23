/* Lerntheke – Ablaufsteuerung und Ansichten
   Reines Vanilla-JS (ES-Module), kein Build-Schritt, keine externen Adressen. */

import * as store from './store.js';
import { markdown, esc, mathematikVorbereiten } from './render.js';
import { symbol, sozialformSymbol, gesicht, skalaPunkt } from './icons.js';

const BASIS = new URL('../', import.meta.url);
const INHALTE = new URL('inhalte/', BASIS);

const SMILEYS = [
  { id: 'unsicher', wort: 'unsicher' },
  { id: 'teils', wort: 'teils' },
  { id: 'sicher', wort: 'sicher' }
];

const TEXTE = {
  diagnoseIntro: {
    du: 'Schätze zuerst ein, wie sicher du dich bei den folgenden Punkten fühlst. Danach siehst du, welche Wahlstationen für dich besonders sinnvoll sind.',
    sie: 'Schätzen Sie zuerst ein, wie sicher Sie sich bei den folgenden Punkten fühlen. Danach sehen Sie, welche Wahlstationen für Sie besonders sinnvoll sind.'
  },
  ausgangIntro: {
    du: 'Bewerte die Punkte jetzt noch einmal. So siehst du, was sich verändert hat.',
    sie: 'Bewerten Sie die Punkte jetzt noch einmal. So sehen Sie, was sich verändert hat.'
  },
  wieSicher: { du: 'Wie sicher warst du dir?', sie: 'Wie sicher waren Sie sich?' },
  wieSicherJetzt: { du: 'Wie sicher fühlst du dich?', sie: 'Wie sicher fühlen Sie sich?' },
  bearbeitetBtn: { du: 'Ich habe die Aufgabe bearbeitet', sie: 'Aufgabe ist bearbeitet' },
  punkteFrage: { du: 'Trage deine erreichten Punkte ein:', sie: 'Tragen Sie Ihre erreichten Punkte ein:' },
  smileyFest: { du: 'Deine Einschätzung bleibt so stehen – die Punkte kannst du noch ändern.', sie: 'Ihre Einschätzung bleibt so stehen – die Punkte können Sie noch ändern.' },
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
  }
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
  zeichne(
    '<h1>' + esc(titel) + '</h1>' + dateiHinweis +
    '<p class="hinweis hinweis-warn">' + esc(details) + '</p>' +
    '<p><a class="btn" href="#/">Zurück zum Anfang</a></p>'
  );
}

/* ---------- Auswertungslogik ---------- */

function eintrag(z, id) {
  return z.aufgaben[id] || { bearbeitet: false, smiley: null, punkte: null, kontrolle: null };
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
  const w = { max: 0, erreicht: 0, bearbeitet: 0, bewertet: 0, anzahl: aufgaben.length };
  for (const a of aufgaben) {
    const maxA = Number(a.punkte) || 0;
    w.max += maxA;
    const e = eintrag(z, a.id);
    if (e.bearbeitet) w.bearbeitet += 1;
    if (e.punkte !== null && e.punkte !== undefined) {
      w.erreicht += grenze(e.punkte, 0, maxA);
      w.bewertet += 1;
    }
  }
  return w;
}

function stationsStatus(station, z) {
  const w = stationsWerte(station, z);
  if (w.anzahl > 0 && w.bewertet === w.anzahl) return 'fertig';
  if (w.bearbeitet > 0 || (z.stationen[station.id] && z.stationen[station.id].geoeffnet)) return 'begonnen';
  return 'offen';
}

function gesamtWerteAufgaben(thema, z) {
  const alle = [];
  for (const st of thema.stationen) for (const a of eigeneAufgaben(st, z)) alle.push({ station: st, aufgabe: a });
  return alle;
}

function istEmpfohlen(station, z) {
  const refs = Array.isArray(station.checkliste) ? station.checkliste : [];
  return refs.some((id) => {
    const s = z.diagnose.eingang[id];
    return s === 'unsicher' || s === 'teils';
  });
}

function gesamtWerte(thema, z) {
  const g = { max: 0, erreicht: 0, anzahl: 0, bewertet: 0, afb: {} };
  for (const { aufgabe: a } of gesamtWerteAufgaben(thema, z)) {
    const maxA = Number(a.punkte) || 0;
    const afb = a.afb || '–';
    if (!g.afb[afb]) g.afb[afb] = { max: 0, erreicht: 0, bewertet: 0, anzahl: 0 };
    g.max += maxA;
    g.anzahl += 1;
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

function kalibrierung(thema, z) {
  const zeilen = [];
  for (const { station: st, aufgabe: a } of gesamtWerteAufgaben(thema, z)) {
    const e = eintrag(z, a.id);
    const maxA = Number(a.punkte) || 0;
    if (!e.smiley || e.punkte === null || e.punkte === undefined || maxA <= 0) continue;
    const quote = grenze(e.punkte, 0, maxA) / maxA;
    let urteil = 'passend';
    if (e.smiley === 'sicher' && quote < 0.5) urteil = 'ueberschaetzt';
    else if (e.smiley === 'unsicher' && quote >= 0.8) urteil = 'unterschaetzt';
    zeilen.push({ station: st, aufgabe: a, smiley: e.smiley, punkte: grenze(e.punkte, 0, maxA), max: maxA, quote, urteil });
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
 * Dreistufige Skala: außen das unzufriedene (rot) und das lachende Gesicht (grün),
 * in der Mitte ein Punkt. Die Wörter bleiben für Screenreader erhalten.
 */
function smileyGruppe(name, gewaehlt, frage, gesperrt) {
  const s = SMILEYS.map((sm) => {
    const id = name + '-' + sm.id;
    const marke = sm.id === 'teils' ? skalaPunkt() : gesicht(sm.id);
    return '<label class="skala-stufe stufe-' + sm.id + (gesperrt ? ' ist-fest' : '') + '">' +
      '<input type="radio" name="' + esc(name) + '" id="' + esc(id) + '" value="' + sm.id + '"' +
      (gewaehlt === sm.id ? ' checked' : '') + (gesperrt ? ' disabled' : '') + '>' +
      marke + '<span class="nur-vorlesen">' + sm.wort + '</span></label>';
  }).join('');
  return '<fieldset class="skala-gruppe"><legend>' + esc(frage) + '</legend>' +
    '<div class="skala">' + s + '</div></fieldset>';
}

/** Gesicht mit Wort – für Tabellen und Rückblicke. */
function stufeZelle(id) {
  const sm = SMILEYS.find((x) => x.id === id);
  if (!sm) return '<span class="meta">–</span>';
  return '<span class="stufe-zelle">' + gesicht(sm.id) +
    '<span class="stufe-wort">' + esc(sm.wort) + '</span></span>';
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

/* ---------- Ansicht: Start ---------- */

function ansichtStart() {
  document.documentElement.dataset.fach = 'neutral';
  document.title = 'Lerntheke';
  $('#kopfnav').innerHTML = '';

  let html = '<h1>Lerntheke</h1>';

  const letztes = store.letztesThema();
  const kennt = letztes && findeThema(letztes.stufe, letztes.thema);
  if (kennt) {
    html += '<a class="karte karte-link" href="' + themaPfad(letztes.stufe, letztes.thema) + '">' +
      '<p class="meta">Zuletzt geöffnet</p>' +
      '<h2>' + esc(kennt.eintrag.name) + '</h2>' +
      '<p class="meta"><span>' + esc(kennt.stufe.name) + '</span>' + '</p>' +
      '</a>';
  }

  let leer = true;
  for (const stufe of katalog.stufen || []) {
    const themen = (stufe.themen || []).filter((th) => th.aktiv !== false);
    if (!themen.length) continue;
    leer = false;
    html += '<h2>' + esc(stufe.name || stufe.id) + '</h2><ul class="liste-blank">';
    for (const th of themen) {
      html += '<li><a class="karte karte-link" href="' + themaPfad(stufe.id, th.id) + '">' +
        '<div class="karte-kopf"><h3>' + esc(th.name || th.id) + '</h3>' + fachChip(th.fach) + '</div>' +
        (th.beschreibung ? '<p class="meta">' + esc(th.beschreibung) + '</p>' : '') +
        '</a></li>';
    }
    html += '</ul>';
  }
  if (leer) html += '<p class="hinweis">Im Katalog ist noch kein aktives Thema eingetragen.</p>';

  if (store.speicherIstFluechtig()) {
    html += '<p class="hinweis hinweis-warn">Dieser Browser erlaubt kein dauerhaftes Speichern (z.&nbsp;B. privater Modus). Der Fortschritt geht beim Schließen des Tabs verloren.</p>';
  }

  zeichne(html);
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

function kopfSetzen(unterseite) {
  document.documentElement.dataset.fach = aktuell.thema.fach || 'neutral';
  document.title = (aktuell.thema.titel || 'Lerntheke') + ' – Lerntheke';
  const p = themaPfad(aktuell.stufe, aktuell.themaId);
  $('#kopfnav').innerHTML = unterseite
    ? '<a href="' + p + '">Stationsübersicht</a>'
    : '<a href="#/">Thema wechseln</a>';
}

function speichereZustand() {
  store.speichern(aktuell.zustand);
}

/* ---------- Ansicht: Selbstdiagnose (Eingang) ---------- */

function ansichtDiagnose() {
  kopfSetzen(true);
  const z = aktuell.zustand;
  const punkte = aktuell.thema.checkliste;
  let html = '<h1>Selbsteinschätzung</h1><p>' + esc(t('diagnoseIntro')) + '</p>';

  if (!punkte.length) {
    html += '<p class="hinweis">Für dieses Thema ist keine Checkliste hinterlegt.</p>';
  }
  for (const c of punkte) {
    html += '<section class="karte"><h2>' + markdownZeile(c.text) + '</h2>' +
      smileyGruppe('eingang-' + c.id, z.diagnose.eingang[c.id], t('wieSicherJetzt'), false)
        .replace('<fieldset', '<fieldset data-diagnose="eingang" data-id="' + esc(c.id) + '"') +
      '</section>';
  }

  html += '<div class="btn-reihe">' +
    '<a class="btn btn-primaer" href="' + themaPfad(aktuell.stufe, aktuell.themaId) + '">Weiter zu den Stationen</a>' +
    '<a class="btn btn-schlicht" href="' + themaPfad(aktuell.stufe, aktuell.themaId) + '">Überspringen</a>' +
    '</div>';
  zeichne(html);
}

function markdownZeile(text) {
  const html = markdown(text);
  return html.replace(/^<p>/, '').replace(/<\/p>$/, '');
}

/* ---------- Ansicht: Stationsübersicht ---------- */

function ansichtStationen() {
  kopfSetzen(false);
  const z = aktuell.zustand;
  const thema = aktuell.thema;
  const g = gesamtWerte(thema, z);
  const diagnoseGemacht = Object.keys(z.diagnose.eingang).length > 0;

  let html = '<h1>' + esc(thema.titel || aktuell.katalogEintrag.name) + '</h1>' +
    '<p class="meta meta-reihe"><span>' + esc(aktuell.stufeName) + '</span><span>' +
    esc(thema.fach === 'physik' ? 'Physik' : thema.fach === 'mathe' ? 'Mathematik' : thema.fach || '') + '</span></p>';

  if (thema.hinweis) html += '<p class="hinweis">' + markdownZeile(thema.hinweis) + '</p>';

  html += '<section class="karte">' +
    '<h2>Fortschritt</h2>' +
    balkenZeile('Punkte', g.erreicht, g.max) +
    '<p class="meta">' + g.bewertet + ' von ' + g.anzahl + ' Aufgaben ausgewertet</p>' +
    '<div class="btn-reihe">' +
    '<a class="btn" href="' + themaPfad(aktuell.stufe, aktuell.themaId) + '/auswertung">' +
    symbol('ergebnis') + 'Auswertung</a>' +
    '<a class="btn btn-schlicht" href="' + themaPfad(aktuell.stufe, aktuell.themaId) + '/diagnose">' +
    (diagnoseGemacht ? 'Selbsteinschätzung ansehen' : 'Selbsteinschätzung starten') + '</a>' +
    '</div></section>';

  if (!diagnoseGemacht && thema.checkliste.length) {
    html += '<p class="hinweis">Noch keine Selbsteinschätzung. Sie hilft dabei, die passenden Wahlstationen zu erkennen.</p>';
  }

  const pflicht = thema.stationen.filter((s) => s.typ !== 'wahl');
  const wahl = thema.stationen.filter((s) => s.typ === 'wahl');

  if (pflicht.length) html += '<p class="kicker">Pflichtstationen</p><ul class="liste-blank">' + pflicht.map((s) => stationsKarte(s, z)).join('') + '</ul>';
  if (wahl.length) html += '<p class="kicker">Wahlstationen</p><ul class="liste-blank">' + wahl.map((s) => stationsKarte(s, z)).join('') + '</ul>';
  if (!thema.stationen.length) html += '<p class="hinweis">Dieses Thema enthält noch keine Stationen.</p>';

  zeichne(html);
}

function stationsKarte(station, z) {
  const w = stationsWerte(station, z);
  const status = stationsStatus(station, z);
  const empfohlen = station.typ === 'wahl' && istEmpfohlen(station, z);
  const pfad = themaPfad(aktuell.stufe, aktuell.themaId) + '/s/' + encodeURIComponent(station.id);

  const rolle = rolleVon(station, z);
  const tandemOhneRolle = istTandem(station) && !rolle;

  return '<li><a class="karte karte-link" href="' + pfad + '">' +
    '<div class="karte-kopf"><h3>' + esc(station.id) + ' · ' + esc(station.titel || '') + '</h3>' +
    (empfohlen ? '<span class="chip chip-empf">' + symbol('empfohlen') + 'empfohlen</span>' : '') + statusChip(status) + '</div>' +
    '<p class="meta meta-reihe">' +
    (station.dauer_min ? '<span>' + symbol('dauer') + esc(String(station.dauer_min)) + ' min</span>' : '') +
    '<span>' + sozialformSymbol(station.sozialform) + esc(sozialformText(station.sozialform)) + '</span>' +
    (station.hilfsmittel ? '<span>' + symbol('hilfsmittel') + esc(station.hilfsmittel) + '</span>' : '') +
    (tandemOhneRolle
      ? '<span>' + station.aufgaben.length + ' Nummern zu zweit</span>'
      : '<span>' + w.anzahl + ' Aufgabe' + (w.anzahl === 1 ? '' : 'n') +
        (rolle ? ' als Partner ' + esc(rolle) : '') + '</span>') +
    '</p>' +
    (tandemOhneRolle
      ? '<p class="meta">Rolle noch nicht gewählt</p>'
      : balkenZeile('Punkte', w.erreicht, w.max)) +
    '</a></li>';
}

/* ---------- Ansicht: Station ---------- */

/** Kopfzeile, Meta-Angaben und Checklistenbezug – für alle Stationsarten gleich. */
function stationsKopf(station) {
  const bezug = (station.checkliste || [])
    .map((id) => (aktuell.thema.checkliste.find((c) => c.id === id) || {}).text)
    .filter(Boolean);

  return '<p class="meta"><a href="' + themaPfad(aktuell.stufe, aktuell.themaId) + '">← Stationsübersicht</a></p>' +
    '<h1>' + esc(station.id) + ' · ' + esc(station.titel || '') + '</h1>' +
    '<p class="meta meta-reihe">' +
    (station.typ === 'wahl' ? '<span>Wahlstation</span>' : '<span>Pflichtstation</span>') +
    (station.dauer_min ? '<span>' + symbol('dauer') + esc(String(station.dauer_min)) + ' min</span>' : '') +
    '<span>' + sozialformSymbol(station.sozialform) + esc(sozialformText(station.sozialform)) + '</span>' +
    (station.hilfsmittel ? '<span>' + symbol('hilfsmittel') + esc(station.hilfsmittel) + '</span>' : '') +
    '</p>' +
    (station.hinweis ? '<p class="hinweis">' + markdownZeile(station.hinweis) + '</p>' : '') +
    (bezug.length
      ? '<p class="meta meta-bezug">Darum geht es: ' + bezug.map((b) => markdownZeile(b)).join(' · ') + '</p>'
      : '');
}

function pdfKnoepfe(pdfURL) {
  return '<div class="btn-reihe">' +
    '<a class="btn btn-primaer" href="' + esc(pdfURL) + '" target="_blank" rel="noopener">' +
    symbol('arbeitsblatt') + 'Arbeitsblatt öffnen</a>' +
    '<a class="btn" href="' + esc(pdfURL) + '" download>Herunterladen</a>' +
    '</div>';
}

/**
 * Bereich für das Arbeitsblatt.
 * Bei "pdf_optional": true erscheinen die Knöpfe erst, wenn die Datei wirklich existiert –
 * Tandemstationen kommen ohne Papier aus, ein Druck-PDF ist dort nur eine Zugabe.
 */
function pdfBereich(station) {
  const pdfURL = station.pdf ? new URL(station.pdf, aktuell.ordner).href : null;
  if (station.pdf_optional) {
    if (pdfURL) pruefePdfNach(pdfURL);
    return '<div id="pdf-platz"></div>';
  }
  if (!pdfURL) return '<p class="hinweis hinweis-warn">Zu dieser Station ist kein Arbeitsblatt hinterlegt.</p>';
  return pdfKnoepfe(pdfURL);
}

function pruefePdfNach(pdfURL) {
  fetch(pdfURL, { method: 'HEAD' })
    .then((antwort) => {
      const platz = document.getElementById('pdf-platz');
      if (antwort.ok && platz) platz.innerHTML = pdfKnoepfe(pdfURL);
    })
    .catch(() => { /* ohne Datei bleibt der Bereich leer */ });
}

function ansichtStation(stationId) {
  kopfSetzen(true);
  const z = aktuell.zustand;
  const station = aktuell.thema.stationen.find((s) => String(s.id) === String(stationId));
  if (!station) {
    fehlerAnsicht('Station nicht gefunden', 'Die Station "' + stationId + '" steht nicht in thema.json.');
    return;
  }
  const bisher = z.stationen[station.id];
  if (!bisher || !bisher.geoeffnet) {
    z.stationen[station.id] = Object.assign({ rolle: null, schritt: 0 }, bisher, { geoeffnet: true });
    speichereZustand();
  }

  if (istTandem(station)) { ansichtTandem(station); return; }

  const w = stationsWerte(station, z);

  let html = stationsKopf(station) + pdfBereich(station);

  const offeneVorhanden = station.aufgaben.some((a) => !eintrag(z, a.id).bearbeitet);

  html += '<h2 style="margin-top:1.4rem">Aufgaben</h2>' +
    '<p class="meta">' + pkt(w.erreicht) + ' von ' + pkt(w.max) + ' Punkten eingetragen' +
    (offeneVorhanden ? ' · Bearbeitete Aufgabe mit dem Haken bestätigen, dann folgen Einschätzung und Lösung.' : '') +
    '</p>';

  const naechsteOffen = station.aufgaben.find((a) => {
    const e = eintrag(z, a.id);
    return !(e.bearbeitet && e.smiley && e.punkte !== null);
  });

  html += station.aufgaben.map((a, i) => aufgabenKarte(a, z, station, i, naechsteOffen && naechsteOffen.id === a.id)).join('');

  html += '<div class="btn-reihe">' +
    '<a class="btn" href="' + themaPfad(aktuell.stufe, aktuell.themaId) + '">Zurück zur Übersicht</a>' +
    '<a class="btn btn-schlicht" href="' + themaPfad(aktuell.stufe, aktuell.themaId) + '/auswertung">Auswertung</a>' +
    '</div>';

  zeichne(html);
}

function aufgabenKarte(a, z, station, index, istAktiv) {
  const e = eintrag(z, a.id);
  const maxA = Number(a.punkte) || 0;
  const fertig = e.bearbeitet && e.smiley && e.punkte !== null;
  const klassen = 'karte aufgabe' + (fertig ? ' fertig' : istAktiv ? ' aktiv' : '');

  // Der Haken sitzt rechts in der Kopfzeile: Bei zehn Aufgaben auf einer Seite
  // wären zehn große Knöpfe darunter zu viel des Guten.
  const haken = !e.bearbeitet
    ? '<button type="button" class="haken-btn" data-aktion="bearbeitet" data-id="' + esc(a.id) + '"' +
      ' title="' + esc(t('bearbeitetBtn')) + '"' +
      ' aria-label="Aufgabe ' + esc(a.label || a.id) + ': ' + esc(t('bearbeitetBtn')) + '">' +
      symbol('haken') + '</button>'
    : '';

  let html = '<article class="' + klassen + '" id="a-' + esc(a.id) + '">' +
    '<div class="aufgabe-kopf"><span class="nr">Aufgabe ' + esc(a.label || a.id) + '</span>' +
    '<span class="chip">' + pkt(maxA) + ' ' + (maxA === 1 ? 'Punkt' : 'Punkte') + '</span>' +
    (a.afb ? '<span class="chip">AFB ' + esc(a.afb) + '</span>' : '') +
    (fertig ? '<span class="chip chip-fertig">' + pkt(grenze(e.punkte, 0, maxA)) + ' erreicht</span>' : '') +
    haken +
    '</div>';

  if (!e.bearbeitet) return html + '</article>';

  if (!e.smiley) {
    html += smileyGruppe('smiley-' + a.id, null, t('wieSicher'), false)
      .replace('<fieldset', '<fieldset data-smiley="' + esc(a.id) + '"');
    return html + '</article>';
  }

  html += smileyGruppe('smiley-' + a.id, e.smiley, t('wieSicher'), true) +
    '<p class="meta">' + esc(t('smileyFest')) + '</p>';

  html += '<div class="loesung"><p class="loesung-marke">' + symbol('loesung') + 'Lösung</p>' +
    (a.loesung ? markdown(a.loesung) : '<p>Für diese Aufgabe ist keine Lösung hinterlegt.</p>') +
    bildHtml(a) + '</div>';

  const wert = e.punkte === null ? '' : pkt(grenze(e.punkte, 0, maxA));
  html += '<p style="margin:.9rem 0 .4rem"><strong>' + esc(t('punkteFrage')) + '</strong></p>' +
    '<div class="stepper">' +
    '<button type="button" class="btn" data-aktion="punkte-minus" data-id="' + esc(a.id) + '" aria-label="Halben Punkt abziehen">−</button>' +
    '<input type="text" inputmode="decimal" value="' + esc(wert) + '" data-punkte="' + esc(a.id) + '" ' +
    'aria-label="Erreichte Punkte für Aufgabe ' + esc(a.label || a.id) + ', maximal ' + pkt(maxA) + '">' +
    '<button type="button" class="btn" data-aktion="punkte-plus" data-id="' + esc(a.id) + '" aria-label="Halben Punkt hinzufügen">+</button>' +
    '<span class="max">von ' + pkt(maxA) + '</span>' +
    '</div>';

  const naechste = station.aufgaben[index + 1];
  if (naechste) {
    html += '<div class="btn-reihe"><button type="button" class="btn btn-primaer" data-aktion="naechste" data-ziel="' +
      esc(naechste.id) + '">Nächste Aufgabe</button></div>';
  }

  return html + '</article>';
}

/* ---------- Ansicht: Tandemstation ----------
   Zwei Geräte, kein Papier: Beide sehen dieselbe Nummer. Wer die Aufgabe hat, löst laut;
   das Gegenüber sieht die Lösung, gibt bei Bedarf den Tipp und meldet zurück.
   Gekoppelt wird nichts – den Takt halten die beiden selbst über die große Nummer. */

function ansichtTandem(station) {
  const z = aktuell.zustand;
  const stand = z.stationen[station.id];
  const rolle = stand.rolle;

  let html = stationsKopf(station) + pdfBereich(station);

  if (!rolle) {
    html += '<section class="karte"><h2>' + esc(t('rolleFrage')) + '</h2>' +
      '<p>' + esc(t('tandemIntro')) + '</p>' +
      '<div class="btn-reihe">' +
      '<button type="button" class="btn btn-primaer btn-gross" data-aktion="rolle" data-wert="A">Ich bin Partner A</button>' +
      '<button type="button" class="btn btn-primaer btn-gross" data-aktion="rolle" data-wert="B">Ich bin Partner B</button>' +
      '</div>' +
      '<p class="meta">Wichtig: Einigt euch vorher, wer A und wer B ist – sonst habt ihr beide dieselben Aufgaben.</p>' +
      '</section>';
    zeichne(html);
    return;
  }

  const anzahl = station.aufgaben.length;
  const schritt = grenze(stand.schritt || 0, 0, Math.max(0, anzahl - 1));
  const a = station.aufgaben[schritt];
  const w = stationsWerte(station, z);

  html += '<section class="karte takt">' +
    '<p class="takt-nr" aria-hidden="true">' + (schritt + 1) + '</p>' +
    '<p class="takt-zeile"><strong>Nummer ' + (schritt + 1) + ' von ' + anzahl + '</strong></p>' +
    '<p class="meta">' + esc(t('taktHinweis')) + '</p>' +
    taktPunkte(station, z, rolle, schritt) +
    '<p class="meta takt-rolle">Rolle: <strong>Partner ' + esc(rolle) + '</strong> · ' +
    pkt(w.erreicht) + ' von ' + pkt(w.max) + ' eigenen Punkten ' +
    '<button type="button" class="btn btn-schlicht btn-klein" data-aktion="rolle-wechseln">Rolle wechseln</button></p>' +
    '</section>';

  const eigen = a ? (a.partner || 'A') === rolle : false;
  if (!a) html += '<p class="hinweis hinweis-warn">Diese Station enthält keine Aufgaben.</p>';
  else if (eigen) html += tandemEigene(a, z, schritt);
  else html += tandemKontrolle(a, schritt, rolle);

  html += '<div class="btn-reihe">' +
    '<button type="button" class="btn" data-aktion="takt-zurueck"' + (schritt === 0 ? ' disabled' : '') + '>← Vorherige</button>' +
    (schritt < anzahl - 1
      ? '<button type="button" class="btn btn-primaer" data-aktion="takt-weiter">Weiter →</button>'
      : '<a class="btn btn-primaer" href="' + themaPfad(aktuell.stufe, aktuell.themaId) + '/auswertung">Zur Auswertung</a>') +
    '<a class="btn btn-schlicht" href="' + themaPfad(aktuell.stufe, aktuell.themaId) + '">Stationsübersicht</a>' +
    '</div>';

  if (schritt === anzahl - 1) html += '<p class="hinweis">' + esc(t('tandemFertig')) + '</p>';

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

  let html = '<article class="karte aufgabe' + (e.kontrolle ? ' fertig' : ' aktiv') + '" id="a-' + esc(a.id) + '">' +
    '<div class="aufgabe-kopf"><span class="nr">Eigene Aufgabe ' + esc(a.label || String(schritt + 1)) + '</span>' +
    '<span class="chip">' + pkt(maxA) + ' ' + (maxA === 1 ? 'Punkt' : 'Punkte') + '</span>' +
    (a.afb ? '<span class="chip">AFB ' + esc(a.afb) + '</span>' : '') +
    '</div>' +
    '<p class="meta">' + esc(t('eigeneKarte')) + '</p>' +
    '<div class="aufgabentext">' + (a.aufgabe ? markdown(a.aufgabe) : '<p class="m-fehler">Für diese Nummer fehlt der Aufgabentext.</p>') + '</div>';

  if (!e.bearbeitet) {
    return html + '<div class="btn-reihe">' +
      '<button type="button" class="btn btn-primaer" data-aktion="bearbeitet" data-id="' + esc(a.id) + '">Ich habe laut gelöst</button>' +
      '</div></article>';
  }

  if (!e.smiley) {
    return html + smileyGruppe('smiley-' + a.id, null, t('wieSicher'), false)
      .replace('<fieldset', '<fieldset data-smiley="' + esc(a.id) + '"') + '</article>';
  }

  html += smileyGruppe('smiley-' + a.id, e.smiley, t('wieSicher'), true);

  html += '<p style="margin:.9rem 0 .4rem"><strong>' + esc(t('kontrolleFrage')) + '</strong></p>' +
    '<div class="btn-reihe" role="group" aria-label="' + esc(t('kontrolleFrage')) + '">' +
    KONTROLLEN.map((k) => {
      const aktiv = e.kontrolle === k.id;
      return '<button type="button" class="btn kontroll-btn' + (aktiv ? ' ist-aktiv' : '') + '"' +
        ' data-aktion="kontrolle" data-id="' + esc(a.id) + '" data-wert="' + k.id + '"' +
        ' aria-pressed="' + (aktiv ? 'true' : 'false') + '">' +
        esc(k.text) + ' <span class="kontroll-punkte">' + pkt(punkteFuerKontrolle(maxA, k.id)) + ' P</span></button>';
    }).join('') + '</div>';

  if (e.kontrolle) {
    html += '<p class="meta">Eingetragen: ' + pkt(grenze(e.punkte || 0, 0, maxA)) + ' von ' + pkt(maxA) +
      ' Punkten. Korrigieren geht über die Knöpfe darüber.</p>' +
      '<div class="loesung"><p class="loesung-marke">' + symbol('loesung') + 'Lösung zum Nachlesen</p>' +
      (a.loesung ? markdown(a.loesung) : '<p>Für diese Aufgabe ist keine Lösung hinterlegt.</p>') +
      bildHtml(a) + '</div>';
  }

  return html + '</article>';
}

function tandemKontrolle(a, schritt, rolle) {
  const anderer = rolle === 'A' ? 'B' : 'A';
  return '<article class="karte kontrollkarte" id="a-' + esc(a.id) + '">' +
    '<div class="aufgabe-kopf"><span class="nr">Kontrollkarte für Partner ' + esc(anderer) + '</span>' +
    '<span class="chip">zählt nicht für die eigene Auswertung</span></div>' +
    '<p class="meta">' + esc(t('partnerKarte')) + '</p>' +
    '<div class="aufgabentext">' + (a.aufgabe ? markdown(a.aufgabe) : '<p class="m-fehler">Für diese Nummer fehlt der Aufgabentext.</p>') + '</div>' +
    '<div class="loesung"><p class="loesung-marke">' + symbol('loesung') + 'Lösung</p>' +
    (a.loesung ? markdown(a.loesung) : '<p>Für diese Aufgabe ist keine Lösung hinterlegt.</p>') +
    bildHtml(a) + '</div>' +
    (a.tipp
      ? '<details class="tipp"><summary>' + symbol('tipp') + 'Tipp geben</summary><div class="tipp-inhalt">' + markdown(a.tipp) + '</div></details>'
      : '<p class="meta">Für diese Nummer ist kein Tipp hinterlegt.</p>') +
    '</article>';
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

function ansichtAuswertung() {
  kopfSetzen(true);
  const z = aktuell.zustand;
  const thema = aktuell.thema;
  const g = gesamtWerte(thema, z);
  const prozent = g.max > 0 ? Math.round((g.erreicht / g.max) * 100) : 0;

  let html = '<h1>Auswertung</h1>' +
    '<p class="meta">' + esc(thema.titel || '') + (z.name ? ' · ' + esc(z.name) : '') + '</p>';

  html += '<section class="karte"><h2>Gesamt</h2>' +
    balkenZeile('Punkte', g.erreicht, g.max) +
    '<p class="meta">' + prozent + ' % · ' + g.bewertet + ' von ' + g.anzahl + ' Aufgaben ausgewertet</p></section>';

  html += '<section class="karte"><h2>Nach Stationen</h2>';
  for (const st of thema.stationen) {
    const w = stationsWerte(st, z);
    html += balkenZeile(st.id, w.erreicht, w.max);
  }
  html += '</section>';

  const afbSchluessel = Object.keys(g.afb).sort();
  if (afbSchluessel.length) {
    html += '<section class="karte"><h2>Nach Anforderungsbereich</h2>';
    for (const k of afbSchluessel) {
      html += balkenZeile('AFB ' + k, g.afb[k].erreicht, g.afb[k].max);
    }
    html += '</section>';
  }

  html += kalibrierungsKarte(thema, z);
  html += ausgangsKarte(thema, z);
  html += zusammenfassungsKarte(thema, z);
  html += sicherungsKarte();

  zeichne(html);
}

function kalibrierungsKarte(thema, z) {
  const zeilen = kalibrierung(thema, z);
  let html = '<section class="karte"><h2>Einschätzung und Ergebnis</h2>';
  if (!zeilen.length) {
    return html + '<p class="meta">Sobald Einschätzung und Punkte zu einer Aufgabe vorliegen, erscheint hier der Vergleich.</p></section>';
  }
  const ueber = zeilen.filter((r) => r.urteil === 'ueberschaetzt');
  const unter = zeilen.filter((r) => r.urteil === 'unterschaetzt');
  const passend = zeilen.length - ueber.length - unter.length;

  const saetze = [];
  if (ueber.length) saetze.push(t('ueberschaetzt'));
  if (unter.length) saetze.push(t('unterschaetzt'));
  if (!saetze.length) saetze.push(t('passend'));
  html += saetze.map((s) => '<p>' + esc(s) + '</p>').join('');
  html += '<p class="meta">' + passend + ' von ' + zeilen.length + ' Aufgaben passend eingeschätzt' +
    (ueber.length ? ' · ' + ueber.length + '× überschätzt' : '') +
    (unter.length ? ' · ' + unter.length + '× unterschätzt' : '') + '</p>';

  html += '<div class="tab-umbruch"><table class="tab"><thead><tr>' +
    '<th>Aufgabe</th><th>Einschätzung</th><th class="zahl">Punkte</th><th>Vergleich</th></tr></thead><tbody>';
  for (const r of zeilen) {
    const urteilText = r.urteil === 'ueberschaetzt' ? 'überschätzt'
      : r.urteil === 'unterschaetzt' ? 'unterschätzt' : 'passend';
    html += '<tr><td>' + esc(r.station.id) + ' · ' + esc(r.aufgabe.label || r.aufgabe.id) + '</td>' +
      '<td>' + stufeZelle(r.smiley) + '</td>' +
      '<td class="zahl">' + pkt(r.punkte) + ' / ' + pkt(r.max) + '</td>' +
      '<td>' + esc(urteilText) + '</td></tr>';
  }
  return html + '</tbody></table></div></section>';
}

function ausgangsKarte(thema, z) {
  if (!thema.checkliste.length) return '';
  let html = '<section class="karte"><h2>Selbsteinschätzung danach</h2><p>' + esc(t('ausgangIntro')) + '</p>';
  for (const c of thema.checkliste) {
    const vorher = z.diagnose.eingang[c.id];
    html += '<div style="margin:.9rem 0 1.2rem"><p style="margin-bottom:.2rem"><strong>' + markdownZeile(c.text) + '</strong></p>' +
      '<p class="meta">vorher: ' + (vorher ? stufeZelle(vorher) : 'nicht eingeschätzt') + '</p>' +
      smileyGruppe('ausgang-' + c.id, z.diagnose.ausgang[c.id], t('wieSicherJetzt'), false)
        .replace('<fieldset', '<fieldset data-diagnose="ausgang" data-id="' + esc(c.id) + '"') +
      '</div>';
  }

  html += '<h3>Vorher / Nachher</h3><div class="tab-umbruch"><table class="tab"><thead><tr>' +
    '<th>Kompetenz</th><th>vorher</th><th>nachher</th></tr></thead><tbody>';
  for (const c of thema.checkliste) {
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
      const feld = main.querySelector('[data-punkte="' + id + '"]');
      const e = eintrag(aktuell.zustand, id);
      if (feld) feld.value = e.punkte === null ? '' : pkt(e.punkte);
      aktualisiereKartenKopf(id);
      return;
    }

    if (aktion === 'naechste') {
      const ziel = document.getElementById('a-' + el.dataset.ziel);
      if (ziel) {
        ziel.scrollIntoView({ block: 'start', behavior: 'smooth' });
        const knopf = ziel.querySelector('button, input[type="radio"]');
        if (knopf) knopf.focus({ preventScroll: true });
      }
      return;
    }

    if (aktion === 'rolle' || aktion === 'rolle-wechseln') {
      const sid = stationAusPfad();
      if (!sid) return;
      if (aktion === 'rolle-wechseln' && !window.confirm(t('rolleWechselFrage'))) return;
      const stand = aktuell.zustand.stationen[sid] || (aktuell.zustand.stationen[sid] = { geoeffnet: true, rolle: null, schritt: 0 });
      stand.rolle = aktion === 'rolle' ? el.dataset.wert : null;
      speichereZustand();
      route();
      return;
    }

    if (aktion === 'takt-weiter' || aktion === 'takt-zurueck' || aktion === 'takt-zu') {
      const sid = stationAusPfad();
      const station = sid && aktuell.thema.stationen.find((s) => String(s.id) === sid);
      if (!station) return;
      const stand = aktuell.zustand.stationen[sid];
      const letzte = Math.max(0, station.aufgaben.length - 1);
      const jetzt = grenze(stand.schritt || 0, 0, letzte);
      const ziel = aktion === 'takt-zu' ? Number(el.dataset.wert)
        : aktion === 'takt-weiter' ? jetzt + 1 : jetzt - 1;
      stand.schritt = grenze(isFinite(ziel) ? ziel : 0, 0, letzte);
      speichereZustand();
      route().then(() => {
        const takt = document.querySelector('.takt');
        if (takt) takt.scrollIntoView({ block: 'start', behavior: 'smooth' });
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

    const feldSmiley = ziel.closest('[data-smiley]');
    if (feldSmiley && ziel.type === 'radio') {
      const id = feldSmiley.dataset.smiley;
      const z = aktuell.zustand;
      const e = z.aufgaben[id] || (z.aufgaben[id] = { bearbeitet: true, smiley: null, punkte: null });
      if (!e.smiley) {
        e.smiley = ziel.value;
        speichereZustand();
        route().then(() => {
          const karte = document.getElementById('a-' + id);
          if (!karte) return;
          karte.scrollIntoView({ block: 'start', behavior: 'smooth' });
        });
      }
      return;
    }

    const feldDiagnose = ziel.closest('[data-diagnose]');
    if (feldDiagnose && ziel.type === 'radio') {
      const phase = feldDiagnose.dataset.diagnose;
      const punktId = feldDiagnose.dataset.id;
      aktuell.zustand.diagnose[phase][punktId] = ziel.value;
      speichereZustand();
      // Die Vorher/Nachher-Tabelle steht auf derselben Seite und soll sofort mitziehen.
      const zelle = main.querySelector('[data-' + phase.replace('eingang', 'vorher').replace('ausgang', 'nachher') + '="' + punktId + '"]');
      if (zelle) zelle.innerHTML = stufeZelle(ziel.value);
      return;
    }

    if (ziel.matches('[data-punkte]')) {
      const id = ziel.dataset.punkte;
      const roh = ziel.value.trim().replace(',', '.');
      if (roh === '') { setzePunkte(id, null); ziel.value = ''; aktualisiereKartenKopf(id); return; }
      const n = Number(roh);
      if (!isFinite(n)) { meldung('Bitte eine Zahl eintragen.'); ziel.value = ''; return; }
      setzePunkte(id, n);
      const e = eintrag(aktuell.zustand, id);
      ziel.value = e.punkte === null ? '' : pkt(e.punkte);
      aktualisiereKartenKopf(id);
    }
  });

  main.addEventListener('input', (ev) => {
    if (ev.target.matches('[data-name]')) {
      aktuell.zustand.name = ev.target.value.slice(0, 80);
      speichereZustand();
    }
  });
}

/** Aktualisiert nur den Kopf einer Aufgabenkarte, damit das Eingabefeld den Fokus behält. */
function aktualisiereKartenKopf(id) {
  const karte = document.getElementById('a-' + id);
  if (!karte) return;
  const a = findeAufgabe(id);
  const e = eintrag(aktuell.zustand, id);
  const maxA = Number(a && a.punkte) || 0;
  const alt = karte.querySelector('.chip-fertig');
  const fertig = e.bearbeitet && e.smiley && e.punkte !== null;
  if (fertig) {
    const text = pkt(grenze(e.punkte, 0, maxA)) + ' erreicht';
    if (alt) alt.textContent = text;
    else {
      const chip = document.createElement('span');
      chip.className = 'chip chip-fertig';
      chip.textContent = text;
      karte.querySelector('.aufgabe-kopf').appendChild(chip);
    }
    karte.classList.add('fertig');
    karte.classList.remove('aktiv');
  } else if (alt) {
    alt.remove();
    karte.classList.remove('fertig');
  }
}

/* ---------- Router ---------- */

function pfadTeile() {
  const h = location.hash.replace(/^#\/?/, '');
  return h.split('/').filter((x) => x !== '').map(decodeURIComponent);
}

async function route() {
  const teile = pfadTeile();
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
