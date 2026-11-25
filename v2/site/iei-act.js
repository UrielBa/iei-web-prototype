/* IEI · Learn & act
   Explore sub-tab that turns a country's relative gaps into a short, practical conversation:
   five drivers to explore (largest gaps against the comparison group first, then the lowest scores),
   a higher-scoring peer to learn from, related case studies and policy actions, and a three-step
   "turn a finding into an ask" note that the reader can copy or e-mail. Nothing is sent or stored. */
(function () {
  'use strict';
  var root = document.getElementById('ieiAct');
  var D = window.IEI_DATA; if (!root || !D) return;
  var C = Object.keys(D.countries).map(function (k) { return D.countries[k]; }), META = D.meta;
  var byId = {}; C.forEach(function (c) { byId[c.id] = c; });
  var DID = META.driverIds, DLAB = META.driverLabels, LEV = META.levers;
  var ACC = ['#3DCC7D', '#77DAD9', '#F094B5', '#FFBD87'];
  var lev = {}; LEV.forEach(function (L, k) { L.drivers.forEach(function (d) { lev[d] = k; }); });
  var IND = window.IEI_IND || { inds: [], vals: {} }, FACTS = window.IEI_FACTS || {};
  var T = function (x) { return window.IEI_T ? window.IEI_T(x) : x; };
  var TOOLKIT = 'https://www.gsgimpact.org/resources/gsg-impact-publications-reports/towards-impact-economies-aligning-government-action-and-private-capital-for-public-good/';
  var TRACKER = 'https://impactpolicytracker.org/';
  var GUIDE = 'https://www.gsgimpact.org/resources/gsg-impact-publications-reports/national-partners-strategy-guide-for-building-impact-economies/';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  function avg(a) { a = a.filter(function (x) { return x != null; }); return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : null; }
  function sgn(d) { d = Math.round(d); return d === 0 ? '±0' : (d > 0 ? '+' : '−') + Math.abs(d); }

  var state = { sel: '', cmp: 'income', pick: 0, notes: {} };
  try { state.notes = JSON.parse(localStorage.getItem('iei-act-notes') || '{}') || {}; } catch (e) { state.notes = {}; }
  function saveNotes() { try { localStorage.setItem('iei-act-notes', JSON.stringify(state.notes)); } catch (e) {} }

  function group(c, kind) {
    return C.filter(function (x) {
      if (kind === 'region') return x.region === c.region;
      if (kind === 'all') return true;
      return x.income === c.income;
    });
  }
  var CMP = { income: 'the income-group average', region: 'the regional average', all: 'the global average' };

  function five(c, list) {
    var rows = DID.map(function (id, i) {
      var v = c.d[i], ref = avg(list.map(function (x) { return x.d[i]; }));
      return { id: id, i: i, v: v, ref: ref, gap: (v == null || ref == null) ? null : v - ref };
    }).filter(function (r) { return r.v != null; });
    var gaps = rows.filter(function (r) { return r.gap != null && r.gap < 0; }).sort(function (a, b) { return a.gap - b.gap; });
    var out = gaps.slice(0, 5);
    if (out.length < 5) {
      rows.filter(function (r) { return out.indexOf(r) < 0; }).sort(function (a, b) { return a.v - b.v; })
        .slice(0, 5 - out.length).forEach(function (r) { r.low = true; out.push(r); });
    }
    return out;
  }
  function peerFor(c, r) {
    var tiers = [
      ['same income group and region', function (x) { return x.income === c.income && x.region === c.region; }],
      ['same income group', function (x) { return x.income === c.income; }],
      ['same region', function (x) { return x.region === c.region; }],
      ['all IEI economies', function () { return true; }]
    ];
    for (var t = 0; t < tiers.length; t++) {
      var p = C.filter(function (x) { return x.id !== c.id && tiers[t][1](x) && x.d[r.i] != null && x.d[r.i] > r.v + 5; })
        .sort(function (a, b) { return b.d[r.i] - a.d[r.i]; })[0];
      if (p) return { c: p, why: tiers[t][0], v: p.d[r.i] };
    }
    return null;
  }
  function weakest(c, did, n) {
    var v = IND.vals[c.id] || {};
    return IND.inds.filter(function (m) { return !m.star && m.driver === did && v[m.id] && v[m.id].s != null; })
      .sort(function (a, b) { return v[a.id].s - v[b.id].s; }).slice(0, n || 2)
      .map(function (m) { return { m: m, s: v[m.id].s, act: (FACTS[m.id] || {}).act || '' }; });
  }
  function cases(did) { return window.IEI_CASES_MATCH ? window.IEI_CASES_MATCH('D:' + did) : []; }

  function current() {
    var h = (window.IEI_HASH ? window.IEI_HASH.get() : {}), id = (h.country || '').toUpperCase();
    if (byId[id]) return id;
    if (window.IEI_CUR && byId[window.IEI_CUR()]) return window.IEI_CUR();
    return byId.KEN ? 'KEN' : C[0].id;
  }

  function render() {
    var c = byId[state.sel], list = group(c, state.cmp), top = five(c, list);
    if (state.pick >= top.length) state.pick = 0;
    var r = top[state.pick];
    var opts = C.slice().sort(function (a, b) { return a.name.localeCompare(b.name); })
      .map(function (x) { return '<option value="' + x.id + '"' + (x.id === c.id ? ' selected' : '') + '>' + esc(T(x.name)) + '</option>'; }).join('');
    var cmp = [['income', 'Same income group'], ['region', 'Same region'], ['all', 'All economies']]
      .map(function (o) { return '<option value="' + o[0] + '"' + (state.cmp === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');

    var items = top.map(function (x, n) {
      var k = lev[x.id], p = peerFor(c, x), cs = cases(x.id).slice(0, 2), on = n === state.pick;
      return '<li class="ia-it' + (on ? ' on' : '') + '" style="--a:' + ACC[k] + '">' +
        '<button type="button" class="ia-pick" data-pick="' + n + '" aria-pressed="' + on + '">' +
        '<span class="ia-n">' + String(n + 1).padStart(2, '0') + '</span>' +
        '<span class="ia-main"><span class="ia-did">' + x.id + '</span><span class="ia-dl">' + esc(DLAB[x.id]) + '</span>' +
        '<span class="ia-meta">Score ' + Math.round(x.v) + ' · ' + (x.gap == null ? 'no comparison' : sgn(x.gap) + ' vs ' + CMP[state.cmp] + ' (' + Math.round(x.ref) + ')') + (x.low && x.gap >= 0 ? ' · low absolute score' : '') + '</span></span></button>' +
        (on ? '<div class="ia-more">' +
          (p ? '<p class="ia-peer"><span class="ia-k">Peer to learn from</span><button type="button" class="ia-lnk" data-country="' + p.c.id + '">' + esc(T(p.c.name)) + '</button> scores ' + Math.round(p.v) + ' on this driver (' + p.why + ').</p>' : '') +
          (cs.length ? '<p><span class="ia-k">Related case studies</span>' + cs.map(function (k) { return '<button type="button" class="ia-lnk" data-case="' + esc(k.id) + '" data-scope="D:' + x.id + '">' + esc(k.t) + (k.cn ? ' · ' + esc(k.cn) : '') + '</button>'; }).join('') + '</p>' : '') +
          '<p><button type="button" class="ia-lnk" data-drv="' + x.id + '">See the indicators behind this driver →</button></p></div>' : '') +
        '</li>';
    }).join('');

    var w = r ? weakest(c, r.id, 2) : [], p = r ? peerFor(c, r) : null, cs = r ? cases(r.id) : [];
    var key = c.id + ':' + (r ? r.id : ''), nt = state.notes[key] || {};
    var panel = r ? '<div class="ia-ask" style="--a:' + ACC[lev[r.id]] + '">' +
      '<p class="ia-eye">Selected driver · ' + r.id + '</p><h3 class="ia-h3">Turn a finding into an ask</h3>' +
      '<p class="ia-sub">' + esc(DLAB[r.id]) + ' · ' + esc(T(c.name)) + ' scores ' + Math.round(r.v) + (r.ref != null ? ', against ' + CMP[state.cmp] + ' of ' + Math.round(r.ref) : '') + '.</p>' +
      '<ol class="ia-steps">' +
      '<li><b>Validate the signal locally</b><span>Check data quality, policies already in place and why this topic matters to local actors. The Index measures enabling conditions and behaviour, not outcomes.' +
      (w.length ? ' Weakest indicators here: ' + w.map(function (y) { return esc(y.m.name) + ' (' + Math.round(y.s) + ')'; }).join(', ') + '.' : '') + '</span></li>' +
      '<li><b>Review policy options and examples</b><span>' +
      (w.filter(function (y) { return y.act; }).length ? w.filter(function (y) { return y.act; }).map(function (y) { return esc(y.act); }).join(' ') + ' ' : '') +
      (cs.length ? 'See how others did it: ' + cs.slice(0, 2).map(function (k) { return '<button type="button" class="ia-lnk" data-case="' + esc(k.id) + '" data-scope="D:' + r.id + '">' + esc(k.t) + '</button>'; }).join(', ') + '. ' : '') +
      'Treat these as starting points, not prescriptions.</span></li>' +
      '<li><b>Identify who can act</b><span>' + (p ? 'Consider a peer-learning conversation with ' + esc(T(p.c.name)) + '. ' : '') + 'Name the ministry, regulator or partner that can move this, and draft one concrete ask.</span></li>' +
      '</ol>' +
      '<label class="ia-f"><span>What is happening locally?</span><textarea data-note="local" rows="3" placeholder="Local context or evidence to validate">' + esc(nt.local || '') + '</textarea></label>' +
      '<label class="ia-f"><span>Who can move this forward?</span><input data-note="who" type="text" placeholder="Government body, regulator or partner" value="' + esc(nt.who || '') + '"></label>' +
      '<label class="ia-f"><span>What is your specific ask?</span><textarea data-note="ask" rows="3" placeholder="One concrete next step">' + esc(nt.ask || '') + '</textarea></label>' +
      '<div class="ia-btns"><button type="button" class="s-btn primary" data-copy>Copy action note</button><button type="button" class="s-btn" data-mail>Draft an e-mail</button><span class="ia-msg" aria-live="polite"></span></div>' +
      '<p class="ia-res">Further resources: <a href="' + TOOLKIT + '" target="_blank" rel="noopener">GSG policy toolkit ↗</a> · <a href="' + TRACKER + '" target="_blank" rel="noopener">Impact Policy Tracker ↗</a> · <a href="' + GUIDE + '" target="_blank" rel="noopener">National Partner strategy guide ↗</a></p>' +
      '<p class="ia-fine">Nothing is sent or stored online. Your notes stay in this browser until you copy them.</p></div>' : '';

    root.innerHTML =
      '<div class="ia-head"><div><p class="s-eyebrow">Learn &amp; act</p><h2 class="ia-h2">Learn from peers. Take action.</h2>' +
      '<p class="ia-lede">Five drivers worth a closer look for the selected country, with a peer to learn from, related cases and a simple way to turn one finding into a stakeholder conversation.</p></div>' +
      '<div class="ia-ctl"><label class="ia-sel"><span>Country</span><select data-ia-c>' + opts + '</select></label>' +
      '<label class="ia-sel"><span>Compare against</span><select data-ia-cmp>' + cmp + '</select></label></div></div>' +
      '<div class="ia-grid"><div class="ia-left"><h3 class="ia-h3">Five drivers to explore</h3><p class="ia-sub">Largest gaps against ' + CMP[state.cmp] + ' first, then the lowest scores. ' + T(c.name) + ' · IEI ' + c.score + '/100 · ' + esc(c.tier) + '.</p>' +
      '<ol class="ia-list">' + items + '</ol>' +
      '<p class="ia-fine">These are diagnostic leads, not automated policy recommendations. A related case may be adjacent to an indicator rather than a direct measure of it.</p></div>' +
      '<div class="ia-right">' + panel + '</div></div>';
  }

  function note() {
    var c = byId[state.sel], r = five(c, group(c, state.cmp))[state.pick], nt = state.notes[c.id + ':' + r.id] || {};
    return 'Impact Economy Index · action note\n' +
      'Country: ' + c.name + ' (IEI ' + c.score + '/100, ' + c.tier + ')\n' +
      'Driver: ' + r.id + ' ' + DLAB[r.id] + '\n' +
      'Score: ' + Math.round(r.v) + (r.ref != null ? ' vs ' + Math.round(r.ref) + ' (' + CMP[state.cmp] + ')' : '') + '\n\n' +
      'What is happening locally: ' + (nt.local || '–') + '\n' +
      'Who can move this forward: ' + (nt.who || '–') + '\n' +
      'Specific ask: ' + (nt.ask || '–') + '\n\n' + location.href;
  }
  function msg(t) { var m = root.querySelector('.ia-msg'); if (m) { m.textContent = t; setTimeout(function () { if (m) m.textContent = ''; }, 2500); } }

  root.addEventListener('change', function (e) {
    if (e.target.matches('[data-ia-c]')) { state.sel = e.target.value; state.pick = 0; if (window.IEI_GO) window.IEI_GO('explore', { tab: 'act', country: state.sel }, true); render(); }
    if (e.target.matches('[data-ia-cmp]')) { state.cmp = e.target.value; state.pick = 0; render(); }
  });
  root.addEventListener('input', function (e) {
    var k = e.target.getAttribute('data-note'); if (!k) return;
    var c = byId[state.sel], r = five(c, group(c, state.cmp))[state.pick], key = c.id + ':' + r.id;
    state.notes[key] = state.notes[key] || {}; state.notes[key][k] = e.target.value; saveNotes();
  });
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-pick')) { state.pick = +b.getAttribute('data-pick'); render(); var f = root.querySelector('.ia-it.on .ia-pick'); if (f) f.focus(); return; }
    if (b.hasAttribute('data-country')) { if (window.IEI_OPEN_COUNTRY) window.IEI_OPEN_COUNTRY(b.getAttribute('data-country')); return; }
    if (b.hasAttribute('data-case')) { if (window.IEI_CASES_OPEN) window.IEI_CASES_OPEN(b.getAttribute('data-scope'), b, b.getAttribute('data-case')); return; }
    if (b.hasAttribute('data-drv')) { if (window.IEI_OPEN_DRIVER) window.IEI_OPEN_DRIVER(state.sel, b.getAttribute('data-drv')); return; }
    if (b.hasAttribute('data-copy')) {
      var t = note();
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { msg('Copied'); }, function () {
        var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); msg('Copied'); } catch (x) { msg('Copy not available'); } ta.remove();
      });
      return;
    }
    if (b.hasAttribute('data-mail')) {
      var c = byId[state.sel];
      location.href = 'mailto:?subject=' + encodeURIComponent('Impact Economy Index · ' + c.name + ' · follow-up') + '&body=' + encodeURIComponent(note());
    }
  });

  function sync() {
    var id = current();
    if (id !== state.sel) { state.sel = id; state.pick = 0; render(); }
  }
  state.sel = current(); render();
  window.addEventListener('hashchange', sync);
  document.addEventListener('iei:view', sync);
  window.IEI_ACT_RENDER = function () { render(); };
})();
