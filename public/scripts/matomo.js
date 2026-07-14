var _paq = window._paq = window._paq || []
_paq.push(['trackPageView'])
_paq.push(['enableLinkTracking'])
;(function () {
  var siteId = '7', trackerUrl = '//matomodocker.azurewebsites.net/'
  _paq.push(['setTrackerUrl', trackerUrl + 'matomo.php'])
  _paq.push(['setSiteId', siteId])
  var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0]
  g.async = true; g.src = trackerUrl + 'matomo.js'; s.parentNode.insertBefore(g, s)
})()
