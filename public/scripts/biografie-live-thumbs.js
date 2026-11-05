// Aggiorna le miniature dell'elenco col ritratto corrente (D1), così riflette
// le modifiche fatte dagli artisti senza attendere un rebuild.
(async () => {
  try {
    const r = await fetch('https://artisti-api.it-e3f.workers.dev/api/portraits', { cache: 'no-store' });
    if (!r.ok) return;
    const { portraits } = await r.json();
    for (const p of portraits || []) {
      const card = document.querySelector('[data-cartella="' + p.cartella + '"]');
      if (!card) continue;
      // nome
      if (p.nome) {
        let nm = p.nome;
        try { nm = decodeURIComponent(p.nome); } catch (e) {}
        const h3 = card.querySelector('h3');
        if (h3 && h3.textContent !== nm) h3.textContent = nm;
        card.dataset.nome = nm.toLowerCase();
      }
      // estratto bio
      if (typeof p.abstract === 'string') {
        const ab = card.querySelector('p');
        if (ab && ab.textContent !== p.abstract) ab.textContent = p.abstract;
      }
      // ritratto
      if (p.portrait) {
        const box = card.querySelector('[data-thumb]');
        if (box) {
          const src = /^https?:\/\//.test(p.portrait) ? p.portrait : '/biografie/' + p.cartella + '/' + p.portrait;
          const cur = box.querySelector('img');
          if (cur) { if (cur.getAttribute('src') !== src) cur.setAttribute('src', src); }
          else {
            const im = document.createElement('img');
            im.src = src; im.alt = ''; im.loading = 'lazy';
            im.className = 'w-full h-full object-cover group-hover:opacity-80 transition-opacity';
            box.innerHTML = '';
            box.appendChild(im);
          }
        }
      }
    }
  } catch (e) {}
})();
