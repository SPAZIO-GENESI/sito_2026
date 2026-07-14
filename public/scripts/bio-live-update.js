// Aggiornamento "live": sovrascrive bio/abstract/link col dato fresco dalla D1.
// Il contenuto del build resta come fallback (e per SEO/crawler).
// La cartella dell'artista si ricava dal percorso (/biografie/<cartella>/),
// invece che da un valore iniettato server-side: pagina identica per tutti gli artisti.
(async () => {
  try {
    const WORKER_URL = 'https://artisti-api.it-e3f.workers.dev';
    const parts = location.pathname.split('/').filter(Boolean);
    const cartella = parts[parts.indexOf('biografie') + 1];
    if (!cartella) return;

    const r = await fetch(WORKER_URL + '/api/bio?cartella=' + encodeURIComponent(cartella), { cache: 'no-store' });
    if (!r.ok) return;
    const a = await r.json();
    if (a.error) return;
    if (typeof a.bio === 'string' && a.bio) {
      const full = document.getElementById('bio-full');
      if (full) full.innerHTML = a.bio;
      const abs = document.getElementById('bio-abstract');
      if (abs) {
        const plain = a.bio.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        abs.textContent = plain.length > 300 ? plain.slice(0, 300).replace(/\s\S*$/, '') + '…' : plain;
      }
    }
    const ig = document.getElementById('lnk-ig');
    if (ig && a.ig) { ig.href = 'https://www.instagram.com/' + a.ig; const t = ig.querySelector('[data-igtext]'); if (t) t.textContent = 'Instagram @' + a.ig; }
    const soc = document.getElementById('lnk-social');
    if (soc && a.social) { soc.href = a.social; const t = soc.querySelector('[data-soctext]'); if (t) t.textContent = a.social; }
    const pf = document.getElementById('lnk-portfolio');
    if (pf && a.portfolio) { pf.href = /^https?:\/\//i.test(a.portfolio) ? a.portfolio : '/biografie/' + cartella + '/' + a.portfolio; }

    // Foto: appiattisci la struttura img e ricostruisci ritratto + galleria
    const eh = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const resolve = (v) => /^https?:\/\//.test(v) ? v : '/biografie/' + cartella + '/' + v;
    const isVid = (v) => /\.(mp4|webm|mov|m4v)$/i.test(v);
    const imgs = [];
    if (Array.isArray(a.img)) for (const g of a.img) if (g && typeof g === 'object') for (const vv of Object.values(g)) if (Array.isArray(vv)) for (const e of vv) if (e && e.img) imgs.push(e);
    const firstImg = imgs.find((e) => !isVid(e.img));
    const portrait = document.getElementById('portrait');
    if (portrait && firstImg) {
      if (portrait.tagName === 'IMG') { portrait.src = resolve(firstImg.img); }
      else { const im = document.createElement('img'); im.id = 'portrait'; im.src = resolve(firstImg.img); im.alt = ''; im.className = 'w-full rounded-lg shadow-lg object-cover aspect-square'; portrait.replaceWith(im); }
    }
    const grid = document.getElementById('opere-grid');
    const sec = document.getElementById('opere-sec');
    if (grid) {
      if (imgs.length) {
        grid.innerHTML = imgs.map((e) => {
          const cap = (e.des || e.deslunga)
            ? '<figcaption class="p-4 bg-card">' + (e.des ? '<p class="text-sm font-medium text-foreground mb-1">' + eh(e.des) + '</p>' : '') + (e.deslunga ? '<div class="opera-desc regdiv text-xs text-muted-foreground">' + e.deslunga + '</div><button type="button" class="opera-toggle">Leggi tutto &#9662;</button>' : '') + '</figcaption>'
            : '';
          const media = isVid(e.img)
            ? '<video src="' + resolve(e.img) + '" controls preload="metadata" class="w-full bg-black"></video>'
            : '<img src="' + resolve(e.img) + '" alt="' + eh(e.des || '') + '" class="w-full object-cover" loading="lazy" />';
          return '<figure class="rounded-lg overflow-hidden shadow-lg">' + media + cap + '</figure>';
        }).join('');
        if (sec) sec.classList.remove('hidden');
      } else if (sec) sec.classList.add('hidden');
    }
  } catch (e) {}
})();
