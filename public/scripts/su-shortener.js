const baseEndpoint = 'https://sentinelle.mappa.asud.net/sg'

const form = document.getElementById('shortenerForm')
const result = document.getElementById('result')

form?.addEventListener('submit', async (e) => {
  e.preventDefault()

  const input = document.getElementById('originalURL')
  const originalURL = input.value.trim()
  if (!originalURL || !result) return

  result.textContent = 'Generazione in corso…'

  const endpoint = `${baseEndpoint}?originalURL=${encodeURIComponent(originalURL)}`

  try {
    const res = await fetch(endpoint)
    const data = await res.json()

    if (data.success && data.secureShortURL) {
      result.innerHTML = `<a href="${data.secureShortURL}" target="_blank" class="text-accent underline">${data.secureShortURL}</a>`
    } else {
      result.textContent = 'Errore nella risposta'
    }
  } catch {
    result.textContent = 'Errore di rete'
  }
})
