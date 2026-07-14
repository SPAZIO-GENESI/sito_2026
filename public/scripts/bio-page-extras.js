// Accordion descrizione opere (solo smartphone, via CSS): toggle espandi/riduci.
document.addEventListener('click', function (e) {
  const btn = e.target.closest ? e.target.closest('.opera-toggle') : null;
  if (!btn) return;
  const cap = btn.closest('figcaption');
  const d = cap && cap.querySelector('.opera-desc');
  if (!d) return;
  const open = d.classList.toggle('expanded');
  btn.innerHTML = open ? 'Riduci &#9652;' : 'Leggi tutto &#9662;';
});

// Pulsante "Scarica come Portfolio" (era onclick="window.print()" inline).
document.getElementById('btn-print')?.addEventListener('click', () => window.print());

// Ticker news: pausa al passaggio del mouse (era onmouseover/onmouseout inline sul <marquee>).
document.querySelectorAll('marquee').forEach((m) => {
  m.addEventListener('mouseover', () => m.stop());
  m.addEventListener('mouseout', () => m.start());
});
