function handleCaptchaResponse() {
  var event = new Event('captchaChange');
  document.getElementById('sib-captcha').dispatchEvent(event);
  window.grecaptcha = window.turnstile;
}
