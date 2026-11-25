/*!
 * IEI Country Analysis – interactive country report for the Impact Economy Index.
 * Vanilla JS, no dependencies. Reads window.IEI_DATA and renders into #ieiCountry.
 */
(function () {
  'use strict';
  var DATA = window.IEI_DATA, root = document.getElementById('ieiCountry');
  if (!DATA || !root) return;

  var FLAGS = '../Impact Economy Index_files/flags/4x3/';
  var C = DATA.countries, META = DATA.meta, N = C.length, PAGE_HASH = 'country=';
  var byId = {}; C.forEach(function (c) { byId[c.id] = c; });
  var LEV = [
    { name: META.levers[0].name, short: 'Accountability & Transparency', accent: '#3DCC7D', drivers: META.levers[0].drivers },
    { name: META.levers[1].name, short: 'Procurement & Demand', accent: '#77DAD9', drivers: META.levers[1].drivers },
    { name: META.levers[2].name, short: 'Capital Allocation & Deployment', accent: '#F094B5', drivers: META.levers[2].drivers },
    { name: META.levers[3].name, short: 'Coordination & Support', accent: '#FFBD87', drivers: META.levers[3].drivers }
  ];
  var DID = META.driverIds, DLAB = META.driverLabels;
  var driverLever = {}; LEV.forEach(function (L, k) { L.drivers.forEach(function (id) { driverLever[id] = k; }); });
  var TIER_BG = {}, TIER_FG = {}, TIER_RANGE = {}; META.tiers.forEach(function (t) { TIER_BG[t.name] = t.bg; TIER_FG[t.name] = t.fg; TIER_RANGE[t.name] = t.min + '–' + t.max; });
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function cbtn(scope, noun) {
    var n = window.IEI_CASES_COUNT ? window.IEI_CASES_COUNT(scope) : 0;
    return n ? '<button type="button" class="cs-pill" data-cases="' + scope + '" aria-label="' + n + ' case ' + (n === 1 ? 'study' : 'studies') + ' ' + noun + '">' + n + ' case stud' + (n === 1 ? 'y' : 'ies') + '</button>' : '';
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function flag(c, cls) { return '<img class="' + cls + '" src="' + FLAGS + c.flag + '.svg" alt="" loading="lazy">'; }
  function avg(list, fn) {
    var v = list.map(fn).filter(function (x) { return x != null; });
    return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null;
  }
  function rankIn(fn, c) {
    var v = fn(c); if (v == null) return null;
    var vals = C.map(fn).filter(function (x) { return x != null; });
    return { r: 1 + vals.filter(function (x) { return x > v; }).length, n: vals.length };
  }
  function sgn(d) { return d === 0 ? '±0' : (d > 0 ? '+' : '−') + Math.abs(d); }

  var regions = Array.from(new Set(C.map(function (c) { return c.region; }))).sort();
  var incomes = ['High Income', 'Upper Middle Income', 'Lower Middle Income', 'Low Income'].filter(function (i) { return C.some(function (c) { return c.income === i; }); });
  var H0 = window.IEI_HASH ? window.IEI_HASH.get() : {};
  var fromHash = (H0.country || '').toUpperCase();
  var state = { sel: byId[fromHash] ? fromHash : (byId.ARG ? 'ARG' : C[0].id), bench: 'income', benchId: '', sort: 'lever', peers: [], peerFor: '', plevel: 'driver', open: {}, q: '', tier: '', region: '', income: '' };
  if (['income', 'tier', 'region', 'all', 'best', 'country'].indexOf(H0.cmp) >= 0) state.bench = H0.cmp;
  if (H0.vs && byId[H0.vs.toUpperCase()]) { state.bench = 'country'; state.benchId = H0.vs.toUpperCase(); }
  if (H0.open === 'all') DID.forEach(function (d) { state.open[d] = true; });
  else if (H0.open) H0.open.split(',').forEach(function (d) { if (DID.indexOf(d) >= 0) state.open[d] = true; });
  var armed = !!fromHash;
  function syncHash(force) {
    if (!window.IEI_HASH || (!armed && !force)) return;
    armed = true;
    var open = DID.filter(function (d) { return state.open[d]; });
    window.IEI_HASH.set({ country: state.sel, cmp: state.bench === 'income' || state.bench === 'country' ? '' : state.bench, vs: state.bench === 'country' ? state.benchId : '', open: open.length && open.length < DID.length ? open.join(',') : (open.length === DID.length ? 'all' : '') });
  }

  function filtered() {
    return C.filter(function (c) {
      return (!state.tier || c.tier === state.tier) && (!state.region || c.region === state.region) &&
        (!state.income || c.income === state.income) && (!state.q || norm(c.name).indexOf(norm(state.q)) !== -1);
    }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  }
  function bestList() { return C.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, 5); }
  function benchFor(c) {
    var b = state.bench, list, label, short;
    if (b === 'tier') { list = C.filter(function (x) { return x.tier === c.tier; }); label = 'Stage average · ' + c.tier; short = 'its stage average'; }
    else if (b === 'region') { list = C.filter(function (x) { return x.region === c.region; }); label = 'Region average · ' + c.region; short = 'its regional average'; }
    else if (b === 'country' && byId[state.benchId] && state.benchId !== c.id) { list = [byId[state.benchId]]; label = byId[state.benchId].name; short = byId[state.benchId].name; }
    else if (b === 'best') { list = bestList(); label = 'Best in class (provisional): top 5 countries'; short = 'the best-in-class group (top 5, provisional)'; }
    else if (b === 'all') { list = C; label = 'Average of all countries'; short = 'the all-country average'; }
    else { list = C.filter(function (x) { return x.income === c.income; }); label = 'Income group average · ' + c.income; short = 'its income-group average'; }
    return { list: list, label: label, short: short, n: list.length };
  }

  /* ---------- shell ---------- */
  root.innerHTML =
    '<div class="ic">' +
    '  <div class="ic-intro"><h2 class="ic-h">Explore any of the ' + N + ' countries</h2>' +
    '  <p class="ic-lede">Pick a country to see how it scores on the four levers and fourteen drivers, and compare it with its maturity stage, income group, region or any other country.</p></div>' +
    '  <div class="ic-grid">' +
    '    <aside class="ic-rail" aria-label="Country selection">' +
    '      <label class="ic-field"><span class="ic-sr">Search countries</span><input type="search" class="ic-q" placeholder="Search a country…" autocomplete="off"></label>' +
    '      <div class="ic-filters">' +
    '        <label class="ic-field"><span class="ic-sr">Stage</span><select class="ic-ftier"><option value="">All stages</option>' + META.tiers.map(function (t) { return '<option>' + esc(t.name) + '</option>'; }).join('') + '</select></label>' +
    '        <label class="ic-field"><span class="ic-sr">Income group</span><select class="ic-fincome"><option value="">All income groups</option>' + incomes.map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('') + '</select></label>' +
    '        <label class="ic-field"><span class="ic-sr">Region</span><select class="ic-fregion"><option value="">All regions</option>' + regions.map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('') + '</select></label>' +
    '      </div>' +
    '      <p class="ic-listcount" aria-live="polite"></p>' +
    '      <ul class="ic-list"></ul>' +
    '    </aside>' +
    '    <div class="ic-report" aria-live="polite"></div>' +
    '  </div>' +
    '</div>';
  var $ = function (s) { return root.querySelector(s); };
  var list = $('.ic-list'), report = $('.ic-report');

  function renderList() {
    var L = filtered();
    $('.ic-listcount').textContent = L.length + ' of ' + N + ' countries';
    list.innerHTML = L.length ? L.map(function (c) {
      return '<li><button type="button" class="ic-item' + (c.id === state.sel ? ' is-on' : '') + '" data-id="' + c.id + '"' + (c.id === state.sel ? ' aria-current="true"' : '') + '>' +
        flag(c, 'ic-flag') + '<span class="ic-iname">' + esc(c.name) + '</span><span class="ic-ipill" style="background:' + TIER_BG[c.tier] + ';color:' + TIER_FG[c.tier] + '">' + c.score + '</span></button></li>';
    }).join('') : '<li class="ic-none">No countries match these filters.</li>';
  }

  /* ---------- benchmark ticks: comparison + Global + Best in class ---------- */
  function tk(cls, label, v, own) {
    return '<u' + (cls ? ' class="' + cls + '"' : '') + ' style="left:' + v.toFixed(1) + '%" tabindex="0" data-tl="' + esc(label) + '" data-tv="' + v.toFixed(1) + '"' + (own != null ? ' data-to="' + own + '"' : '') + ' aria-label="' + esc(label) + ': ' + Math.round(v) + '"></u>';
  }
  function ticks(bn, fn, cmp, own) {
    var out = '';
    if (cmp != null) out += tk('', bn.label, cmp, own);
    if (state.bench !== 'all') { var g = avg(C, fn); if (g != null) out += tk('g', 'Global average', g, own); }
    if (state.bench !== 'best') { var b = avg(bestList(), fn); if (b != null) out += tk('b', 'Best in class (provisional): top 5 countries', b, own); }
    return out;
  }
  function tickKey() {
    return '<p class="ic-tkey"><span><i></i>' + (state.bench === 'country' ? 'Selected country' : 'Comparison group') + '</span>' + (state.bench !== 'all' ? '<span><i class="g"></i>Global average</span>' : '') +
      (state.bench !== 'best' ? '<span><i class="b"></i>Best in class <em>(TBD · top 5 for now)</em></span>' : '') + '</p>';
  }


  /* friendly tooltip for benchmark markers and radar points */
  (function () {
    var T = function (x) { return window.IEI_T ? window.IEI_T(x) : x; };
    var tip = document.createElement('div'); tip.className = 'ic-tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true; document.body.appendChild(tip);
    var on = null;
    function diff(d) { d = Math.round(d); return d === 0 ? '<b class="eq">=</b>' : '<b class="' + (d > 0 ? 'up' : 'dn') + '">' + (d > 0 ? '+' : '−') + Math.abs(d) + '</b>'; }
    function html(el) {
      var c = byId[state.sel], name = c ? T(c.name) : '';
      if (el.matches('.ic-rh')) {
        var k = +el.getAttribute('data-k'), v = +el.getAttribute('data-v'), r = el.getAttribute('data-r'), bn = benchFor(c);
        return '<p class="ic-tip-h"><i style="background:' + LEV[k].accent + '"></i>' + esc(T(LEV[k].name)) + '</p>' +
          '<p class="ic-tip-big">' + v + '<small>' + esc(name) + '</small></p>' +
          (r === '' ? '' : '<p class="ic-tip-r">' + esc(T(bn.label)) + ' <b>' + Math.round(+r) + '</b> ' + diff(v - r) + '</p>');
      }
      var cls = el.classList.contains('g') ? 'g' : el.classList.contains('b') ? 'b' : 'c', v2 = +el.getAttribute('data-tv'), o = el.getAttribute('data-to');
      return '<p class="ic-tip-h"><i class="mk ' + cls + '"></i>' + esc(T(el.getAttribute('data-tl'))) + '</p>' +
        '<p class="ic-tip-big">' + Math.round(v2) + '</p>' +
        (o == null || o === '' ? '' : '<p class="ic-tip-r">' + esc(name) + ' <b>' + Math.round(+o) + '</b> ' + diff(+o - v2) + '</p>');
    }
    function show(el) {
      on = el; tip.innerHTML = html(el); tip.hidden = false;
      var anchor = el.matches('.ic-rh') && el.ownerSVGElement ? el.ownerSVGElement.querySelectorAll('.ic-rd')[+el.getAttribute('data-k')] || el : el;
      var r = anchor.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, x = r.left + r.width / 2 - w / 2, y = r.top - h - 10;
      x = Math.max(8, Math.min(x, document.documentElement.clientWidth - w - 8)); if (y < 8) y = r.bottom + 10;
      tip.style.left = (x + window.scrollX) + 'px'; tip.style.top = (y + window.scrollY) + 'px';
      if (el.matches('.ic-rh')) { var svg = el.ownerSVGElement; if (svg) svg.setAttribute('data-hk', el.getAttribute('data-k')); }
    }
    function hide() { tip.hidden = true; if (on && on.ownerSVGElement) on.ownerSVGElement.removeAttribute('data-hk'); on = null; }
    var SEL = '.ic-bar u[data-tl], .ic-rh';
    document.addEventListener('mouseover', function (e) { var el = e.target.closest && e.target.closest(SEL); if (el) show(el); });
    document.addEventListener('mouseout', function (e) { var el = e.target.closest && e.target.closest(SEL); if (el && (!e.relatedTarget || !el.contains(e.relatedTarget))) hide(); });
    document.addEventListener('focusin', function (e) { var el = e.target.closest && e.target.closest(SEL); if (el) show(el); });
    document.addEventListener('focusout', function (e) { var el = e.target.closest && e.target.closest(SEL); if (el) hide(); });
    window.addEventListener('scroll', function () { if (!tip.hidden) hide(); }, { passive: true });
  })();

  /* ---------- radar ---------- */
  function radar(c, bn) {
    var S = 260, cx = S / 2, cy = S / 2, R = 92;
    function pt(i, v) { var a = -Math.PI / 2 + i * Math.PI / 2; return [cx + Math.cos(a) * R * v / 100, cy + Math.sin(a) * R * v / 100]; }
    function poly(vals) { return vals.map(function (v, i) { return pt(i, v).map(function (n) { return n.toFixed(1); }).join(','); }).join(' '); }
    var ref = LEV.map(function (_, k) { return avg(bn.list, function (x) { return x.l[k]; }); });
    var rings = [25, 50, 75, 100].map(function (g) { return '<polygon points="' + poly([g, g, g, g]) + '" class="ic-rg"/>'; }).join('');
    var axes = [0, 1, 2, 3].map(function (i) { var p = pt(i, 100); return '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" class="ic-ax"/>'; }).join('');
    var lab = [['Accountability', 'text-anchor:middle', 0, -14], ['Procurement', 'text-anchor:end', 4, -12], ['Capital', 'text-anchor:middle', 0, 24], ['Coordination', 'text-anchor:start', -4, -12]].map(function (l, i) {
      var p = pt(i, 100); return '<text x="' + (p[0] + l[2]).toFixed(1) + '" y="' + (p[1] + l[3]).toFixed(1) + '" style="' + l[1] + '" class="ic-rl">' + l[0] + '</text>';
    }).join('');
    var dots = c.l.map(function (v, i) { var p = pt(i, v); return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4.5" fill="' + LEV[i].accent + '" stroke="#0F1428" stroke-width="1.5" class="ic-rd"/>'; }).join('');
    var bdots = ref.map(function (v, i) { if (v == null) return ''; var p = pt(i, v); return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3" class="ic-rbd"/>'; }).join('');
    var hits = c.l.map(function (v, i) { var p = pt(i, Math.max(v, ref[i] || 0) * 0.5 + 50); return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="30" class="ic-rh" tabindex="0" data-k="' + i + '" data-v="' + v + '" data-r="' + (ref[i] == null ? '' : ref[i].toFixed(1)) + '" aria-label="' + esc(LEV[i].name) + ': ' + v + '"/>'; }).join('');
    return '<svg class="ic-radar" viewBox="0 0 ' + S + ' ' + S + '" role="img" aria-label="Radar chart of ' + esc(c.name) + ' lever scores versus ' + esc(bn.label) + '">' +
      rings + axes + '<polygon points="' + poly(ref) + '" class="ic-rb"/><polygon points="' + poly(c.l) + '" class="ic-rc"/>' + bdots + dots + lab + hits + '</svg>';
  }

  /* ---------- report ---------- */
  function heatColour(v) {
    if (v == null) return null;
    var a = 0.12 + 0.78 * Math.max(0, Math.min(1, v / 100));
    return { bg: 'rgba(112,132,255,' + a.toFixed(2) + ')', fg: a > 0.62 ? '#0F1428' : '#fff' };
  }
  function peerCard(c, bn, drivers, closest) {
    if (state.peerFor !== c.id) { state.peerFor = c.id; state.peers = closest.slice(0, 4).map(function (p) { return p.c.id; }); }
    var P = state.peers.map(function (id) { return byId[id]; }).filter(Boolean);
    var opts = C.filter(function (x) { return x.id !== c.id && state.peers.indexOf(x.id) < 0; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    var cols = [c].concat(P);
    var head = '<tr><th scope="col" class="ic-hd">Driver</th>' + cols.map(function (x, i) {
      return '<th scope="col" class="ic-hc' + (i === 0 ? ' is-me' : '') + '">' + flag(x, 'ic-flag') + '<span>' + esc(x.name) + '</span>' + (i > 0 ? '<button type="button" class="ic-rm" data-rm="' + x.id + '" aria-label="Remove ' + esc(x.name) + '">×</button>' : '') + '</th>';
    }).join('') + (P.length ? '<th scope="col" class="ic-hc ic-pavg"><span>Peer avg</span></th>' : '') + '<th scope="col" class="ic-hc"><span>vs ' + esc(bn.short) + '</span></th></tr>';
    var lvl = state.plevel || 'driver', R = [];
    if (lvl === 'lever') {
      LEV.forEach(function (L, k) { R.push({ id: String(k + 1), lab: L.name, acc: L.accent, get: function (y) { return y.l[k]; }, ref: avg(bn.list, function (x) { return x.l[k]; }) }); });
    } else if (lvl === 'driver') {
      drivers.forEach(function (x) { R.push({ id: x.id, lab: DLAB[x.id], acc: LEV[x.k].accent, get: function (y) { return y.d[x.i]; }, ref: x.ref }); });
    } else {
      var lastD = '';
      INDS.filter(function (m) { return !m.star; }).forEach(function (m) {
        if (m.driver !== lastD) { lastD = m.driver; R.push({ head: true, id: m.driver, lab: DLAB[m.driver] || m.drvname, acc: LEV[driverLever[m.driver]] ? LEV[driverLever[m.driver]].accent : '#fff' }); }
        R.push({ id: m.id, lab: m.name, acc: LEV[driverLever[m.driver]] ? LEV[driverLever[m.driver]].accent : '#fff', key: m.key, get: function (y) { var e = indVal(y.id, m.id); return e && e.s != null ? Math.round(e.s) : null; }, ref: indRef(m, bn.list) });
      });
    }
    var ncols = cols.length + (P.length ? 1 : 0) + 1;
    var body = R.map(function (x) {
      if (x.head) return '<tr class="ic-ghead"><th scope="colgroup" colspan="' + (ncols + 1) + '"><span class="ic-did" style="--a:' + x.acc + '">' + x.id + '</span> ' + esc(x.lab) + '</th></tr>';
      var pv = P.map(function (p) { return x.get(p); }), pavg = avg(pv, function (v) { return v; });
      var cells = cols.map(function (y, j) {
        var v = x.get(y), hc = heatColour(v);
        return v == null ? '<td class="ic-hv na"><span class="ic-na">No data</span></td>' : '<td class="ic-hv' + (j === 0 ? ' me' : '') + '" style="background:' + hc.bg + ';color:' + hc.fg + '">' + v + '</td>';
      }).join('');
      var mine = x.get(c), dd = (mine == null || x.ref == null) ? null : Math.round(mine - x.ref);
      var cls = dd == null ? '' : dd >= 5 ? 'up' : dd <= -5 ? 'down' : 'eq', lab = dd == null ? '–' : dd >= 5 ? 'Ahead' : dd <= -5 ? 'Behind' : 'In line';
      return '<tr><th scope="row" class="ic-hd"><span class="ic-did" style="--a:' + x.acc + '">' + x.id + '</span><span class="ic-hl2">' + esc(x.lab) + (x.key ? ' <i class="ic-keym" title="Key impact model">◆</i>' : '') + '</span></th>' + cells +
        (P.length ? '<td class="ic-hv avg">' + (pavg == null ? '–' : Math.round(pavg)) + '</td>' : '') +
        '<td class="ic-hv st ' + cls + '">' + lab + (dd == null ? '' : ' <em>' + sgn(dd) + '</em>') + '</td></tr>';
    }).join('');
    var firstCol = lvl === 'lever' ? 'Lever' : lvl === 'driver' ? 'Driver' : 'Indicator';
    head = head.replace('<th scope="col" class="ic-hd">Driver</th>', '<th scope="col" class="ic-hd">' + firstCol + '</th>');
    var seg = '<div class="ic-seg" role="group" aria-label="Compare at level"><span class="ic-lbl">Compare at</span>' + [['lever', 'Levers'], ['driver', 'Drivers'], ['indicator', 'Indicators']].map(function (o) { return '<button type="button" class="ic-sbtn' + (lvl === o[0] ? ' on' : '') + '" data-plv="' + o[0] + '" aria-pressed="' + (lvl === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>';
    return '<div class="ic-card ic-pcard"><div class="ic-dhead"><div><h4 class="ic-h4">Compare with chosen peers</h4><p class="ic-psub">Scores side by side, at lever, driver or indicator level. Choose up to five countries.</p></div></div>' + seg +
      '<div class="ic-ppick"><span class="ic-lbl">Quick picks</span>' +
      [['region', 'Same region'], ['income', 'Same income group'], ['closest', 'Closest profile'], ['clear', 'Clear']].map(function (o) { return '<button type="button" class="ic-qp" data-qp="' + o[0] + '">' + o[1] + '</button>'; }).join('') +
      (P.length < 5 ? '<label class="ic-field ic-add"><span class="ic-sr">Add a country</span><select class="ic-padd"><option value="">Add a country…</option>' + opts.map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + '</option>'; }).join('') + '</select></label>' : '') + '</div>' +
      '<div class="ic-tscroll"><table class="ic-heat"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
      '<p class="ic-note">Darker blue means a higher ' + (lvl === 'lever' ? 'lever' : lvl === 'driver' ? 'driver' : 'indicator') + ' score' + (lvl === 'indicator' ? ' (35 scored indicators; leading-edge models are not scored)' : '') + '. “Ahead” / “Behind” mark a gap of 5 points or more against ' + esc(bn.short) + '; the 5-point threshold is illustrative, not a methodological cut-off.</p></div>';
  }
  function csvDownload() {
    var c = byId[state.sel], bn = benchFor(c), P = state.peers.map(function (id) { return byId[id]; }).filter(Boolean);
    var q = function (v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var head = ['Country', 'Driver', 'Description', 'Lever', 'Score', 'Comparison group', 'Comparison average', 'Difference', 'Rank (of countries with data)'].concat(P.map(function (p) { return p.name; }));
    var rows = DID.map(function (id, i) {
      var v = c.d[i], ref = avg(bn.list, function (x) { return x.d[i]; }), rk = rankIn(function (x) { return x.d[i]; }, c);
      return [c.name, id, DLAB[id], LEV[driverLever[id]].name, v == null ? '' : v, bn.label, ref == null ? '' : ref.toFixed(1), (v == null || ref == null) ? '' : Math.round(v - ref), rk ? rk.r + ' of ' + rk.n : ''].concat(P.map(function (p) { return p.d[i]; }));
    });
    var lines = [head].concat(rows).map(function (r) { return r.map(q).join(','); });
    var blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'iei-' + c.id.toLowerCase() + '-drivers.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function setPeers(kind) {
    var c = byId[state.sel], base;
    if (kind === 'clear') base = [];
    else if (kind === 'closest') base = C.filter(function (x) { return x.id !== c.id; }).map(function (x) { return { id: x.id, d: Math.sqrt(x.l.reduce(function (s, v, k) { return s + Math.pow(v - c.l[k], 2); }, 0)) }; }).sort(function (a, b) { return a.d - b.d; }).slice(0, 5).map(function (x) { return x.id; });
    else base = C.filter(function (x) { return x.id !== c.id && x[kind] === c[kind]; }).sort(function (a, b) { return Math.abs(a.score - c.score) - Math.abs(b.score - c.score); }).slice(0, 5).map(function (x) { return x.id; });
    state.peers = base; render();
  }

  /* ---------- standout strength: something every country can be proud of ---------- */
  function standoutItems() {
    var it = [];
    LEV.forEach(function (L, k) { it.push({ lvl: 'Lever', id: String(k + 1), name: L.name, acc: L.accent, get: function (x) { return x.l[k]; } }); });
    DID.forEach(function (id, i) { it.push({ lvl: 'Driver', id: id, name: DLAB[id], acc: LEV[driverLever[id]].accent, get: function (x) { return x.d[i]; } }); });
    INDS.filter(function (m) { return !m.star; }).forEach(function (m) {
      it.push({ lvl: 'Indicator', id: m.id, name: m.name, acc: LEV[driverLever[m.driver]].accent, drv: m.driver, get: function (x) { var e = indVal(x.id, m.id); return e && e.s != null ? e.s : null; } });
    });
    return it;
  }
  function placeIn(list, fn, c) {
    var v = fn(c); if (v == null) return null;
    var vals = list.map(fn).filter(function (x) { return x != null; });
    if (vals.length < 3) return null;
    var hi = vals.filter(function (x) { return x > v; }).length, tie = vals.filter(function (x) { return x === v; }).length;
    return { r: hi + 1, n: vals.length, shared: tie > 1, eff: hi + tie };
  }
  var SO_CACHE = {};
  function standout(c) {
    if (SO_CACHE[c.id]) return SO_CACHE[c.id];
    var reg = C.filter(function (x) { return x.region === c.region; }), inc = C.filter(function (x) { return x.income === c.income; });
    var lvlW = { Lever: 0, Driver: 0.3, Indicator: 0.8 };
    var cands = standoutItems().map(function (o) {
      var v = o.get(c); if (v == null) return null;
      var g = placeIn(C, o.get, c), rg = placeIn(reg, o.get, c), ig = placeIn(inc, o.get, c);
      if (!g) return null;
      var ref = avg(inc, o.get), gap = ref == null ? 0 : v - ref;
      // effective rank (ties counted pessimistically) keeps "joint #1 with 20 countries" from looking special
      var tier = g.eff <= 3 ? 1 : (rg && rg.eff === 1) || (ig && ig.eff === 1) ? 2 : g.eff <= 10 ? 3 : (rg && rg.eff <= 3) || (ig && ig.eff <= 3) ? 4 : 5;
      var sc = tier * 10 + lvlW[o.lvl] + g.eff / g.n * 5 - Math.max(gap, 0) / 80;
      return { o: o, v: v, g: g, rg: rg, ig: ig, gap: gap, ref: ref, tier: tier, sc: sc };
    }).filter(Boolean).sort(function (a, b) { return a.sc - b.sc; });
    var top = cands[0], also = [];
    cands.slice(1).forEach(function (x) {
      if (also.length >= 2 || x.tier > Math.max(top.tier, 3)) return;
      if (x.o.id === top.o.id || x.o.drv === top.o.id || top.o.drv === x.o.id || also.some(function (a) { return a.o.id === x.o.drv || a.o.drv === x.o.id || (a.o.drv && a.o.drv === x.o.drv); })) return;
      if (x.o.lvl === 'Lever' && top.o.lvl === 'Driver' && LEV[+x.o.id - 1].drivers.indexOf(top.o.id) >= 0) return;
      also.push(x);
    });
    // peers who could learn from it: same region or income group, furthest behind on this item
    var pool = C.filter(function (x) { return x.id !== c.id && (x.region === c.region || x.income === c.income) && top.o.get(x) != null && top.o.get(x) < top.v; });
    pool.sort(function (a, b) { return top.o.get(a) - top.o.get(b); });
    return (SO_CACHE[c.id] = { top: top, also: also, learn: pool.slice(0, 3) });
  }
  function rk(g) { var tie = g.eff - g.r + 1; return tie > 1 ? (g.r === 1 ? 'Top score, shared by ' + tie + ' of ' + g.n : 'Joint #' + g.r + ' of ' + g.n) : '#' + g.r + ' of ' + g.n; }
  function soPlace(x, c) {
    var b = [];
    var q = [];
    if (x.g.eff <= 10) q.push({ r: x.g.r, o: 0, t: (x.g.shared ? 'Joint #' : '#') + x.g.r + ' of ' + x.g.n + ' worldwide' });
    if (x.rg && x.rg.eff <= 3) q.push({ r: x.rg.r, o: 1, t: (x.rg.shared ? 'Joint #' : '#') + x.rg.r + ' in ' + c.region });
    if (x.ig && x.ig.eff <= 3) q.push({ r: x.ig.r, o: 2, t: (x.ig.shared ? 'Joint #' : '#') + x.ig.r + ' among ' + c.income + ' countries' });
    q.sort(function (u, v) { return u.r - v.r || u.o - v.o; }).forEach(function (u) { b.push(u.t); });
    if (!b.length) {
      var opt = [{ p: x.g.eff / x.g.n, t: x.g.eff / x.g.n <= .5 ? 'Top ' + Math.max(1, Math.round(x.g.eff / x.g.n * 100)) + '% worldwide' : null }];
      if (x.rg) opt.push({ p: x.rg.eff / x.rg.n, t: rk(x.rg) + ' in ' + c.region });
      if (x.ig) opt.push({ p: x.ig.eff / x.ig.n, t: rk(x.ig) + ' ' + c.income + ' countries' });
      opt = opt.filter(function (o) { return o.t; }).sort(function (u, v) { return u.p - v.p; });
      b.push(opt.length && opt[0].p <= .5 ? opt[0].t : 'Its strongest result relative to its peers');
    }
    return b;
  }
  window.IEI_STANDOUT = function (id) { var S = standout(byId[id]); return S && { item: S.top.o.lvl + ' ' + S.top.o.id + ' ' + S.top.o.name, place: soPlace(S.top, byId[id]), tier: S.top.tier, also: S.also.map(function (x) { return x.o.id; }), learn: S.learn.map(function (x) { return x.id; }) }; };
  function soClose() { var pp = document.getElementById('icSoPop'), bb = document.querySelector('.ic-sob'); if (pp && !pp.hidden) { pp.hidden = true; if (bb) { bb.setAttribute('aria-expanded', 'false'); bb.focus(); } } }
  document.addEventListener('click', function (e) { var pp = document.getElementById('icSoPop'); if (pp && !pp.hidden && !e.target.closest('#icSoPop') && !e.target.closest('.ic-sob')) soClose(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') soClose(); });
  function standoutBadge(c) {
    var S = standout(c); if (!S || !S.top) return '';
    return ' <button type="button" class="ic-sob" style="--a:' + S.top.o.acc + '" aria-expanded="false" aria-controls="icSoPop" title="Where ' + esc(c.name) + ' stands out"><span aria-hidden="true">★</span><span class="ic-sr">Where ' + esc(c.name) + ' stands out</span></button>' +
      '<span class="ic-sopop" id="icSoPop" role="dialog" aria-label="Where ' + esc(c.name) + ' stands out" hidden><button type="button" class="ic-sox" aria-label="Close">×</button>' + standoutCard(c) + '</span>';
  }
  function standoutCard(c) {
    var S = standout(c); if (!S || !S.top) return '';
    var t = S.top, pl = soPlace(t, c);
    var lead = t.tier <= 2 ? 'stands out' : t.tier <= 4 ? 'leads its peers' : 'shows its greatest relative strength';
    var also = S.also.map(function (x) {
      return '<li style="--a:' + x.o.acc + '"><span class="ic-did">' + esc(x.o.id) + '</span><span class="ic-soa-n">' + esc(x.o.name) + '</span><span class="ic-soa-p">' + esc(soPlace(x, c)[0]) + '</span></li>';
    }).join('');
    var learn = S.learn.length ? '<div class="ic-so-learn"><span class="ic-lbl">Could inspire</span>' + S.learn.map(function (x) {
      return '<button type="button" class="ic-so-peer" data-go="' + x.id + '">' + flag(x, 'ic-flag') + '<span>' + esc(x.name) + '</span><em>' + Math.round(t.o.get(x)) + '</em></button>';
    }).join('') + '</div>' : '';
    return '<div class="ic-so" style="--a:' + t.o.acc + '">' +
      '<div class="ic-so-main"><p class="ic-so-k"><span class="ic-so-ic" aria-hidden="true">★</span>Where ' + esc(c.name) + ' ' + lead + '</p>' +
      '<p class="ic-so-lvl">' + t.o.lvl + ' <span class="ic-did" style="--a:' + t.o.acc + '">' + esc(t.o.id) + '</span></p>' +
      '<h4 class="ic-so-t">' + esc(t.o.name) + '</h4>' +
      '<div class="ic-so-chips">' + pl.map(function (p, i) { return '<span class="ic-so-chip' + (i === 0 ? ' a' : '') + '">' + esc(p) + '</span>'; }).join('') +
      (t.ref != null && t.gap >= 1 ? '<span class="ic-so-chip">' + sgn(Math.round(t.gap)) + ' vs income-group average</span>' : '') + '</div>' + learn + '</div>' +
      '<div class="ic-so-side"><div class="ic-so-score"><b>' + Math.round(t.v) + '</b><span>score</span></div>' +
      (also ? '<p class="ic-lbl">Also notable</p><ul class="ic-so-also">' + also + '</ul>' : '') + '</div></div>';
  }

  /* ---------- context, evidence, divergence (25 Nov 2026) ---------- */
  function evidenceOf(c) {
    var I = window.IEI_IND || { inds: [], vals: {} }, v = I.vals[c.id] || {}, sc = I.inds.filter(function (m) { return !m.star; });
    return { n: sc.filter(function (m) { return v[m.id] && v[m.id].s != null; }).length, of: sc.length };
  }
  function ctxStrip(c, bn) {
    var x = c.x || {}, ev = evidenceOf(c);
    var ref = function (k) { return avg(bn.list, function (y) { return y.x ? y.x[k] : null; }); };
    var item = function (val, lab, src, r, money) {
      if (val == null) return '<div class="ic-cx"><b>–</b><span>' + lab + '</span><small>' + src + ' · not available</small></div>';
      var f = money ? '$' + Math.round(val).toLocaleString('en-GB') : (Math.round(val * 10) / 10).toFixed(1);
      var rf = r == null ? '' : ' · comparison ' + (money ? '$' + Math.round(r).toLocaleString('en-GB') : Math.round(r));
      return '<div class="ic-cx"><b>' + f + '</b><span>' + lab + '</span><small>' + src + rf + '</small></div>';
    };
    return '<div class="ic-ctx"><div class="ic-ctx-h"><p class="ic-lbl">Context and evidence</p><p class="ic-ctx-n">Context indicators are shown for reference and are not part of the IEI score.</p></div><div class="ic-ctx-g">' +
      item(x.epi, 'Environmental Performance Index', 'Score /100', ref('epi')) +
      item(x.spi, 'Social Progress Index', 'Score /100 · 2025', ref('spi')) +
      item(x.gdppc, 'GDP per capita', 'Current USD · World Bank 2025', ref('gdppc'), true) +
      '<div class="ic-cx"><b>' + ev.n + '<em>/' + ev.of + '</em></b><span>Evidence coverage</span><small>Scored indicators with data. Missing data is not treated as zero.</small></div>' +
      '</div></div>';
  }
  function divCard(c, bn, drivers) {
    var ok = drivers.filter(function (x) { return x.v != null && x.ref != null; });
    var mx = Math.max(20, Math.ceil(Math.max.apply(null, ok.map(function (x) { return Math.abs(x.v - x.ref); }).concat([0])) / 10) * 10);
    var rows = LEV.map(function (L, k) {
      return '<div class="ic-dvg-g" style="--a:' + L.accent + '"><p class="ic-dvg-l"><i></i>' + esc(L.name) + '</p>' + drivers.filter(function (x) { return x.k === k; }).map(function (x) {
        if (x.v == null || x.ref == null) return '<div class="ic-dvg-r"><span class="ic-did" style="--a:' + L.accent + '">' + x.id + '</span><span class="ic-dvg-t">' + esc(DLAB[x.id]) + '</span><span class="ic-dvg-b"></span><b class="ic-na">No data</b></div>';
        var d = x.v - x.ref, w = Math.min(50, Math.abs(d) / mx * 50);
        return '<div class="ic-dvg-r"><span class="ic-did" style="--a:' + L.accent + '">' + x.id + '</span><span class="ic-dvg-t">' + esc(DLAB[x.id]) + '</span><span class="ic-dvg-b"><i style="' + (d < 0 ? 'right:50%' : 'left:50%') + ';width:' + w.toFixed(1) + '%"></i></span><b>' + sgn(Math.round(d)) + '</b></div>';
      }).join('') + '</div>';
    }).join('');
    return '<div class="ic-card ic-dvg"><div class="ic-dvg-ax" aria-hidden="true"><span></span><span></span><span class="ic-dvg-sc"><em>−' + mx + '</em><em>0</em><em>+' + mx + '</em></span><span></span></div>' + rows +
      '<p class="ic-note">Driver score minus the average for ' + esc(bn.short) + ' (' + esc(bn.label) + '). Bars to the right mark relative strengths, bars to the left relative gaps. The comparison does not imply a causal explanation.</p></div>';
  }
  function actLink(c) { return '<button type="button" class="ic-actgo" data-act="' + c.id + '">Turn these gaps into action: Learn &amp; Act →</button>'; }
  function render() { renderCore(); syncHash(); }
  function renderCore() {
    var c = byId[state.sel], bn = benchFor(c);
    var refTotal = avg(bn.list, function (x) { return x.score; });
    var tr = rankIn(function (x) { return x.score; }, c);

    var levers = LEV.map(function (L, k) {
      var v = c.l[k], ref = avg(bn.list, function (x) { return x.l[k]; }), d = Math.round(v - ref), rk = rankIn(function (x) { return x.l[k]; }, c);
      return { k: k, L: L, v: v, ref: ref, d: d, rk: rk };
    });
    var best = levers.slice().sort(function (a, b) { return b.d - a.d; })[0], worst = levers.slice().sort(function (a, b) { return a.d - b.d; })[0];

    var drivers = DID.map(function (id, i) {
      var v = c.d[i], ref = avg(bn.list, function (x) { return x.d[i]; });
      return { id: id, i: i, k: driverLever[id], v: v, ref: ref, d: (v == null || ref == null) ? null : Math.round(v - ref), rk: rankIn(function (x) { return x.d[i]; }, c) };
    });
    var scored = drivers.filter(function (x) { return x.d != null; });
    var strengths = scored.slice().sort(function (a, b) { return b.d - a.d; }).slice(0, 3);
    var gaps = scored.slice().sort(function (a, b) { return a.d - b.d; }).slice(0, 3);
    var rows = drivers.slice();
    if (state.sort === 'gap') rows.sort(function (a, b) { return (a.d == null) - (b.d == null) || a.d - b.d; });
    if (state.sort === 'strength') rows.sort(function (a, b) { return (a.d == null) - (b.d == null) || b.d - a.d; });
    var missing = drivers.filter(function (x) { return x.v == null; }).length;

    var summary = '<b>' + esc(c.name) + '</b> ranks <b>#' + tr.r + '</b> of ' + N + ' with a total score of <b>' + c.score + '</b> (' + esc(c.tier) + '). ' +
      (best.d === worst.d ? 'Its levers are in line with ' + esc(bn.short) + '.' :
        best.d <= 0 ? 'It sits below ' + esc(bn.short) + ' on every lever: the smallest gap is on <b>' + esc(best.L.short) + '</b> (' + sgn(best.d) + ') and the largest on <b>' + esc(worst.L.short) + '</b> (' + sgn(worst.d) + ').' :
        worst.d >= 0 ? 'It is at or above ' + esc(bn.short) + ' on every lever, strongest on <b>' + esc(best.L.short) + '</b> (' + sgn(best.d) + ') and narrowest on <b>' + esc(worst.L.short) + '</b> (' + sgn(worst.d) + ').' :
        'Relative to ' + esc(bn.short) + ', its strongest lever is <b>' + esc(best.L.short) + '</b> (' + sgn(best.d) + ') and its largest gap is <b>' + esc(worst.L.short) + '</b> (' + sgn(worst.d) + ').');

    if (strengths.length && gaps.length && gaps[0].d < 0) summary += ' At driver level, the largest relative gap is <b>' + esc(DLAB[gaps[0].id]) + '</b> (' + sgn(gaps[0].d) + ')' + (strengths[0].d > 0 ? ' and the strongest relative lead is <b>' + esc(DLAB[strengths[0].id]) + '</b> (' + sgn(strengths[0].d) + ')' : '') + '. These are starting points for local validation, not automatic policy priorities.';
    var peers = C.filter(function (x) { return x.id !== c.id; }).map(function (x) {
      var dist = Math.sqrt(x.l.reduce(function (s, v, k) { return s + Math.pow(v - c.l[k], 2); }, 0));
      return { c: x, dist: dist };
    }).sort(function (a, b) { return a.dist - b.dist; }).slice(0, 5);

    var f = filtered(), idx = f.map(function (x) { return x.id; }).indexOf(c.id);

    var benchSel = '<div class="ic-bench"><label class="ic-field"><span class="ic-lbl">Compare with</span><select class="ic-bsel">' +
      [['income', 'Same income group'], ['tier', 'Same stage'], ['region', 'Same region'], ['all', 'Global (all countries)'], ['best', 'Best in class (TBD)'], ['country', 'Another country…']].map(function (o) { return '<option value="' + o[0] + '"' + (state.bench === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
      (state.bench === 'country' ? '<label class="ic-field"><span class="ic-sr">Country to compare</span><select class="ic-bcsel">' + C.filter(function (x) { return x.id !== c.id; }).sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (x) { return '<option value="' + x.id + '"' + (state.benchId === x.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select></label>' : '') +
      '<p class="ic-bnote">' + esc(bn.label) + (bn.n > 1 ? ' · ' + bn.n + ' countries' : '') + '</p></div>';

    var levCards = levers.map(function (x) {
      return '<div class="ic-lev" style="--a:' + x.L.accent + '"><p class="ic-lname"><i></i>' + esc(x.L.short) + '</p>' +
        '<p class="ic-lval">' + x.v + '<em class="ic-d ' + (x.d > 0 ? 'up' : x.d < 0 ? 'down' : 'eq') + '">' + sgn(x.d) + '</em></p>' +
        '<div class="ic-bar"><span style="width:' + x.v + '%"></span>' + ticks(bn, function (y) { return y.l[x.k]; }, x.ref, x.v) + '</div>' +
        '<p class="ic-lmeta">Rank #' + x.rk.r + ' of ' + x.rk.n + ' · comparison ' + Math.round(x.ref) + '</p>' + cbtn('L:' + (x.k + 1), 'for this lever') + '</div>';
    }).join('');

    function sg(arr, cls) {
      return arr.map(function (x) {
        return '<li><span class="ic-did" style="--a:' + LEV[x.k].accent + '">' + x.id + '</span><span class="ic-slab">' + esc(DLAB[x.id]) + '</span><em class="ic-d ' + cls + '">' + sgn(x.d) + '</em></li>';
      }).join('');
    }

    var tableRows = rows.map(function (x, n) {
      var head = '';
      if (state.sort === 'lever' && (n === 0 || rows[n - 1].k !== x.k)) {
        head = '<tr class="ic-grp"><th colspan="4" scope="colgroup" style="--a:' + LEV[x.k].accent + '"><i></i>' + esc(LEV[x.k].name) + '<span class="ic-gv"><b>' + levers[x.k].v + '</b><em class="ic-d ' + (levers[x.k].d > 0 ? 'up' : levers[x.k].d < 0 ? 'down' : 'eq') + '">' + sgn(levers[x.k].d) + '</em></span></th></tr>';
      }
      var isOpen = !!state.open[x.id];
      return head + '<tr class="ic-dr" tabindex="0" role="button" data-drv="' + x.id + '" aria-expanded="' + isOpen + '" aria-label="' + x.id + ' ' + esc(DLAB[x.id]) + ': show indicators"><td class="ic-c1"><span class="ic-did" style="--a:' + LEV[x.k].accent + '">' + x.id + '</span></td>' +
        '<td class="ic-c2"><span class="ic-dtxt">' + esc(DLAB[x.id]) + '</span><span class="ic-chev" aria-hidden="true"></span></td>' +
        '<td class="ic-c3">' + (x.v == null ? '<span class="ic-na">No data</span>' :
          '<div class="ic-bar thin" style="--a:' + LEV[x.k].accent + '"><span style="width:' + x.v + '%"></span>' + ticks(bn, function (y) { return y.d[x.i]; }, x.ref, x.v) + '</div>') + '</td>' +
        '<td class="ic-c4">' + (x.v == null ? '–' : '<b>' + x.v + '</b>' + (x.d == null ? '' : '<em class="ic-d ' + (x.d > 0 ? 'up' : x.d < 0 ? 'down' : 'eq') + '">' + sgn(x.d) + '</em>')) +
        '<span class="ic-rk">' + (x.rk ? '#' + x.rk.r + '/' + x.rk.n : '') + '</span></td></tr>' +
        '<tr class="ic-dx" data-for="' + x.id + '"' + (isOpen ? '' : ' hidden') + '><td colspan="4">' + (isOpen ? driverPanel(x.id, c, bn) : '') + '</td></tr>';
    }).join('');

    report.innerHTML =
      '<div class="ic-card ic-head">' +
      '  <div class="ic-hl">' + flag(c, 'ic-hflag') + '<div><h3 class="ic-name">' + esc(c.name) + standoutBadge(c) + '</h3><p class="ic-sub">' + esc(c.region) + ' · ' + esc(c.income) + '</p></div></div>' +
      '  <div class="ic-share"><button type="button" class="ic-sh" data-share="link">Copy link</button><button type="button" class="ic-sh" data-share="print">Printable profile (PDF)</button><button type="button" class="ic-sh" data-share="embed" aria-expanded="false">Embed</button><span class="ic-shmsg" aria-live="polite"></span></div>' +
      '  <div class="ic-nav"><button type="button" class="ic-step" data-step="-1" aria-label="Previous country"' + (idx <= 0 ? ' disabled' : '') + '>←</button>' +
      '  <button type="button" class="ic-step" data-step="1" aria-label="Next country"' + (idx < 0 || idx >= f.length - 1 ? ' disabled' : '') + '>→</button></div>' +
      '</div>' +
      '<div class="ic-card ic-hero">' +
      '  <div class="ic-score"><div class="ic-big">' + c.score + '</div><span class="ic-badge" style="background:' + TIER_BG[c.tier] + ';color:' + TIER_FG[c.tier] + '">' + esc(c.tier) + '</span>' +
      '  <p class="ic-wnote">Average of the 14 equally-weighted drivers</p><p class="ic-rank">Rank <b>#' + tr.r + '</b> of ' + N + '</p><p class="ic-vs">' + sgn(Math.round(c.score - refTotal)) + ' vs. comparison (' + Math.round(refTotal) + ')</p></div>' +
      '  <div class="ic-radarwrap">' + radar(c, bn) + '<p class="ic-legend"><span><i class="a"></i>' + esc(c.name) + '</span><span><i class="b"></i>' + esc(bn.label) + '</span></p></div>' +
      '  <div class="ic-sum"><p class="ic-summary">' + summary + '</p>' + benchSel + '</div>' +
      '</div>' +
      ctxStrip(c, bn) + '<div class="ic-levs">' + levCards + '</div>' + tickKey() +
      ebCard(c, bn) +
      '<div class="ic-two">' +
      '  <div class="ic-card ic-sg"><h4 class="ic-h4"><i class="up"></i>Relative strengths</h4><ul>' + sg(strengths, 'up') + '</ul></div>' +
      '  <div class="ic-card ic-sg"><h4 class="ic-h4"><i class="down"></i>Largest gaps</h4><ul>' + sg(gaps, 'down') + '</ul>' + actLink(c) + '</div>' +
      '</div>' +
      '<h4 class="ic-h4 ic-dvg-h">Over- and under-performance vs comparison</h4>' + divCard(c, bn, drivers) +
      '<div class="ic-card ic-drivers">' +
      '  <div class="ic-dhead"><h4 class="ic-h4">All 14 drivers</h4><div class="ic-sort" role="group" aria-label="Sort drivers">' +
      [['lever', 'By lever'], ['gap', 'Largest gaps'], ['strength', 'Strengths']].map(function (o) { return '<button type="button" data-sort="' + o[0] + '" aria-pressed="' + (state.sort === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div><div class="ic-dbtns"><button type="button" class="ic-dl" data-expand="1">' + (DID.every(function (id) { return state.open[id]; }) ? 'Collapse all' : 'Expand all') + '</button><button type="button" class="ic-dl" data-csv="1">Drivers CSV</button><button type="button" class="ic-dl" data-csv-ind="1">Indicators CSV</button></div></div>' +
      '  <p class="ic-hint">Select a driver to see its indicators, the facts behind each score and how it compares.</p>' +
      '  <p class="ic-key"><u></u> ' + esc(bn.label) + '</p>' +
      '  <div class="ic-tscroll"><table class="ic-table"><thead class="ic-sr"><tr><th>Driver</th><th>Description</th><th>Score</th><th>Value</th></tr></thead><tbody>' + tableRows + '</tbody></table></div>' +
      (missing ? '<p class="ic-note">' + missing + ' driver' + (missing > 1 ? 's' : '') + ' without data for this country are shown as “No data”. This is not a score of zero or a low score: the driver is left out of the averages and comparisons.</p>' : '') +
      '</div>' +
      indCard(c, bn) +
      peerCard(c, bn, drivers, peers) +
      '<div class="ic-card ic-peers"><h4 class="ic-h4">Countries with a similar lever profile</h4><div class="ic-chips">' +
      peers.map(function (p) { return '<button type="button" class="ic-chip" data-id="' + p.c.id + '">' + flag(p.c, 'ic-flag') + '<span>' + esc(p.c.name) + '</span><b>' + p.c.score + '</b></button>'; }).join('') + '</div></div>' +
      (c.link ? '<a class="ic-profile" href="' + esc(c.link) + '" target="_blank" rel="noopener">Open full country profile ↗</a>' : '');
    renderList();
  }

  function pick(id, scroll) {
    if (!byId[id]) return;
    state.sel = id;
    if (state.bench === 'country' && state.benchId === id) state.benchId = '';
    syncHash(true);
    render();
    var on = list.querySelector('.is-on');
    if (on && scroll !== false) {
      var lb = list.getBoundingClientRect(), ob = on.getBoundingClientRect();
      if (ob.top < lb.top || ob.bottom > lb.bottom) list.scrollTo({ top: list.scrollTop + (ob.top - lb.top) - lb.height / 2, behavior: reduced ? 'auto' : 'smooth' });
    }
  }

  /* ---------- indicator detail + methodology pop-up ---------- */
  var IND = window.IEI_IND, INDS = IND ? IND.inds : [], IV = IND ? IND.vals : {};
  var DRVNAME = {};
  INDS.forEach(function (m) { DRVNAME[m.driver] = m.drvname; });
  function num(x) { var n = parseFloat(x); return isFinite(n) ? n : null; }
  function fmt(v) {
    if (v == null) return '–';
    var a = Math.abs(v);
    if (a >= 1000) return Math.round(v).toLocaleString('en-US');
    if (a === 0) return '0';
    var s = Number(v.toPrecision(4)); return String(s);
  }
  function indVal(iso, id) { return (IV[iso] && IV[iso][id]) || null; }
  function indRank(m, c) {
    var mine = indVal(c.id, m.id); if (!mine || mine.s == null) return null;
    var all = C.map(function (x) { var e = indVal(x.id, m.id); return e ? e.s : null; }).filter(function (x) { return x != null; });
    return { r: 1 + all.filter(function (x) { return x > mine.s; }).length, n: all.length };
  }
  function indRef(m, list) { return avg(list, function (x) { var e = indVal(x.id, m.id); return e ? e.s : null; }); }
  function valueLine(m, e) {
    if (!e || e.s == null && !m.star) return '';
    if (m.comps) return 'Component scores: ' + (e.p || []).map(function (x) { return fmt(x); }).join(' · ');
    if (m.lic) return 'Underlying value not shown (licensed data)';
    return e.v == null ? '' : 'Value used: ' + fmt(e.v);
  }

  var FACTS = window.IEI_FACTS || {};
  function catIdx(spec, v) {
    if (!spec || !spec.cat || v == null) return -1;
    var best = -1, bd = 1e9;
    spec.cat.forEach(function (r, i) { var d = Math.abs(r[0] - v); if (d < bd) { bd = d; best = i; } });
    var span = Math.abs(spec.cat[spec.cat.length - 1][0] - spec.cat[0][0]) || 1;
    return bd <= span * 0.06 ? best : -1;
  }
  function band(s) { return s >= 67 ? 'Strong' : s >= 34 ? 'Moderate' : 'Weak'; }
  function factFor(m, e) {
    var sp = FACTS[m.id]; if (!sp || !e) return null;
    if (sp.comps) {
      var q = (e.p || []).map(function (x, i) { return x == null ? null : sp.comps[i] + ' scores ' + fmt(x); }).filter(Boolean);
      return q.length ? q.join('; ') : null;
    }
    if (sp.hid) return e.s == null ? null : band(e.s) + ' performance on ' + sp.hid + ' (score ' + fmt(e.s) + ')';
    if (e.v == null || typeof e.v !== 'number') return null;
    if (sp.cat) { var i = catIdx(sp, e.v); if (i >= 0) return sp.cat[i][1]; }
    return sp.fact ? sp.fact(e.v) : null;
  }
  function others(c, bn) { return bn.list.filter(function (x) { return x.id !== c.id; }); }
  function median(a) { a = a.slice().sort(function (x, y) { return x - y; }); var k = a.length >> 1; return a.length % 2 ? a[k] : (a[k - 1] + a[k]) / 2; }
  function groupFact(m, list) {
    var sp = FACTS[m.id]; if (!sp) return null;
    var es = list.map(function (x) { return indVal(x.id, m.id); }).filter(function (e) { return e && e.s != null; });
    if (!es.length) return null;
    if (es.length === 1) return factFor(m, es[0]);
    if (sp.comps || sp.hid) { var av = es.reduce(function (a, e) { return a + e.s; }, 0) / es.length; return sp.hid ? band(av) + ' performance on average (average score ' + Math.round(av) + ')' : 'Average score ' + Math.round(av); }
    if (sp.cat) {
      var cnt = {}; es.forEach(function (e) { var i = catIdx(sp, e.v); if (i >= 0) cnt[i] = (cnt[i] || 0) + 1; });
      var keys = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a] || b - a; });
      if (!keys.length) return null;
      var tot = es.length;
      return 'Most common: ' + sp.cat[keys[0]][1].replace(/^./, function (z) { return z.toLowerCase() === z ? z : (/^[A-Z]{2,}/.test(sp.cat[keys[0]][1]) ? z : z.toLowerCase()); }) + ' (' + cnt[keys[0]] + ' of ' + tot + ' economies with data)';
    }
    var vs = es.map(function (e) { return e.v; }).filter(function (x) { return typeof x === 'number'; });
    return vs.length ? 'Typical economy: ' + lcf(sp.fact(median(vs))) : null;
  }
  function lcf(t) { return /^[A-Z][a-z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t; }
  function gName(bn) {
    var l = bn.label; var i = l.indexOf(' · ');
    return i > 0 ? l.slice(i + 3) : (l === 'Average of all countries' ? 'All countries' : l);
  }
  function scoreOfCode(m, code) { var f = num(m.floor), t = num(m.ceil); return (f == null || t == null || t === f) ? null : 1 + 99 * (code - f) / (t - f); }
  function neededValue(m, T) {
    var f = num(m.floor), t = num(m.ceil), meth = String(m.method || '').toLowerCase();
    if (m.pass) return T;
    if (m.id === '1.A.4') { var pts = [[0, 100], [0.1, 80], [0.5, 60], [1, 40], [1.5, 1]]; for (var i = 0; i < pts.length - 1; i++) { var a = pts[i], b = pts[i + 1]; if (T <= a[1] && T >= b[1]) return a[0] + (a[1] - T) / (a[1] - b[1]) * (b[0] - a[0]); } return null; }
    if (f == null || t == null) return null;
    if (meth === 'log') return f > 0 ? f * Math.pow(t / f, (T - 1) / 99) : null;
    return f + (T - 1) / 99 * (t - f);
  }
  /* explanation of the difference with the comparison group, in plain language */
  function explain(m, c, bn) {
    var e = indVal(c.id, m.id) || {}, sp = FACTS[m.id] || {}, oth = others(c, bn);
    var ref = indRef(m, bn.list), r = { e: e, cf: factFor(m, e), gf: oth.length ? groupFact(m, oth) : null, ref: ref, d: (e.s == null || ref == null) ? null : e.s - ref, steps: [] };
    if (m.star || e.s == null || sp.comps) return r;
    if (sp.cat && typeof e.v === 'number') {
      var i = catIdx(sp, e.v);
      if (i >= 0 && i < sp.cat.length - 1) { var nx = sp.cat[i + 1], sc = scoreOfCode(m, nx[0]); r.steps.push('Next step up: ' + nx[1] + (sc == null ? '' : ' (about +' + Math.round(sc - e.s) + ' points)') + '.'); }
      else if (i === sp.cat.length - 1) r.steps.push('Already at the top of the ladder.');
    } else if (!sp.hid && typeof e.v === 'number' && sp.fact && r.d != null && r.d < -0.5) {
      var nv = neededValue(m, ref);
      if (nv != null && isFinite(nv)) r.steps.push('To reach the comparison average score (' + Math.round(ref) + '), the picture would need to look like: ' + sp.fact(nv).replace(/^./, function (x) { return x.toLowerCase(); }) + '.');
    }
    return r;
  }
  var TYPE = { E: ['Enabling condition', 'e'], B: ['Behaviour', 'b'], L: ['Leading-edge impact model', 'k'] };
  function typeTag(m) { var t = TYPE[m.type]; return (t ? '<em class="ic-ty ' + t[1] + '">' + t[0] + '</em>' : '') + (m.key ? '<em class="ic-ty k">Key impact model</em>' : ''); }
  function indItem(m, c, bn) {
    var k = parseInt(m.id.charAt(0), 10) - 1, x = explain(m, c, bn), e = x.e, s = e.s;
    var rk = m.star ? null : indRank(m, c), ref = m.star ? null : x.ref;
    var d = (x.d == null) ? null : Math.round(x.d);
    var cell;
    if (m.star) cell = '<span class="ic-ni-tag">Not scored</span>';
    else if (s == null) cell = '<span class="ic-na">No data</span>';
    else cell = '<b>' + Math.round(s) + '</b>' + (d == null ? '' : '<em class="ic-d ' + (d > 0 ? 'up' : d < 0 ? 'down' : 'eq') + '">' + sgn(d) + '</em>') + (rk ? '<span class="ic-rk">#' + rk.r + '/' + rk.n + '</span>' : '');
    var f1 = x.cf || (s == null && !m.star ? 'No data available for this economy' : '');
    var f2 = (x.gf && !m.star) ? '<span class="ic-icmp"><i>' + esc(gName(bn)) + ':</i> ' + esc(x.gf) + '</span>' : '';
    return '<div class="ic-ixr"><span class="ic-iid" style="--a:' + LEV[k].accent + '">' + esc(m.id) + '</span>' +
      '<div class="ic-ixm"><span class="ic-iname">' + esc(m.name) + '</span>' + typeTag(m) + '<span class="ic-ival">' + esc(f1) + '</span>' + f2 + cbtn('I:' + m.id, 'for this indicator') + '</div>' +
      '<div class="ic-ixs">' + cell + '</div>' +
      '<button type="button" class="ic-mbtn" data-ind="' + esc(m.id) + '" aria-label="Why this score and how to improve it: ' + esc(m.name) + '">Details</button>' +
      ((m.star || s == null) ? '' : '<div class="ic-ixb"><div class="ic-bar thin" style="--a:' + LEV[k].accent + '"><span style="width:' + s + '%"></span>' + (ref == null ? '' : tk('', bn.label, ref, s)) + '</div></div>') + '</div>';
  }
  function driverPanel(id, c, bn) {
    var di = DID.indexOf(id), de = (c.de && c.de[di]) || [null, null];
    var list = INDS.filter(function (m) { return m.driver === id; }).sort(function (a, b) { return (a.star ? 1 : 0) - (b.star ? 1 : 0); });
    var n = list.filter(function (m) { return !m.star; }), nd = n.filter(function (m) { var e = indVal(c.id, m.id); return e && e.s != null; }).length;
    return '<div class="ic-dpan"><p class="ic-dpm"><b>' + nd + ' of ' + n.length + '</b> indicators have data · ' +
      '<span class="ic-ty e">Enabling</span> ' + (de[0] == null ? '–' : Math.round(de[0])) + ' · <span class="ic-ty b">Behaviour</span> ' + (de[1] == null ? '–' : Math.round(de[1])) + '</p>' + cbtn('D:' + id, 'for this driver') +
      list.map(function (m) { return indItem(m, c, bn); }).join('') + '</div>';
  }
  function ebCard(c, bn) {
    if (c.e == null && c.b == null) return '';
    function row(key, label, cls, v) {
      var ref = avg(bn.list, function (x) { return x[key]; }), rk = rankIn(function (x) { return x[key]; }, c), d = (v == null || ref == null) ? null : Math.round(v - ref);
      return '<div class="ic-ebr"><p class="ic-ebl"><i class="ic-sq ' + cls + '"></i>' + label + '</p><div class="ic-bar" style="--a:var(--ec-' + cls + ')"><span style="width:' + (v == null ? 0 : v) + '%"></span>' + (ref == null ? '' : tk('', bn.label, ref, v == null ? null : Math.round(v))) + '</div>' +
        '<p class="ic-ebv"><b>' + (v == null ? '–' : Math.round(v)) + '</b>' + (d == null ? '' : '<em class="ic-d ' + (d > 0 ? 'up' : d < 0 ? 'down' : 'eq') + '">' + sgn(d) + '</em>') + '<span class="ic-rk">' + (rk ? '#' + rk.r + '/' + rk.n : '') + '</span></p></div>';
    }
    var diff = (c.e != null && c.b != null) ? c.e - c.b : null;
    var msg = diff == null ? '' : diff >= 5 ? 'Policy and regulatory frameworks are ahead of practice: enabling conditions score ' + Math.round(diff) + ' points above behaviour.' :
      diff <= -5 ? 'Practice is ahead of frameworks: behaviour scores ' + Math.round(-diff) + ' points above enabling conditions.' : 'Frameworks and practice are broadly in step (within 5 points).';
    return '<div class="ic-card ic-eb"><h4 class="ic-h4">Enabling conditions and behaviour</h4>' +
      '<p class="ic-note ic-ebn"><b>Enabling conditions</b> are the policies, rules and institutions that make an impact economy possible. <b>Behaviour</b> is what companies, investors, consumers and governments actually do. Each score averages the indicators of that type within each driver, then across drivers. It is a diagnostic view of the same indicators, not a separate score.</p>' +
      '<p class="ic-key"><u></u> ' + esc(bn.label) + '</p>' + row('e', 'Enabling conditions', 'e', c.e) + row('b', 'Behaviour', 'b', c.b) +
      (msg ? '<p class="ic-ebm">' + esc(msg) + '</p>' : '') + '</div>';
  }
  function gapsHtml(c, bn) {
    if (!others(c, bn).length) return '';
    var rows = INDS.filter(function (m) { return !m.star && FACTS[m.id]; }).map(function (m) { var x = explain(m, c, bn); return { m: m, x: x }; }).filter(function (r) { return r.x.d != null; });
    var behind = rows.filter(function (r) { return r.x.d <= -5; }).sort(function (a, b) { return a.x.d - b.x.d; }).slice(0, 5);
    var ahead = rows.filter(function (r) { return r.x.d >= 5; }).sort(function (a, b) { return b.x.d - a.x.d; }).slice(0, 3);
    function li(r, withAct) {
      var m = r.m, x = r.x, k = parseInt(m.id.charAt(0), 10) - 1, d = Math.round(x.d), act = FACTS[m.id].act;
      return '<li><div class="ic-gl1"><span class="ic-iid" style="--a:' + LEV[k].accent + '">' + esc(m.id) + '</span><b>' + esc(m.name) + '</b><em class="ic-d ' + (d > 0 ? 'up' : 'down') + '">' + sgn(d) + '</em></div>' +
        '<p><i>' + esc(c.name) + ':</i> ' + esc(x.cf || 'No detail available') + '</p>' + (x.gf ? '<p><i>' + esc(gName(bn)) + ':</i> ' + esc(x.gf) + '</p>' : '') +
        (withAct && act ? '<p class="ic-gact"><i>How to close the gap:</i> ' + esc(act) + '</p>' : '') +
        (withAct ? gapCases(m, c) : '') +
        '<button type="button" class="ic-mlink" data-ind="' + esc(m.id) + '">More detail</button></li>';
    }
    return '<div class="ic-gaps"><div class="ic-gcol"><h5><i class="down"></i>Where it falls behind ' + esc(bn.short) + '</h5>' + (behind.length ? '<ul>' + behind.map(function (r) { return li(r, true); }).join('') + '</ul>' : '<p class="ic-gnone">No indicator is 5 or more points below the comparison.</p>') + '</div>' +
      '<div class="ic-gcol"><h5><i class="up"></i>Where it leads</h5>' + (ahead.length ? '<ul>' + ahead.map(function (r) { return li(r, false); }).join('') + '</ul>' : '<p class="ic-gnone">No indicator is 5 or more points above the comparison.</p>') + '</div></div>';
  }
  function gapCases(m, c) {
    if (!window.IEI_CASES_MATCH) return '';
    var scope = 'I:' + m.id, L = window.IEI_CASES_MATCH(scope).filter(function (k) { return k.c !== c.id; });
    if (!L.length) { scope = 'D:' + m.driver; L = window.IEI_CASES_MATCH(scope).filter(function (k) { return k.c !== c.id; }); }
    if (!L.length) return '';
    var k = L[0];
    return '<div class="ic-gcase"><span class="ic-gck">Learn from ' + esc(k.cn) + '</span><button type="button" class="ic-gcb" data-case-open="' + esc(String(k.id)) + '" data-case-scope="' + scope + '">' + esc(k.t) + '</button>' +
      (L.length > 1 ? '<button type="button" class="ic-gcm" data-cases="' + scope + '">+' + (L.length - 1) + ' more</button>' : '') + '</div>';
  }
  function printProfile(c, bn, url) {
    var V = window.IEI_VERSION || {}, abs = function (p) { return new URL(p, location.href).href; };
    var tr = rankIn(function (x) { return x.score; }, c), refT = avg(bn.list, function (x) { return x.score; });
    function bar(v, ref, col) { return '<div class="bar"><span style="width:' + (v || 0) + '%;background:' + col + '"></span>' + (ref == null ? '' : '<u style="left:' + ref.toFixed(1) + '%"></u>') + '</div>'; }
    function dd(d) { return d == null ? '' : '<em class="' + (d >= 5 ? 'up' : d <= -5 ? 'dn' : '') + '">' + sgn(d) + '</em>'; }
    var levs = LEV.map(function (L, k) { var ref = avg(bn.list, function (x) { return x.l[k]; }); return '<div class="lev"><p><i style="background:' + L.accent + '"></i>' + esc(L.short) + '</p><b>' + c.l[k] + '</b>' + dd(Math.round(c.l[k] - ref)) + bar(c.l[k], ref, L.accent) + '</div>'; }).join('');
    var eb = (c.e == null) ? '' : [['e', 'Enabling conditions', '#3CC8C0'], ['b', 'Behaviour', '#5B6CFF']].map(function (r) { var v = c[r[0]], ref = avg(bn.list, function (x) { return x[r[0]]; }); return '<div class="ebr"><span>' + r[1] + '</span>' + bar(v, ref, r[2]) + '<b>' + Math.round(v) + '</b>' + dd(Math.round(v - ref)) + '</div>'; }).join('');
    var rows = DID.map(function (id, i) {
      var v = c.d[i], ref = avg(bn.list, function (x) { return x.d[i]; }), k = driverLever[id];
      return '<tr><td><span class="did" style="background:' + LEV[k].accent + '">' + id + '</span></td><td>' + esc(DLAB[id]) + '</td><td class="b">' + (v == null ? '<span class="na">No data</span>' : bar(v, ref, LEV[k].accent)) + '</td><td class="n">' + (v == null ? '–' : v) + '</td><td class="n">' + (ref == null ? '–' : Math.round(ref)) + '</td><td class="n">' + ((v == null || ref == null) ? '' : dd(Math.round(v - ref))) + '</td></tr>';
    }).join('');
    var gl = INDS.filter(function (m) { return !m.star && FACTS[m.id]; }).map(function (m) { return { m: m, x: explain(m, c, bn) }; }).filter(function (r) { return r.x.d != null && r.x.d <= -5; }).sort(function (a, b) { return a.x.d - b.x.d; }).slice(0, 4);
    var gaps = gl.map(function (r) {
      var m = r.m, act = FACTS[m.id].act, cs = '';
      if (window.IEI_CASES_MATCH) { var L = window.IEI_CASES_MATCH('I:' + m.id).filter(function (k) { return k.c !== c.id; }); if (!L.length) L = window.IEI_CASES_MATCH('D:' + m.driver).filter(function (k) { return k.c !== c.id; }); if (L.length) cs = '<p class="cs"><i>Learn from ' + esc(L[0].cn) + ':</i> ' + esc(L[0].t) + '</p>'; }
      return '<li><p class="gh"><span class="did" style="background:' + LEV[parseInt(m.id.charAt(0), 10) - 1].accent + '">' + esc(m.id) + '</span><b>' + esc(m.name) + '</b>' + dd(Math.round(r.x.d)) + '</p><p>' + esc(r.x.cf || '') + '</p>' + (act ? '<p><i>How to close the gap:</i> ' + esc(act) + '</p>' : '') + cs + '</li>';
    }).join('');
    var css = '@font-face{font-family:Urbanist;src:url(' + abs('../brand/fonts/Urbanist-Variable.woff2') + ') format("woff2");font-weight:100 900}@font-face{font-family:Urbanist;font-style:italic;src:url(' + abs('../brand/fonts/Urbanist-Italic-Variable.woff2') + ') format("woff2");font-weight:100 900}' +
      '@page{size:A4;margin:14mm 14mm 16mm}*{box-sizing:border-box}body{margin:0;font:500 10.5pt/1.45 Urbanist,sans-serif;color:#0F1428;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      '.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0F1428;padding-bottom:10px;margin-bottom:14px}.top img{height:34px}.top .r{text-align:right;font-size:9pt;color:#4b5064}' +
      'h1{font:700 24pt/1.1 Urbanist;margin:0}h2{font:600 12pt Urbanist;color:#2942B5;margin:11px 0 6px}.sub{color:#4b5064;margin:2px 0 0}.it{font-style:italic}' +
      '.hero{display:grid;grid-template-columns:140px 1fr;gap:16px;align-items:center;background:#F1F0EE;border-radius:14px;padding:10px 14px}.hero p{margin:3px 0}.big{font:700 38pt/1 Urbanist}.tier{display:inline-block;padding:3px 10px;border-radius:99px;font:700 9pt Urbanist;margin-top:6px}' +
      '.levs{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.lev{border:1px solid #D9D6D1;border-radius:12px;padding:10px}.lev p{margin:0 0 4px;font:700 9pt Urbanist;display:flex;gap:6px;align-items:center}.lev i{width:8px;height:8px;border-radius:50%;display:inline-block}.lev b{font:700 17pt Urbanist;margin-right:6px}' +
      '.bar{position:relative;height:7px;border-radius:99px;background:#E2DFDA;margin-top:6px}.bar span{position:absolute;left:0;top:0;bottom:0;border-radius:99px}.bar u{position:absolute;top:-3px;bottom:-3px;width:2px;background:#0F1428}' +
      'em{font-style:normal;font:700 8.5pt Urbanist;padding:1px 6px;border-radius:99px;background:#E2DFDA}em.up{background:#D3F4E1}em.dn{background:#FBE0EA}' +
      '.ebr{display:grid;grid-template-columns:140px 1fr 34px 46px;gap:10px;align-items:center;margin:4px 0}.ebr .bar{margin:0}' +
      'table{width:100%;border-collapse:collapse;font-size:8.3pt;line-height:1.25}th{text-align:left;font:700 8.5pt Urbanist;color:#4b5064;border-bottom:1px solid #D9D6D1;padding:4px}td{padding:2.5px 4px;border-bottom:1px solid #EEECE8;vertical-align:middle}td.b{width:22%}td.b .bar{margin:0}td.n{text-align:right;white-space:nowrap}.did{display:inline-block;padding:1px 5px;border-radius:5px;font:700 8pt Urbanist}.na{color:#8a8f9e;font-size:8pt}' +
      'ul.g{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:10px}ul.g li{border:1px solid #D9D6D1;border-radius:12px;padding:9px 11px;break-inside:avoid}ul.g p{margin:3px 0;font-size:9pt}.gh{display:flex;gap:6px;align-items:center}.cs{color:#2942B5}' +
      '.foot{margin-top:14px;border-top:1px solid #D9D6D1;padding-top:8px;font-size:8pt;color:#4b5064}.pg{break-before:page}@media screen{body{max-width:820px;margin:20px auto;padding:0 20px}}';
    var html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + esc(c.name) + ' · Impact Economy Index profile</title><style>' + css + '</style></head><body>' +
      '<div class="top"><img src="' + abs('../brand/logo/gsg-impact-lilac-navy.png') + '" alt="GSG Impact"><div class="r"><b>Impact Economy Index · Country profile</b><br>Draft for validation</div></div>' +
      '<div class="hero"><div><div class="big">' + c.score + '</div><span class="tier" style="background:' + TIER_BG[c.tier] + ';color:' + TIER_FG[c.tier] + '">' + esc(c.tier) + '</span></div>' +
      '<div><h1>' + esc(c.name) + '</h1><p class="sub">' + esc(c.region) + ' · ' + esc(c.income) + '</p><p>Rank <b>#' + tr.r + '</b> of ' + N + '. Total score ' + c.score + ' out of 100, ' + sgn(Math.round(c.score - refT)) + ' against the comparison (' + esc(bn.label) + ', ' + Math.round(refT) + ').</p>' +
      '<p class="sub it">The total is the average of 14 equally weighted drivers. The marker on each bar shows the comparison.</p></div></div>' +
      '<h2>The four levers</h2><div class="levs">' + levs + '</div>' + (eb ? '<h2>Enabling conditions and behaviour</h2>' + eb : '') +
      '<h2>All 14 drivers</h2><table><thead><tr><th></th><th>Driver</th><th></th><th class="n">Score</th><th class="n">Comparison</th><th class="n">Gap</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      (gaps ? '<h2 class="pg">Where ' + esc(c.name) + ' falls behind, and what would help</h2><ul class="g">' + gaps + '</ul>' : '') +
      '<div class="foot">Comparison: ' + esc(bn.label) + '. ' + (V.status ? esc(V.status) + ' ' : '') + 'Online profile: ' + esc(url) + '<br>Source: GSG Impact, Impact Economy Index' + (V.source ? '. ' + esc(V.source) : '') + '.</div>' +
      '<script>window.addEventListener("load",function(){(document.fonts?document.fonts.ready:Promise.resolve()).then(function(){setTimeout(function(){window.print()},300)})});<\/script></body></html>';
    var w = window.open('', '_blank');
    if (!w) { alert('Please allow pop-ups to open the printable profile.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }
  function indCard(c, bn) {
    if (!INDS.length) return '';
    var g = gapsHtml(c, bn);
    if (!g) return '';
    return '<div class="ic-card ic-inds" id="icInds"><div class="ic-dhead"><h4 class="ic-h4">What explains the differences</h4></div>' +
      '<p class="ic-note ic-inote">The facts behind the biggest score gaps against ' + esc(bn.short) + ', and what would move them. Open any driver in “All 14 drivers” to see every indicator.</p>' + g + '</div>';
  }
  function indCsv() {
    var c = byId[state.sel], bn = benchFor(c);
    var q = function (v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var head = ['Country', 'Indicator ID', 'Indicator', 'Driver', 'Lever', 'Scored', 'Score (1-100)', 'Value used', 'Comparison group', 'Comparison average', 'What the data says', 'Comparison group (typical)'];
    var rows = INDS.map(function (m) {
      var e = indVal(c.id, m.id) || {}, k = parseInt(m.id.charAt(0), 10) - 1, ref = m.star ? null : indRef(m, bn.list);
      return [c.name, m.id, m.name, m.driver + ' ' + (m.drvname || ''), LEV[k].name, m.star ? 'No' : 'Yes', e.s == null ? '' : e.s, m.comps ? (e.p || []).join(' | ') : (m.lic ? 'not shown' : (e.v == null ? '' : e.v)), bn.label, ref == null ? '' : ref.toFixed(1), factFor(m, e) || '', (!m.star && others(c, bn).length ? groupFact(m, others(c, bn)) : '') || ''];
    });
    var out = [head].concat(rows).map(function (r) { return r.map(q).join(','); });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + out.join('\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = 'IEI_indicators_' + c.name.replace(/[^A-Za-z0-9]+/g, '_') + '.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  /* method description */
  function goalDesc(method, fl, ce, unit) {
    var m = String(method || '').toLowerCase(), f = num(fl), t = num(ce);
    if (f == null || t == null) return null;
    if (m === 'log') return { kind: 'Logarithmic scale', f: f, t: t, formula: 'score = 1 + 99 × ln(value ÷ floor) ÷ ln(ceiling ÷ floor)', note: 'Values are clamped to the floor and ceiling. A logarithmic scale stops a few very large values from flattening everyone else’s score.' };
    if (m === 'categorical') return { kind: 'Categorical ladder on a linear scale', f: f, t: t, formula: 'score = 1 + 99 × (code − floor) ÷ (ceiling − floor)', note: 'Each policy category has a fixed code, so every category always earns the same score.' };
    return { kind: 'Linear scale', f: f, t: t, formula: 'score = 1 + 99 × (value − floor) ÷ (ceiling − floor)', note: 'Values are clamped to the floor and ceiling.' };
  }
  function section(t, body) { return body ? '<section class="icm-sec"><h5>' + esc(t) + '</h5>' + body + '</section>' : ''; }
  function p(t) { return t ? '<p>' + esc(t) + '</p>' : ''; }
  function linkList(ls) {
    return (ls || []).filter(function (u) { return /^https?:\/\//i.test(u); }).map(function (u) {
      var h = u.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0];
      return '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(h) + ' ↗</a>';
    }).join(' ');
  }
  function methodHtml(m, c) {
    var k = parseInt(m.id.charAt(0), 10) - 1, e = indVal(c.id, m.id) || {}, rk = m.star ? null : indRank(m, c);
    var parts = [];
    /* country box */
    var box;
    if (m.star) box = '<p>' + esc(m.name) + ' is a leading-edge model: it is tracked and shown for context but does <b>not</b> enter any driver or total score.</p>' + (e.v != null ? '<p class="icm-big">' + esc(c.name) + ': <b>' + fmt(e.v) + '</b></p>' : '<p class="icm-big">No data for ' + esc(c.name) + '</p>');
    else if (e.s == null) box = '<p class="icm-big">' + esc(c.name) + ': <b>no data</b></p><p>The indicator is left out of the driver average for this country. It is not scored as zero.</p>';
    else if (m.comps) box = '<p class="icm-big">' + esc(c.name) + ': score <b>' + fmt(e.s) + '</b>' + (rk ? ' · rank #' + rk.r + ' of ' + rk.n : '') + '</p><ul class="icm-comp">' + m.comps.map(function (cp, i) { return '<li><b>' + esc(cp.label) + '</b>: ' + (e.p && e.p[i] != null ? 'component score ' + fmt(e.p[i]) + (e.v && e.v[i] != null ? ' (value ' + fmt(e.v[i]) + ')' : '') : 'no data') + '</li>'; }).join('') + '</ul>';
    else box = '<p class="icm-big">' + esc(c.name) + ': ' + (m.lic || e.v == null ? '' : 'value <b>' + fmt(e.v) + '</b> → ') + 'score <b>' + fmt(e.s) + '</b>' + (rk ? ' · rank #' + rk.r + ' of ' + rk.n : '') + '</p>' + (m.lic ? '<p>The underlying value comes from licensed data and is not shown on this page.</p>' : '');
    parts.push('<div class="icm-country" style="--a:' + LEV[k].accent + '">' + box + '</div>');
    var bn0 = benchFor(c), x0 = explain(m, c, bn0), sp0 = FACTS[m.id] || {};
    if (!m.star && e.s != null && others(c, bn0).length) {
      var dd = x0.d == null ? null : Math.round(x0.d);
      parts.push(section('Why it differs from ' + gName(bn0), '<p><b>' + esc(c.name) + '</b>: ' + esc(x0.cf || 'no detail available') + '.</p>' + (x0.gf ? '<p><b>' + esc(gName(bn0)) + '</b>: ' + esc(x0.gf) + '.</p>' : '') + (dd == null ? '' : '<p class="icm-mut">Score gap: ' + sgn(dd) + ' points (' + Math.round(e.s) + ' vs ' + Math.round(x0.ref) + ').</p>')));
    }
    if (sp0.act || x0.steps.length) parts.push(section('How to improve it', (sp0.act ? p(sp0.act) : '') + x0.steps.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('')));
    parts.push('<details class="icm-tech"><summary>Methodology detail</summary>');
    parts.push(section('What it measures', p(m.measures)));
    /* scoring */
    var sc = '';
    if (m.comps) {
      sc += p(m.rationale);
      m.comps.forEach(function (cp) {
        var g = goalDesc(cp.method, cp.floor, cp.ceil);
        sc += '<div class="icm-gp"><b>' + esc(cp.label) + '</b>' + (g ? '<span>' + esc(g.kind) + ' · floor ' + fmt(g.f) + ' → score 1 · ceiling ' + fmt(g.t) + ' → score 100</span>' : '') + (cp.unit ? '<span>Unit: ' + esc(cp.unit) + '</span>' : '') + '</div>';
      });
    } else {
      var g = m.pass ? null : goalDesc(m.method, m.floor, m.ceil);
      if (m.pass) sc += '<div class="icm-gp"><b>Direct 1–100 score</b><span>The source composite is already on the IEI 1–100 scale, so no further transformation is applied.</span></div>';
      if (m.id === '1.A.4') sc += '<div class="icm-gp"><b>Custom piecewise scale</b><span>Larger subsidies score lower; see the breakpoints below.</span></div>';
      if (m.star) sc += p(m.rationale);
      else {
        if (g) sc += '<div class="icm-gp"><b>' + esc(g.kind) + '</b><span>Floor ' + fmt(g.f) + ' → score 1 · ceiling ' + fmt(g.t) + ' → score 100</span><code>' + esc(g.formula) + '</code>' + (g.note ? '<span>' + esc(g.note) + '</span>' : '') + '</div>';
        sc += p(m.rationale);
      }
    }
    parts.push(section(m.star ? 'How it is used' : 'How the score is derived', sc));
    if (!m.comps) { parts.push(section('Unit and calculation', (m.unit ? '<p><b>Unit:</b> ' + esc(m.unit) + '</p>' : '') + (m.metric ? '<p>' + esc(m.metric) + '</p>' : ''))); }
    else parts.push(section('Unit and calculation', m.comps.map(function (cp) { return '<p><b>' + esc(cp.label) + '.</b> ' + esc(cp.unit || '') + ' ' + esc(cp.metric || '') + '</p>'; }).join('')));
    var src = m.comps ? m.comps.map(function (cp) { return '<p><b>' + esc(cp.label) + ':</b> ' + esc(cp.source || '') + (cp.year ? ' <span class="icm-mut">' + esc(cp.year) + '</span>' : '') + '</p><p class="icm-links">' + linkList(cp.links) + '</p>'; }).join('') :
      '<p>' + esc(m.source || '') + '</p>' + (m.year ? '<p class="icm-mut"><b>Reference period:</b> ' + esc(m.year) + '</p>' : '') + '<p class="icm-links">' + linkList(m.links) + '</p>';
    parts.push(section('Data source', src));
    var have = [], miss = [];
    C.forEach(function (x) { var q = indVal(x.id, m.id); if (q && (q.s != null)) have.push(x); else miss.push(x); });
    var cov = '<p><b>Coverage:</b> ' + have.length + ' of ' + N + ' economies have data.' + (miss.length && miss.length <= 20 ? ' Without data: ' + esc(miss.map(function (x) { return x.name; }).join(', ')) + '.' : '') + '</p>' +
      (m.star ? '' : '<p>An economy with no data for an indicator is left out of that driver’s average; it is not scored as zero. A confirmed zero is a genuine observation and receives the lowest score on the scale (1).</p>');
    parts.push(section('Coverage and missing data', cov));
    parts.push('</details>');
    var cb = cbtn('I:' + m.id, 'for this indicator'); if (cb) parts.push(section('Case studies', '<p>See how other countries have put this into practice.</p>' + cb));
    return parts.join('');
  }
  var modal = null, opener = null;
  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'icm'; modal.hidden = true;
    modal.innerHTML = '<div class="icm-bg" data-close="1"></div><div class="icm-box" role="dialog" aria-modal="true" aria-labelledby="icmT" tabindex="-1"><button type="button" class="icm-x" data-close="1" aria-label="Close">×</button><div class="icm-head"></div><div class="icm-body"></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeModal(); });
    return modal;
  }
  function openModal(id, btn) {
    var m = INDS.filter(function (x) { return x.id === id; })[0], c = byId[state.sel];
    if (!m || !c) return;
    ensureModal(); opener = btn || null;
    var k = parseInt(m.id.charAt(0), 10) - 1;
    modal.querySelector('.icm-head').innerHTML = '<span class="ic-iid" style="--a:' + LEV[k].accent + '">' + esc(m.id) + '</span><h3 id="icmT">' + esc(m.name) + '</h3><p class="icm-ty">' + typeTag(m) + '</p><p>' + esc(LEV[k].short) + ' · ' + esc(m.drvname || '') + (m.star ? ' · key impact model' : '') + '</p>';
    modal.querySelector('.icm-body').innerHTML = methodHtml(m, c);
    modal.hidden = false; document.documentElement.classList.add('icm-open');
    var box = modal.querySelector('.icm-box'); box.scrollTop = 0; modal.querySelector('.icm-body').scrollTop = 0;
    setTimeout(function () { box.focus(); }, 0);
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true; document.documentElement.classList.remove('icm-open');
    if (opener && document.body.contains(opener)) opener.focus(); opener = null;
  }
  document.addEventListener('keydown', function (e) {
    if (!modal || modal.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
    if (e.key === 'Tab') {
      var f = Array.prototype.slice.call(modal.querySelectorAll('button, a[href]')).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], lastEl = f[f.length - 1], box = modal.querySelector('.icm-box');
      if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    }
  });

  function toggleDrv(tr) {
    var id = tr.getAttribute('data-drv'), open = !state.open[id], dx = tr.parentNode.querySelector('tr.ic-dx[data-for="' + id + '"]');
    state.open[id] = open; tr.setAttribute('aria-expanded', open); syncHash(true);
    if (!dx) return;
    if (open) dx.firstChild.innerHTML = driverPanel(id, byId[state.sel], benchFor(byId[state.sel]));
    dx.hidden = !open;
    var eb = root.querySelector('[data-expand]'); if (eb) eb.textContent = DID.every(function (d) { return state.open[d]; }) ? 'Collapse all' : 'Expand all';
  }
  report.addEventListener('keydown', function (e) {
    var tr = e.target.closest && e.target.closest('tr.ic-dr[data-drv]');
    if (tr && e.target === tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleDrv(tr); }
  });
  /* ---------- events ---------- */
  root.addEventListener('click', function (e) {
    var t = e.target, b;
    if ((b = t.closest('.ic-item, .ic-chip'))) {
      pick(b.getAttribute('data-id'));
      if (b.classList.contains('ic-chip')) { var top = $('.ic-report').getBoundingClientRect().top + window.pageYOffset - 90; if (top < window.pageYOffset) window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' }); }
      return;
    }
    if ((b = t.closest('.ic-sob'))) { var pp = document.getElementById('icSoPop'), op = pp.hidden; pp.hidden = !op; b.setAttribute('aria-expanded', op); return; }
    if ((b = t.closest('.ic-sox'))) { soClose(); return; }
    if ((b = t.closest('[data-go]'))) { pick(b.getAttribute('data-go')); var tp = $('.ic-report').getBoundingClientRect().top + window.pageYOffset - 90; window.scrollTo({ top: tp, behavior: reduced ? 'auto' : 'smooth' }); return; }
    if ((b = t.closest('.ic-step'))) {
      var f = filtered(), i = f.map(function (x) { return x.id; }).indexOf(state.sel) + parseInt(b.getAttribute('data-step'), 10);
      if (f[i]) pick(f[i].id);
      return;
    }
    if ((b = t.closest('[data-sort]'))) { state.sort = b.getAttribute('data-sort'); render(); return; }
    if ((b = t.closest('[data-rm]'))) { state.peers = state.peers.filter(function (id) { return id !== b.getAttribute('data-rm'); }); render(); return; }
    if ((b = t.closest('[data-plv]'))) { state.plevel = b.getAttribute('data-plv'); render(); return; }
    if ((b = t.closest('[data-qp]'))) { setPeers(b.getAttribute('data-qp')); return; }
    if ((b = t.closest('[data-share]'))) {
      var kind = b.getAttribute('data-share'), url = (syncHash(true), window.IEI_HASH ? window.IEI_HASH.url() : location.href), msg = root.querySelector('.ic-shmsg');
      if (kind === 'link') {
        var done = function () { if (msg) { msg.textContent = 'Link copied'; setTimeout(function () { msg.textContent = ''; }, 2500); } };
        try { navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copy this link', url); }); } catch (er) { window.prompt('Copy this link', url); }
      } else if (kind === 'embed') {
        var box = root.querySelector('.ic-embed');
        if (box) { box.remove(); b.setAttribute('aria-expanded', 'false'); return; }
        var lang = (new URLSearchParams(location.search)).get('lang');
        var src = new URL('embed.html?c=' + state.sel + (lang ? '&lang=' + lang : ''), location.href).href;
        var code = '<iframe src="' + src + '" width="100%" height="480" style="border:0;max-width:520px" title="Impact Economy Index: ' + byId[state.sel].name + '" loading="lazy"></iframe>';
        box = document.createElement('div'); box.className = 'ic-embed';
        box.innerHTML = '<p><b>Embed this country card</b> on a National Partner or partner website. Copy the code below into the page.</p><textarea readonly rows="3" aria-label="Embed code"></textarea><div class="ic-embed-a"><button type="button" class="ic-sh" data-embed-copy>Copy code</button><a class="ic-sh" href="' + src + '" target="_blank" rel="noopener">Preview card ↗</a></div>';
        box.querySelector('textarea').value = code;
        root.querySelector('.ic-head').after(box); b.setAttribute('aria-expanded', 'true');
      } else printProfile(byId[state.sel], benchFor(byId[state.sel]), url);
      return;
    }
    if ((b = t.closest('[data-embed-copy]'))) {
      var ta = root.querySelector('.ic-embed textarea'), m2 = root.querySelector('.ic-shmsg');
      try { navigator.clipboard.writeText(ta.value).then(function () { if (m2) { m2.textContent = 'Code copied'; setTimeout(function () { m2.textContent = ''; }, 2500); } }); } catch (er) { ta.select(); }
      return;
    }
    if ((b = t.closest('[data-expand]'))) {
      var allOpen = DID.every(function (id) { return state.open[id]; });
      DID.forEach(function (id) { state.open[id] = !allOpen; });
      armed = true; render(); return;
    }
    if ((b = t.closest('tr.ic-dr[data-drv]'))) { toggleDrv(b); return; }
    if ((b = t.closest('[data-ind]'))) { openModal(b.getAttribute('data-ind'), b); return; }
    if ((b = t.closest('[data-itab]'))) {
      var v = b.getAttribute('data-itab'), card = b.closest('.ic-inds');
      Array.prototype.forEach.call(card.querySelectorAll('[data-itab]'), function (x) { x.setAttribute('aria-pressed', x === b); });
      Array.prototype.forEach.call(card.querySelectorAll('tbody tr'), function (r) { var l = r.getAttribute('data-lev'); r.hidden = !(v === 'all' || l === v); });
      return;
    }
    if (t.closest('[data-csv-ind]')) { indCsv(); return; }
    if (t.closest('[data-csv]')) csvDownload();
  });
  $('.ic-q').addEventListener('input', function (e) { state.q = e.target.value.trim(); renderList(); });
  $('.ic-ftier').addEventListener('change', function (e) { state.tier = e.target.value; renderList(); });
  $('.ic-fincome').addEventListener('change', function (e) { state.income = e.target.value; renderList(); });
  $('.ic-fregion').addEventListener('change', function (e) { state.region = e.target.value; renderList(); });
  report.addEventListener('change', function (e) {
    if (e.target.classList.contains('ic-bsel')) {
      state.bench = e.target.value; armed = true;
      if (state.bench === 'country' && (!state.benchId || state.benchId === state.sel)) {
        var o = C.filter(function (x) { return x.id !== state.sel; }).sort(function (a, b) { return b.score - a.score; })[0]; state.benchId = o ? o.id : '';
      }
      render();
    }
    if (e.target.classList.contains('ic-padd') && e.target.value && state.peers.length < 5) { state.peers = state.peers.concat(e.target.value); render(); return; }
    if (e.target.classList.contains('ic-bcsel')) { state.benchId = e.target.value; armed = true; render(); }
  });
  window.addEventListener('hashchange', function () {
    var h = window.IEI_HASH ? window.IEI_HASH.get() : {}, id = (h.country || '').toUpperCase(); if (byId[id] && id !== state.sel) pick(id);
  });
  window.IEI_CUR = function () { return state.sel; };
  window.IEI_OPEN_DRIVER = function (id, did) {
    if (!byId[id]) return;
    state.open[did] = true; if (state.acc) state.acc.drivers = true; state.sort = 'lever';
    if (window.IEI_GO) window.IEI_GO('explore', { tab: 'country', country: id });
    pick(id, false);
    setTimeout(function () { var r = document.querySelector('.ic-dr[data-drv="' + did + '"]'); if (r) { var y = r.getBoundingClientRect().top + window.pageYOffset - 90; window.scrollTo({ top: y, behavior: 'instant' }); r.focus({ preventScroll: true }); } }, 60);
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-act]'); if (!b) return;
    if (window.IEI_GO) window.IEI_GO('explore', { tab: 'act', country: b.getAttribute('data-act') });
  });
  window.IEI_OPEN_COUNTRY = function (id) {
    if (!byId[id]) return;
    state.q = ''; state.tier = ''; state.region = ''; state.income = '';
    $('.ic-q').value = ''; $('.ic-ftier').value = ''; $('.ic-fincome').value = ''; $('.ic-fregion').value = '';
    pick(id);
    var sec = document.getElementById('country');
    if (sec) sec.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  render();
  if (fromHash && byId[fromHash] && !document.querySelector('.s-view')) setTimeout(function () { var s = document.getElementById('country'); if (s) s.scrollIntoView(); }, 300);
})();
