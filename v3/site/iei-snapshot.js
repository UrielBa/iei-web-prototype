/* IEI · Overview map snapshot: countries shaded by maturity stage, hover for score, click for the profile. */
(function () {
  'use strict';
  var box = document.getElementById('sSnapMap'), leg = document.getElementById('sSnapLeg');
  var D = window.IEI_DATA, W = window.IEI_WORLD;
  if (!box || !D || !W) return;
  var T = function (x) { return window.IEI_T ? window.IEI_T(x) : x; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var tiers = D.meta.tiers, byId = {};
  Object.keys(D.countries).forEach(function (k) { var c = D.countries[k]; byId[c.id] = c; });
  var stageOf = function (v) { for (var i = tiers.length - 1; i > 0; i--) if (v >= tiers[i].min) return i; return 0; };
  // stronger steps of the logo lilac, light to full
  var FILL = ['#E9ECFF', '#CBD2FF', '#AEB8FF', '#8F9DFF', '#6478FF', '#3D4FD9'];

  var others = [], has = [];
  W.forEach(function (w) { (byId[w.i] ? has : others).push(w); });
  box.innerHTML = '<svg class="s-snap-svg" viewBox="10 0 950 425" role="img" aria-label="World map of the ' + has.length + ' countries in the Index, shaded by maturity stage">' +
    '<g>' + others.map(function (w) { return '<path class="s-sm-o" d="' + w.d + '"/>'; }).join('') +
    has.map(function (w) {
      var c = byId[w.i], k = stageOf(c.score);
      return '<path class="s-sm-c" tabindex="0" role="button" data-id="' + w.i + '" d="' + w.d + '" style="fill:' + FILL[k] + '" aria-label="' + esc(T(c.name)) + ': ' + c.score + ', ' + esc(T(c.tier)) + '"/>';
    }).join('') + '</g></svg>';
  var svg = box.firstChild;
  // markers for countries too small to see
  [].forEach.call(svg.querySelectorAll('.s-sm-c'), function (p) {
    var bb; try { bb = p.getBBox(); } catch (e) { return; }
    if (!bb || Math.max(bb.width, bb.height) > 5) return;
    var c = byId[p.getAttribute('data-id')], m = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    m.setAttribute('cx', bb.x + bb.width / 2); m.setAttribute('cy', bb.y + bb.height / 2); m.setAttribute('r', 4.5);
    m.setAttribute('class', 's-sm-c s-sm-dot'); m.setAttribute('data-id', p.getAttribute('data-id')); m.setAttribute('style', 'fill:' + FILL[stageOf(c.score)]);
    svg.firstChild.appendChild(m);
  });

  var counts = tiers.map(function () { return 0; });
  Object.keys(byId).forEach(function (id) { counts[stageOf(byId[id].score)]++; });
  if (leg) leg.innerHTML = '<ul>' + tiers.map(function (t, i) {
    return '<li' + (counts[i] ? '' : ' class="zero"') + '><i style="background:' + FILL[i] + '"></i><b>Stage ' + t.stage + ' · ' + esc(T(t.name)) + '</b><span>' + t.min + '–' + t.max + ' · ' + (counts[i] ? counts[i] + ' ' + (counts[i] === 1 ? 'country' : 'countries') : (t.name === 'Thriving' ? 'no country yet' : 'none')) + '</span>' + (t.desc ? '<em>' + esc(T(t.desc)) + '</em>' : '') + '</li>';
  }).join('') + '</ul><p class="s-snap-note">Grey: not assessed in the 2026 Index.</p>';

  var tip = document.createElement('div'); tip.className = 's-snaptip'; tip.hidden = true; document.body.appendChild(tip);
  function show(el) {
    var c = byId[el.getAttribute('data-id')]; if (!c) return;
    tip.innerHTML = '<strong>' + esc(T(c.name)) + '</strong><span>' + c.score + ' / 100 · ' + esc(T(c.tier)) + '</span><em>Select to open the profile</em>';
    tip.hidden = false;
    var r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    var x = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, document.documentElement.clientWidth - w - 8)), y = r.top - h - 8;
    if (y < 64) y = r.bottom + 8;
    tip.style.left = (x + window.scrollX) + 'px'; tip.style.top = (y + window.scrollY) + 'px';
  }
  function hide() { tip.hidden = true; }
  svg.addEventListener('mouseover', function (e) { var p = e.target.closest('.s-sm-c'); if (p) show(p); });
  svg.addEventListener('mouseout', function (e) { if (e.target.closest('.s-sm-c')) hide(); });
  svg.addEventListener('focusin', function (e) { var p = e.target.closest('.s-sm-c'); if (p) show(p); });
  svg.addEventListener('focusout', hide);
  function open(p) { hide(); var id = p.getAttribute('data-id'); if (window.IEI_OPEN_COUNTRY) window.IEI_OPEN_COUNTRY(id); else location.hash = 'explore&tab=country&country=' + id; }
  svg.addEventListener('click', function (e) { var p = e.target.closest('.s-sm-c'); if (p) open(p); });
  svg.addEventListener('keydown', function (e) { var p = e.target.closest('.s-sm-c'); if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(p); } });
  window.addEventListener('hashchange', hide);
})();
