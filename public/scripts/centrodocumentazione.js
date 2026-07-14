// ── Ricerca: lessicale (istantanea) + semantica (per concetto) ──────────────
const searchInput = document.getElementById('cdid-search')
const semBtn = document.getElementById('cdid-semantic')
const statusEl = document.getElementById('cdid-status')
const rows = Array.from(document.querySelectorAll('.cdid-row'))
const tbody = document.querySelector('#cdid-table tbody')
const originalOrder = rows.slice()

const EMB_WORKER = 'https://cfg_embeddings.it-e3f.workers.dev'
let vectors = null

function cosine(a, b) {
  let d = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  return d / (Math.sqrt(na) * Math.sqrt(nb) || 1)
}

async function loadVectors() {
  if (vectors) return vectors
  const r = await fetch('/data/libri-embeddings.json')
  if (!r.ok) throw new Error('embeddings non disponibili')
  vectors = (await r.json()).vectors
  return vectors
}

function resetView() {
  originalOrder.forEach(row => { tbody?.appendChild(row); row.style.display = '' })
  if (statusEl) statusEl.textContent = ''
}

// Lessicale: filtro istantaneo mentre si digita
searchInput?.addEventListener('input', () => {
  if (statusEl) statusEl.textContent = ''
  const q = searchInput.value.toLowerCase().trim()
  rows.forEach(row => {
    row.style.display = !q || (row.dataset.search ?? '').includes(q) ? '' : 'none'
  })
})

// Semantica: ordina i testi per pertinenza al concetto cercato
async function semanticSearch() {
  const q = (searchInput?.value ?? '').trim()
  if (!q || !statusEl) return
  statusEl.textContent = 'Cerco per concetto…'
  try {
    const vecs = await loadVectors()
    const res = await fetch(`${EMB_WORKER}/?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    if (!Array.isArray(data.vec)) throw new Error('no-vec')
    const scored = []
    rows.forEach(row => {
      const v = vecs[row.dataset.libroId ?? '']
      if (v) scored.push([row, cosine(data.vec, v)])
      else row.style.display = 'none'
    })
    scored.sort((a, b) => b[1] - a[1])
    // Soglia di pertinenza assoluta (tarata su bge-m3): mostra solo i testi
    // davvero affini al concetto. Garantisce almeno il migliore, al massimo 25.
    // Per ricerche specifiche (es. "terremoto dell'Aquila") esce 1 solo testo;
    // per temi ampi (es. "anarchia") escono molti, dal più affine.
    const SOGLIA = 0.42
    let mostrati = 0
    scored.forEach(([row, score]) => {
      tbody?.appendChild(row)
      const ok = mostrati < 1 || (score >= SOGLIA && mostrati < 25)
      row.style.display = ok ? '' : 'none'
      if (ok) mostrati++
    })
    const etichetta = mostrati === 1 ? '1 testo pertinente' : `${mostrati} testi pertinenti, dal più affine`
    statusEl.innerHTML = `Per concetto «${q}»: ${etichetta}. <a href="#" id="cdid-reset" class="text-accent underline">azzera</a>`
    document.getElementById('cdid-reset')?.addEventListener('click', (e) => { e.preventDefault(); resetView() })
  } catch (e) {
    statusEl.textContent = 'Ricerca per concetto non disponibile al momento.'
  }
}

semBtn?.addEventListener('click', semanticSearch)
searchInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); semanticSearch() } })

// Lightbox
const modal = document.getElementById('cdid-modal')
const modalImg = document.getElementById('cdid-modal-img')
const modalTitle = document.getElementById('cdid-modal-title')
const modalDesc = document.getElementById('cdid-modal-desc')
const modalClose = document.getElementById('cdid-modal-close')

document.querySelectorAll('.cdid-thumb').forEach(btn => {
  btn.addEventListener('click', () => {
    modalImg.src = btn.dataset.img ?? ''
    modalTitle.textContent = btn.dataset.title ?? 'Copertina'
    modalDesc.textContent = btn.dataset.desc ?? ''
    modal.classList.remove('hidden')
    modal.classList.add('flex')
  })
})

const closeModal = () => {
  modal.classList.add('hidden')
  modal.classList.remove('flex')
  modalImg.src = ''
}

modalClose.addEventListener('click', closeModal)
modal.addEventListener('click', e => { if (e.target === modal) closeModal() })
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal() })
