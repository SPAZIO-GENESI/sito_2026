const grid = document.getElementById('artisti-grid')
const buttons = document.querySelectorAll('.sort-btn')

function sortCards(mode) {
  const cards = Array.from(grid.querySelectorAll('.artista-card'))
  cards.sort((a, b) => {
    const nomeA = a.dataset.nome ?? ''
    const nomeB = b.dataset.nome ?? ''
    const idxA = parseInt(a.dataset.index ?? '0')
    const idxB = parseInt(b.dataset.index ?? '0')
    if (mode === 'alpha-asc') return nomeA.localeCompare(nomeB, 'it')
    if (mode === 'alpha-desc') return nomeB.localeCompare(nomeA, 'it')
    if (mode === 'storico-asc') return idxA - idxB
    if (mode === 'storico-desc') return idxB - idxA
    return 0
  })
  cards.forEach(card => grid.appendChild(card))
}

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.sort
    buttons.forEach(b => {
      b.className = 'sort-btn px-4 py-2 rounded-full border border-border text-sm font-medium transition-colors text-foreground hover:bg-muted'
    })
    btn.className = 'sort-btn px-4 py-2 rounded-full border border-border text-sm font-medium transition-colors bg-accent text-accent-foreground'
    sortCards(mode)
  })
})

sortCards('alpha-asc')
