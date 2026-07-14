const dialog = document.getElementById('lightbox')
const lbImg = document.getElementById('lb-img')
const lbCaption = document.getElementById('lb-caption')
const lbCounter = document.getElementById('lb-counter')
const thumbs = Array.from(document.querySelectorAll('.gallery-thumb'))

let current = 0

function openAt(idx) {
  current = idx
  const btn = thumbs[idx]
  if (!btn || !lbImg || !lbCaption || !lbCounter || !dialog) return
  lbImg.src = btn.dataset.src ?? ''
  lbCaption.textContent = btn.dataset.caption ?? ''
  lbCounter.textContent = `${idx + 1} / ${thumbs.length}`
  dialog.showModal()
}

function go(dir) {
  openAt((current + dir + thumbs.length) % thumbs.length)
}

thumbs.forEach((btn, i) => btn.addEventListener('click', () => openAt(i)))

document.getElementById('lb-close')?.addEventListener('click', () => dialog?.close())
document.getElementById('lb-prev')?.addEventListener('click', () => go(-1))
document.getElementById('lb-next')?.addEventListener('click', () => go(1))

dialog?.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close()
})

document.addEventListener('keydown', (e) => {
  if (dialog?.open) {
    if (e.key === 'ArrowLeft') go(-1)
    if (e.key === 'ArrowRight') go(1)
    if (e.key === 'Escape') dialog.close()
  } else {
    const prevArrow = document.querySelector('.event-nav-arrow.left-0')
    const nextArrow = document.querySelector('.event-nav-arrow.right-0')
    if (e.key === 'ArrowLeft' && prevArrow) window.location.href = prevArrow.href
    if (e.key === 'ArrowRight' && nextArrow) window.location.href = nextArrow.href
  }
})
