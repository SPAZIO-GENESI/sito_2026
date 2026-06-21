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
      if (tag === 'P') { const i = walk(n); out += i ? '<p>' + i + '</p>' : ''; return; }
      if (tag === 'DIV') {
        const i = walk(n);
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
    },
  };
})();
