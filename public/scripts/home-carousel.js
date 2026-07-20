const slides = document.querySelectorAll('.carousel-slide')
const dots = document.querySelectorAll('.carousel-dot')
let current = 0
let timer

// Slide video: la durata dell'attesa segue la lunghezza reale del video
// invece del timer fisso, così non viene mai tagliato a metà.
function scheduleNext(resetVideo = true) {
  clearTimeout(timer)
  if (slides.length <= 1) return
  const el = slides[current]
  if (el.tagName === 'VIDEO') {
    if (resetVideo) el.currentTime = 0
    el.play().catch(() => {})
    el.onended = () => goTo(current + 1)
    const remaining = el.duration && !isNaN(el.duration) ? el.duration - el.currentTime : 20
    timer = setTimeout(() => goTo(current + 1), (remaining + 0.5) * 1000)
  } else {
    timer = setTimeout(() => goTo(current + 1), 4000)
  }
}

function goTo(n) {
  if (slides.length === 0) return
  clearTimeout(timer)
  if (slides[current].tagName === 'VIDEO') slides[current].pause()
  slides[current].classList.replace('opacity-100', 'opacity-0')
  dots[current].classList.replace('bg-white', 'bg-white/40')
  current = (n + slides.length) % slides.length
  slides[current].classList.replace('opacity-0', 'opacity-100')
  dots[current].classList.replace('bg-white/40', 'bg-white')
  scheduleNext()
}

dots.forEach(dot => {
  dot.addEventListener('click', (e) => {
    e.preventDefault()
    goTo(Number(dot.dataset.index))
  })
})

const carousel = document.getElementById('carousel')
carousel?.addEventListener('mouseenter', () => {
  clearTimeout(timer)
  if (slides[current]?.tagName === 'VIDEO') slides[current].pause()
})
carousel?.addEventListener('mouseleave', () => scheduleNext(false))

scheduleNext()

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
