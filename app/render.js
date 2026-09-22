/* Lerntheke – Darstellung von Lösungstexten
   Markdown (Absätze, Überschriften, Listen, Tabellen, fett/kursiv/Code)
   plus Mathematik in $…$ und $$…$$.

   Mathematik wird mit KaTeX gesetzt, wenn unter vendor/katex/ eine lokale Kopie liegt.
   Fehlt sie, übernimmt ein eingebauter Ersatz-Renderer (deckt Schulmathematik ab).
   In beiden Fällen werden zur Laufzeit keine externen Adressen aufgerufen. */

const BASIS = new URL('../', import.meta.url);

let katexAktiv = false;

/** Liefert true, wenn KaTeX geladen wurde. */
export function katexVerfuegbar() {
  return katexAktiv;
}

function ladeStil(url) {
  return new Promise((ok, fehler) => {
    const el = document.createElement('link');
    el.rel = 'stylesheet';
    el.href = url;
    el.onload = () => ok();
    el.onerror = () => fehler(new Error('CSS nicht ladbar'));
    document.head.appendChild(el);
  });
}

function ladeSkript(url) {
  return new Promise((ok, fehler) => {
    const el = document.createElement('script');
    el.src = url;
    el.defer = true;
    el.onload = () => ok();
    el.onerror = () => fehler(new Error('Skript nicht ladbar'));
    document.head.appendChild(el);
  });
}

/** Sucht eine lokale KaTeX-Kopie und bindet sie ein. Schlägt sie fehl, bleibt der Ersatz aktiv. */
export async function mathematikVorbereiten() {
  const js = new URL('vendor/katex/katex.min.js', BASIS).href;
  const css = new URL('vendor/katex/katex.min.css', BASIS).href;
  try {
    const antwort = await fetch(js, { method: 'HEAD' });
    if (!antwort.ok) return false;
    await ladeStil(css);
    await ladeSkript(js);
    katexAktiv = !!(window.katex && typeof window.katex.renderToString === 'function');
  } catch (e) {
    katexAktiv = false;
  }
  return katexAktiv;
}

/* ---------- Escaping ---------- */

export function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------- Mathematik ---------- */

export function mathe(tex, block) {
  if (katexAktiv) {
    try {
      return window.katex.renderToString(tex, {
        displayMode: !!block,
        throwOnError: false,
        strict: false,
        output: 'html'
      });
    } catch (e) { /* unten weiter mit Ersatz */ }
  }
  const innen = texZuHtml(tex, !!block);
  return block
    ? '<span class="mathe mathe-block">' + innen + '</span>'
    : '<span class="mathe">' + innen + '</span>';
}

const SYMBOLE = {
  cdot: '·', times: '×', div: '÷', ast: '∗', pm: '±', mp: '∓',
  le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', ll: '≪', gg: '≫',
  approx: '≈', equiv: '≡', sim: '∼', propto: '∝', cong: '≅',
  infty: '∞', to: '→', rightarrow: '→', longrightarrow: '⟶', leftarrow: '←',
  Rightarrow: '⇒', Leftrightarrow: '⇔', leftrightarrow: '↔', iff: '⇔', implies: '⇒',
  mapsto: '↦', in: '∈', notin: '∉', subset: '⊂', subseteq: '⊆', supset: '⊃',
  cup: '∪', cap: '∩', setminus: '∖', emptyset: '∅', varnothing: '∅',
  forall: '∀', exists: '∃', neg: '¬', land: '∧', lor: '∨',
  partial: '∂', nabla: '∇', angle: '∠', circ: '∘', perp: '⊥', parallel: '∥',
  ldots: '…', dots: '…', cdots: '⋯', vdots: '⋮', prime: '′', ell: 'ℓ',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε',
  zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ',
  lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', rho: 'ρ', varrho: 'ϱ',
  sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'φ', varphi: 'φ', chi: 'χ',
  psi: 'ψ', omega: 'ω', pi: 'π',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π',
  Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  '%': '%', $: '$', '{': '{', '}': '}', '&': '&', _: '_', '#': '#',
  lbrace: '{', rbrace: '}', vert: '|', Vert: '‖', langle: '⟨', rangle: '⟩',
  lvert: '|', rvert: '|', lfloor: '⌊', rfloor: '⌋', lceil: '⌈', rceil: '⌉'
};

const FUNKTIONEN = ['sin', 'cos', 'tan', 'cot', 'arcsin', 'arccos', 'arctan',
  'sinh', 'cosh', 'tanh', 'ln', 'log', 'lg', 'exp', 'max', 'min', 'ggT', 'det', 'dim'];

const ABSTAENDE = { ',': '0.17em', ';': '0.28em', ':': '0.22em', ' ': '0.28em', quad: '1em', qquad: '2em', '!': '-0.17em' };

function zerlege(s) {
  const t = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '\\') {
      const m = /^[a-zA-Z]+/.exec(s.slice(i + 1));
      if (m) { t.push({ k: 'cmd', v: m[0] }); i += 1 + m[0].length; }
      else { t.push({ k: 'cmd', v: s[i + 1] || '' }); i += 2; }
    } else if (c === '{' || c === '}' || c === '^' || c === '_' || c === '&') {
      t.push({ k: c }); i += 1;
    } else if (/\s/.test(c)) {
      i += 1;
    } else if (/[0-9]/.test(c)) {
      const m = /^[0-9]+/.exec(s.slice(i));
      t.push({ k: 'num', v: m[0] }); i += m[0].length;
    } else {
      t.push({ k: 'chr', v: c }); i += 1;
    }
  }
  return t;
}

/** Wandelt TeX in einfaches HTML um. Unbekannte Befehle werden sichtbar markiert. */
export function texZuHtml(tex, block) {
  try {
    const ts = zerlege(String(tex));
    const p = { i: 0, block: !!block };
    const r = folge(ts, p);
    return r;
  } catch (e) {
    return '<span class="m-fehler">' + esc(tex) + '</span>';
  }
}

function folge(ts, p) {
  const teile = [];
  while (p.i < ts.length && ts[p.i].k !== '}') {
    const t = ts[p.i];
    if (t.k === '^' || t.k === '_') {
      p.i += 1;
      const inhalt = gruppe(ts, p);
      const basis = teile.pop() || { html: '' };
      teile.push(skript(basis, t.k, inhalt, ts, p));
      continue;
    }
    teile.push(atom(ts, p));
  }
  return teile.map((a) => a.html).join('');
}

function gruppe(ts, p) {
  const t = ts[p.i];
  if (!t) return '';
  if (t.k === '{') {
    p.i += 1;
    const h = folge(ts, p);
    if (ts[p.i] && ts[p.i].k === '}') p.i += 1;
    return h;
  }
  return atom(ts, p).html;
}

function skript(basis, art, inhalt, ts, p) {
  let hoch = art === '^' ? inhalt : null;
  let tief = art === '_' ? inhalt : null;
  const naechstes = ts[p.i];
  if (naechstes && (naechstes.k === '^' || naechstes.k === '_') && naechstes.k !== art) {
    p.i += 1;
    const zweites = gruppe(ts, p);
    if (naechstes.k === '^') hoch = zweites; else tief = zweites;
  }
  if (basis.op === 'gross' && p.block) {
    return {
      html: '<span class="m-limits">' +
        (hoch ? '<span class="m-oben">' + hoch + '</span>' : '') +
        '<span class="m-gross">' + basis.html + '</span>' +
        (tief ? '<span class="m-unten">' + tief + '</span>' : '') +
        '</span>'
    };
  }
  if (hoch && tief) {
    return {
      html: basis.html + '<span class="m-subsup"><span>' + hoch + '</span><span>' + tief + '</span></span>'
    };
  }
  if (hoch) return { html: basis.html + '<sup class="m-sup">' + hoch + '</sup>' };
  return { html: basis.html + '<sub class="m-sub">' + tief + '</sub>' };
}

function abstand(breite) {
  return { html: '<span style="display:inline-block;width:' + breite + '"></span>' };
}

function atom(ts, p) {
  const t = ts[p.i];
  p.i += 1;
  if (!t) return { html: '' };

  if (t.k === '{') {
    p.i -= 1;
    return { html: '<span>' + gruppe(ts, p) + '</span>' };
  }
  if (t.k === '&') return abstand('0.6em');
  if (t.k === 'num') return { html: esc(t.v) };
  if (t.k === 'chr') {
    const c = t.v;
    if (/[a-zA-Z]/.test(c)) return { html: '<i>' + esc(c) + '</i>' };
    if (c === '-') return { html: '−' };
    if (c === "'") return { html: '′' };
    return { html: esc(c) };
  }

  const b = t.v;

  if (b === 'frac' || b === 'dfrac' || b === 'tfrac' || b === 'cfrac') {
    const z = gruppe(ts, p);
    const n = gruppe(ts, p);
    return {
      html: '<span class="m-frac"><span class="m-zaehler">' + z + '</span><span class="m-nenner">' + n + '</span></span>'
    };
  }
  if (b === 'sqrt') {
    let grad = '';
    if (ts[p.i] && ts[p.i].k === 'chr' && ts[p.i].v === '[') {
      p.i += 1;
      const teile = [];
      while (ts[p.i] && !(ts[p.i].k === 'chr' && ts[p.i].v === ']')) teile.push(atom(ts, p).html);
      if (ts[p.i]) p.i += 1;
      grad = teile.join('');
    }
    const inhalt = gruppe(ts, p);
    return {
      html: '<span class="m-sqrt">' + (grad ? '<sup class="m-sup">' + grad + '</sup>' : '') +
        '<span>√</span><span class="m-rad">' + inhalt + '</span></span>'
    };
  }
  if (b === 'text' || b === 'textrm' || b === 'textbf' || b === 'mathrm' || b === 'mathbf' ||
      b === 'mathit' || b === 'mathbb' || b === 'mathcal' || b === 'operatorname' || b === 'mathsf') {
    const inhalt = gruppe(ts, p);
    const fett = (b === 'textbf' || b === 'mathbf') ? ' style="font-weight:700"' : '';
    return { html: '<span class="m-txt"' + fett + '>' + inhalt + '</span>' };
  }
  if (b === 'bar' || b === 'overline') {
    return { html: '<span class="m-ueber">' + gruppe(ts, p) + '</span>' };
  }
  if (b === 'vec') return { html: '<span>' + gruppe(ts, p) + '⃗</span>' };
  if (b === 'hat') return { html: '<span>' + gruppe(ts, p) + '̂</span>' };
  if (b === 'left' || b === 'right') {
    const d = ts[p.i];
    if (d) {
      p.i += 1;
      if (d.k === 'chr' && d.v === '.') return { html: '' };
      const z = d.k === 'cmd' ? (SYMBOLE[d.v] || '') : d.v;
      return { html: '<span class="m-delim">' + esc(z) + '</span>' };
    }
    return { html: '' };
  }
  if (b === 'int' || b === 'iint' || b === 'oint') {
    const z = b === 'iint' ? '∬' : b === 'oint' ? '∮' : '∫';
    return { html: '<span class="m-op">' + z + '</span>', op: 'seite' };
  }
  if (b === 'sum') return { html: '<span class="m-op">∑</span>', op: 'gross' };
  if (b === 'prod') return { html: '<span class="m-op">∏</span>', op: 'gross' };
  if (b === 'lim') return { html: '<span class="m-txt">lim</span>', op: 'gross' };
  if (b === 'begin' || b === 'end') { gruppe(ts, p); return { html: '' }; }
  if (b === '\\') return { html: p.block ? '<br>' : ' ' };
  if (Object.prototype.hasOwnProperty.call(ABSTAENDE, b)) return abstand(ABSTAENDE[b]);
  if (FUNKTIONEN.includes(b)) return { html: '<span class="m-txt">' + b + '</span>' };
  if (Object.prototype.hasOwnProperty.call(SYMBOLE, b)) return { html: esc(SYMBOLE[b]) };

  return { html: '<span class="m-fehler">\\' + esc(b) + '</span>' };
}

/* ---------- Markdown ---------- */

const MARKE = ' ';

/** Schneidet $…$ und $$…$$ heraus, damit Markdown sie nicht anfasst. */
function mathHerausloesen(text) {
  const stuecke = [];
  let out = '';
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '\\' && (text[i + 1] === '$')) { out += '$'; i += 2; continue; }
    if (c === '$') {
      const block = text[i + 1] === '$';
      const trenner = block ? '$$' : '$';
      const ende = text.indexOf(trenner, i + trenner.length);
      if (ende === -1) { out += c; i += 1; continue; }
      const inhalt = text.slice(i + trenner.length, ende);
      out += MARKE + 'm' + stuecke.length + MARKE;
      stuecke.push({ tex: inhalt, block });
      i = ende + trenner.length;
      continue;
    }
    out += c;
    i += 1;
  }
  return { text: out, stuecke };
}

function inline(s) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((?!javascript:)([^)\s]+)\)/gi, '<a href="$2" rel="noopener">$1</a>');
}

function tabelle(zeilen) {
  const zellen = (z) => z.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
  const kopf = zellen(zeilen[0]);
  const rest = zeilen.slice(2);
  let h = '<div class="tab-umbruch"><table><thead><tr>';
  h += kopf.map((c) => '<th>' + inline(c) + '</th>').join('');
  h += '</tr></thead><tbody>';
  for (const z of rest) {
    h += '<tr>' + zellen(z).map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>';
  }
  return h + '</tbody></table></div>';
}

function istTrennzeile(z) {
  return /^\s*\|?[\s:-]*-[-\s:|]*\|?\s*$/.test(z) && z.includes('-');
}

/** Markdown mit Mathematik zu HTML. Der Text wird vollständig escaped. */
export function markdown(text) {
  if (!text) return '';
  const { text: roh, stuecke } = mathHerausloesen(String(text));
  const zeilen = esc(roh).replace(/\r\n?/g, '\n').split('\n');
  let html = '';
  let i = 0;

  while (i < zeilen.length) {
    const z = zeilen[i];

    if (!z.trim()) { i += 1; continue; }

    const ueber = /^(#{1,4})\s+(.*)$/.exec(z);
    if (ueber) {
      const stufe = Math.min(ueber[1].length + 2, 6);
      html += '<h' + stufe + '>' + inline(ueber[2]) + '</h' + stufe + '>';
      i += 1;
      continue;
    }

    if (z.trim().startsWith('|') && zeilen[i + 1] && istTrennzeile(zeilen[i + 1])) {
      const block = [];
      while (i < zeilen.length && zeilen[i].trim().startsWith('|')) { block.push(zeilen[i]); i += 1; }
      html += tabelle(block);
      continue;
    }

    if (/^\s*[-*+]\s+/.test(z)) {
      html += '<ul>';
      while (i < zeilen.length && /^\s*[-*+]\s+/.test(zeilen[i])) {
        html += '<li>' + inline(zeilen[i].replace(/^\s*[-*+]\s+/, '')) + '</li>';
        i += 1;
      }
      html += '</ul>';
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(z)) {
      html += '<ol>';
      while (i < zeilen.length && /^\s*\d+[.)]\s+/.test(zeilen[i])) {
        html += '<li>' + inline(zeilen[i].replace(/^\s*\d+[.)]\s+/, '')) + '</li>';
        i += 1;
      }
      html += '</ol>';
      continue;
    }

    const absatz = [];
    while (i < zeilen.length && zeilen[i].trim() && !/^\s*[-*+#|]|^\s*\d+[.)]\s/.test(zeilen[i])) {
      absatz.push(zeilen[i].trim());
      i += 1;
    }
    if (absatz.length) html += '<p>' + inline(absatz.join(' ')) + '</p>';
    else i += 1;
  }

  return html.replace(new RegExp(MARKE + 'm(\\d+)' + MARKE, 'g'), (_, n) => {
    const s = stuecke[Number(n)];
    return s ? mathe(s.tex, s.block) : '';
  });
}
