/*!
 * IEI Explorer – interactive map + ranking table for the Impact Economy Index.
 * Vanilla JS, no dependencies. Reads window.IEI_DATA (data/iei-data.js) and
 * window.IEI_WORLD (data/iei-world.js) and renders into #ieiExplorer.
 */
(function () {
  'use strict';

  var DATA = window.IEI_DATA, WORLD = window.IEI_WORLD;
  var root = document.getElementById('ieiExplorer');
  if (!DATA || !WORLD || !root) return;

  var FLAGS = '../Impact Economy Index_files/flags/4x3/';
  var C = DATA.countries, META = DATA.meta;
  var N = C.length;
  var BASE = { x: 10, y: 0, w: 950, h: 425 };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var byId = {};
  C.forEach(function (c) { byId[c.id] = c; });
  var worldById = {};
  WORLD.forEach(function (w) { worldById[w.i] = w; });

  /* ---------- metrics & colour ---------- */
  var TIER_BG = {}, TIER_FG = {}, TIER_RANGE = {}; META.tiers.forEach(function (t) { TIER_BG[t.name] = t.bg; TIER_FG[t.name] = t.fg; TIER_RANGE[t.name] = t.min + '–' + t.max; });

  var METRICS = [
    { id: 'score', name: 'Total score', short: 'Total', accent: '#0F1428', ink: '#FFFFFF', pal: ['#F3F4FF', '#ABB6FF', '#6478FF'], val: function (c) { return c.score; } },
    { id: 'l1', name: META.levers[0].name, short: 'Accountability & Transparency', accent: '#3DCC7D', ink: '#0F1428', pal: ['#EFFBF5', '#96E3B9', '#3DCC7D'], val: function (c) { return c.l[0]; } },
    { id: 'l2', name: META.levers[1].name, short: 'Procurement & Demand', accent: '#77DAD9', ink: '#0F1428', pal: ['#F4FCFC', '#B6EBEA', '#77DAD9'], val: function (c) { return c.l[1]; } },
    { id: 'l3', name: META.levers[2].name, short: 'Capital Allocation & Deployment', accent: '#F094B5', ink: '#0F1428', pal: ['#FEF6F9', '#F7C5D7', '#F094B5'], val: function (c) { return c.l[2]; } },
    { id: 'l4', name: META.levers[3].name, short: 'Coordination & Support', accent: '#FFBD87', ink: '#0F1428', pal: ['#FFFAF5', '#FFDBBE', '#FFBD87'], val: function (c) { return c.l[3]; } }
  ];
  var M = {};
  METRICS.forEach(function (m) {
    var v = C.map(m.val);
    m.min = Math.min.apply(null, v);
    m.max = Math.max.apply(null, v);
    m.avg = v.reduce(function (a, b) { return a + b; }, 0) / v.length;
    m.rank = {};
    C.forEach(function (c) { m.rank[c.id] = 1 + v.filter(function (x) { return x > m.val(c); }).length; });
    M[m.id] = m;
  });
  META.driverIds.forEach(function (id, i) {
    var lk = 0; META.levers.forEach(function (L, k) { if (L.drivers.indexOf(id) >= 0) lk = k; });
    var base = METRICS[lk + 1];
    var m = { id: 'd' + id, driver: true, name: 'Driver ' + id + ' · ' + META.driverLabels[id], short: 'Driver ' + id, accent: base.accent, ink: base.ink, pal: base.pal, val: function (c) { return c.d[i]; } };
    var v = C.map(m.val).filter(function (x) { return x != null; });
    m.min = Math.min.apply(null, v); m.max = Math.max.apply(null, v);
    m.avg = v.reduce(function (a, b) { return a + b; }, 0) / v.length;
    m.rank = {};
    C.forEach(function (c) { var x = m.val(c); m.rank[c.id] = x == null ? null : 1 + v.filter(function (y) { return y > x; }).length; });
    M[m.id] = m;
  });

  var IND = (window.IEI_IND && window.IEI_IND.inds || []).filter(function (x) { return !x.star; });
  IND.forEach(function (ind) {
    var lk = parseInt(ind.id.charAt(0), 10) - 1, base = METRICS[lk + 1], vals = window.IEI_IND.vals;
    var m = { id: 'i' + ind.id, driver: true, ind: true, name: 'Indicator ' + ind.id + ' · ' + ind.name, short: 'Indicator ' + ind.id, accent: base.accent, ink: base.ink, pal: base.pal,
      val: function (c) { var e = (vals[c.id] || {})[ind.id]; return (e && e.s != null) ? Math.round(e.s) : null; } };
    var v = C.map(m.val).filter(function (x) { return x != null; });
    if (!v.length) return;
    m.min = Math.min.apply(null, v); m.max = Math.max.apply(null, v);
    m.avg = v.reduce(function (a, b) { return a + b; }, 0) / v.length;
    m.rank = {};
    C.forEach(function (c) { var x = m.val(c); m.rank[c.id] = x == null ? null : 1 + v.filter(function (y) { return y > x; }).length; });
    M[m.id] = m;
  });

  function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgbCss(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
  function luminance(c) {
    var f = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  }
  function tierOf(score) {
    var t = META.tiers;
    for (var i = t.length - 1; i > 0; i--) if (score >= t[i].min) return t[i].name;
    return t[0].name;
  }
  function colour(m, v) {
    if (m.id === 'score') { var t = tierOf(v); return { bg: TIER_BG[t], fg: TIER_FG[t] }; }
    var u = (v - m.min) / ((m.max - m.min) || 1);
    u = Math.max(0, Math.min(1, u));
    var s = m.pal.map(hex2rgb);
    var rgb = u < 0.5 ? lerp(s[0], s[1], u / 0.5) : lerp(s[1], s[2], (u - 0.5) / 0.5);
    return { bg: rgbCss(rgb), fg: '#0F1428' };
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  function flag(c, cls) { return '<img class="' + (cls || 'ix-flag') + '" src="' + FLAGS + c.flag + '.svg" alt="" loading="lazy">'; }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  /* ---------- state ---------- */
  var state = { metric: 'score', selected: null, q: '', region: '', income: '', sort: { key: 'score', dir: -1 }, drivers: false, tierFocus: null, tier: '', page: 0, all: false, bench: 'all', benchId: '' };
  var PAGE = 12;
  function metric() { return M[state.metric]; }
  function matches(c) {
    if (state.region && c.region !== state.region) return false;
    if (state.income && c.income !== state.income) return false;
    if (state.tier && c.tier !== state.tier) return false;
    if (state.q && norm(c.name).indexOf(norm(state.q)) === -1) return false;
    return true;
  }
  function filtering() { return !!(state.q || state.region || state.income || state.tier); }

  /* ---------- shell ---------- */
  var regions = Array.from(new Set(C.map(function (c) { return c.region; }))).sort();
  var incomes = ['High Income', 'Upper Middle Income', 'Lower Middle Income', 'Low Income'].filter(function (i) { return C.some(function (c) { return c.income === i; }); });
  Array.from(new Set(C.map(function (c) { return c.income; }))).forEach(function (i) { if (incomes.indexOf(i) < 0) incomes.push(i); });

  var COLS = [
    { k: 'name', label: 'Country', cls: 'ix-th-name' },
    { k: 'region', label: 'Region', cls: 'hide-sm' },
    { k: 'income', label: 'Income group', cls: 'hide-md' },
    { k: 'score', label: 'Total', metric: 'score' },
    { k: 'tier', label: 'Stage' },
    { k: 'l1', label: 'Accountability & Transparency', metric: 'l1' },
    { k: 'l2', label: 'Procurement & Demand', metric: 'l2' },
    { k: 'l3', label: 'Coordination & Support', metric: 'l3' },
    { k: 'l4', label: 'Capital Allocation & Deployment', metric: 'l4' }
  ];

  root.innerHTML =
    '<div class="ix">' +
    '  <div class="ix-toolbar">' +
    '    <div class="ix-metrics" role="group" aria-label="Score to display">' +
    METRICS.map(function (m) {
      return '<button type="button" class="ix-metric" data-m="' + m.id + '" style="--a:' + m.accent + ';--on:' + m.ink + '" aria-pressed="false"><i class="ix-dot"></i>' + esc(m.id === 'score' ? 'Total score' : m.name) + '</button>';
    }).join('') +
    '      <label class="ix-sel ix-drvwrap"><span class="ix-sr">Map a single driver or indicator</span><select class="ix-drvsel"><option value="">Or map a driver or indicator…</option>' +
    META.levers.map(function (L) { return '<optgroup label="Drivers · ' + esc(L.name) + '">' + L.drivers.map(function (id) { return '<option value="d' + id + '">' + id + ' · ' + esc(META.driverLabels[id]) + '</option>'; }).join('') + '</optgroup>'; }).join('') +
    META.levers.map(function (L, k) { var li = IND.filter(function (x) { return parseInt(x.id.charAt(0), 10) === k + 1 && M['i' + x.id]; }); return li.length ? '<optgroup label="Indicators · ' + esc(L.name) + '">' + li.map(function (x) { return '<option value="i' + x.id + '">' + x.id + ' · ' + esc(x.name) + '</option>'; }).join('') + '</optgroup>' : ''; }).join('') + '</select></label>' +
    '    </div>' +
    '    <div class="ix-filters">' +
    '      <label class="ix-search"><span class="ix-sr">Search countries</span><input type="search" class="ix-q" placeholder="Search a country…" autocomplete="off"></label>' +
    '      <label class="ix-sel"><span class="ix-sr">Region</span><select class="ix-region"><option value="">All regions</option>' + regions.map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('') + '</select></label>' +
    '      <label class="ix-sel"><span class="ix-sr">Stage</span><select class="ix-tier"><option value="">All stages</option>' + META.tiers.map(function (t) { return '<option value="' + esc(t.name) + '">' + esc(t.name) + '</option>'; }).join('') + '</select></label>' +
    '      <label class="ix-sel"><span class="ix-sr">Income group</span><select class="ix-income"><option value="">All income groups</option>' + incomes.map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('') + '</select></label>' +
    '      <button type="button" class="ix-ghost ix-reset">Reset</button>' +
    '    </div>' +
    '  </div>' +
    '  <div class="ix-main">' +
    '    <section class="ix-card ix-mapcard" aria-label="Map">' +
    '      <div class="ix-mapbar">' +
    '        <div><p class="ix-maptitle"></p><p class="ix-mapsub"></p></div>' +
    '        <div class="ix-zoom" role="group" aria-label="Map zoom">' +
    '          <button type="button" data-z="in" aria-label="Zoom in">+</button>' +
    '          <button type="button" data-z="out" aria-label="Zoom out">−</button>' +
    '          <button type="button" data-z="reset" aria-label="Reset view">⤢</button>' +
    '        </div>' +
    '      </div>' +
    '      <div class="ix-mapwrap">' +
    '        <svg class="ix-map" viewBox="' + [BASE.x, BASE.y, BASE.w, BASE.h].join(' ') + '" role="img" aria-label="World map coloured by Impact Economy Index score. The ranking table below lists the same data."></svg>' +
    '        <div class="ix-tip" hidden></div>' +
    '      </div>' +
    '      <div class="ix-legend"></div>' +
    '      <p class="ix-maphint">Click a country to open its profile · drag to pan · Ctrl/⌘ + scroll to zoom</p>' +
    '    </section>' +
    '    <aside class="ix-card ix-panel" aria-live="polite"></aside>' +
    '  </div>' +
    '  <section class="ix-card ix-tablecard" id="ixTable" aria-label="Ranking table">' +
    '    <div class="ix-tablebar">' +
    '      <div><p class="ix-tabletitle">Country ranking</p><p class="ix-count"></p></div>' +
    '      <button type="button" class="ix-ghost ix-dl">Download data (CSV)</button>' +
    '    </div>' +
    '    <div class="ix-scroll"><table class="ix-table"><thead><tr>' +
    '      <th class="ix-th-rank" scope="col"><span>#</span></th>' +
    COLS.map(function (c) {
      var mm = c.metric ? M[c.metric] : null;
      return '<th scope="col" class="' + (c.cls || '') + (mm ? ' ix-th-m' : '') + '" data-k="' + c.k + '" aria-sort="none"><button type="button">' + (mm ? '<i class="ix-dot" style="--a:' + (mm.id === 'score' ? '#6478ff' : mm.accent) + '"></i>' : '') + '<span>' + esc(c.label) + '</span><span class="ix-sort" aria-hidden="true"></span></button></th>';
    }).join('') +
    '<th scope="col" class="ix-th-m ix-th-sel" data-k="score" aria-sort="none" hidden><button type="button"><i class="ix-dot"></i><span class="ix-sel-l"></span><span class="ix-sort" aria-hidden="true"></span></button></th>' +
    '    </tr></thead><tbody></tbody></table></div>' +
    '    <div class="ix-pager"><span class="ix-pageinfo" aria-live="polite"></span><div class="ix-pagebtns">' +
    '      <button type="button" class="ix-ghost ix-pg" data-pg="prev" aria-label="Previous page">←</button>' +
    '      <button type="button" class="ix-ghost ix-pg" data-pg="next" aria-label="Next page">→</button>' +
    '      <button type="button" class="ix-ghost ix-pgall"></button></div></div>' +
    '  </section>' +
    '</div>';

  var $ = function (sel) { return root.querySelector(sel); };
  var svg = $('.ix-map'), wrap = $('.ix-mapwrap'), tip = $('.ix-tip'), panel = $('.ix-panel'), tbody = $('.ix-table tbody'), scroller = $('.ix-scroll');

  /* ---------- map ---------- */
  var others = [], has = [];
  WORLD.forEach(function (w) { (byId[w.i] ? has : others).push(w); });
  svg.innerHTML = '<g class="ix-land">' +
    others.map(function (w) { return '<path class="ix-c" d="' + w.d + '"/>'; }).join('') +
    has.map(function (w) { return '<path class="ix-c has" data-id="' + w.i + '" d="' + w.d + '"/>'; }).join('') + '</g>';
  var land = svg.firstChild;
  var pathEl = {};
  Array.prototype.forEach.call(svg.querySelectorAll('.ix-c.has'), function (p) { pathEl[p.getAttribute('data-id')] = p; });
  svg.insertAdjacentHTML('afterbegin', '<defs><pattern id="ixHatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#F1F0EE"/><line x1="0" y1="0" x2="0" y2="5" stroke="#B9B4AC" stroke-width="1.6"/></pattern></defs>');
  var markEl = {};
  Object.keys(pathEl).forEach(function (id) {
    var bb; try { bb = pathEl[id].getBBox(); } catch (e) { return; }
    if (!bb || Math.max(bb.width, bb.height) > 4) return;
    var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('class', 'ix-c has ix-mk'); c.setAttribute('data-id', id);
    c.setAttribute('cx', (bb.x + bb.width / 2).toFixed(2)); c.setAttribute('cy', (bb.y + bb.height / 2).toFixed(2)); c.setAttribute('r', '3.4');
    land.appendChild(c); markEl[id] = c;
  });
  function both(id) { return [pathEl[id], markEl[id]].filter(Boolean); }

  var view = { x: BASE.x, y: BASE.y, w: BASE.w, h: BASE.h }, anim = null;
  function applyView() {
    svg.setAttribute('viewBox', [view.x, view.y, view.w, view.h].map(function (v) { return v.toFixed(2); }).join(' '));
    var k = BASE.w / view.w;
    $('[data-z="in"]').disabled = k >= 11.5;
    $('[data-z="out"]').disabled = k <= 1.01;
    wrap.classList.toggle('is-zoomed', k > 1.01);
  }
  function clampView(v) {
    v.w = Math.min(Math.max(v.w, BASE.w / 12), BASE.w);
    v.h = v.w * BASE.h / BASE.w;
    v.x = Math.min(Math.max(v.x, BASE.x), BASE.x + BASE.w - v.w);
    v.y = Math.min(Math.max(v.y, BASE.y), BASE.y + BASE.h - v.h);
    return v;
  }
  function flyTo(t, instant) {
    if (anim) cancelAnimationFrame(anim);
    t = clampView({ x: t.x, y: t.y, w: t.w, h: t.h });
    if (reduced || instant) { view = t; applyView(); return; }
    var from = { x: view.x, y: view.y, w: view.w, h: view.h }, t0 = performance.now(), dur = 650;
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      view = { x: from.x + (t.x - from.x) * e, y: from.y + (t.y - from.y) * e, w: from.w + (t.w - from.w) * e, h: from.h + (t.h - from.h) * e };
      applyView();
      if (p < 1) anim = requestAnimationFrame(step);
    })(t0);
  }
  function zoomBy(f, cx, cy, instant) {
    var nw = view.w / f;
    cx = cx == null ? view.x + view.w / 2 : cx;
    cy = cy == null ? view.y + view.h / 2 : cy;
    var nh = nw * BASE.h / BASE.w;
    flyTo({ x: cx - (cx - view.x) * nw / view.w, y: cy - (cy - view.y) * nh / view.h, w: nw, h: nh }, instant);
  }
  function targetFor(id) {
    var b = worldById[id].b;
    var w = b[2] - b[0], h = b[3] - b[1];
    var tw = Math.min(BASE.w, Math.max(BASE.w / 9, w * 3, h * 2.1 * BASE.w / BASE.h));
    var th = tw * BASE.h / BASE.w;
    return { x: (b[0] + b[2]) / 2 - tw / 2, y: (b[1] + b[3]) / 2 - th / 2, w: tw, h: th };
  }

  var drag = null, suppressClick = false;
  svg.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    drag = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
    if (view.w >= BASE.w - 0.5) return;
    drag.moved = true;
    if (anim) cancelAnimationFrame(anim);
    var r = svg.getBoundingClientRect();
    view.x = drag.vx - dx * view.w / r.width;
    view.y = drag.vy - dy * view.h / r.height;
    clampView(view);
    applyView();
    wrap.classList.add('is-dragging');
    hideTip();
  });
  window.addEventListener('pointerup', function () {
    if (drag && drag.moved) { suppressClick = true; setTimeout(function () { suppressClick = false; }, 0); }
    drag = null;
    wrap.classList.remove('is-dragging');
  });
  svg.addEventListener('wheel', function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    var r = svg.getBoundingClientRect();
    zoomBy(e.deltaY < 0 ? 1.25 : 0.8, view.x + (e.clientX - r.left) / r.width * view.w, view.y + (e.clientY - r.top) / r.height * view.h, true);
  }, { passive: false });

  /* ---------- tooltip & hover ---------- */
  function tipHtml(c) {
    var m = metric(), v = m.val(c);
    return '<div class="ix-tip-h">' + flag(c, 'ix-flag') + '<b>' + esc(c.name) + '</b></div>' +
      '<div class="ix-tip-s"><span class="ix-tip-v">' + (v == null ? 'No data' : v) + '</span><span>' + esc(m.id === 'score' ? tierOf(v) : m.short) + '</span></div>' +
      (m.id === 'score' ? '<div class="ix-tip-l">' + METRICS.slice(1).map(function (x) { return '<span title="' + esc(x.name) + '"><i style="background:' + x.accent + '"></i>' + x.val(c) + '</span>'; }).join('') + '</div>' : '<div class="ix-tip-l"><span>Total ' + c.score + ' · ' + esc(tierOf(c.score)) + '</span></div>');
  }
  function showTip(c, e) {
    tip.innerHTML = tipHtml(c);
    tip.hidden = false;
    var r = wrap.getBoundingClientRect();
    var x = e.clientX - r.left + 16, y = e.clientY - r.top + 16;
    var tw = tip.offsetWidth, th = tip.offsetHeight;
    if (x + tw > r.width - 6) x = e.clientX - r.left - tw - 16;
    if (y + th > r.height - 6) y = e.clientY - r.top - th - 16;
    tip.style.transform = 'translate(' + Math.max(6, x) + 'px,' + Math.max(6, y) + 'px)';
  }
  function hideTip() { tip.hidden = true; }
  var hoverId = null;
  function setHover(id) {
    if (hoverId === id) return;
    if (hoverId) both(hoverId).forEach(function (x) { x.classList.remove('is-hover'); });
    var old = tbody.querySelector('tr.is-hover'); if (old) old.classList.remove('is-hover');
    hoverId = id;
    if (id) both(id).forEach(function (x) { x.classList.add('is-hover'); });
    if (id) { var tr = tbody.querySelector('tr[data-id="' + id + '"]'); if (tr) tr.classList.add('is-hover'); }
  }

  function cov(c) { return c.d.filter(function (v) { return v != null; }).length; }
  /* ---------- painting ---------- */
  function paint() {
    var m = metric();
    C.forEach(function (c) {
      var el = pathEl[c.id];
      var fill = m.val(c) == null ? 'url(#ixHatch)' : colour(m, m.val(c)).bg;
      var off = !matches(c) || (state.tierFocus && m.id === 'score' && tierOf(c.score) !== state.tierFocus);
      both(c.id).forEach(function (x) { x.style.fill = fill; x.classList.toggle('dim', !!off); });
    });
    $('.ix-maptitle').textContent = m.name;
    $('.ix-mapsub').textContent = (m.id === 'score' ? 'Total score by country (1–100)' : m.ind ? 'Indicator score by country (1–100) · hatched = no data' : m.driver ? 'Driver score by country (1–100) · hatched = no data' : 'Lever score by country (1–100)') + ' · ' + N + ' countries';
    Array.prototype.forEach.call(root.querySelectorAll('.ix-metric'), function (b) {
      var on = b.getAttribute('data-m') === state.metric;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var ds = $('.ix-drvsel'); if (ds) ds.value = m.driver ? m.id : '';
    var sth = $('.ix-th-sel'); if (sth) { sth.hidden = !m.driver; sth.setAttribute('data-k', m.id); sth.querySelector('.ix-dot').style.setProperty('--a', m.accent); sth.querySelector('.ix-sel-l').textContent = m.short; }
    $('.ix-drvwrap').classList.toggle('is-active', !!m.driver);
    if (legendFor !== state.metric) renderLegend();
  }
  var legendFor = null;
  function renderLegend() {
    legendFor = state.metric;
    var m = metric(), el = $('.ix-legend');
    if (m.id === 'score') {
      el.innerHTML = '<div class="ix-leg-steps">' + META.tiers.map(function (t) {
        return '<button type="button" class="ix-leg-item" data-tier="' + t.name + '"><i style="background:' + TIER_BG[t.name] + '"></i><span><b>' + t.name + '</b> ' + TIER_RANGE[t.name] + '</span></button>';
      }).join('') + '<span class="ix-leg-item ix-leg-out"><i></i><span>Not in the Index</span></span></div>';
    } else {
      el.innerHTML = '<div class="ix-leg-grad"><span>' + m.min + '</span><i style="background:linear-gradient(90deg,' + m.pal.join(',') + ')"></i><span>' + m.max + '</span></div><span class="ix-leg-item ix-leg-nd"><i></i><span>No data</span></span><span class="ix-leg-item ix-leg-out"><i></i><span>Not in the Index</span></span>';
    }
  }
  function paintSelection() {
    Array.prototype.forEach.call(svg.querySelectorAll('.is-selected'), function (p) { p.classList.remove('is-selected'); });
    if (state.selected && pathEl[state.selected]) {
      pathEl[state.selected].classList.add('is-selected');
      land.appendChild(pathEl[state.selected]);
      if (markEl[state.selected]) { markEl[state.selected].classList.add('is-selected'); land.appendChild(markEl[state.selected]); }
      Object.keys(markEl).forEach(function (k) { if (k !== state.selected) land.appendChild(markEl[k]); });
    }
  }

  /* ---------- side panel ---------- */
  function listItems(arr, m) {
    return '<ol class="ix-list">' + arr.map(function (c) {
      return '<li><button type="button" data-id="' + c.id + '">' + flag(c) + '<span>' + esc(c.name) + '</span><b>' + (m.val(c) == null ? '–' : m.val(c)) + '</b></button></li>';
    }).join('') + '</ol>';
  }
  function renderOverview() {
    var m = metric();
    var ranked = C.filter(function (c) { return m.val(c) != null; }).sort(function (a, b) { return m.val(b) - m.val(a) || a.name.localeCompare(b.name); });
    var tiers = '';
    if (m.id === 'score') {
      var counts = META.tiers.map(function (t) { return { t: t.name, n: C.filter(function (c) { return c.tier === t.name; }).length }; });
      tiers = '<p class="ix-sub">Countries by maturity stage</p><div class="ix-tierbar">' + counts.map(function (x) {
        return '<span style="flex:' + x.n + ';background:' + TIER_BG[x.t] + ';color:' + TIER_FG[x.t] + '" title="' + x.t + ': ' + x.n + '">' + x.n + '</span>';
      }).join('') + '</div><div class="ix-tiernames">' + counts.map(function (x) { return '<span>' + x.t + '</span>'; }).join('') + '</div>';
    }
    panel.innerHTML = '<div class="ix-pb">' +
      '<p class="ix-kicker">Global snapshot</p><h3 class="ix-ptitle">' + esc(m.name) + '</h3>' +
      '<div class="ix-avg"><span style="color:' + '#0F1428' + '">' + Math.round(m.avg) + '</span><small>average across ' + ranked.length + ' countries<br>range ' + m.min + '–' + m.max + '</small></div>' +
      tiers +
      '<p class="ix-sub">Highest</p>' + listItems(ranked.slice(0, 3), m) +
      '<p class="ix-sub">Lowest</p>' + listItems(ranked.slice(-3).reverse(), m) +
      '<p class="ix-hint">Select a country on the map or in the table to see its full profile.</p></div>';
  }
  function ring(score, tier) {
    var r = 42, circ = 2 * Math.PI * r;
    return '<svg class="ix-ring" viewBox="0 0 100 100" role="img" aria-label="Score ' + score + ' out of 100"><circle cx="50" cy="50" r="' + r + '" class="ix-ring-bg"/><circle cx="50" cy="50" r="' + r + '" class="ix-ring-fg" style="stroke:' + (({ 'Nascent': '#BFEDEC', 'Emerging': '#77DAD9', 'Early Developing': '#4FC9C8', 'Late Developing': '#6478FF', 'Advanced': '#2942B5', 'Thriving': '#0F1428' })[tier] || '#2942B5') + ';stroke-dasharray:' + (circ * score / 100).toFixed(1) + ' ' + circ.toFixed(1) + '" transform="rotate(-90 50 50)"/><text x="50" y="50" text-anchor="middle" dominant-baseline="central" class="ix-ring-t">' + score + '</text></svg>';
  }
  function firstOther() { var o = C.filter(function (x) { return x.id !== state.selected; }).sort(function (a, b) { return b.score - a.score; }); return o.length ? o[0].id : ''; }
  function avgOf(list, fn) {
    var v = list.map(fn).filter(function (x) { return x != null; });
    return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null;
  }
  function benchFor(c) {
    var b = state.bench, list, label;
    if (b === 'tier') { list = C.filter(function (x) { return x.tier === c.tier; }); label = 'Stage average (' + c.tier + ', ' + list.length + ')'; }
    else if (b === 'income') { list = C.filter(function (x) { return x.income === c.income; }); label = 'Income group average (' + c.income + ', ' + list.length + ')'; }
    else if (b === 'region') { list = C.filter(function (x) { return x.region === c.region; }); label = 'Region average (' + c.region + ', ' + list.length + ')'; }
    else if (b === 'country' && byId[state.benchId]) { list = [byId[state.benchId]]; label = byId[state.benchId].name; }
    else { list = C; label = 'Average of all countries (' + N + ')'; }
    return { list: list, label: label };
  }
  function delta(v, ref) {
    if (v == null || ref == null) return '';
    var d = Math.round(v - ref);
    return '<em class="ix-d ' + (d > 0 ? 'up' : d < 0 ? 'down' : 'eq') + '" title="Difference vs. comparison">' + (d === 0 ? '±0' : (d > 0 ? '+' : '−') + Math.abs(d)) + '</em>';
  }
  function renderCountry(c) {
    var bn = benchFor(c);
    var benchUi = '<div class="ix-benchbar"><label><span class="ix-sub" style="margin:0">Compare with</span>' +
      '<select class="ix-bench" aria-label="Comparison group">' +
      [['all', 'All countries'], ['tier', 'Same stage'], ['income', 'Same income group'], ['region', 'Same region'], ['country', 'Another country…']].map(function (o) { return '<option value="' + o[0] + '"' + (state.bench === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') +
      '</select></label>' +
      (state.bench === 'country' ? '<label><span class="ix-sr">Country to compare</span><select class="ix-benchc" aria-label="Country to compare">' +
        C.filter(function (x) { return x.id !== c.id; }).sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (x) { return '<option value="' + x.id + '"' + (state.benchId === x.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select></label>' : '') + '</div>';
    var avgTotal = Math.round(avgOf(bn.list, function (x) { return x.score; })), diff = c.score - avgTotal;
    var levers = METRICS.slice(1).map(function (m) {
      var v = m.val(c), ref = avgOf(bn.list, m.val);
      return '<div class="ix-lrow"><span class="ix-lname"><i style="background:' + m.accent + '"></i>' + esc(m.short) + '</span><b>' + v + delta(v, ref) + '</b>' +
        '<div class="ix-bar"><span style="width:' + v + '%;background:' + m.accent + '"></span><u style="left:' + ref.toFixed(1) + '%" title="' + esc(bn.label) + ': ' + Math.round(ref) + '"></u></div></div>';
    }).join('');
    var drv = META.levers.map(function (L, k) {
      var m = METRICS[k + 1];
      return '<p class="ix-dgroup"><i style="background:' + m.accent + '"></i>' + esc(L.name) + '</p>' + L.drivers.map(function (id) {
        var di = META.driverIds.indexOf(id), v = c.d[di], ref = avgOf(bn.list, function (x) { return x.d[di]; });
        return '<div class="ix-drow" title="' + esc(META.driverLabels[id]) + '"><span class="ix-did">' + id + '</span><span class="ix-dlab">' + esc(META.driverLabels[id]) + '</span><b>' + (v == null ? 'n/a' : v + delta(v, ref)) + '</b><div class="ix-bar thin"><span style="width:' + (v == null ? 0 : v) + '%;background:' + m.accent + '"></span>' + (ref == null ? '' : '<u style="left:' + ref.toFixed(1) + '%" title="' + esc(bn.label) + ': ' + Math.round(ref) + '"></u>') + '</div></div>';
      }).join('');
    }).join('');
    panel.innerHTML = '<div class="ix-pb">' +
      '<div class="ix-phead">' + flag(c, 'ix-pflag') + '<div><h3 class="ix-ptitle">' + esc(c.name) + '</h3><p class="ix-psub">' + esc(c.region) + ' · ' + esc(c.income) + '</p></div><button type="button" class="ix-x" aria-label="Back to overview">×</button></div>' +
      '<div class="ix-scorebox">' + ring(c.score, c.tier) + '<div><span class="ix-badge" style="background:' + TIER_BG[c.tier] + ';color:' + TIER_FG[c.tier] + '">' + esc(c.tier) + '</span>' +
      '<p class="ix-rankline">Ranked <b>#' + M.score.rank[c.id] + '</b> of ' + N + '</p>' +
      '<p class="ix-diffline">' + (diff === 0 ? 'At the comparison average (' + avgTotal + ')' : '<b>' + (diff > 0 ? '+' : '−') + Math.abs(diff) + '</b> vs. ' + esc(bn.label.toLowerCase().replace(/ \(.*$/, '')) + ' (' + avgTotal + ')') + '</p></div></div>' +
      benchUi +
      '<p class="ix-sub">Levers <span class="ix-key"><u></u> ' + esc(bn.label) + '</span></p>' + levers +
      '<button type="button" class="ix-toggle" aria-expanded="' + state.drivers + '">' + (state.drivers ? 'Hide drivers' : 'Show all 14 drivers') + '</button>' +
      '<div class="ix-drv"' + (state.drivers ? '' : ' hidden') + '>' + drv + '</div>' +
      (window.IEI_OPEN_COUNTRY || document.getElementById('ieiCountry') ? '<button type="button" class="ix-toggle ix-analysis" data-open="' + c.id + '">Open full country analysis ↓</button>' : '') +
      (c.link ? '<a class="ix-profile" href="' + esc(c.link) + '" target="_blank" rel="noopener">Open country profile ↗</a>' : '') + '</div>';
  }
  function renderPanel() {
    if (state.selected) renderCountry(byId[state.selected]); else renderOverview();
  }

  /* ---------- table ---------- */
  function keyVal(c, k) {
    if (k === 'name' || k === 'region' || k === 'income') return c[k];
    if (k === 'tier') return c.score;
    return M[k].val(c);
  }
  function sortedRows() {
    var k = state.sort.key, d = state.sort.dir;
    return C.filter(matches).sort(function (a, b) {
      var x = keyVal(a, k), y = keyVal(b, k);
      if (x == null || y == null) return (x == null) - (y == null) || a.name.localeCompare(b.name);
      var r = typeof x === 'string' ? x.localeCompare(y) : x - y;
      return (r * d) || a.name.localeCompare(b.name);
    });
  }
  function renderTable() {
    var full = sortedRows(), m = metric();
    var pages = Math.max(1, Math.ceil(full.length / PAGE));
    if (state.page >= pages) state.page = pages - 1;
    if (state.page < 0) state.page = 0;
    var list = state.all ? full : full.slice(state.page * PAGE, state.page * PAGE + PAGE);
    var from = state.all ? 1 : state.page * PAGE + 1;
    tbody.innerHTML = list.length ? list.map(function (c) {
      return '<tr class="ix-row' + (state.selected === c.id ? ' is-selected' : '') + '" data-id="' + c.id + '" tabindex="0" aria-label="' + esc(c.name) + ', total score ' + c.score + '">' +
        '<td class="ix-rk">' + (m.rank[c.id] == null ? '–' : m.rank[c.id]) + '</td>' +
        '<td class="ix-nm">' + flag(c) + '<span>' + esc(c.name) + '</span>' + (cov(c) < 14 ? '<span class="ix-cov" title="' + cov(c) + ' of 14 drivers have data. Missing drivers are left out of the average, not scored as zero.">' + cov(c) + '/14 drivers</span>' : '') + '</td>' +
        '<td class="hide-sm ix-mut">' + esc(c.region) + '</td>' +
        '<td class="hide-md ix-mut">' + esc(c.income) + '</td>' +
        METRICS.map(function (mm) {
          var v = mm.val(c), col = colour(mm, v);
          return '<td class="ix-h' + (mm.id === state.metric ? ' is-active' : '') + '" style="background:' + col.bg + ';color:' + col.fg + '">' + v + '</td>' +
            (mm.id === 'score' ? '<td class="ix-tcell"><span class="ix-badge sm" style="background:' + TIER_BG[c.tier] + ';color:' + TIER_FG[c.tier] + '">' + esc(c.tier) + '</span></td>' : '');
        }).join('') + (m.driver ? (function () { var v = m.val(c); if (v == null) return '<td class="ix-h is-active ix-nd-cell">No data</td>'; var col = colour(m, v); return '<td class="ix-h is-active" style="background:' + col.bg + ';color:' + col.fg + '">' + v + '</td>'; })() : '') + '</tr>';
    }).join('') : '<tr><td colspan="11" class="ix-empty">No countries match these filters.</td></tr>';
    $('.ix-count').textContent = 'Showing ' + (list.length ? from + '–' + (from + list.length - 1) : 0) + ' of ' + full.length + (full.length === N ? '' : ' (filtered from ' + N + ')') + ' countries · ranks follow ' + m.name.toLowerCase();
    $('.ix-pageinfo').textContent = state.all ? 'All ' + full.length + ' countries shown' : 'Page ' + (state.page + 1) + ' of ' + pages;
    $('.ix-pager').classList.toggle('is-single', full.length <= PAGE);
    $('.ix-pgall').textContent = state.all ? 'Show ' + PAGE + ' per page' : 'Show all';
    $('[data-pg="prev"]').disabled = state.all || state.page <= 0;
    $('[data-pg="next"]').disabled = state.all || state.page >= pages - 1;
    Array.prototype.forEach.call(root.querySelectorAll('.ix-table th[data-k]'), function (th) {
      var k = th.getAttribute('data-k');
      th.setAttribute('aria-sort', state.sort.key === k ? (state.sort.dir === 1 ? 'ascending' : 'descending') : 'none');
      th.classList.toggle('is-active', state.metric === k);
    });
    if (hoverId) { var tr = tbody.querySelector('tr[data-id="' + hoverId + '"]'); if (tr) tr.classList.add('is-hover'); }
  }

  /* ---------- actions ---------- */
  function refresh() { state.page = 0; paint(); renderTable(); }
  function setMetric(id, silent) {
    if (!M[id]) id = 'score';
    state.metric = id;
    if (!silent && window.IEI_HASH) window.IEI_HASH.set({ map: id === 'score' ? '' : id });
    state.sort = { key: id, dir: -1 };
    state.tierFocus = null;
    refresh();
    if (!state.selected) renderOverview();
  }
  function select(id, fromTable) {
    state.selected = (id && byId[id] && state.selected !== id) ? id : null;
    paintSelection();
    renderPanel();
    if (state.selected && !fromTable && !state.all) {
      var ix = sortedRows().map(function (x) { return x.id; }).indexOf(state.selected);
      if (ix >= 0) { var pg = Math.floor(ix / PAGE); if (pg !== state.page) { state.page = pg; renderTable(); } }
    }
    Array.prototype.forEach.call(tbody.querySelectorAll('tr.is-selected'), function (r) { r.classList.remove('is-selected'); });
    if (state.selected) {
      var tr = tbody.querySelector('tr[data-id="' + state.selected + '"]');
      if (tr) {
        tr.classList.add('is-selected');
        if (!fromTable) {
          var box = scroller.getBoundingClientRect(), rr = tr.getBoundingClientRect();
          scroller.scrollTo({ top: scroller.scrollTop + (rr.top - box.top) - box.height / 2 + rr.height / 2, behavior: reduced ? 'auto' : 'smooth' });
        }
      }
      flyTo(targetFor(state.selected));
    } else {
      flyTo(BASE);
    }
  }
  function resetAll() {
    state.q = ''; state.region = ''; state.income = ''; state.tier = ''; state.tierFocus = null;
    $('.ix-q').value = ''; $('.ix-region').value = ''; $('.ix-income').value = ''; $('.ix-tier').value = '';
    state.selected = null; paintSelection();
    state.sort = { key: state.metric, dir: -1 };
    refresh(); renderPanel(); flyTo(BASE);
  }
  function downloadCsv() {
    var head = ['Country', 'ISO3', 'Total score', 'Maturity stage'].concat(META.levers.map(function (l) { return l.name; }), ['Enabling conditions', 'Behaviour', 'Region', 'Income group'], META.driverIds.map(function (id) { return 'Driver ' + id + ' - ' + META.driverLabels[id]; }));
    var q = function (v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = [head.map(q).join(',')].concat(C.slice().sort(function (a, b) { return b.score - a.score; }).map(function (c) {
      return [c.name, c.id, c.score, c.tier].concat(c.l, [c.e, c.b, c.region, c.income], c.d).map(q).join(',');
    }));
    var blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'impact-economy-index-scores' + (window.IEI_VERSION ? '_' + window.IEI_VERSION.label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '') + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  window.IEI_DOWNLOAD_CSV = downloadCsv;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-iei-csv]');
    if (a) { e.preventDefault(); downloadCsv(); }
    a = e.target.closest && e.target.closest('[data-tbc]');
    if (a) e.preventDefault();
  });

  /* ---------- events ---------- */
  root.addEventListener('click', function (e) {
    var t = e.target;
    var b;
    if ((b = t.closest('.ix-metric'))) return setMetric(b.getAttribute('data-m'));
    if ((b = t.closest('.ix-zoom button'))) {
      var z = b.getAttribute('data-z');
      return z === 'reset' ? flyTo(BASE) : zoomBy(z === 'in' ? 1.7 : 1 / 1.7);
    }
    if (t.closest('.ix-reset')) return resetAll();
    if (t.closest('.ix-dl')) return downloadCsv();
    if ((b = t.closest('.ix-pg'))) { state.page += b.getAttribute('data-pg') === 'next' ? 1 : -1; renderTable(); return scroller.scrollTo({ top: 0 }); }
    if (t.closest('.ix-pgall')) { state.all = !state.all; state.page = 0; return renderTable(); }
    if (t.closest('.ix-x')) return select(null);
    if ((b = t.closest('.ix-analysis'))) { if (window.IEI_OPEN_COUNTRY) window.IEI_OPEN_COUNTRY(b.getAttribute('data-open')); return; }
    if (t.closest('.ix-toggle')) { state.drivers = !state.drivers; return renderPanel(); }
    if ((b = t.closest('.ix-table th[data-k]'))) {
      var k = b.getAttribute('data-k');
      if (state.sort.key === k) state.sort.dir *= -1;
      else state.sort = { key: k, dir: (k === 'name' || k === 'region' || k === 'income') ? 1 : -1 };
      if (M[k] && state.metric !== k) { state.metric = k; state.tierFocus = null; if (window.IEI_HASH) window.IEI_HASH.set({ map: k === 'score' ? '' : k }); paint(); if (!state.selected) renderOverview(); }
      state.page = 0;
      return renderTable();
    }
    if ((b = t.closest('.ix-list button'))) return select(b.getAttribute('data-id'));
    if ((b = t.closest('tr[data-id]'))) return select(b.getAttribute('data-id'), true);
    if ((b = t.closest('.ix-c.has'))) { if (suppressClick) return; return select(b.getAttribute('data-id')); }
  });
  root.addEventListener('keydown', function (e) {
    var tr = e.target.closest && e.target.closest('tr[data-id]');
    if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(tr.getAttribute('data-id'), true); }
    if (e.key === 'Escape' && state.selected) select(null);
  });
  root.addEventListener('mouseover', function (e) {
    var p = e.target.closest('.ix-c.has'), tr = e.target.closest('tr[data-id]'), lg = e.target.closest('.ix-leg-item[data-tier]');
    setHover(p ? p.getAttribute('data-id') : (tr ? tr.getAttribute('data-id') : null));
    if (lg) { state.tierFocus = lg.getAttribute('data-tier'); paint(); }
  });
  root.addEventListener('mouseout', function (e) {
    var lg = e.target.closest('.ix-leg-item[data-tier]');
    if (lg && state.tierFocus && !(e.relatedTarget && lg.contains(e.relatedTarget))) { state.tierFocus = null; paint(); }
    if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('.ix-c.has, tr[data-id]')) setHover(null);
    if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('.ix-c.has')) hideTip();
  });
  svg.addEventListener('mousemove', function (e) {
    if (drag && drag.moved) return;
    var p = e.target.closest('.ix-c.has');
    if (p) showTip(byId[p.getAttribute('data-id')], e); else hideTip();
  });
  $('.ix-q').addEventListener('input', function (e) { state.q = e.target.value.trim(); refresh(); });
  /* country suggestions while typing: pick one to select it on the map */
  (function () {
    var q = $('.ix-q'), box = document.createElement('ul'), cur = -1, items = [];
    box.className = 'ix-sug'; box.id = 'ixSug'; box.setAttribute('role', 'listbox'); box.hidden = true;
    q.parentNode.appendChild(box);
    q.setAttribute('role', 'combobox'); q.setAttribute('aria-autocomplete', 'list'); q.setAttribute('aria-controls', 'ixSug'); q.setAttribute('aria-expanded', 'false');
    var TT = function (x) { return window.IEI_T ? window.IEI_T(x) : x; };
    var fold = function (x) { return String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    function close() { box.hidden = true; cur = -1; q.setAttribute('aria-expanded', 'false'); }
    function draw() {
      var v = fold(q.value.trim());
      if (!v) { items = []; close(); return; }
      var hits = C.map(function (c) { var n = TT(c.name), a = fold(n), b = fold(c.name), i = Math.min(a.indexOf(v) < 0 ? 99 : a.indexOf(v), b.indexOf(v) < 0 ? 99 : b.indexOf(v)); return { c: c, n: n, i: i }; })
        .filter(function (h) { return h.i < 99; }).sort(function (x, y) { return (x.i === 0 ? 0 : 1) - (y.i === 0 ? 0 : 1) || x.n.localeCompare(y.n); }).slice(0, 8);
      items = hits; cur = -1;
      if (!hits.length) { close(); return; }
      box.innerHTML = hits.map(function (h, k) {
        return '<li role="option" id="ixSug' + k + '" data-id="' + h.c.id + '"><img src="../Impact Economy Index_files/flags/4x3/' + h.c.flag + '.svg" alt=""><span>' + esc(h.n) + '</span><b>' + h.c.score + '</b></li>';
      }).join('');
      box.hidden = false; q.setAttribute('aria-expanded', 'true');
    }
    function pick(id) {
      close(); q.value = ''; state.q = ''; refresh();
      if (state.selected !== id) select(id);
      var m = $('.ix-mapwrap') || svg; if (m && m.scrollIntoView) m.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }
    function hl() { Array.prototype.forEach.call(box.children, function (li, k) { li.classList.toggle('on', k === cur); }); if (cur >= 0) q.setAttribute('aria-activedescendant', 'ixSug' + cur); else q.removeAttribute('aria-activedescendant'); }
    q.addEventListener('input', draw);
    q.addEventListener('focus', draw);
    q.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); cur = Math.min(items.length - 1, cur + 1); hl(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); cur = Math.max(0, cur - 1); hl(); }
      else if (e.key === 'Enter') { e.preventDefault(); pick(items[cur >= 0 ? cur : 0].c.id); }
      else if (e.key === 'Escape') close();
    });
    box.addEventListener('mousedown', function (e) { var li = e.target.closest('li[data-id]'); if (li) { e.preventDefault(); pick(li.getAttribute('data-id')); } });
    q.addEventListener('blur', function () { setTimeout(close, 120); });
  })();
  $('.ix-drvsel').addEventListener('change', function (e) { setMetric(e.target.value || 'score'); });
  $('.ix-region').addEventListener('change', function (e) { state.region = e.target.value; refresh(); });
  $('.ix-income').addEventListener('change', function (e) { state.income = e.target.value; refresh(); });
  $('.ix-tier').addEventListener('change', function (e) { state.tier = e.target.value; refresh(); });
  panel.addEventListener('change', function (e) {
    if (e.target.classList.contains('ix-bench')) { state.bench = e.target.value; if (state.bench === 'country' && (!state.benchId || state.benchId === state.selected)) state.benchId = firstOther(); renderPanel(); }
    if (e.target.classList.contains('ix-benchc')) { state.benchId = e.target.value; renderPanel(); }
  });

  /* ---------- init ---------- */
  var cnt = document.getElementById('ieiCount');
  if (cnt) cnt.textContent = N;
  applyView();
  var H0 = window.IEI_HASH ? window.IEI_HASH.get() : {};
  if (H0.map && M[H0.map]) { state.metric = H0.map; state.sort = { key: H0.map, dir: -1 }; if (!H0.country && !document.querySelector('.s-view')) setTimeout(function () { var s = document.getElementById('explore'); if (s) s.scrollIntoView(); }, 300); }
  paint();
  renderTable();
  renderPanel();
})();
