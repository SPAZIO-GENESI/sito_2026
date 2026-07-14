const KEY = 'sg_cookie_consent'
const banner = document.getElementById('cookie-banner')

function applyConsent(choice) {
  localStorage.setItem(KEY, choice)
  banner.classList.add('hidden')
  document.dispatchEvent(new CustomEvent('sg:consent', { detail: choice }))
}

if (!localStorage.getItem(KEY)) {
  banner.classList.remove('hidden')
}

document.getElementById('cookie-accept').addEventListener('click', () => applyConsent('all'))
document.getElementById('cookie-reject').addEventListener('click', () => applyConsent('necessary'))
