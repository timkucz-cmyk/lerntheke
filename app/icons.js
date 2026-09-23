/* Lerntheke – Symbole
   Strichzeichnungen aus dem LMG-Unterricht-Design-System (Lucide, ISC-Lizenz).
   Inline als Zeichenkette, damit zur Laufzeit keine weiteren Dateien geladen werden.
   Sie erben Farbe und Größe vom umgebenden Text (currentColor, 1em). */

const FORMEN = {
  einzel: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  partner: '<path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/>',
  gruppe: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  tandem: '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
  dauer: '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
  hilfsmittel: '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
  arbeitsblatt: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  loesung: '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
  tipp: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  ergebnis: '<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>',
  haken: '<path d="M20 6 9 17l-5-5"/>',
  empfohlen: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
};

/**
 * Liefert ein Symbol als Inline-SVG.
 * Rein dekorativ: Die Bedeutung steht immer auch als Text daneben.
 */
export function symbol(name) {
  const formen = FORMEN[name];
  if (!formen) return '';
  return '<svg class="sym" viewBox="0 0 24 24" width="1em" height="1em" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true" focusable="false">' + formen + '</svg>';
}

/** Symbolname zur Sozialform einer Station. */
export function sozialformSymbol(sozialform) {
  if (sozialform === 'partner') return symbol('partner');
  if (sozialform === 'gruppe') return symbol('gruppe');
  if (sozialform === 'tandem') return symbol('tandem');
  return symbol('einzel');
}

/* Gesichter der Selbsteinschätzung (Lucide frown/meh/smile).
   Als Zeichnung statt Emoji, damit sie rot, gelb und grün eingefärbt werden können. */
const GESICHTER = {
  unsicher: '<circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/>' +
    '<line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
  teils: '<circle cx="12" cy="12" r="10"/><line x1="8" x2="16" y1="15" y2="15"/>' +
    '<line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
  sicher: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>' +
    '<line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>'
};

/**
 * Gesicht zur Einschätzung "unsicher" | "teils" | "sicher".
 * Die Farbe kommt über die Klasse stufe-… aus dem Stylesheet.
 */
export function gesicht(stufe) {
  const formen = GESICHTER[stufe];
  if (!formen) return '';
  return '<svg class="gesicht stufe-' + stufe + '" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true" focusable="false">' + formen + '</svg>';
}

/** Mittlere Stufe der Skala: nur ein Punkt, die Gesichter stehen außen. */
export function skalaPunkt() {
  return '<svg class="gesicht stufe-teils" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<circle cx="12" cy="12" r="4" fill="currentColor"/></svg>';
}
