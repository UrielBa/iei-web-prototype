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

  var FLAGS = './Impact Economy Index_files/flags/4x3/';
  var C = DATA.countries, META = DATA.meta;
  var N = C.length;
  var BASE = { x: 10, y: 0, w: 950, h: 425 };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var byId = {};
  C.forEach(function (c) { byId[c.id] = c; });
  var worldById = {};
  WORLD.forEach(function (w) { worldById[w.i] = w; });

  /* ---------- metrics & colour ---------- */
  var TIER_BG = { 'Early stage': '#DCE1FF', 'Developing': '#AEBAFF', 'Progressing': '#7084FF', 'Advanced': '#1B2A8F' };
  var TIER_FG = { 'Early stage': '#0F1428', 'Developing': '#0F1428', 'Progressing': '#FFFFFF', 'Advanced': '#FFFFFF' };
  var TIER_RANGE = { 'Early stage': 'below 40', 'Developing': '40–49', 'Progressing': '50–59', 'Advanced': '60 and above' };

  var METRICS = [
    { id: 'score', name: 'Total score', short: 'Total', accent: '#0F1428', ink: '#FFFFFF', pal: ['#DCE1FF', '#7084FF', '#1B2A8F'], val: function (c) { return c.score; } },
    { id: 'l1', name: META.levers[0].name, short: 'Accountability & Transparency', accent: '#3DCC7D', ink: '#0B0B0B', pal: ['#E0F6EA', '#3DCC7D', '#0C6636'], val: function (c) { return c.l[0]; } },
    { id: 'l2', name: META.levers[1].name, short: 'Procurement & Demand', accent: '#77DAD9', ink: '#0B0B0B', pal: ['#E1F6F6', '#77DAD9', '#17787B'], val: function (c) { return c.l[1]; } },
    { id: 'l3', name: META.levers[2].name, short: 'Coordination & Support', accent: '#FFBD87', ink: '#0B0B0B', pal: ['#FFEEDF', '#FFBD87', '#B4540C'], val: function (c) { return c.l[2]; } },
    { id: 'l4', name: META.levers[3].name, short: 'Capital Allocation & Deployment', accent: '#F094B5', ink: '#0B0B0B', pal: ['#FCE6EE', '#F094B5', '#992450'], val: function (c) { return c.l[3]; } }
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

  function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgbCss(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
  function luminance(c) {
    var f = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  }
  function tierOf(score) {
    var t = META.tiers;
    for (var i = 0; i < t.length; i++) if (score >= t[i].min && score <= t[i].max) return t[i].name;
    return t[t.length - 1].name;
  }
  function colour(m, v) {
    if (m.id === 'score') { var t = tierOf(v); return { bg: TIER_BG[t], fg: TIER_FG[t] }; }
    var u = (v - m.min) / ((m.max - m.min) || 1);
    u = Math.max(0, Math.min(1, u));
    var s = m.pal.map(hex2rgb);
    var rgb = u < 0.5 ? lerp(s[0], s[1], u / 0.5) : lerp(s[1], s[2], (u - 0.5) / 0.5);
    return { bg: rgbCss(rgb), fg: luminance(rgb) > 0.4 ? '#0F1428' : '#FFFFFF' };
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
    { k: 'tier', label: 'Tier' },
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
    '    </div>' +
    '    <div class="ix-filters">' +
    '      <label class="ix-search"><span class="ix-sr">Search countries</span><input type="search" class="ix-q" placeholder="Search a country…" autocomplete="off"></label>' +
    '      <label class="ix-sel"><span class="ix-sr">Region</span><select class="ix-region"><option value="">All regions</option>' + regions.map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('') + '</select></label>' +
    '      <label class="ix-sel"><span class="ix-sr">Tier</span><select class="ix-tier"><option value="">All tiers</option>' + META.tiers.map(function (t) { return '<option value="' + esc(t.name) + '">' + esc(t.name) + '</option>'; }).join('') + '</select></label>' +
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
    '  <section class="ix-card ix-tablecard" aria-label="Ranking table">' +
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
      '<div class="ix-tip-s"><span class="ix-tip-v">' + v + '</span><span>' + esc(m.id === 'score' ? tierOf(v) : m.short) + '</span></div>' +
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
    if (hoverId && pathEl[hoverId]) pathEl[hoverId].classList.remove('is-hover');
    var old = tbody.querySelector('tr.is-hover'); if (old) old.classList.remove('is-hover');
    hoverId = id;
    if (id && pathEl[id]) pathEl[id].classList.add('is-hover');
    if (id) { var tr = tbody.querySelector('tr[data-id="' + id + '"]'); if (tr) tr.classList.add('is-hover'); }
  }

  /* ---------- painting ---------- */
  function paint() {
    var m = metric();
    C.forEach(function (c) {
      var el = pathEl[c.id];
      el.style.fill = colour(m, m.val(c)).bg;
      var off = !matches(c) || (state.tierFocus && m.id === 'score' && tierOf(c.score) !== state.tierFocus);
      el.classList.toggle('dim', !!off);
    });
    $('.ix-maptitle').textContent = m.name;
    $('.ix-mapsub').textContent = (m.id === 'score' ? 'Total score by country (0–100)' : 'Lever score by country (0–100)') + ' · ' + N + ' countries';
    Array.prototype.forEach.call(root.querySelectorAll('.ix-metric'), function (b) {
      var on = b.getAttribute('data-m') === state.metric;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (legendFor !== state.metric) renderLegend();
  }
  var legendFor = null;
  function renderLegend() {
    legendFor = state.metric;
    var m = metric(), el = $('.ix-legend');
    if (m.id === 'score') {
      el.innerHTML = '<div class="ix-leg-steps">' + META.tiers.map(function (t) {
        return '<button type="button" class="ix-leg-item" data-tier="' + t.name + '"><i style="background:' + TIER_BG[t.name] + '"></i><span><b>' + t.name + '</b> ' + TIER_RANGE[t.name] + '</span></button>';
      }).join('') + '<span class="ix-leg-item ix-leg-nd"><i></i><span>No data</span></span></div>';
    } else {
      el.innerHTML = '<div class="ix-leg-grad"><span>' + m.min + '</span><i style="background:linear-gradient(90deg,' + m.pal.join(',') + ')"></i><span>' + m.max + '</span></div><span class="ix-leg-item ix-leg-nd"><i></i><span>No data</span></span>';
    }
  }
  function paintSelection() {
    Array.prototype.forEach.call(svg.querySelectorAll('.is-selected'), function (p) { p.classList.remove('is-selected'); });
    if (state.selected && pathEl[state.selected]) {
      pathEl[state.selected].classList.add('is-selected');
      land.appendChild(pathEl[state.selected]);
    }
  }

  /* ---------- side panel ---------- */
  function listItems(arr, m) {
    return '<ol class="ix-list">' + arr.map(function (c) {
      return '<li><button type="button" data-id="' + c.id + '">' + flag(c) + '<span>' + esc(c.name) + '</span><b>' + m.val(c) + '</b></button></li>';
    }).join('') + '</ol>';
  }
  function renderOverview() {
    var m = metric();
    var ranked = C.slice().sort(function (a, b) { return m.val(b) - m.val(a) || a.name.localeCompare(b.name); });
    var tiers = '';
    if (m.id === 'score') {
      var counts = META.tiers.map(function (t) { return { t: t.name, n: C.filter(function (c) { return c.tier === t.name; }).length }; });
      tiers = '<p class="ix-sub">Countries by tier</p><div class="ix-tierbar">' + counts.map(function (x) {
        return '<span style="flex:' + x.n + ';background:' + TIER_BG[x.t] + ';color:' + TIER_FG[x.t] + '" title="' + x.t + ': ' + x.n + '">' + x.n + '</span>';
      }).join('') + '</div><div class="ix-tiernames">' + counts.map(function (x) { return '<span>' + x.t + '</span>'; }).join('') + '</div>';
    }
    panel.innerHTML = '<div class="ix-pb">' +
      '<p class="ix-kicker">Global snapshot</p><h3 class="ix-ptitle">' + esc(m.name) + '</h3>' +
      '<div class="ix-avg"><span style="color:' + (m.id === 'score' ? '#1B2A8F' : m.pal[2]) + '">' + Math.round(m.avg) + '</span><small>average across ' + N + ' countries<br>range ' + m.min + '–' + m.max + '</small></div>' +
      tiers +
      '<p class="ix-sub">Highest</p>' + listItems(ranked.slice(0, 3), m) +
      '<p class="ix-sub">Lowest</p>' + listItems(ranked.slice(-3).reverse(), m) +
      '<p class="ix-hint">Select a country on the map or in the table to see its full profile.</p></div>';
  }
  function ring(score, tier) {
    var r = 42, circ = 2 * Math.PI * r;
    return '<svg class="ix-ring" viewBox="0 0 100 100" role="img" aria-label="Score ' + score + ' out of 100"><circle cx="50" cy="50" r="' + r + '" class="ix-ring-bg"/><circle cx="50" cy="50" r="' + r + '" class="ix-ring-fg" style="stroke:' + (tier === 'Early stage' ? '#8E9CFF' : tier === 'Developing' ? '#6F82FF' : tier === 'Progressing' ? '#4458E8' : '#1B2A8F') + ';stroke-dasharray:' + (circ * score / 100).toFixed(1) + ' ' + circ.toFixed(1) + '" transform="rotate(-90 50 50)"/><text x="50" y="50" text-anchor="middle" dominant-baseline="central" class="ix-ring-t">' + score + '</text></svg>';
  }
  function firstOther() { var o = C.filter(function (x) { return x.id !== state.selected; }).sort(function (a, b) { return b.score - a.score; }); return o.length ? o[0].id : ''; }
  function avgOf(list, fn) {
    var v = list.map(fn).filter(function (x) { return x != null; });
    return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null;
  }
  function benchFor(c) {
    var b = state.bench, list, label;
    if (b === 'tier') { list = C.filter(function (x) { return x.tier === c.tier; }); label = 'Tier average (' + c.tier + ', ' + list.length + ')'; }
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
      [['all', 'All countries'], ['tier', 'Same tier'], ['income', 'Same income group'], ['region', 'Same region'], ['country', 'Another country…']].map(function (o) { return '<option value="' + o[0] + '"' + (state.bench === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') +
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
        '<td class="ix-rk">' + m.rank[c.id] + '</td>' +
        '<td class="ix-nm">' + flag(c) + '<span>' + esc(c.name) + '</span></td>' +
        '<td class="hide-sm ix-mut">' + esc(c.region) + '</td>' +
        '<td class="hide-md ix-mut">' + esc(c.income) + '</td>' +
        METRICS.map(function (mm) {
          var v = mm.val(c), col = colour(mm, v);
          return '<td class="ix-h' + (mm.id === state.metric ? ' is-active' : '') + '" style="background:' + col.bg + ';color:' + col.fg + '">' + v + '</td>' +
            (mm.id === 'score' ? '<td class="ix-tcell"><span class="ix-badge sm" style="background:' + TIER_BG[c.tier] + ';color:' + TIER_FG[c.tier] + '">' + esc(c.tier) + '</span></td>' : '');
        }).join('') + '</tr>';
    }).join('') : '<tr><td colspan="10" class="ix-empty">No countries match these filters.</td></tr>';
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
  function setMetric(id) {
    state.metric = id;
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
    var head = ['Country', 'Total score', 'Tier'].concat(META.levers.map(function (l) { return l.name; }), ['Region', 'Income group'], META.driverIds.map(function (id) { return 'Driver ' + id; }));
    var q = function (v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = [head.map(q).join(',')].concat(C.slice().sort(function (a, b) { return b.score - a.score; }).map(function (c) {
      return [c.name, c.score, c.tier].concat(c.l, [c.region, c.income], c.d).map(q).join(',');
    }));
    var blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'impact-economy-index-scores.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

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
      if (M[k] && state.metric !== k) { state.metric = k; state.tierFocus = null; paint(); if (!state.selected) renderOverview(); }
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
  paint();
  renderTable();
  renderPanel();
})();
