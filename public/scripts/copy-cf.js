const btn = document.getElementById('copy-cf')
if (btn) btn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(btn.dataset.cf)
    const l = document.getElementById('copy-label')
    if (l) { l.textContent = 'Copiato!'; setTimeout(() => (l.textContent = 'Copia'), 1800) }
  } catch (e) {}
})
