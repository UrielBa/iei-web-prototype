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

  /* Explore: tab dock that stays under the header once the page tabs scroll away */
  var tabs = document.querySelector('.s-subtabs');
  if (tabs) {
    var dock = document.createElement('div'); dock.className = 's-tabdock'; dock.hidden = true;
    dock.innerHTML = '<div class="s-wrap"><div class="s-dockrow" role="tablist" aria-label="Explore views"></div></div>';
    var row = dock.querySelector('.s-dockrow');
    $$('[data-subtab]', tabs).forEach(function (b) { var c = b.cloneNode(true); c.removeAttribute('id'); c.removeAttribute('aria-controls'); row.appendChild(c); });
    document.body.appendChild(dock);
    var dockCheck = function () {
      var view = tabs.closest('.s-view'), show = false, h = nav ? nav.getBoundingClientRect().height : 56;
      if (view && !view.hidden) show = tabs.getBoundingClientRect().bottom < h + 4;
      dock.hidden = !show; dock.style.top = (h - 1) + 'px';
    };
    window.addEventListener('scroll', dockCheck, { passive: true }); window.addEventListener('hashchange', function () { setTimeout(dockCheck, 80); }); window.addEventListener('resize', dockCheck); dockCheck();
  }

  /* Overview: section index on the right edge */
  var ov = document.querySelector('.s-view[data-view="overview"]');
  if (ov) {
    var secs = [['.s-hero', 'Introduction'], ['.s-def', 'Definition'], ['.s-use', 'Levers'], ['.s-ins', 'Key results'], ['.s-nextb', 'Next steps']]
      .map(function (x) { var el = ov.querySelector(x[0]); return el ? { el: el, label: x[1] } : null; }).filter(Boolean);
    var rail = document.createElement('nav'); rail.className = 's-rail'; rail.setAttribute('aria-label', 'Sections of this page'); rail.hidden = true;
    rail.innerHTML = '<ul>' + secs.map(function (x, i) { return '<li><button type="button" data-i="' + i + '" aria-label="' + x.label + '"><span>' + x.label + '</span><i></i></button></li>'; }).join('') + '</ul>';
    document.body.appendChild(rail);
    var btns = $$('button', rail);
    var railUpd = function () {
      rail.hidden = ov.hidden || window.innerWidth < 1200;
      if (rail.hidden) return;
      var mid = window.innerHeight * .4, cur = 0;
      secs.forEach(function (x, i) { if (x.el.getBoundingClientRect().top <= mid) cur = i; });
      btns.forEach(function (b, i) { b.classList.toggle('on', i === cur); if (i === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      rail.classList.toggle('on-dark', secs[cur].el.classList.contains('s-def'));
    };
    rail.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var y = secs[+b.getAttribute('data-i')].el.getBoundingClientRect().top + window.pageYOffset - 56;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    });
    window.addEventListener('scroll', railUpd, { passive: true }); window.addEventListener('resize', railUpd); window.addEventListener('hashchange', function () { setTimeout(railUpd, 80); }); railUpd();
  }
})();
