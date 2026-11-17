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
  var state = { sel: byId[fromHash] ? fromHash : (byId.ARG ? 'ARG' : C[0].id), bench: 'income', benchId: '', sort: 'lever', peers: [], peerFor: '', open: {}, q: '', tier: '', region: '', income: '' };

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
      var isOpen = !!state.open[x.id];
      return head + '<tr class="ic-dr" tabindex="0" role="button" data-drv="' + x.id + '" aria-expanded="' + isOpen + '" aria-label="' + x.id + ' ' + esc(DLAB[x.id]) + ': show indicators"><td class="ic-c1"><span class="ic-did" style="--a:' + LEV[x.k].accent + '">' + x.id + '</span></td>' +
        '<td class="ic-c2"><span class="ic-dtxt">' + esc(DLAB[x.id]) + '</span><span class="ic-chev" aria-hidden="true"></span></td>' +
        '<td class="ic-c3">' + (x.v == null ? '<span class="ic-na">No data</span>' :
          '<div class="ic-bar thin" style="--a:' + LEV[x.k].accent + '"><span style="width:' + x.v + '%"></span>' + (x.ref == null ? '' : '<u style="left:' + x.ref.toFixed(1) + '%" title="' + esc(bn.label) + ': ' + Math.round(x.ref) + '"></u>') + '</div>') + '</td>' +
        '<td class="ic-c4">' + (x.v == null ? '–' : '<b>' + x.v + '</b>' + (x.d == null ? '' : '<em class="ic-d ' + (x.d > 0 ? 'up' : x.d < 0 ? 'down' : 'eq') + '">' + sgn(x.d) + '</em>')) +
        '<span class="ic-rk">' + (x.rk ? '#' + x.rk.r + '/' + x.rk.n : '') + '</span></td></tr>' +
        '<tr class="ic-dx" data-for="' + x.id + '"' + (isOpen ? '' : ' hidden') + '><td colspan="4">' + (isOpen ? driverPanel(x.id, c, bn) : '') + '</td></tr>';
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
      ebCard(c, bn) +
      '<div class="ic-two">' +
      '  <div class="ic-card ic-sg"><h4 class="ic-h4"><i class="up"></i>Relative strengths</h4><ul>' + sg(strengths, 'up') + '</ul></div>' +
      '  <div class="ic-card ic-sg"><h4 class="ic-h4"><i class="down"></i>Largest gaps</h4><ul>' + sg(gaps, 'down') + '</ul></div>' +
      '</div>' +
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
    try { history.replaceState(null, '', '#' + PAGE_HASH + id); } catch (e) { }
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
    if (m.id === '1A.4') { var pts = [[0, 100], [0.1, 80], [0.5, 60], [1, 40], [1.5, 1]]; for (var i = 0; i < pts.length - 1; i++) { var a = pts[i], b = pts[i + 1]; if (T <= a[1] && T >= b[1]) return a[0] + (a[1] - T) / (a[1] - b[1]) * (b[0] - a[0]); } return null; }
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
  var TYPE = { E: ['Enabling', 'e'], B: ['Behaviour', 'b'], K: ['Key impact model', 'k'] };
  function typeTag(m) { var t = TYPE[m.type]; return t ? '<em class="ic-ty ' + t[1] + '">' + t[0] + '</em>' : ''; }
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
      '<div class="ic-ixm"><span class="ic-iname">' + esc(m.name) + '</span>' + typeTag(m) + '<span class="ic-ival">' + esc(f1) + '</span>' + f2 + '</div>' +
      '<div class="ic-ixs">' + cell + '</div>' +
      '<button type="button" class="ic-mbtn" data-ind="' + esc(m.id) + '" aria-label="Why this score and how to improve it: ' + esc(m.name) + '">Details</button>' +
      ((m.star || s == null) ? '' : '<div class="ic-ixb"><div class="ic-bar thin" style="--a:' + LEV[k].accent + '"><span style="width:' + s + '%"></span>' + (ref == null ? '' : '<u style="left:' + ref.toFixed(1) + '%" title="' + esc(bn.label) + ': ' + Math.round(ref) + '"></u>') + '</div></div>') + '</div>';
  }
  function driverPanel(id, c, bn) {
    var di = DID.indexOf(id), de = (c.de && c.de[di]) || [null, null];
    var list = INDS.filter(function (m) { return m.driver === id; }).sort(function (a, b) { return (a.star ? 1 : 0) - (b.star ? 1 : 0); });
    var n = list.filter(function (m) { return !m.star; }), nd = n.filter(function (m) { var e = indVal(c.id, m.id); return e && e.s != null; }).length;
    return '<div class="ic-dpan"><p class="ic-dpm"><b>' + nd + ' of ' + n.length + '</b> indicators have data · ' +
      '<span class="ic-ty e">Enabling</span> ' + (de[0] == null ? '–' : Math.round(de[0])) + ' · <span class="ic-ty b">Behaviour</span> ' + (de[1] == null ? '–' : Math.round(de[1])) + '</p>' +
      list.map(function (m) { return indItem(m, c, bn); }).join('') + '</div>';
  }
  function ebCard(c, bn) {
    if (c.e == null && c.b == null) return '';
    function row(key, label, cls, v) {
      var ref = avg(bn.list, function (x) { return x[key]; }), rk = rankIn(function (x) { return x[key]; }, c), d = (v == null || ref == null) ? null : Math.round(v - ref);
      return '<div class="ic-ebr"><p class="ic-ebl"><i class="ic-sq ' + cls + '"></i>' + label + '</p><div class="ic-bar" style="--a:var(--ec-' + cls + ')"><span style="width:' + (v == null ? 0 : v) + '%"></span>' + (ref == null ? '' : '<u style="left:' + ref.toFixed(1) + '%" title="' + esc(bn.label) + ': ' + Math.round(ref) + '"></u>') + '</div>' +
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
        '<button type="button" class="ic-mlink" data-ind="' + esc(m.id) + '">More detail</button></li>';
    }
    return '<div class="ic-gaps"><div class="ic-gcol"><h5><i class="down"></i>Where it falls behind ' + esc(bn.short) + '</h5>' + (behind.length ? '<ul>' + behind.map(function (r) { return li(r, true); }).join('') + '</ul>' : '<p class="ic-gnone">No indicator is 5 or more points below the comparison.</p>') + '</div>' +
      '<div class="ic-gcol"><h5><i class="up"></i>Where it leads</h5>' + (ahead.length ? '<ul>' + ahead.map(function (r) { return li(r, false); }).join('') + '</ul>' : '<p class="ic-gnone">No indicator is 5 or more points above the comparison.</p>') + '</div></div>';
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
      if (m.id === '1A.4') sc += '<div class="icm-gp"><b>Custom piecewise scale</b><span>Larger subsidies score lower; see the breakpoints below.</span></div>';
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
    state.open[id] = open; tr.setAttribute('aria-expanded', open);
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
    if ((b = t.closest('.ic-step'))) {
      var f = filtered(), i = f.map(function (x) { return x.id; }).indexOf(state.sel) + parseInt(b.getAttribute('data-step'), 10);
      if (f[i]) pick(f[i].id);
      return;
    }
    if ((b = t.closest('[data-sort]'))) { state.sort = b.getAttribute('data-sort'); render(); return; }
    if ((b = t.closest('[data-rm]'))) { state.peers = state.peers.filter(function (id) { return id !== b.getAttribute('data-rm'); }); render(); return; }
    if ((b = t.closest('[data-qp]'))) { setPeers(b.getAttribute('data-qp')); return; }
    if ((b = t.closest('[data-expand]'))) {
      var allOpen = DID.every(function (id) { return state.open[id]; });
      DID.forEach(function (id) { state.open[id] = !allOpen; });
      render(); return;
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
