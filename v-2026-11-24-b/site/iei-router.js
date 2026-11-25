/* IEI router: four views on hash routes, sub-tabs, report modal.
   Routes: #overview · #explore[&tab=map|country][&country=ISO] · #framework[&sec=howto] · #case-studies
   Older links (#country=ARG, #about, #cases, #howto, #download…) are mapped onto these. */
(function () {
  'use strict';
  var ROUTES = ['overview', 'explore', 'framework', 'case-studies'];
  var LEGACY = { '': 'overview', top: 'overview', about: 'overview', use: 'overview', definition: 'overview',
    cases: 'case-studies', 'cases-sec': 'case-studies', howto: 'framework', country: 'explore', download: 'overview' };
  var views = [].slice.call(document.querySelectorAll('.s-view'));
  if (!views.length) return;
  var links = [].slice.call(document.querySelectorAll('.s-nav [data-route]'));
  var cur = null;

  function parse() {
    var h = location.hash.replace(/^#/, ''), parts = h ? h.split('&') : [], first = parts[0] || '', p = {};
    parts.forEach(function (x) { var i = x.indexOf('='); if (i > 0) p[decodeURIComponent(x.slice(0, i))] = decodeURIComponent(x.slice(i + 1)); });
    var r = first.indexOf('=') >= 0 ? '' : first;
    if (ROUTES.indexOf(r) < 0) {
      if (r === 'howto') p.sec = 'howto';
      if (r === 'download') p.report = '1';
      if (r === 'country' || (!r && p.country)) p.tab = 'country';
      r = (!r && p.country) ? 'explore' : LEGACY.hasOwnProperty(r) ? LEGACY[r] : (p.country ? 'explore' : 'overview');
    }
    return { r: r, p: p };
  }
  function build(r, p) {
    var q = Object.keys(p).filter(function (k) { return p[k] != null && p[k] !== ''; }).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(p[k]); });
    return '#' + r + (q.length ? '&' + q.join('&') : '');
  }
  function go(r, patch, replace) {
    var s = parse(), p = r === s.r ? s.p : (s.p.country ? { country: s.p.country } : {});
    for (var k in (patch || {})) p[k] = patch[k];
    var h = build(r, p);
    if (replace) { history.replaceState(null, '', location.pathname + location.search + h); apply(); }
    else if (location.hash !== h) location.hash = h; else apply();
  }
  window.IEI_GO = go;

  function hideTips() {
    ['.ix-tip', '.s-dtip', '.ic-tip', '#icSoPop'].forEach(function (s) { document.querySelectorAll(s).forEach(function (t) { t.hidden = true; }); });
  }
  function settle(view) {
    // make freshly shown content render: reveal animations, SVG/maps re-measure on next frame
    view.querySelectorAll('.s-reveal').forEach(function (el) { el.classList.add('s-in'); });
    requestAnimationFrame(function () {
      window.dispatchEvent(new Event('resize'));
      document.dispatchEvent(new CustomEvent('iei:view', { detail: { view: view.getAttribute('data-view') } }));
    });
  }
  function setSub(tab) {
    tab = tab === 'country' ? 'country' : 'map';
    document.querySelectorAll('[data-subtab]').forEach(function (b) {
      var on = b.getAttribute('data-subtab') === tab; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; b.classList.toggle('is-on', on);
    });
    var changed = false;
    document.querySelectorAll('.s-subpanel').forEach(function (el) { var on = el.getAttribute('data-sub') === tab; if (el.hidden === on) changed = true; el.hidden = !on; });
    return changed;
  }
  function apply() {
    var s = parse(), r = s.r, p = s.p, changed = r !== cur;
    views.forEach(function (v) { v.hidden = v.getAttribute('data-view') !== r; });
    links.forEach(function (a) { var on = a.getAttribute('data-route') === r; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var view = document.querySelector('.s-view[data-view="' + r + '"]');
    var subChanged = r === 'explore' ? setSub(p.tab) : false;
    hideTips(); if (!(r === 'framework' && p.sec === 'howto')) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (r === 'framework' && p.sec === 'howto') {
      var how = document.getElementById('howto');
      if (how) requestAnimationFrame(function () { var y = how.getBoundingClientRect().top + window.pageYOffset - 80; window.scrollTo({ top: y, behavior: 'instant' }); });
    }
    cur = r;
    if (view && (changed || subChanged)) settle(view);
    if (p.report === '1') openModal();
  }

  /* ---- sub-tabs (Explore) ---- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-subtab]'); if (!b) return;
    var tab = b.getAttribute('data-subtab'), p = parse().p;
    go('explore', { tab: tab === 'country' ? 'country' : '', country: p.country || '' });
  });
  document.addEventListener('keydown', function (e) {
    var b = e.target.closest && e.target.closest('[role=tab]'); if (!b || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    var list = [].slice.call(b.parentNode.querySelectorAll('[role=tab]')), i = list.indexOf(b);
    var n = list[(i + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length]; n.focus(); n.click();
  });

  /* ---- simple tabs (How to read the Index) ---- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.s-tab'); if (!b) return;
    var list = b.parentNode.querySelectorAll('.s-tab');
    list.forEach(function (t) {
      var on = t === b, pan = document.getElementById(t.getAttribute('aria-controls'));
      t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; if (pan) pan.hidden = !on;
    });
  });

  /* ---- report modal ---- */
  var modal = document.getElementById('sReport'), lastFocus = null;
  function openModal() {
    if (!modal || !modal.hidden) return;
    lastFocus = document.activeElement; modal.hidden = false; document.documentElement.classList.add('s-modal-open');
    var f = modal.querySelector('input,select,button:not(.s-modal-x)'); if (f) setTimeout(function () { f.focus(); }, 30);
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true; document.documentElement.classList.remove('s-modal-open');
    var s = parse(); if (s.p.report) { delete s.p.report; history.replaceState(null, '', location.pathname + location.search + build(s.r, s.p)); }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  window.IEI_REPORT = openModal;
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-report]'); if (b) { e.preventDefault(); openModal(); return; }
    if (modal && !modal.hidden && e.target.closest('[data-close]')) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (!modal || modal.hidden) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'Tab') {
      var f = [].slice.call(modal.querySelectorAll('a[href],button,input,select,textarea')).filter(function (x) { return !x.hidden && x.offsetParent !== null; });
      if (!f.length) return; var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });

  /* ---- opening a country from the map, case studies or tooltips ---- */
  var orig = window.IEI_OPEN_COUNTRY;
  window.IEI_OPEN_COUNTRY = function (id) {
    go('explore', { tab: 'country', country: id });
    if (orig) orig(id);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.addEventListener('hashchange', apply);
  apply();
  // the browser jumps to elements whose id matches the hash (e.g. #explore); undo that on first load
  window.addEventListener('load', function () { setTimeout(function () { var p = parse().p; if (!p.sec) window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, 0); });
})();
