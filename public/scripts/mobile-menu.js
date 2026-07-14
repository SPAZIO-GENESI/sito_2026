const btn  = document.getElementById('mobile-menu-btn')
const menu = document.getElementById('mobile-menu')
const iconH = document.getElementById('icon-hamburger')
const iconC = document.getElementById('icon-close')

btn.addEventListener('click', () => {
  const open = menu.classList.toggle('hidden')
  // open is true when we just added 'hidden' (= closing)
  btn.setAttribute('aria-expanded', open ? 'false' : 'true')
  iconH.classList.toggle('hidden', !open)
  iconC.classList.toggle('hidden', open)
})

// Close on outside click
document.addEventListener('click', (e) => {
  if (!btn.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.add('hidden')
    btn.setAttribute('aria-expanded', 'false')
    iconH.classList.remove('hidden')
    iconC.classList.add('hidden')
  }
})
