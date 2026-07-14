const items = document.querySelectorAll('.archivio-item')
const countLabel = document.getElementById('count-label')
const noResults = document.getElementById('no-results')
const resetBtn = document.getElementById('reset-filters')

const active = { anno: new Set(), tipo: new Set(), tag: new Set() }

function applyFilters() {
  let visible = 0
  items.forEach(item => {
    const annoOk = !active.anno.size || active.anno.has(item.dataset.anno)
    const tipoOk = !active.tipo.size || active.tipo.has(item.dataset.tipo)
    const tagsOk = !active.tag.size || [...active.tag].some(t => (item.dataset.tags ?? '').includes(t))
    const show = annoOk && tipoOk && tagsOk
    item.style.display = show ? '' : 'none'
    if (show) visible++
  })
  countLabel.textContent = `${visible} event${visible === 1 ? 'o' : 'i'}`
  noResults.classList.toggle('hidden', visible > 0)
  const hasFilters = Object.values(active).some(s => s.size > 0)
  resetBtn.classList.toggle('hidden', !hasFilters)
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.dataset.group
    const value = btn.dataset.value
    if (active[group].has(value)) {
      active[group].delete(value)
      btn.classList.remove('bg-accent', 'text-accent-foreground', 'border-accent')
      btn.classList.add('text-foreground')
    } else {
      active[group].add(value)
      btn.classList.add('bg-accent', 'text-accent-foreground', 'border-accent')
      btn.classList.remove('text-foreground', 'text-muted-foreground')
    }
    applyFilters()
  })
})

resetBtn.addEventListener('click', () => {
  Object.values(active).forEach(s => s.clear())
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('bg-accent', 'text-accent-foreground', 'border-accent')
    if (btn.dataset.group === 'tag') {
      btn.classList.add('text-muted-foreground')
    } else {
      btn.classList.add('text-foreground')
    }
  })
  applyFilters()
})
