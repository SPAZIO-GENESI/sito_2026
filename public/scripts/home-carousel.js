const slides = document.querySelectorAll('.carousel-slide')
const dots = document.querySelectorAll('.carousel-dot')
let current = 0
let timer

function goTo(n) {
  if (slides.length === 0) return
  slides[current].classList.replace('opacity-100', 'opacity-0')
  dots[current].classList.replace('bg-white', 'bg-white/40')
  current = (n + slides.length) % slides.length
  slides[current].classList.replace('opacity-0', 'opacity-100')
  dots[current].classList.replace('bg-white/40', 'bg-white')
}

function startAuto() {
  if (slides.length > 1) timer = setInterval(() => goTo(current + 1), 4000)
}

dots.forEach(dot => {
  dot.addEventListener('click', (e) => {
    e.preventDefault()
    clearInterval(timer)
    goTo(Number(dot.dataset.index))
    startAuto()
  })
})

const carousel = document.getElementById('carousel')
carousel?.addEventListener('mouseenter', () => clearInterval(timer))
carousel?.addEventListener('mouseleave', startAuto)

startAuto()

// Ticker news: pausa al passaggio del mouse (era onmouseover/onmouseout inline sul <marquee>).
document.querySelectorAll('marquee').forEach((m) => {
  m.addEventListener('mouseover', () => m.stop())
  m.addEventListener('mouseout', () => m.start())
})

// Loghi adesioni: nascondi se il logo non carica (era onerror inline sull'<img>).
document.querySelectorAll('img[data-hide-on-error]').forEach((img) => {
  const hide = () => { img.style.display = 'none' }
  if (img.complete && img.naturalWidth === 0) hide()
  else img.addEventListener('error', hide)
})
