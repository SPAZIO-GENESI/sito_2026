const KEY = 'sg_cookie_consent'

function loadPayPal() {
  // SDK 1: hosted-buttons
  const s1 = document.createElement('script')
  s1.src = 'https://www.paypal.com/sdk/js?client-id=BAAWaqUltEyNiREyqCFGtH46W-x7TOP9Rc26ILViUvyJWFNw4U91zwyPWw8lUimPNBBOXc9fH9mUocMFxA&components=hosted-buttons&disable-funding=venmo&currency=EUR'
  s1.setAttribute('data-sdk-integration-source', 'button-factory')
  s1.onload = function() {
    paypal.HostedButtons({ hostedButtonId: 'V7NLWNW8BK6D2' }).render('#paypal-container-V7NLWNW8BK6D2')
    paypal.HostedButtons({ hostedButtonId: '5EVEGBYTDSAJG' }).render('#paypal-container-5EVEGBYTDSAJG')
    paypal.HostedButtons({ hostedButtonId: '2MY36H66BSN4W' }).render('#paypal-container-2MY36H66BSN4W')

    // SDK 2: subscription — caricato dopo SDK1
    const s2 = document.createElement('script')
    s2.src = 'https://www.paypal.com/sdk/js?client-id=Ab6joAWjiJDrrrqzYb0gzg5uDBCtCI0Td5NXZealzworAbewh__9rgxpuKHzRCRo9xSiKhME-hOIAFRg&vault=true&intent=subscription'
    s2.setAttribute('data-sdk-integration-source', 'button-factory')
    s2.onload = function() {
      paypal.Buttons({
        style: { shape: 'rect', color: 'gold', layout: 'vertical', label: 'subscribe' },
        createSubscription: function(data, actions) {
          return actions.subscription.create({ plan_id: 'P-7ML05505JA818620MNG6B4LA' })
        },
        onApprove: function() {
          window.location.href = window.location.pathname + '?abbonamento=ok'
        }
      }).render('#paypal-button-container-P-7ML05505JA818620MNG6B4LA')
    }
    document.head.appendChild(s2)
  }
  document.head.appendChild(s1)

  // Rimuovi il placeholder
  const ph = document.getElementById('paypal-consent-placeholder')
  if (ph) ph.remove()
}

if (localStorage.getItem(KEY) === 'all') {
  loadPayPal()
} else {
  // Mostra placeholder finché non c'è consenso
  const ph = document.getElementById('paypal-consent-placeholder')
  if (ph) ph.style.display = 'block'
  // Ascolta l'evento emesso dal banner
  document.addEventListener('sg:consent', function(e) {
    if (e.detail === 'all') loadPayPal()
  })
}

// Pulsante "Accetta ora" nel placeholder (era onclick inline).
document.getElementById('btn-accetta-cookie')?.addEventListener('click', () => {
  document.getElementById('cookie-accept')?.click()
})
