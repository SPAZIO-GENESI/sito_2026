const graphDataUrl = '/graph_data.json';
const CAT_STROKE = {
  corpo:'#639922', memoria:'#534AB7', spazio:'#0F6E56',
  processo:'#BA7517', relazione:'#993556'
};
let gdata = null;

(async () => {
  const d3 = await import('https://cdn.jsdelivr.net/npm/d3@7/+esm');
  window._d3 = d3;

  /* ── Resizable divider ── */
  const divider = document.getElementById('sg-divider');
  const paneS   = document.getElementById('pane-side');
  let dragging = false, startX = 0, startW = 0;

  divider.addEventListener('mousedown', e => {
    dragging = true; startX = e.clientX; startW = paneS.offsetWidth;
    divider.style.background = '#dee2e6';
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const newW = Math.max(160, Math.min(startW + (startX - e.clientX), window.innerWidth * 0.6));
    paneS.style.width = newW + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    divider.style.background = '#f5f5f5';
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    renderGraph(d3);
  });

  /* ── Graph rendering ── */
  const isMobile = () => window.innerWidth < 768;

  function pillSize(node) {
    const mobile = isMobile();
    const fsMin = mobile ? 9 : 11, fsMax = mobile ? 15 : 19;
    const fs = Math.round(fsMin + (node.size - 0.7) / 1.1 * (fsMax - fsMin));
    const pw = Math.round(node.label.length * fs * 0.62 + (mobile ? 18 : 26));
    const ph = Math.round(fs + (mobile ? 10 : 14));
    return { fs, pw, ph };
  }

  function renderGraph(d3) {
    const wrap = document.getElementById('pane-graph');
    const W = wrap.clientWidth, H = wrap.clientHeight;
    if (W < 10 || H < 10) return;

    const mobile = isMobile();
    const svg = d3.select('#graph').attr('viewBox', `0 0 ${W} ${H}`);
    const nodes = gdata.nodes.map(d => ({...d}));
    const edges = gdata.edges.map(d => ({...d}));

    if (window._sim) window._sim.stop();

    const pad = mobile ? 30 : 50;
    const bX = d => Math.max(pad, Math.min(W - pad, d.x));
    const bY = d => Math.max(pad, Math.min(H - pad, d.y));

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.id)
        .distance(d => (mobile ? 70 : 120) - d.weight * (mobile ? 35 : 60))
        .strength(d => 0.25 + d.weight * 0.5))
      .force('charge', d3.forceManyBody().strength(mobile ? -140 : -300))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide().radius(d => pillSize(d).pw / 2 + (mobile ? 6 : 12)))
      .force('x', d3.forceX(W / 2).strength(mobile ? 0.12 : 0.04))
      .force('y', d3.forceY(H / 2).strength(mobile ? 0.12 : 0.04))
      .force('bounds', () => {
        nodes.forEach(d => {
          if (d.x < pad)     { d.x = pad;     d.vx =  Math.abs(d.vx || 0); }
          if (d.x > W - pad) { d.x = W - pad; d.vx = -Math.abs(d.vx || 0); }
          if (d.y < pad)     { d.y = pad;      d.vy =  Math.abs(d.vy || 0); }
          if (d.y > H - pad) { d.y = H - pad;  d.vy = -Math.abs(d.vy || 0); }
        });
      });
    window._sim = sim;

    const edgeSel = d3.select('#edges-g').selectAll('line.edge')
      .data(edges, d => `${d.source.id || d.source}-${d.target.id || d.target}`)
      .join('line').attr('class', 'edge')
      .attr('stroke-width', d => 0.5 + d.weight * 2);

    const nodeSel = d3.select('#nodes-g').selectAll('g.node-g')
      .data(nodes, d => d.id)
      .join('g').attr('class', d => `node-g cat-${d.cat}`)
      .call(d3.drag()
        .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on('end',   (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }))
      .on('click', (ev, d) => { ev.stopPropagation(); selectNode(d.id, edgeSel, nodeSel); });

    nodeSel.selectAll('rect.pill').data(d => [d]).join('rect')
      .attr('class', 'pill').attr('rx', 20).attr('ry', 20)
      .each(function(d) {
        const { pw, ph } = pillSize(d);
        d3.select(this).attr('width', pw).attr('height', ph).attr('x', -pw / 2).attr('y', -ph / 2);
      });

    nodeSel.selectAll('text.label').data(d => [d]).join('text')
      .attr('class', 'label').attr('y', 1)
      .each(function(d) { d3.select(this).attr('font-size', pillSize(d).fs).text(d.label); });

    sim.on('tick', () => {
      edgeSel.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
             .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      nodeSel.attr('transform', d => `translate(${bX(d)},${bY(d)})`);
    });

    svg.on('click', () => deselect(edgeSel, nodeSel));
    window._edgeSel = edgeSel;
    window._nodeSel = nodeSel;
  }

  function selectNode(id, edgeSel, nodeSel) {
    edgeSel = edgeSel || window._edgeSel;
    nodeSel = nodeSel || window._nodeSel;

    nodeSel.classed('active', d => d.id === id);
    edgeSel
      .classed('highlight', d => (d.source.id || d.source) === id || (d.target.id || d.target) === id)
      .classed('dim',       d => (d.source.id || d.source) !== id && (d.target.id || d.target) !== id);

    const node = gdata.nodes.find(n => n.id === id);
    document.getElementById('hint').style.display = 'none';
    document.getElementById('detail').style.display = 'block';
    document.getElementById('d-name').textContent = node.label;
    document.getElementById('d-meta').innerHTML =
      `frequenza: <strong>${node.freq}</strong> · in <strong>${node.docs.length}</strong>/${gdata.meta.total_docs} testi`;

    const related = gdata.edges
      .filter(e => (e.source.id || e.source) === id || (e.target.id || e.target) === id)
      .map(e => ({
        id: ((e.source.id || e.source) === id) ? (e.target.id || e.target) : (e.source.id || e.source),
        weight: e.weight
      }))
      .sort((a, b) => b.weight - a.weight);

    const list = document.getElementById('d-list');
    list.innerHTML = '';
    related.forEach(e => {
      const n = gdata.nodes.find(x => x.id === e.id);
      if (!n) return;
      const stroke = CAT_STROKE[n.cat] || '#888';
      const row = document.createElement('div');
      row.className = 'conn-row';
      row.innerHTML = `
        <span class="conn-label">${n.label}</span>
        <div class="conn-track"><div class="conn-fill" style="width:${Math.round(e.weight * 100)}%;background:${stroke}"></div></div>
        <span class="conn-pct">${Math.round(e.weight * 100)}%</span>`;
      row.addEventListener('click', () => selectNode(n.id));
      list.appendChild(row);
    });

    const docList = document.getElementById('d-doc-list');
    docList.innerHTML = '';
    node.docs.forEach(doc => {
      const card = document.createElement('div');
      card.className = 'doc-card';
      card.innerHTML = `<div class="doc-title">${doc.title}</div>`;
      if (doc.excerpt) card.innerHTML += `<div class="doc-excerpt">«${doc.excerpt}»</div>`;
      card.innerHTML += doc.pdf_url
        ? `<a class="doc-link" href="${doc.pdf_url}" target="_blank" rel="noopener">↗ comunicato PDF</a>`
        : `<span class="doc-no-pdf">PDF non disponibile</span>`;
      docList.appendChild(card);
    });
  }

  function deselect(edgeSel, nodeSel) {
    edgeSel = edgeSel || window._edgeSel;
    nodeSel = nodeSel || window._nodeSel;
    if (!edgeSel) return;
    nodeSel.classed('active', false);
    edgeSel.classed('highlight', false).classed('dim', false);
    document.getElementById('hint').style.display = '';
    document.getElementById('detail').style.display = 'none';
  }

  window.addEventListener('resize', () => {
    const d3 = window._d3;
    if (!d3 || !gdata) return;
    d3.select('#nodes-g').selectAll('*').remove();
    d3.select('#edges-g').selectAll('*').remove();
    renderGraph(d3);
  });

  try {
    const r = await fetch(graphDataUrl + '?t=' + Date.now());
    gdata = await r.json();
    const m = gdata.meta;
    document.getElementById('m-docs').textContent  = m.total_docs;
    document.getElementById('m-nodes').textContent = m.total_concepts;
    document.getElementById('m-edges').textContent = m.total_edges;
    if (m.generated)
      document.getElementById('m-date').textContent =
        'aggiornato ' + new Date(m.generated).toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric' });
    renderGraph(d3);
  } catch(e) {
    document.getElementById('hint').textContent = 'Errore caricamento dati grafo.';
    console.error(e);
  }
})();
