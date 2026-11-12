/*!
 * IEI Country Analysis – interactive country report for the Impact Economy Index.
 * Vanilla JS, no dependencies. Reads window.IEI_DATA and renders into #ieiCountry.
 */
(function () {
  'use strict';
  var DATA = window.IEI_DATA, root = document.getElementById('ieiCountry');
  if (!DATA || !root) return;

  var FLAGS = './Impact Economy Index_files/flags/4x3/';
  var C = DATA.countries, META = DATA.meta, N = C.length, PAGE_HASH = 'country=';
  var byId = {}; C.forEach(function (c) { byId[c.id] = c; });
  var LEV = [
    { name: META.levers[0].name, short: 'Accountability & Transparency', accent: '#3DCC7D', drivers: META.levers[0].drivers },
    { name: META.levers[1].name, short: 'Procurement & Demand', accent: '#77DAD9', drivers: META.levers[1].drivers },
    { name: META.levers[2].name, short: 'Coordination & Support', accent: '#FFBD87', drivers: META.levers[2].drivers },
    { name: META.levers[3].name, short: 'Capital Allocation & Deployment', accent: '#F094B5', drivers: META.levers[3].drivers }
  ];
  var DID = META.driverIds, DLAB = META.driverLabels;
  var driverLever = {}; LEV.forEach(function (L, k) { L.drivers.forEach(function (id) { driverLever[id] = k; }); });
  var TIER_BG = { 'Early stage': '#DCE1FF', 'Developing': '#AEBAFF', 'Progressing': '#7084FF', 'Advanced': '#1B2A8F' };
  var TIER_FG = { 'Early stage': '#0F1428', 'Developing': '#0F1428', 'Progressing': '#FFFFFF', 'Advanced': '#FFFFFF' };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  var fromHash = (location.hash.indexOf('#' + PAGE_HASH) === 0) ? location.hash.slice(PAGE_HASH.length + 1).toUpperCase() : '';
  var state = { sel: byId[fromHash] ? fromHash : (byId.ARG ? 'ARG' : C[0].id), bench: 'income', benchId: '', sort: 'lever', peers: [], peerFor: '', q: '', tier: '', region: '', income: '' };

  function filtered() {
    return C.filter(function (c) {
      return (!state.tier || c.tier === state.tier) && (!state.region || c.region === state.region) &&
        (!state.income || c.income === state.income) && (!state.q || norm(c.name).indexOf(norm(state.q)) !== -1);
    }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  }
  function benchFor(c) {
    var b = state.bench, list, label, short;
    if (b === 'tier') { list = C.filter(function (x) { return x.tier === c.tier; }); label = 'Tier average · ' + c.tier; short = 'its tier average'; }
    else if (b === 'region') { list = C.filter(function (x) { return x.region === c.region; }); label = 'Region average · ' + c.region; short = 'its regional average'; }
    else if (b === 'country' && byId[state.benchId] && state.benchId !== c.id) { list = [byId[state.benchId]]; label = byId[state.benchId].name; short = byId[state.benchId].name; }
    else if (b === 'all') { list = C; label = 'Average of all countries'; short = 'the all-country average'; }
    else { list = C.filter(function (x) { return x.income === c.income; }); label = 'Income group average · ' + c.income; short = 'its income-group average'; }
    return { list: list, label: label, short: short, n: list.length };
  }

  /* ---------- shell ---------- */
  root.innerHTML =
    '<div class="ic">' +
    '  <div class="ic-intro"><h2 class="ic-h">Explore any of the ' + N + ' countries</h2>' +
    '  <p class="ic-lede">Pick a country to see how it scores on the four levers and fourteen drivers, and compare it with its tier, income group, region or any other country.</p></div>' +
    '  <div class="ic-grid">' +
    '    <aside class="ic-rail" aria-label="Country selection">' +
    '      <label class="ic-field"><span class="ic-sr">Search countries</span><input type="search" class="ic-q" placeholder="Search a country…" autocomplete="off"></label>' +
    '      <div class="ic-filters">' +
    '        <label class="ic-field"><span class="ic-sr">Tier</span><select class="ic-ftier"><option value="">All tiers</option>' + META.tiers.map(function (t) { return '<option>' + esc(t.name) + '</option>'; }).join('') + '</select></label>' +
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

  /* ---------- radar ---------- */
  function radar(c, bn) {
    var S = 260, cx = S / 2, cy = S / 2, R = 92;
    function pt(i, v) { var a = -Math.PI / 2 + i * Math.PI / 2; return [cx + Math.cos(a) * R * v / 100, cy + Math.sin(a) * R * v / 100]; }
    function poly(vals) { return vals.map(function (v, i) { return pt(i, v).map(function (n) { return n.toFixed(1); }).join(','); }).join(' '); }
    var ref = LEV.map(function (_, k) { return avg(bn.list, function (x) { return x.l[k]; }); });
    var rings = [25, 50, 75, 100].map(function (g) { return '<polygon points="' + poly([g, g, g, g]) + '" class="ic-rg"/>'; }).join('');
    var axes = [0, 1, 2, 3].map(function (i) { var p = pt(i, 100); return '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" class="ic-ax"/>'; }).join('');
    var lab = [['Accountability', 'text-anchor:middle', 0, -14], ['Procurement', 'text-anchor:start', 12, 4], ['Coordination', 'text-anchor:middle', 0, 24], ['Capital', 'text-anchor:end', -12, 4]].map(function (l, i) {
      var p = pt(i, 100); return '<text x="' + (p[0] + l[2]).toFixed(1) + '" y="' + (p[1] + l[3]).toFixed(1) + '" style="' + l[1] + '" class="ic-rl">' + l[0] + '</text>';
    }).join('');
    var dots = c.l.map(function (v, i) { var p = pt(i, v); return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4.5" fill="' + LEV[i].accent + '" stroke="#0F1428" stroke-width="1.5"/>'; }).join('');
    return '<svg class="ic-radar" viewBox="0 0 ' + S + ' ' + S + '" role="img" aria-label="Radar chart of ' + esc(c.name) + ' lever scores versus ' + esc(bn.label) + '">' +
      rings + axes + '<polygon points="' + poly(ref) + '" class="ic-rb"/><polygon points="' + poly(c.l) + '" class="ic-rc"/>' + dots + lab + '</svg>';
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
    var body = drivers.map(function (x, n) {
      var pv = P.map(function (p) { return p.d[x.i]; }), pavg = avg(pv, function (v) { return v; });
      var cells = cols.map(function (y, j) {
        var v = y.d[x.i], hc = heatColour(v);
        return v == null ? '<td class="ic-hv na"><span class="ic-na">No data</span></td>' : '<td class="ic-hv' + (j === 0 ? ' me' : '') + '" style="background:' + hc.bg + ';color:' + hc.fg + '">' + v + '</td>';
      }).join('');
      var cls = x.d == null ? '' : x.d >= 5 ? 'up' : x.d <= -5 ? 'down' : 'eq', lab = x.d == null ? '–' : x.d >= 5 ? 'Ahead' : x.d <= -5 ? 'Behind' : 'In line';
      return '<tr><th scope="row" class="ic-hd"><span class="ic-did" style="--a:' + LEV[x.k].accent + '">' + x.id + '</span><span class="ic-hl2">' + esc(DLAB[x.id]) + '</span></th>' + cells +
        (P.length ? '<td class="ic-hv avg">' + (pavg == null ? '–' : Math.round(pavg)) + '</td>' : '') +
        '<td class="ic-hv st ' + cls + '">' + lab + (x.d == null ? '' : ' <em>' + sgn(x.d) + '</em>') + '</td></tr>';
    }).join('');
    return '<div class="ic-card ic-pcard"><div class="ic-dhead"><div><h4 class="ic-h4">Compare with chosen peers</h4><p class="ic-psub">Driver scores side by side. Choose up to five countries.</p></div></div>' +
      '<div class="ic-ppick"><span class="ic-lbl">Quick picks</span>' +
      [['region', 'Same region'], ['income', 'Same income group'], ['closest', 'Closest profile'], ['clear', 'Clear']].map(function (o) { return '<button type="button" class="ic-qp" data-qp="' + o[0] + '">' + o[1] + '</button>'; }).join('') +
      (P.length < 5 ? '<label class="ic-field ic-add"><span class="ic-sr">Add a country</span><select class="ic-padd"><option value="">Add a country…</option>' + opts.map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + '</option>'; }).join('') + '</select></label>' : '') + '</div>' +
      '<div class="ic-tscroll"><table class="ic-heat"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
      '<p class="ic-note">Darker blue means a higher driver score. “Ahead” / “Behind” mark a gap of 5 points or more against ' + esc(bn.short) + '; the 5-point threshold is illustrative, not a methodological cut-off.</p></div>';
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
  function render() {
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

    var peers = C.filter(function (x) { return x.id !== c.id; }).map(function (x) {
      var dist = Math.sqrt(x.l.reduce(function (s, v, k) { return s + Math.pow(v - c.l[k], 2); }, 0));
      return { c: x, dist: dist };
    }).sort(function (a, b) { return a.dist - b.dist; }).slice(0, 5);

    var f = filtered(), idx = f.map(function (x) { return x.id; }).indexOf(c.id);

    var benchSel = '<div class="ic-bench"><label class="ic-field"><span class="ic-lbl">Compare with</span><select class="ic-bsel">' +
      [['income', 'Same income group'], ['tier', 'Same tier'], ['region', 'Same region'], ['all', 'All countries'], ['country', 'Another country…']].map(function (o) { return '<option value="' + o[0] + '"' + (state.bench === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
      (state.bench === 'country' ? '<label class="ic-field"><span class="ic-sr">Country to compare</span><select class="ic-bcsel">' + C.filter(function (x) { return x.id !== c.id; }).sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (x) { return '<option value="' + x.id + '"' + (state.benchId === x.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select></label>' : '') +
      '<p class="ic-bnote">' + esc(bn.label) + (bn.n > 1 ? ' · ' + bn.n + ' countries' : '') + '</p></div>';

    var levCards = levers.map(function (x) {
      return '<div class="ic-lev" style="--a:' + x.L.accent + '"><p class="ic-lname"><i></i>' + esc(x.L.short) + '</p>' +
        '<p class="ic-lval">' + x.v + '<em class="ic-d ' + (x.d > 0 ? 'up' : x.d < 0 ? 'down' : 'eq') + '">' + sgn(x.d) + '</em></p>' +
        '<div class="ic-bar"><span style="width:' + x.v + '%"></span><u style="left:' + x.ref.toFixed(1) + '%" title="' + esc(bn.label) + ': ' + Math.round(x.ref) + '"></u></div>' +
        '<p class="ic-lmeta">Rank #' + x.rk.r + ' of ' + x.rk.n + ' · comparison ' + Math.round(x.ref) + '</p></div>';
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
      return head + '<tr class="ic-dr"><td class="ic-c1"><span class="ic-did" style="--a:' + LEV[x.k].accent + '">' + x.id + '</span></td>' +
        '<td class="ic-c2">' + esc(DLAB[x.id]) + '</td>' +
        '<td class="ic-c3">' + (x.v == null ? '<span class="ic-na">No data</span>' :
          '<div class="ic-bar thin" style="--a:' + LEV[x.k].accent + '"><span style="width:' + x.v + '%"></span>' + (x.ref == null ? '' : '<u style="left:' + x.ref.toFixed(1) + '%" title="' + esc(bn.label) + ': ' + Math.round(x.ref) + '"></u>') + '</div>') + '</td>' +
        '<td class="ic-c4">' + (x.v == null ? '–' : '<b>' + x.v + '</b>' + (x.d == null ? '' : '<em class="ic-d ' + (x.d > 0 ? 'up' : x.d < 0 ? 'down' : 'eq') + '">' + sgn(x.d) + '</em>')) +
        '<span class="ic-rk">' + (x.rk ? '#' + x.rk.r + '/' + x.rk.n : '') + '</span></td></tr>';
    }).join('');

    report.innerHTML =
      '<div class="ic-card ic-head">' +
      '  <div class="ic-hl">' + flag(c, 'ic-hflag') + '<div><h3 class="ic-name">' + esc(c.name) + '</h3><p class="ic-sub">' + esc(c.region) + ' · ' + esc(c.income) + '</p></div></div>' +
      '  <div class="ic-nav"><button type="button" class="ic-step" data-step="-1" aria-label="Previous country"' + (idx <= 0 ? ' disabled' : '') + '>←</button>' +
      '  <button type="button" class="ic-step" data-step="1" aria-label="Next country"' + (idx < 0 || idx >= f.length - 1 ? ' disabled' : '') + '>→</button></div>' +
      '</div>' +
      '<div class="ic-card ic-hero">' +
      '  <div class="ic-score"><div class="ic-big">' + c.score + '</div><span class="ic-badge" style="background:' + TIER_BG[c.tier] + ';color:' + TIER_FG[c.tier] + '">' + esc(c.tier) + '</span>' +
      '  <p class="ic-wnote">Average of the 14 equally-weighted drivers</p><p class="ic-rank">Rank <b>#' + tr.r + '</b> of ' + N + '</p><p class="ic-vs">' + sgn(Math.round(c.score - refTotal)) + ' vs. comparison (' + Math.round(refTotal) + ')</p></div>' +
      '  <div class="ic-radarwrap">' + radar(c, bn) + '<p class="ic-legend"><span><i class="a"></i>' + esc(c.name) + '</span><span><i class="b"></i>' + esc(bn.label) + '</span></p></div>' +
      '  <div class="ic-sum"><p class="ic-summary">' + summary + '</p>' + benchSel + '</div>' +
      '</div>' +
      '<div class="ic-levs">' + levCards + '</div>' +
      '<div class="ic-two">' +
      '  <div class="ic-card ic-sg"><h4 class="ic-h4"><i class="up"></i>Relative strengths</h4><ul>' + sg(strengths, 'up') + '</ul></div>' +
      '  <div class="ic-card ic-sg"><h4 class="ic-h4"><i class="down"></i>Largest gaps</h4><ul>' + sg(gaps, 'down') + '</ul></div>' +
      '</div>' +
      '<div class="ic-card ic-drivers">' +
      '  <div class="ic-dhead"><h4 class="ic-h4">All 14 drivers</h4><div class="ic-sort" role="group" aria-label="Sort drivers">' +
      [['lever', 'By lever'], ['gap', 'Largest gaps'], ['strength', 'Strengths']].map(function (o) { return '<button type="button" data-sort="' + o[0] + '" aria-pressed="' + (state.sort === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div><button type="button" class="ic-dl" data-csv="1">Download CSV</button></div>' +
      '  <p class="ic-key"><u></u> ' + esc(bn.label) + '</p>' +
      '  <div class="ic-tscroll"><table class="ic-table"><thead class="ic-sr"><tr><th>Driver</th><th>Description</th><th>Score</th><th>Value</th></tr></thead><tbody>' + tableRows + '</tbody></table></div>' +
      (missing ? '<p class="ic-note">' + missing + ' driver' + (missing > 1 ? 's' : '') + ' without data for this country are shown as “No data”. This is not a score of zero or a low score: the driver is left out of the averages and comparisons.</p>' : '') +
      '</div>' +
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
    try { history.replaceState(null, '', '#' + PAGE_HASH + id); } catch (e) { }
    render();
    var on = list.querySelector('.is-on');
    if (on && scroll !== false) {
      var lb = list.getBoundingClientRect(), ob = on.getBoundingClientRect();
      if (ob.top < lb.top || ob.bottom > lb.bottom) list.scrollTo({ top: list.scrollTop + (ob.top - lb.top) - lb.height / 2, behavior: reduced ? 'auto' : 'smooth' });
    }
  }

  /* ---------- events ---------- */
  root.addEventListener('click', function (e) {
    var t = e.target, b;
    if ((b = t.closest('.ic-item, .ic-chip'))) {
      pick(b.getAttribute('data-id'));
      if (b.classList.contains('ic-chip')) { var top = $('.ic-report').getBoundingClientRect().top + window.pageYOffset - 90; if (top < window.pageYOffset) window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' }); }
      return;
    }
    if ((b = t.closest('.ic-step'))) {
      var f = filtered(), i = f.map(function (x) { return x.id; }).indexOf(state.sel) + parseInt(b.getAttribute('data-step'), 10);
      if (f[i]) pick(f[i].id);
      return;
    }
    if ((b = t.closest('[data-sort]'))) { state.sort = b.getAttribute('data-sort'); render(); return; }
    if ((b = t.closest('[data-rm]'))) { state.peers = state.peers.filter(function (id) { return id !== b.getAttribute('data-rm'); }); render(); return; }
    if ((b = t.closest('[data-qp]'))) { setPeers(b.getAttribute('data-qp')); return; }
    if (t.closest('[data-csv]')) csvDownload();
  });
  $('.ic-q').addEventListener('input', function (e) { state.q = e.target.value.trim(); renderList(); });
  $('.ic-ftier').addEventListener('change', function (e) { state.tier = e.target.value; renderList(); });
  $('.ic-fincome').addEventListener('change', function (e) { state.income = e.target.value; renderList(); });
  $('.ic-fregion').addEventListener('change', function (e) { state.region = e.target.value; renderList(); });
  report.addEventListener('change', function (e) {
    if (e.target.classList.contains('ic-bsel')) {
      state.bench = e.target.value;
      if (state.bench === 'country' && (!state.benchId || state.benchId === state.sel)) {
        var o = C.filter(function (x) { return x.id !== state.sel; }).sort(function (a, b) { return b.score - a.score; })[0]; state.benchId = o ? o.id : '';
      }
      render();
    }
    if (e.target.classList.contains('ic-padd') && e.target.value && state.peers.length < 5) { state.peers = state.peers.concat(e.target.value); render(); return; }
    if (e.target.classList.contains('ic-bcsel')) { state.benchId = e.target.value; render(); }
  });
  window.addEventListener('hashchange', function () {
    if (location.hash.indexOf('#' + PAGE_HASH) === 0) { var id = location.hash.slice(PAGE_HASH.length + 1).toUpperCase(); if (byId[id] && id !== state.sel) pick(id); }
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
  if (fromHash && byId[fromHash]) setTimeout(function () { var s = document.getElementById('country'); if (s) s.scrollIntoView(); }, 300);
})();
