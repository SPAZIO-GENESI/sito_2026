  const GOOGLE_CLIENT_ID = '987898157658-msrb2ugonpnbnc8gp9dlri00br9ceinh.apps.googleusercontent.com';
  const WORKER_URL = 'https://artisti-api.it-e3f.workers.dev';
  let idToken = null;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fmtDT = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d)) return '—';
    return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
  };

  async function api(path, opts = {}) {
    const r = await fetch(WORKER_URL + path, { ...opts, headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: 'Bearer ' + idToken } : {}), ...(opts.headers || {}) } });
    return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
  }

  async function loadList() {
    const r = await api('/api/admin/artisti');
    if (r.status === 403) { $('login-hint').textContent = 'Questa email non è admin.'; idToken = null; return false; }
    if (!r.ok) { $('login-hint').textContent = 'Accesso non riuscito.'; idToken = null; return false; }
    const rows = r.data.artisti || [];
    $('tbody').innerHTML = rows.map((a) => `
      <tr class="border-b border-border">
        <td class="px-3 py-2 font-mono text-xs">${esc(a.cartella)}</td>
        <td class="px-3 py-2">${esc(a.nome ? decodeURIComponent(a.nome) : '')}</td>
        <td class="px-3 py-2 text-muted-foreground">${esc(a.email)}</td>
        <td class="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">${esc(fmtDT(a.updated_at))}</td>
        <td class="px-3 py-2">
          <button data-toggle="${esc(a.cartella)}" data-pub="${a.published ? 1 : 0}"
            class="px-3 py-1 rounded-full text-xs font-semibold ${a.published ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}">
            ${a.published ? 'Pubblicato' : 'Nascosto'}
          </button>
        </td>
        <td class="px-3 py-2 text-right whitespace-nowrap">
          <button data-edit="${esc(a.cartella)}" class="text-accent underline mr-3">Modifica</button>
          <button data-del="${esc(a.cartella)}" class="text-red-600 underline">Elimina</button>
        </td>
      </tr>`).join('');
    bindRowButtons();
    return true;
  }

  let EDIT_CARTELLA = '';
  let AFOTO_LIST = [];
  let ACAP_IMG = '';
  function flattenImg(raw) {
    if (!raw) return [];
    if (Array.isArray(raw) && raw.length && raw[0] && raw[0].img) return raw.filter((e) => e && e.img);
    const out = [];
    if (Array.isArray(raw)) for (const g of raw) if (g && typeof g === 'object') for (const v of Object.values(g)) if (Array.isArray(v)) for (const e of v) if (e && e.img) out.push(e);
    return out;
  }
  const fotoSrc = (v) => (/^https?:\/\//.test(v) ? v : '/biografie/' + EDIT_CARTELLA + '/' + v);
  const isVid = (v) => /\.(mp4|webm|mov|m4v)$/i.test(v);

  const photoEp = (m, body) => api('/api/admin/photo' + (m === 'front' ? '/front' : m === 'caption' ? '/caption' : '') + '?cartella=' + encodeURIComponent(EDIT_CARTELLA), body);

  function renderAfoto(raw) {
    const flat = flattenImg(raw);
    AFOTO_LIST = flat;
    $('afoto-grid').innerHTML = flat.map((e, i) =>
      '<figure class="border border-border rounded-lg overflow-hidden">' +
      (isVid(e.img) ? '<video src="' + fotoSrc(e.img) + '" muted preload="metadata" class="w-full aspect-square object-cover bg-black"></video>' : '<img src="' + fotoSrc(e.img) + '" class="w-full aspect-square object-cover" />') +
      '<figcaption class="p-1.5 text-xs space-y-1">' +
      '<div>' + (i === 0 ? '<span class="text-accent font-semibold">★</span>' : '<button type="button" data-front="' + esc(e.img) + '" class="text-accent underline">★</button>') +
      '<button type="button" data-del="' + esc(e.img) + '" class="text-red-600 underline ml-2">elim</button></div>' +
      '<button type="button" data-capidx="' + i + '" class="text-accent underline">✎ descr.</button>' +
      '</figcaption></figure>'
    ).join('');
    $('afoto-grid').querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => {
      if (!confirm('Eliminare questa foto?')) return;
      const r = await photoEp('del', { method: 'DELETE', body: JSON.stringify({ img: b.getAttribute('data-del') }) });
      if (r.ok) renderAfoto(r.data.foto);
    });
    $('afoto-grid').querySelectorAll('[data-front]').forEach((b) => b.onclick = async () => {
      const r = await photoEp('front', { method: 'POST', body: JSON.stringify({ img: b.getAttribute('data-front') }) });
      if (r.ok) renderAfoto(r.data.foto);
    });
    $('afoto-grid').querySelectorAll('[data-capidx]').forEach((b) => b.onclick = () => openAcap(AFOTO_LIST[+b.getAttribute('data-capidx')]));
  }

  function openAcap(e) {
    if (!e) return;
    ACAP_IMG = e.img;
    $('acap-des').value = e.des || '';
    window.VisualEditor.setHTML($('acap-long'), e.deslunga || '');
    $('acap-status').textContent = '';
    $('acap').classList.remove('hidden');
    $('acap').scrollIntoView({ behavior: 'smooth' });
  }

  function openForm(a, isNew) {
    $('form-title').textContent = isNew ? 'Nuova scheda' : 'Modifica: ' + a.cartella;
    $('a-cartella').value = a.cartella || '';
    $('a-cartella').disabled = !isNew;
    $('a-email').value = a.email || '';
    $('a-nome').value = a.nome ? decodeURIComponent(a.nome) : '';
    window.VisualEditor.setHTML($('a-bio'), a.bio || '');
    $('a-ig').value = a.ig || '';
    $('a-social').value = a.social || '';
    $('a-portfolio').value = a.portfolio || '';
    $('form-status').textContent = '';
    if (isNew) { EDIT_CARTELLA = ''; $('admin-foto').classList.add('hidden'); }
    else { EDIT_CARTELLA = a.cartella; $('admin-foto').classList.remove('hidden'); renderAfoto(a.img); }
    $('form-sec').classList.remove('hidden');
    $('form-sec').scrollIntoView({ behavior: 'smooth' });
  }

  function bindRowButtons() {
    document.querySelectorAll('[data-toggle]').forEach((b) => b.onclick = async () => {
      const cartella = b.getAttribute('data-toggle');
      const next = b.getAttribute('data-pub') === '1' ? 0 : 1;
      const r = await api('/api/admin/visibility', { method: 'POST', body: JSON.stringify({ cartella, published: next }) });
      if (r.ok) {
        b.setAttribute('data-pub', String(next));
        b.textContent = next ? 'Pubblicato' : 'Nascosto';
        b.className = 'px-3 py-1 rounded-full text-xs font-semibold ' + (next ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600');
      } else $('status').textContent = 'Errore aggiornamento stato.';
    });
    document.querySelectorAll('[data-edit]').forEach((b) => b.onclick = async () => {
      const cartella = b.getAttribute('data-edit');
      const r = await api('/api/bio?cartella=' + encodeURIComponent(cartella)); // include bio
      const base = (r.data && !r.data.error) ? r.data : { cartella };
      openForm(base, false);
    });
    document.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => {
      const cartella = b.getAttribute('data-del');
      if (!confirm('Eliminare la scheda "' + cartella + '"?')) return;
      const r = await api('/api/admin/artista?cartella=' + encodeURIComponent(cartella), { method: 'DELETE' });
      if (r.ok) { $('status').textContent = 'Eliminata: ' + cartella; loadList(); } else $('status').textContent = 'Errore eliminazione.';
    });
  }

  async function onCredential(resp) {
    idToken = resp.credential;
    const ok = await loadList();
    if (!ok) return;
    // mostra account
    $('acct').textContent = JSON.parse(atob(idToken.split('.')[1])).email;
    $('login-box').classList.add('hidden');
    $('panel').classList.remove('hidden');
  }

  function initLogin() {
    if (!window.google || !google.accounts) { setTimeout(initLogin, 200); return; }
    google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onCredential });
    google.accounts.id.renderButton($('gbtn'), { theme: 'outline', size: 'large', text: 'signin_with', locale: 'it' });
  }
  initLogin();
  window.VisualEditor.attach($('a-bio'), $('a-bio-tb'));

  $('new').onclick = () => openForm({}, true);
  $('cancel').onclick = () => $('form-sec').classList.add('hidden');
  $('afoto-up').onclick = async () => {
    if (!EDIT_CARTELLA) { $('afoto-status').textContent = 'Salva prima la scheda.'; return; }
    const f = $('afoto-file').files[0];
    if (!f) { $('afoto-status').textContent = 'Scegli un file.'; return; }
    const lim = f.type.startsWith('video/') ? 64 : 8;
    if (f.size > lim * 1024 * 1024) { $('afoto-status').textContent = 'Troppo grande (max ' + lim + ' MB).'; return; }
    $('afoto-status').textContent = 'Caricamento…';
    const r = await api('/api/admin/photo?cartella=' + encodeURIComponent(EDIT_CARTELLA) + '&des=' + encodeURIComponent($('afoto-des').value || ''), { method: 'POST', headers: { 'Content-Type': f.type }, body: f });
    if (r.ok) { $('afoto-status').textContent = 'Caricata ✓'; $('afoto-file').value = ''; $('afoto-des').value = ''; renderAfoto(r.data.foto); }
    else $('afoto-status').textContent = 'Errore: ' + (r.data.error || r.status);
  };

  window.VisualEditor.attach($('acap-long'), $('acap-tb'));
  $('acap-cancel').onclick = () => $('acap').classList.add('hidden');
  $('acap-save').onclick = async () => {
    if (!ACAP_IMG) return;
    $('acap-status').textContent = 'Salvataggio…';
    const r = await photoEp('caption', { method: 'POST', body: JSON.stringify({ img: ACAP_IMG, des: $('acap-des').value, deslunga: window.VisualEditor.serialize($('acap-long')) }) });
    if (r.ok) { $('acap-status').textContent = 'Salvata ✓'; renderAfoto(r.data.foto); $('acap').classList.add('hidden'); }
    else $('acap-status').textContent = 'Errore: ' + (r.data.error || r.status);
  };
  $('logout').onclick = () => { idToken = null; $('panel').classList.add('hidden'); $('form-sec').classList.add('hidden'); $('login-box').classList.remove('hidden'); google.accounts.id.disableAutoSelect(); };

  $('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('form-status').textContent = 'Salvataggio…';
    const body = {
      cartella: $('a-cartella').value, email: $('a-email').value, nome: $('a-nome').value,
      bio: window.VisualEditor.serialize($('a-bio')), ig: $('a-ig').value, social: $('a-social').value, portfolio: $('a-portfolio').value,
    };
    const r = await api('/api/admin/artista', { method: 'POST', body: JSON.stringify(body) });
    if (r.ok) { $('form-status').textContent = 'Salvato ✓'; loadList(); }
    else $('form-status').textContent = 'Errore: ' + (r.data.error || r.status);
  });
