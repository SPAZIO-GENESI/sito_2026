// Mini editor visuale (zero dipendenze) per i campi bio.
// Produce solo i tag ammessi: b, i, br, hr, p, a[href]. Il server sanifica comunque.
(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // DOM (contenteditable) -> HTML ristretto
  function walk(node) {
    let out = '';
    node.childNodes.forEach(function (n) {
      if (n.nodeType === 3) { out += esc(n.nodeValue); return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName;
      if (tag === 'BR') { out += '<br>'; return; }
      if (tag === 'HR') { out += '<hr>'; return; }
      if (tag === 'B' || tag === 'STRONG') { const i = walk(n); out += i.trim() ? '<b>' + i + '</b>' : i; return; }
      if (tag === 'I' || tag === 'EM') { const i = walk(n); out += i.trim() ? '<i>' + i + '</i>' : i; return; }
      if (tag === 'A') {
        const href = n.getAttribute('href') || '';
        const i = walk(n);
        out += /^(https?:|mailto:)/i.test(href) ? '<a href="' + href + '">' + i + '</a>' : i;
        return;
      }
      if (tag === 'P') {
        const i = walk(n);
        const ta = (n.style && n.style.textAlign) || '';
        const al = ta === 'center' || ta === 'right' ? ta : '';
        out += i ? (al ? '<p style="text-align:' + al + '">' + i + '</p>' : '<p>' + i + '</p>') : '';
        return;
      }
      if (tag === 'UL' || tag === 'OL') {
        let items = '';
        n.childNodes.forEach(function (c) { if (c.nodeType === 1 && c.tagName === 'LI') items += '<li>' + walk(c) + '</li>'; });
        out += items ? '<ul>' + items + '</ul>' : '';
        return;
      }
      if (tag === 'LI') { out += '<li>' + walk(n) + '</li>'; return; }
      if (tag === 'DIV') {
        const i = walk(n);
        const ta = (n.style && n.style.textAlign) || '';
        const al = ta === 'center' || ta === 'right' ? ta : '';
        if (al) { if (i) out += '<p style="text-align:' + al + '">' + i + '</p>'; return; }
        if (out && !/(<br>|<\/p>|<hr>)\s*$/.test(out)) out += '<br>';
        out += i;
        return;
      }
      out += walk(n); // span / sconosciuti: scarta il tag, tieni il contenuto
    });
    return out;
  }

  window.VisualEditor = {
    serialize: function (el) {
      return walk(el).replace(/(\s*<br>\s*)+$/g, '').trim();
    },
    setHTML: function (el, html) {
      el.innerHTML = html || '';
    },
    attach: function (editable, toolbar) {
      toolbar.querySelectorAll('[data-cmd]').forEach(function (btn) {
        btn.addEventListener('mousedown', function (e) {
          e.preventDefault();
          editable.focus();
          const cmd = btn.getAttribute('data-cmd');
          if (cmd === 'createLink') {
            const url = prompt('Indirizzo del link (https://… oppure mailto:…):', 'https://');
            if (url) document.execCommand('createLink', false, url);
          } else {
            document.execCommand(cmd, false, null);
          }
        });
      });
      // pulsanti di allineamento paragrafo (icone standard, aggiunti una volta per toolbar)
      if (!toolbar.querySelector('[data-cmd="justifyCenter"]')) {
        const svg = function (lines) {
          return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + lines + '</svg>';
        };
        const icons = {
          justifyLeft: svg('<line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/>'),
          justifyCenter: svg('<line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="19" y1="18" x2="5" y2="18"/>'),
          justifyRight: svg('<line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/>'),
        };
        [['justifyLeft', 'Allinea a sinistra'], ['justifyCenter', 'Centra'], ['justifyRight', 'Allinea a destra']].forEach(function (a) {
          const b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('data-cmd', a[0]);
          b.title = a[1];
          b.setAttribute('aria-label', a[1]);
          b.className = 'px-2 py-1 rounded hover:bg-muted inline-flex items-center';
          b.innerHTML = icons[a[0]];
          b.addEventListener('mousedown', function (e) { e.preventDefault(); editable.focus(); document.execCommand(a[0], false, null); });
          toolbar.appendChild(b);
        });
      }
    },
  };
})();
