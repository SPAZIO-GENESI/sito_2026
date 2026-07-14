document.getElementById('reset-consent')?.addEventListener('click', () => {
  localStorage.removeItem('sg_cookie_consent')
  window.location.reload()
})
