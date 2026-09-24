/* Lerntheke – Speicherung
   Alles bleibt lokal im Browser (localStorage), Schlüssel: lerntheke:<stufe>:<thema>.
   Jeder Zugriff ist gekapselt: Ist localStorage gesperrt oder ein Eintrag defekt,
   arbeitet die App mit einem frischen Zustand weiter statt abzustürzen. */

export const ZUSTAND_VERSION = 1;

const PRAEFIX = 'lerntheke:';
const SCHLUESSEL_LETZTES = 'lerntheke:zuletzt';
// Die Selbsteinschätzung läuft von 1 (unsicher) bis 5 (sicher).
// Ältere Stände kannten nur drei Stufen; sie werden beim Laden umgerechnet.
const ALTE_STUFEN = { unsicher: 1, teils: 3, sicher: 5 };
const KONTROLLEN = ['richtig', 'tipp', 'falsch'];
const ROLLEN = ['A', 'B'];

/* ---------- localStorage mit Rückfallebene ---------- */

const speicherErsatz = new Map();
let speicherDefekt = false;

function rohLesen(k) {
  try {
    const v = window.localStorage.getItem(k);
    return v === null ? undefined : v;
  } catch (e) {
    speicherDefekt = true;
    return speicherErsatz.get(k);
  }
}

function rohSchreiben(k, v) {
  try {
    window.localStorage.setItem(k, v);
    return true;
  } catch (e) {
    speicherDefekt = true;
    speicherErsatz.set(k, v);
    return false;
  }
}

function rohLoeschen(k) {
  try {
    window.localStorage.removeItem(k);
  } catch (e) {
    speicherDefekt = true;
  }
  speicherErsatz.delete(k);
}

/** true, wenn localStorage nicht nutzbar ist (z. B. privater Modus). */
export function speicherIstFluechtig() {
  return speicherDefekt;
}

/* ---------- Hilfen ---------- */

export function schluessel(stufe, thema) {
  return PRAEFIX + stufe + ':' + thema;
}

function istObjekt(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function alsStufe(x) {
  if (typeof x === 'string' && Object.prototype.hasOwnProperty.call(ALTE_STUFEN, x)) return ALTE_STUFEN[x];
  const n = Math.round(Number(x));
  return isFinite(n) && n >= 1 && n <= 5 ? n : null;
}

/** Lage der Nadel auf der Skala, 0 bis 100. */
function alsLage(x) {
  const n = Number(x);
  return isFinite(n) && n >= 0 && n <= 100 ? Math.round(n) : null;
}

function alsKontrolle(x) {
  return KONTROLLEN.includes(x) ? x : null;
}

function alsZahl(x) {
  const n = typeof x === 'string' ? Number(x.replace(',', '.')) : x;
  return typeof n === 'number' && isFinite(n) ? n : null;
}

function leererZustand(stufe, thema) {
  return {
    v: ZUSTAND_VERSION,
    stufe: String(stufe),
    thema: String(thema),
    name: '',
    diagnose: { eingang: {}, ausgang: {} },
    diagnoseLage: { eingang: {}, ausgang: {} },
    stationen: {},
    aufgaben: {},
    angelegt: new Date().toISOString(),
    aktualisiert: new Date().toISOString()
  };
}

/** Bringt beliebige Rohdaten in die erwartete Form. Unbekanntes wird verworfen. */
function normalisiere(roh, stufe, thema) {
  const z = leererZustand(stufe, thema);
  if (!istObjekt(roh)) return z;
  if (roh.v !== ZUSTAND_VERSION) {
    // Unbekannte Version: nur den Namen retten, Rest neu beginnen.
    if (typeof roh.name === 'string') z.name = roh.name.slice(0, 80);
    return z;
  }
  if (typeof roh.name === 'string') z.name = roh.name.slice(0, 80);
  if (typeof roh.angelegt === 'string') z.angelegt = roh.angelegt;

  const d = istObjekt(roh.diagnose) ? roh.diagnose : {};
  const dl = istObjekt(roh.diagnoseLage) ? roh.diagnoseLage : {};
  for (const phase of ['eingang', 'ausgang']) {
    const q = istObjekt(d[phase]) ? d[phase] : {};
    const ql = istObjekt(dl[phase]) ? dl[phase] : {};
    for (const id of Object.keys(q)) {
      const wert = alsStufe(q[id]);
      if (!wert) continue;
      z.diagnose[phase][id] = wert;
      const lage = alsLage(ql[id]);
      if (lage !== null) z.diagnoseLage[phase][id] = lage;
    }
  }

  if (istObjekt(roh.stationen)) {
    for (const id of Object.keys(roh.stationen)) {
      const s = roh.stationen[id];
      if (!istObjekt(s)) continue;
      const schritt = alsZahl(s.schritt);
      z.stationen[id] = {
        geoeffnet: s.geoeffnet === true,
        rolle: ROLLEN.includes(s.rolle) ? s.rolle : null,
        schritt: schritt !== null && schritt >= 0 ? Math.floor(schritt) : 0
      };
    }
  }

  if (istObjekt(roh.aufgaben)) {
    for (const id of Object.keys(roh.aufgaben)) {
      const a = roh.aufgaben[id];
      if (!istObjekt(a)) continue;
      z.aufgaben[id] = {
        bearbeitet: a.bearbeitet === true,
        stufe: alsStufe(a.stufe !== undefined ? a.stufe : a.smiley),
        lage: alsLage(a.lage),
        punkte: alsZahl(a.punkte),
        kontrolle: alsKontrolle(a.kontrolle)
      };
    }
  }
  return z;
}

/* ---------- Öffentliche Schnittstelle ---------- */

/** Lädt den Zustand eines Themas. Liefert immer ein gültiges Objekt. */
export function laden(stufe, thema) {
  const roh = rohLesen(schluessel(stufe, thema));
  if (roh === undefined) return leererZustand(stufe, thema);
  let daten = null;
  try {
    daten = JSON.parse(roh);
  } catch (e) {
    console.warn('Gespeicherter Stand war unlesbar und wurde verworfen.', e);
    return leererZustand(stufe, thema);
  }
  return normalisiere(daten, stufe, thema);
}

export function speichern(z) {
  z.v = ZUSTAND_VERSION;
  z.aktualisiert = new Date().toISOString();
  return rohSchreiben(schluessel(z.stufe, z.thema), JSON.stringify(z));
}

/** Lädt, verändert über fn(zustand) und speichert. Gibt den neuen Zustand zurück. */
export function aendern(stufe, thema, fn) {
  const z = laden(stufe, thema);
  fn(z);
  speichern(z);
  return z;
}

export function zuruecksetzen(stufe, thema) {
  rohLoeschen(schluessel(stufe, thema));
}

/** Zuletzt genutztes Thema merken bzw. abfragen. */
export function merkeThema(stufe, thema, anzeige) {
  rohSchreiben(SCHLUESSEL_LETZTES, JSON.stringify({
    stufe, thema, anzeige: anzeige || '', ts: new Date().toISOString()
  }));
}

export function letztesThema() {
  const roh = rohLesen(SCHLUESSEL_LETZTES);
  if (!roh) return null;
  try {
    const d = JSON.parse(roh);
    if (istObjekt(d) && typeof d.stufe === 'string' && typeof d.thema === 'string') return d;
  } catch (e) { /* ignorieren */ }
  return null;
}

/** Inhalt der Exportdatei. */
export function exportDaten(z, themaTitel) {
  return {
    app: 'lerntheke',
    format: ZUSTAND_VERSION,
    exportiert: new Date().toISOString(),
    titel: themaTitel || '',
    zustand: z
  };
}

/**
 * Liest eine Exportdatei.
 * Ergebnis: { ok: true, zustand } oder { ok: false, fehler: '…' }
 */
export function importDaten(text, stufe, thema) {
  let d;
  try {
    d = JSON.parse(text);
  } catch (e) {
    return { ok: false, fehler: 'Die Datei ist keine gültige JSON-Datei.' };
  }
  const z = istObjekt(d) && istObjekt(d.zustand) ? d.zustand : d;
  if (!istObjekt(z)) return { ok: false, fehler: 'Die Datei enthält keinen Lerntheke-Stand.' };
  if (z.stufe && z.thema && (z.stufe !== stufe || z.thema !== thema)) {
    return {
      ok: false,
      fehler: 'Die Datei gehört zu einem anderen Thema (' + z.stufe + '/' + z.thema + ').'
    };
  }
  return { ok: true, zustand: normalisiere(z, stufe, thema) };
}
