/* qr-teilen.js – QR-Code der aktuellen Seite oben rechts (LMG-Plattformen)
 *
 * Tim, 23.11.2026: In allen Lerntheken und Simulationen oben rechts ein QR-Code, damit die
 * Lehrkraft die Seite bequem mit den Schülerinnen und Schülern teilen kann.
 *
 * Eigenständig, ohne Abhängigkeiten, klassisches Skript (läuft auch über file://).
 * Gleiche Datei in beiden Repos: Lerntheke/app/qr-teilen.js und Simulationen/assets/qr-teilen.js.
 *
 * Einbau
 *   <script src="…/qr-teilen.js" defer></script>
 *   Automatisch eingehängt wird der Knopf in
 *     – header.top mit .backlink (Simulationen): Zeile „← Alle Simulationen … [QR]“
 *     – header.kopf .krumen (Katalog der Simulationen)
 *     – .st-leiste-innen (Startseiten im LMG-Design)
 *     – jedes Element mit [data-qr-teilen] (leerer Platzhalter, wird zum Knopf)
 *   Seiten, die ihren Kopf selbst zeichnen (Lerntheke), setzen QRTeilen.knopfHtml() ein.
 *   Klick auf .qr-knopf öffnet ein Fenster mit großem QR-Code der aktuellen Adresse.
 *
 * Farben: nur LMG-Tokenwerte (#fff, #17181a, #f6f6f4) bzw. Systemfarben Canvas/CanvasText; der QR-Code selbst ist immer schwarz auf weiß.
 *
 * QR-Encoder: Byte-Modus (UTF-8), Fehlerkorrektur M, Version 1–40, Maskenwahl nach
 * Strafpunkten (ISO/IEC 18004). Nach dem Verfahren von Nayuki (MIT) neu geschrieben;
 * gegen die Python-Bibliothek „qrcode“ für alle Versionen und Masken geprüft.
 */
(function () {
  'use strict';
  if (window.QRTeilen) return;

  /* ═════════════════════════════ Encoder ═════════════════════════════ */

  // Index 0 unbenutzt; Zeilen: L, M, Q, H
  var ECC_JE_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  ];
  var BLOECKE = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  ];
  var FORMAT_ECL = [1, 0, 3, 2]; // L, M, Q, H → Formatbits

  function bit(x, i) { return ((x >>> i) & 1) !== 0; }

  function rohModule(ver) {
    var r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var n = Math.floor(ver / 7) + 2;
      r -= (25 * n - 10) * n - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }
  function datenWoerter(ver, ecl) {
    return Math.floor(rohModule(ver) / 8) - ECC_JE_BLOCK[ecl][ver] * BLOECKE[ecl][ver];
  }

  // Reed-Solomon über GF(2^8), Polynom 0x11D
  function rsMal(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
  function rsTeiler(grad) {
    var r = [], i, j, wurzel = 1;
    for (i = 0; i < grad - 1; i++) r.push(0);
    r.push(1);
    for (i = 0; i < grad; i++) {
      for (j = 0; j < r.length; j++) {
        r[j] = rsMal(r[j], wurzel);
        if (j + 1 < r.length) r[j] ^= r[j + 1];
      }
      wurzel = rsMal(wurzel, 0x02);
    }
    return r;
  }
  function rsRest(daten, teiler) {
    var r = teiler.map(function () { return 0; });
    daten.forEach(function (b) {
      var f = b ^ r.shift();
      r.push(0);
      teiler.forEach(function (k, i) { r[i] ^= rsMal(k, f); });
    });
    return r;
  }

  function utf8(text) {
    if (window.TextEncoder) return Array.prototype.slice.call(new TextEncoder().encode(text));
    var s = unescape(encodeURIComponent(text)), r = [];
    for (var i = 0; i < s.length; i++) r.push(s.charCodeAt(i));
    return r;
  }

  /**
   * Erzeugt die Modulmatrix (true = dunkel) ohne Ruhezone.
   * o = { ecl: 0–3 (Standard 1 = M), version: fest, maske: fest (0–7) } – fest nur für Tests.
   */
  function erzeuge(text, o) {
    o = o || {};
    var ecl = o.ecl == null ? 1 : o.ecl;
    var bytes = utf8(text);
    var ver, cap;
    for (ver = o.version || 1; ver <= 40; ver++) {
      cap = datenWoerter(ver, ecl) * 8;
      if (4 + (ver < 10 ? 8 : 16) + bytes.length * 8 <= cap) break;
      if (o.version) throw new Error('Text passt nicht in Version ' + o.version);
    }
    if (ver > 40) throw new Error('Text zu lang für einen QR-Code');

    // Bitstrom: Modus 0100, Länge, Daten, Abschluss, Füllbytes
    var bits = [];
    function anhaengen(wert, n) { for (var i = n - 1; i >= 0; i--) bits.push((wert >>> i) & 1); }
    anhaengen(4, 4);
    anhaengen(bytes.length, ver < 10 ? 8 : 16);
    bytes.forEach(function (b) { anhaengen(b, 8); });
    anhaengen(0, Math.min(4, cap - bits.length));
    anhaengen(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) anhaengen(pad, 8);
    var daten = [];
    for (var i = 0; i < bits.length; i += 8) {
      var w = 0;
      for (var j = 0; j < 8; j++) w = (w << 1) | bits[i + j];
      daten.push(w);
    }

    // Fehlerkorrektur und Verschränkung
    var nBloecke = BLOECKE[ecl][ver], eccLaenge = ECC_JE_BLOCK[ecl][ver];
    var roh = Math.floor(rohModule(ver) / 8);
    var nKurz = nBloecke - roh % nBloecke, kurzLaenge = Math.floor(roh / nBloecke);
    var teiler = rsTeiler(eccLaenge), bloecke = [], k = 0;
    for (i = 0; i < nBloecke; i++) {
      var dat = daten.slice(k, k + kurzLaenge - eccLaenge + (i < nKurz ? 0 : 1));
      k += dat.length;
      var ecc = rsRest(dat, teiler);
      if (i < nKurz) dat.push(0);
      bloecke.push(dat.concat(ecc));
    }
    var woerter = [];
    for (i = 0; i < bloecke[0].length; i++) {
      for (j = 0; j < bloecke.length; j++) {
        if (i !== kurzLaenge - eccLaenge || j >= nKurz) woerter.push(bloecke[j][i]);
      }
    }

    // Matrix
    var n = ver * 4 + 17, mod = [], fkt = [];
    for (i = 0; i < n; i++) { mod.push(new Array(n).fill(false)); fkt.push(new Array(n).fill(false)); }
    function setze(x, y, dunkel) { mod[y][x] = dunkel; fkt[y][x] = true; }

    function finder(x, y) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < n && yy >= 0 && yy < n) setze(xx, yy, d !== 2 && d !== 4);
      }
    }
    function ausrichtung(x, y) {
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++)
        setze(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    function formatBits(maske) {
      var d = FORMAT_ECL[ecl] << 3 | maske, r = d;
      for (var i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      var b = (d << 10 | r) ^ 0x5412;
      for (i = 0; i <= 5; i++) setze(8, i, bit(b, i));
      setze(8, 7, bit(b, 6));
      setze(8, 8, bit(b, 7));
      setze(7, 8, bit(b, 8));
      for (i = 9; i < 15; i++) setze(14 - i, 8, bit(b, i));
      for (i = 0; i < 8; i++) setze(n - 1 - i, 8, bit(b, i));
      for (i = 8; i < 15; i++) setze(8, n - 15 + i, bit(b, i));
      setze(8, n - 8, true);
    }

    for (i = 0; i < n; i++) { setze(6, i, i % 2 === 0); setze(i, 6, i % 2 === 0); }
    finder(3, 3); finder(n - 4, 3); finder(3, n - 4);
    if (ver > 1) {
      var nA = Math.floor(ver / 7) + 2;
      var schritt = Math.floor((ver * 8 + nA * 3 + 5) / (nA * 4 - 4)) * 2;
      var pos = [6];
      for (var p = n - 7; pos.length < nA; p -= schritt) pos.splice(1, 0, p);
      for (i = 0; i < nA; i++) for (j = 0; j < nA; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === nA - 1) || (i === nA - 1 && j === 0)) continue;
        ausrichtung(pos[i], pos[j]);
      }
    }
    formatBits(0);
    if (ver >= 7) {
      var r = ver;
      for (i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
      var vb = ver << 12 | r;
      for (i = 0; i < 18; i++) {
        var a = n - 11 + i % 3, b2 = Math.floor(i / 3);
        setze(a, b2, bit(vb, i)); setze(b2, a, bit(vb, i));
      }
    }

    // Datenmodule im Zickzack
    var z = 0;
    for (var rechts = n - 1; rechts >= 1; rechts -= 2) {
      if (rechts === 6) rechts = 5;
      for (var v = 0; v < n; v++) for (j = 0; j < 2; j++) {
        var x = rechts - j, auf = ((rechts + 1) & 2) === 0, y = auf ? n - 1 - v : v;
        if (!fkt[y][x] && z < woerter.length * 8) {
          mod[y][x] = bit(woerter[z >>> 3], 7 - (z & 7));
          z++;
        }
      }
    }

    function maskiere(m) {
      for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
        var inv;
        switch (m) {
          case 0: inv = (x + y) % 2 === 0; break;
          case 1: inv = y % 2 === 0; break;
          case 2: inv = x % 3 === 0; break;
          case 3: inv = (x + y) % 3 === 0; break;
          case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: inv = x * y % 2 + x * y % 3 === 0; break;
          case 6: inv = (x * y % 2 + x * y % 3) % 2 === 0; break;
          default: inv = ((x + y) % 2 + x * y % 3) % 2 === 0;
        }
        if (!fkt[y][x] && inv) mod[y][x] = !mod[y][x];
      }
    }

    function strafe() {
      var s = 0, x, y;
      function verlaufNeu(laenge, h) { if (h[0] === 0) laenge += n; h.pop(); h.unshift(laenge); }
      function muster(h) {
        var m = h[1], kern = m > 0 && h[2] === m && h[3] === m * 3 && h[4] === m && h[5] === m;
        return (kern && h[0] >= m * 4 && h[6] >= m ? 1 : 0) + (kern && h[6] >= m * 4 && h[0] >= m ? 1 : 0);
      }
      function ende(farbe, laenge, h) {
        if (farbe) { verlaufNeu(laenge, h); laenge = 0; }
        verlaufNeu(laenge + n, h);
        return muster(h);
      }
      function linie(get) {
        var farbe = false, lauf = 0, h = [0, 0, 0, 0, 0, 0, 0];
        for (var t = 0; t < n; t++) {
          if (get(t) === farbe) {
            lauf++;
            if (lauf === 5) s += 3; else if (lauf > 5) s++;
          } else {
            verlaufNeu(lauf, h);
            if (!farbe) s += muster(h) * 40;
            farbe = get(t);
            lauf = 1;
          }
        }
        s += ende(farbe, lauf, h) * 40;
      }
      for (y = 0; y < n; y++) linie(function (t) { return mod[y][t]; });
      for (x = 0; x < n; x++) linie(function (t) { return mod[t][x]; });
      for (y = 0; y < n - 1; y++) for (x = 0; x < n - 1; x++) {
        var c = mod[y][x];
        if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) s += 3;
      }
      var dunkel = 0;
      mod.forEach(function (zeile) { zeile.forEach(function (d) { if (d) dunkel++; }); });
      var ges = n * n;
      s += (Math.ceil(Math.abs(dunkel * 20 - ges * 10) / ges) - 1) * 10;
      return s;
    }

    var maske = o.maske;
    if (maske == null) {
      var beste = Infinity;
      for (var m = 0; m < 8; m++) {
        maskiere(m); formatBits(m);
        var st = strafe();
        if (st < beste) { beste = st; maske = m; }
        maskiere(m);
      }
    }
    maskiere(maske);
    formatBits(maske);
    return mod;
  }

  /** SVG mit Ruhezone (4 Module), schwarz auf weiß – unabhängig vom Farbschema. */
  function svg(text, o) {
    o = o || {};
    var m = erzeuge(text, o), n = m.length, rand = 4, g = n + 2 * rand, pfad = '';
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++)
      if (m[y][x]) pfad += 'M' + (x + rand) + ' ' + (y + rand) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + g + ' ' + g + '"' +
      (o.klasse ? ' class="' + o.klasse + '"' : '') +
      ' shape-rendering="crispEdges" role="img" aria-label="' + (o.label || 'QR-Code') + '">' +
      '<rect width="' + g + '" height="' + g + '" fill="#fff"/><path d="' + pfad + '" fill="#000"/></svg>';
  }

  /* ═════════════════════════════ Knopf und Fenster ═════════════════════════════ */

  var CSS =
    '.qr-knopf{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:4px 12px 4px 4px;margin:0;' +
    'border:1px solid rgba(0,0,0,.18);border-radius:10px;background:#fff;color:#17181a;font:inherit;font-size:15px;' +
    'font-weight:600;line-height:1;cursor:pointer;flex:none;white-space:nowrap}' +
    '.qr-knopf:hover{background:#f6f6f4}' +
    '.qr-knopf:focus-visible{outline:2px solid currentColor;outline-offset:2px}' +
    '.qr-knopf svg{width:34px;height:34px;display:block}' +
    '@media (max-width:599px){.qr-knopf{padding:4px}.qr-knopf .qr-text{display:none}}' +
    '.qr-zeile{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 10px}' +
    '.qr-zeile > .backlink,.qr-zeile > .krumen{margin:0}' +
    '.st-leiste-innen > .qr-knopf{margin-left:auto}' +
    '.qr-fenster{border:0;border-radius:16px;padding:20px;width:min(92vw,640px);max-height:94vh;' +
    'background:Canvas;color:CanvasText;box-shadow:0 20px 60px rgba(0,0,0,.35)}' +
    '.qr-fenster::backdrop{background:rgba(10,12,14,.72)}' +
    '.qr-fenster h2{margin:0 0 4px;font-size:20px;line-height:1.25}' +
    '.qr-fenster .qr-gross{display:block;width:min(100%,72vh);height:auto;margin:12px auto;border-radius:8px}' +
    '.qr-fenster .qr-url{margin:0;font-size:14px;word-break:break-all;opacity:.8;text-align:center}' +
    '.qr-fenster .qr-knoepfe{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px}' +
    '.qr-fenster button{min-height:44px;padding:0 18px;border-radius:10px;border:1px solid rgba(127,127,127,.5);' +
    'background:transparent;color:inherit;font:inherit;font-weight:600;cursor:pointer}' +
    '.qr-fenster button.qr-primaer{background:CanvasText;border-color:CanvasText;color:Canvas}' +
    '@media print{.qr-knopf,.qr-fenster{display:none!important}}';

  var ICON = '<svg viewBox="0 0 29 29" aria-hidden="true" shape-rendering="crispEdges">' +
    '<rect width="29" height="29" fill="#fff"/><path fill="#000" d="' +
    'M2 2h9v9h-9zM4 4v5h5v-5zM5 5h3v3h-3z' +
    'M18 2h9v9h-9zM20 4v5h5v-5zM21 5h3v3h-3z' +
    'M2 18h9v9h-9zM4 20v5h5v-5zM5 21h3v3h-3z' +
    'M13 2h2v2h-2zM13 6h3v3h-3zM13 11h2v2h-2zM2 13h3v2h-3zM7 13h4v2h-4zM13 14h3v3h-3zM18 13h2v3h-2z' +
    'M22 13h5v2h-5zM18 18h3v3h-3zM23 18h4v2h-4zM13 19h2v2h-2zM13 23h3v4h-3zM18 23h2v4h-2zM22 22h2v2h-2zM25 24h2v3h-2z"/></svg>';

  function knopfHtml() {
    return '<button type="button" class="qr-knopf noprint" title="QR-Code dieser Seite zum Teilen anzeigen" ' +
      'aria-label="QR-Code dieser Seite zum Teilen anzeigen" aria-haspopup="dialog">' + ICON +
      '<span class="qr-text">QR-Code</span></button>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  var fenster = null;
  function oeffnen() {
    var url = location.href;
    if (!fenster) {
      fenster = document.createElement('dialog');
      fenster.className = 'qr-fenster';
      fenster.setAttribute('aria-labelledby', 'qr-fenster-titel');
      fenster.addEventListener('click', function (e) {
        if (e.target === fenster) fenster.close();           // Klick auf den Hintergrund
        var b = e.target.closest && e.target.closest('button[data-qr]');
        if (!b) return;
        if (b.dataset.qr === 'zu') fenster.close();
        if (b.dataset.qr === 'kopieren') kopieren(b, fenster.dataset.url);
      });
      document.body.appendChild(fenster);
    }
    fenster.dataset.url = url;
    var titel = (document.querySelector('h1') || {}).textContent || document.title;
    fenster.innerHTML =
      '<h2 id="qr-fenster-titel">' + esc(titel.trim()) + '</h2>' +
      svg(url, { klasse: 'qr-gross', label: 'QR-Code: ' + esc(url) }) +
      '<p class="qr-url">' + esc(url) + '</p>' +
      '<div class="qr-knoepfe"><button type="button" data-qr="kopieren">Link kopieren</button>' +
      '<button type="button" class="qr-primaer" data-qr="zu">Schließen</button></div>';
    if (fenster.showModal) fenster.showModal(); else fenster.setAttribute('open', '');
  }

  function kopieren(knopf, url) {
    function fertig(ok) {
      knopf.textContent = ok ? 'Kopiert' : 'Kopieren nicht möglich';
      setTimeout(function () { knopf.textContent = 'Link kopieren'; }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { fertig(true); }, function () { fertig(false); });
    } else fertig(false);
  }

  function einhaengen(wurzel) {
    wurzel = wurzel || document;
    // Simulationen: Zeile mit Zurück-Link
    wurzel.querySelectorAll('header.top > .backlink, header.kopf .krumen').forEach(function (el) {
      if (el.parentNode.classList.contains('qr-zeile')) return;
      var zeile = document.createElement('div');
      zeile.className = 'qr-zeile';
      el.parentNode.insertBefore(zeile, el);
      zeile.appendChild(el);
      zeile.insertAdjacentHTML('beforeend', knopfHtml());
    });
    wurzel.querySelectorAll('.st-leiste-innen').forEach(function (el) {
      if (!el.querySelector('.qr-knopf')) el.insertAdjacentHTML('beforeend', knopfHtml());
    });
    wurzel.querySelectorAll('[data-qr-teilen]').forEach(function (el) {
      if (el.classList.contains('qr-knopf')) return;
      var t = document.createElement('template');
      t.innerHTML = knopfHtml();
      el.replaceWith(t.content.firstChild);
    });
  }

  function start() {
    if (!document.getElementById('qr-teilen-css')) {
      var st = document.createElement('style');
      st.id = 'qr-teilen-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    einhaengen();
  }

  document.addEventListener('click', function (e) {
    var k = e.target.closest && e.target.closest('.qr-knopf');
    if (k) { e.preventDefault(); oeffnen(); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.QRTeilen = { erzeuge: erzeuge, svg: svg, knopfHtml: knopfHtml, oeffnen: oeffnen, einhaengen: einhaengen };
})();
