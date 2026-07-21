var _paq = window._paq = window._paq || []
_paq.push(['trackPageView'])
_paq.push(['enableLinkTracking'])
// Caricato dopo il "load" della pagina, così non contribuisce al tempo di
// caricamento percepito (v. stesso motivo in tawk.js).
function loadMatomo() {
  var siteId = '7', trackerUrl = '//matomodocker.azurewebsites.net/'
  _paq.push(['setTrackerUrl', trackerUrl + 'matomo.php'])
  _paq.push(['setSiteId', siteId])
  var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0]
  g.async = true; g.src = trackerUrl + 'matomo.js'; s.parentNode.insertBefore(g, s)
}
if (document.readyState === 'complete') loadMatomo()
else window.addEventListener('load', loadMatomo)
