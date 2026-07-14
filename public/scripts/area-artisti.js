  // ⚙️ DA CONFIGURARE dopo aver creato il Client ID Google e deployato il Worker:
  const GOOGLE_CLIENT_ID = '987898157658-msrb2ugonpnbnc8gp9dlri00br9ceinh.apps.googleusercontent.com';
  const WORKER_URL = 'https://artisti-api.it-e3f.workers.dev';

  let idToken = null;
  const $ = (id) => document.getElementById(id);
  const setStatus = (msg, ok) => { const s = $('status'); s.textContent = msg; s.style.color = ok ? '#1e7e34' : '#c0392b'; };

  async function api(path, opts = {}) {
    const r = await fetch(WORKER_URL + path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: 'Bearer ' + idToken } : {}), ...(opts.headers || {}) },
    });
    return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
  }

  let CARTELLA = '';
  let FOTO_LIST = [];
  let CAP_IMG = '';
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

  function flattenImg(raw) {
    if (!raw) return [];
    if (Array.isArray(raw) && raw.length && raw[0] && raw[0].img) return raw.filter((e) => e && e.img);
    const out = [];
    if (Array.isArray(raw)) for (const g of raw) if (g && typeof g === 'object') for (const v of Object.values(g)) if (Array.isArray(v)) for (const e of v) if (e && e.img) out.push(e);
    return out;
  }
  const fotoSrc = (v) => (/^https?:\/\//.test(v) ? v : '/biografie/' + CARTELLA + '/' + v);
  const isVid = (v) => /\.(mp4|webm|mov|m4v)$/i.test(v);

  function renderFoto(raw) {
    const flat = flattenImg(raw);
    FOTO_LIST = flat;
    $('foto-grid').innerHTML = flat.map((e, i) =>
      '<figure class="border border-border rounded-lg overflow-hidden">' +
      (isVid(e.img) ? '<video src="' + fotoSrc(e.img) + '" muted preload="metadata" class="w-full aspect-square object-cover bg-black"></video>' : '<img src="' + fotoSrc(e.img) + '" class="w-full aspect-square object-cover" />') +
      '<figcaption class="p-2 text-xs space-y-1">' +
      '<div>' + (i === 0 ? '<span class="text-accent font-semibold">★ ritratto</span>' : '<button type="button" data-front="' + escAttr(e.img) + '" class="text-accent underline">★ ritratto</button>') +
      '<button type="button" data-del="' + escAttr(e.img) + '" class="text-red-600 underline ml-2">elimina</button></div>' +
      '<button type="button" data-capidx="' + i + '" class="text-accent underline">✎ descrizione</button>' +
      (e.des ? '<div class="text-muted-foreground">' + esc(e.des) + '</div>' : '') +
      '</figcaption></figure>'
    ).join('');
    $('foto-grid').querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => {
      if (!confirm('Eliminare questa foto?')) return;
      const r = await api('/api/photo', { method: 'DELETE', body: JSON.stringify({ img: b.getAttribute('data-del') }) });
      if (r.ok) renderFoto(r.data.foto);
    });
    $('foto-grid').querySelectorAll('[data-front]').forEach((b) => b.onclick = async () => {
      const r = await api('/api/photo/front', { method: 'POST', body: JSON.stringify({ img: b.getAttribute('data-front') }) });
      if (r.ok) renderFoto(r.data.foto);
    });
    $('foto-grid').querySelectorAll('[data-capidx]').forEach((b) => b.onclick = () => openCap(FOTO_LIST[+b.getAttribute('data-capidx')]));
  }

  function openCap(e) {
    if (!e) return;
    CAP_IMG = e.img;
    $('fcap-des').value = e.des || '';
    window.VisualEditor.setHTML($('fcap-long'), e.deslunga || '');
    $('fcap-status').textContent = '';
    $('fcap').classList.remove('hidden');
    $('fcap').scrollIntoView({ behavior: 'smooth' });
  }

  function fillForm(a) {
    CARTELLA = a.cartella;
    $('f-nome').value = a.nome ? decodeURIComponent(a.nome) : '';
    window.VisualEditor.setHTML($('f-bio'), a.bio || '');
    $('f-ig').value = a.ig || '';
    $('f-social').value = a.social || '';
    $('f-portfolio').value = a.portfolio || '';
    $('preview-link').href = '/biografie/' + a.cartella + '/';
    renderFoto(a.img);
  }

  async function onCredential(resp) {
    idToken = resp.credential;
    const me = await api('/api/me');
    if (me.status === 403) { $('login-hint').textContent = 'Questa email (' + (me.data.email || '') + ') non è associata a nessuna scheda artista. Scrivici per essere aggiunto.'; idToken = null; return; }
    if (!me.ok) { $('login-hint').textContent = 'Accesso non riuscito, riprova.'; idToken = null; return; }
    $('acct').textContent = me.data.account.email;
    fillForm(me.data.artista);
    $('login-box').classList.add('hidden');
    $('editor').classList.remove('hidden');
  }

  function initLogin() {
    if (!window.google || !google.accounts) { setTimeout(initLogin, 200); return; }
    google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onCredential });
    google.accounts.id.renderButton($('gbtn'), { theme: 'outline', size: 'large', text: 'signin_with', locale: 'it' });
  }
  initLogin();
  window.VisualEditor.attach($('f-bio'), $('f-bio-tb'));

  $('logout').addEventListener('click', () => { idToken = null; $('editor').classList.add('hidden'); $('login-box').classList.remove('hidden'); google.accounts.id.disableAutoSelect(); });

  $('foto-up').addEventListener('click', async () => {
    const f = $('foto-file').files[0];
    if (!f) { $('foto-status').textContent = 'Scegli un file.'; return; }
    const lim = f.type.startsWith('video/') ? 64 : 8;
    if (f.size > lim * 1024 * 1024) { $('foto-status').textContent = 'Troppo grande (max ' + lim + ' MB).'; return; }
    $('foto-status').textContent = 'Caricamento…';
    const r = await api('/api/photo?des=' + encodeURIComponent($('foto-des').value || ''), { method: 'POST', headers: { 'Content-Type': f.type }, body: f });
    if (r.ok) { $('foto-status').textContent = 'Caricata ✓'; $('foto-file').value = ''; $('foto-des').value = ''; renderFoto(r.data.foto); }
    else $('foto-status').textContent = 'Errore: ' + (r.data.error || r.status);
  });

  window.VisualEditor.attach($('fcap-long'), $('fcap-tb'));
  $('fcap-cancel').onclick = () => $('fcap').classList.add('hidden');
  $('fcap-save').onclick = async () => {
    if (!CAP_IMG) return;
    $('fcap-status').textContent = 'Salvataggio…';
    const r = await api('/api/photo/caption', { method: 'POST', body: JSON.stringify({ img: CAP_IMG, des: $('fcap-des').value, deslunga: window.VisualEditor.serialize($('fcap-long')) }) });
    if (r.ok) { $('fcap-status').textContent = 'Salvata ✓'; renderFoto(r.data.foto); $('fcap').classList.add('hidden'); }
    else $('fcap-status').textContent = 'Errore: ' + (r.data.error || r.status);
  };

  $('editor').addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('Salvataggio…', true);
    const body = {
      nome: $('f-nome').value, bio: window.VisualEditor.serialize($('f-bio')), ig: $('f-ig').value,
      social: $('f-social').value, portfolio: $('f-portfolio').value,
    };
    const r = await api('/api/bio', { method: 'POST', body: JSON.stringify(body) });
    if (r.ok) setStatus('Salvato e pubblicato ✓', true);
    else if (r.status === 401) { setStatus('Sessione scaduta, riaccedi.', false); $('logout').click(); }
    else setStatus('Errore nel salvataggio.', false);
  });
