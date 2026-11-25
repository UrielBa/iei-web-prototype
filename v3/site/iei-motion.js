/* IEI · motion: header progress bar, staggered entrances, count-up numbers. Respects reduced motion. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* reading-progress bar under the header */
  var nav = document.querySelector('.s-nav');
  if (nav) {
    var bar = document.createElement('div'); bar.className = 's-progress'; bar.setAttribute('aria-hidden', 'true'); bar.innerHTML = '<i></i>'; nav.appendChild(bar);
    var fill = bar.firstChild, tick = false;
    var upd = function () { tick = false; var h = document.documentElement.scrollHeight - window.innerHeight; fill.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0).toFixed(4) + ')'; };
    var req = function () { if (!tick) { tick = true; requestAnimationFrame(upd); } };
    window.addEventListener('scroll', req, { passive: true }); window.addEventListener('resize', req);
    window.addEventListener('hashchange', function () { setTimeout(upd, 60); }); upd();
  }

  /* staggered entrance */
  var groups = [['.s-hero-grid>div:first-child>*', 80], ['.s-glance>li', 90], ['.s-levs-rich>li', 120], ['.s-find-grid>.s-find', 110], ['.s-nextcards>.s-nextcard', 120]];
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { var t = e.target; t.classList.add('s-in'); io.unobserve(t); setTimeout(function () { t.classList.remove('s-reveal'); t.style.transitionDelay = ''; }, 1100 + (parseInt(t.style.transitionDelay, 10) || 0)); } });
  }, { threshold: .12 }) : null;
  groups.forEach(function (g) {
    $$(g[0]).forEach(function (el, i) {
      el.classList.add('s-reveal'); el.style.transitionDelay = (i * g[1]) + 'ms';
      if (io && !reduce) io.observe(el); else el.classList.add('s-in');
    });
  });

  /* count-up numbers */
  var cio = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; cio.unobserve(e.target);
      var b = e.target, t = +b.getAttribute('data-count'), s0 = performance.now();
      (function f(now) { var p = Math.min(1, (now - s0) / 1100); b.textContent = Math.round(t * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(s0);
    });
  }, { threshold: .6 }) : null;
  $$('[data-count]').forEach(function (b) { if (cio && !reduce) { b.textContent = '0'; cio.observe(b); } });
})();
