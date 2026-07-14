(function() {
  var targets = [document.documentElement, document.body];
  function restoreOverflow(el) {
    if (el && el.style && el.style.overflow === 'hidden') el.style.overflow = '';
  }
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.type === 'attributes' && m.attributeName === 'style') restoreOverflow(m.target);
    });
  });
  targets.forEach(function(t) { observer.observe(t, { attributes: true, attributeFilter: ['style', 'class'] }); });
})();
