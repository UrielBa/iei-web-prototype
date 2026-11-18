/* IEI Case Studies: filterable section + contextual popup (lever / driver / indicator). Reads IEI_DATA + IEI_CASES. */
(function () {
  'use strict';
  var D = window.IEI_DATA, K = window.IEI_CASES;
  if (!D || !K) return;
  var FLAGS = './Impact Economy Index_files/flags/4x3/', C = D.countries, M = D.meta, byId = {};
  C.forEach(function (c) { byId[c.id] = c; });
  var LEVC = ['#3DCC7D', '#77DAD9', '#FFBD87', '#F094B5'];
  var TBG = { 'Early stage': '#BFEDEC', 'Developing': '#77DAD9', 'Progressing': '#6478FF', 'Advanced': '#2942B5' };
  var TFG = { 'Early stage': '#0F1428', 'Developing': '#0F1428', 'Progressing': '#0F1428', 'Advanced': '#fff' };
  var LEVN = M.levers.map(function (l) { return l.name; });
  var REGMAP = { 'Europe': 'Europe & Middle East', 'Africa': 'Africa', 'Asia': 'Asia Pacific', 'Americas': 'Latin America' };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uniq(a) { return Array.from(new Set(a)).sort(); }
  function safeUrl(u) { return /^https?:\/\//i.test(u) ? u : ''; }

  K.forEach(function (k) {
    var c = k.c && byId[k.c];
    k.tier = c ? c.tier : ''; k.region = c ? c.region : (REGMAP[k.reg] || k.reg);
    k.drivers = uniq(k.i.map(function (x) { return x.slice(0, 2); }));
    k.flag = c ? c.flag : '';
  });

  /* ---------- scope matching ---------- */
  function parse(scope) { var p = String(scope).split(':'); return { t: p[0], v: p[1] }; }
  function match(scope) {
    var s = parse(scope), out = K.filter(function (k) {
      if (s.t === 'I') return k.i.indexOf(s.v) >= 0;
      if (s.t === 'D') return k.drivers.indexOf(s.v) >= 0;
      if (s.t === 'L') return k.drivers.some(function (d) { return d.charAt(0) === String(s.v); });
      return false;
    });
    function rank(k) { var i = k.i[0]; return (s.t === 'I' ? i === s.v : s.t === 'D' ? i.slice(0, 2) === s.v : i.charAt(0) === String(s.v)) ? 0 : 1; }
    return out.map(function (k, n) { return { k: k, n: n }; }).sort(function (a, b) { return rank(a.k) - rank(b.k) || a.n - b.n; }).map(function (x) { return x.k; });
  }
  function title(scope) {
    var s = parse(scope), INDS = (window.IEI_IND && window.IEI_IND.inds) || [];
    if (s.t === 'L') return ['Lever ' + s.v, LEVN[s.v - 1]];
    if (s.t === 'D') return ['Driver ' + s.v, M.driverLabels[s.v]];
    var m = INDS.filter(function (x) { return x.id === s.v; })[0];
    return ['Indicator ' + s.v, m ? m.name : ''];
  }
  window.IEI_CASES_COUNT = function (scope) { return match(scope).length; };

  /* ---------- card + detail html ---------- */
  function tags(k) {
    return '<div class="cs-tags">' + '<span class="cs-st">' + esc(k.s) + '</span>' +
      k.i.map(function (id) { return '<span class="cs-dr" style="--a:' + LEVC[parseInt(id.charAt(0), 10) - 1] + '">' + esc(id) + '</span>'; }).join('') + '</div>';
  }
  function countryLine(k) {
    return '<span class="cs-co">' + (k.flag ? '<img src="' + FLAGS + k.flag + '.svg" alt="">' : '') + esc(k.cn) + '</span>' +
      (k.tier ? '<span class="cs-tier" style="background:' + TBG[k.tier] + ';color:' + TFG[k.tier] + '">' + esc(k.tier) + '</span>' : '');
  }
  function detail(k) {
    var link = safeUrl(k.url);
    return '<article class="cp-detail"><div class="cs-top">' + countryLine(k) + '</div><h3>' + esc(k.t) + '</h3>' + tags(k) +
      '<div class="cp-text">' + k.x.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' +
      '<dl class="cp-meta"><dt>Most useful for</dt><dd>' + esc(k.s) + (k.sa ? ' · also ' + esc(k.sa) : '') + '</dd>' +
      '<dt>Region · income</dt><dd>' + esc(k.region) + ' · ' + esc(k.inc) + '</dd>' +
      (k.src ? '<dt>Source</dt><dd>' + esc(k.src) + '</dd>' : '') + '</dl>' +
      '<div class="cp-actions">' + (link ? '<a class="cp-link" href="' + esc(link) + '" target="_blank" rel="noopener">Open source ↗</a>' : '') +
      (k.c ? '<button type="button" class="cp-prof" data-c="' + k.c + '">View ' + esc(k.cn) + ' profile →</button>' : '') + '</div></article>';
  }
  function brief(k) {
    return '<button type="button" class="cp-card" data-case="' + esc(k.id) + '"><span class="cs-top">' + countryLine(k) + '</span><b>' + esc(k.t) + '</b><span class="cp-b">' + esc(k.b) + '</span>' +
      tags(k) + '<span class="cp-more">Read more →</span></button>';
  }

  /* ---------- popup ---------- */
  var pop, opener, state = { scope: '', id: '' };
  function ensure() {
    if (pop) return pop;
    pop = document.createElement('div'); pop.className = 'cp'; pop.hidden = true;
    pop.innerHTML = '<div class="cp-bg" data-x="1"></div><div class="cp-box" role="dialog" aria-modal="true" aria-labelledby="cpT" tabindex="-1"><button type="button" class="cp-x" data-x="1" aria-label="Close">×</button><div class="cp-head"></div><div class="cp-body"></div></div>';
    document.body.appendChild(pop);
    pop.addEventListener('click', function (e) {
      if (e.target.closest('[data-x]')) { close(); return; }
      var b = e.target.closest('[data-case]');
      if (b) { state.id = b.getAttribute('data-case'); paint(); return; }
      if (e.target.closest('.cp-back')) { state.id = ''; paint(); return; }
      b = e.target.closest('.cp-prof');
      if (b && window.IEI_OPEN_COUNTRY) { var id = b.getAttribute('data-c'); close(); window.IEI_OPEN_COUNTRY(id); }
    });
    return pop;
  }
  function paint() {
    var head = pop.querySelector('.cp-head'), body = pop.querySelector('.cp-body'), box = pop.querySelector('.cp-box');
    var k = state.id && K.filter(function (x) { return String(x.id) === state.id; })[0];
    if (state.scope === 'ALL' || !state.scope) {
      head.innerHTML = '<p class="cp-eye">Case study</p><h3 id="cpT">' + (k ? esc(k.t) : '') + '</h3>';
      body.innerHTML = k ? detail(k) : '';
    } else {
      var L = match(state.scope), t = title(state.scope);
      if (k) {
        head.innerHTML = '<button type="button" class="cp-back">← Back to ' + L.length + ' case' + (L.length === 1 ? '' : 's') + '</button><h3 id="cpT">' + esc(k.t) + '</h3>';
        body.innerHTML = detail(k);
      } else {
        head.innerHTML = '<p class="cp-eye">Case studies to learn from · ' + esc(t[0]) + '</p><h3 id="cpT">' + esc(t[1]) + '</h3><p class="cp-sub">' + L.length + ' case' + (L.length === 1 ? '' : 's') + '. Select one for the full story and sources.</p>';
        body.innerHTML = L.length ? '<div class="cp-list">' + L.map(brief).join('') + '</div>' : '<p class="cs-none">No case studies yet for this ' + esc(t[0].split(' ')[0].toLowerCase()) + '.</p>';
      }
    }
    box.scrollTop = 0; body.scrollTop = 0;
  }
  function open(scope, btn, id) {
    ensure(); state.scope = scope; state.id = id || ''; opener = btn || null; paint();
    pop.hidden = false; document.documentElement.classList.add('cp-open');
    setTimeout(function () { pop.querySelector('.cp-box').focus(); }, 0);
  }
  function close() {
    if (!pop || pop.hidden) return;
    pop.hidden = true; document.documentElement.classList.remove('cp-open');
    if (opener && document.body.contains(opener)) opener.focus(); opener = null;
  }
  window.IEI_CASES_OPEN = open;
  document.addEventListener('keydown', function (e) {
    if (!pop || pop.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') {
      var f = Array.prototype.slice.call(pop.querySelectorAll('button, a[href]')).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1], box = pop.querySelector('.cp-box');
      e.stopPropagation();
      if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, true);
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-cases]');
    if (b) { e.preventDefault(); open(b.getAttribute('data-cases'), b); }
  });

  /* ---------- section with filters ---------- */
  var root = document.getElementById('ieiCases');
  if (!root) return;
  var st = { country: '', stake: '', driver: '', tier: '', region: '' };
  function sel(key, label, opts) {
    return '<label class="cs-f"><span>' + label + '</span><select data-f="' + key + '"><option value="">All</option>' + opts.map(function (o) {
      var v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(v) + '">' + esc(l) + '</option>';
    }).join('') + '</select></label>';
  }
  var drvOpts = M.driverIds.map(function (id) { return [id, id + ' · ' + M.driverLabels[id].replace(/ \(e\.g\..*$/, '').slice(0, 60)]; });
  root.innerHTML = '<div class="cs-bar">' + sel('country', 'Country', uniq(K.map(function (k) { return k.cn; }))) + sel('stake', 'Stakeholder', uniq(K.map(function (k) { return k.s; }))) +
    sel('driver', 'Driver', drvOpts) + sel('tier', 'Tier', M.tiers.map(function (t) { return t.name; })) + sel('region', 'Region', uniq(K.map(function (k) { return k.region; }))) +
    '<button type="button" class="cs-reset">Reset</button></div><p class="cs-count" aria-live="polite"></p><div class="cs-grid"></div>' +
    '<p class="cs-note">Working draft: first selection of case studies (November 2026). Tier is shown for countries in the 54-economy sample.</p>';
  var grid = root.querySelector('.cs-grid'), count = root.querySelector('.cs-count');
  function render() {
    var L = K.filter(function (k) {
      return (!st.country || k.cn === st.country) && (!st.stake || k.s === st.stake) && (!st.driver || k.drivers.indexOf(st.driver) >= 0) &&
        (!st.tier || k.tier === st.tier) && (!st.region || k.region === st.region);
    });
    count.textContent = L.length + ' of ' + K.length + ' case studies';
    grid.innerHTML = L.length ? L.map(function (k) {
      return '<article class="cs-card"><div class="cs-top">' + countryLine(k) + '</div><h3>' + esc(k.t) + '</h3><p>' + esc(k.b) + '</p>' + tags(k) +
        '<button type="button" class="cs-go" data-open-case="' + esc(k.id) + '">Read the case →</button></article>';
    }).join('') : '<p class="cs-none">No case studies match these filters.</p>';
  }
  root.addEventListener('change', function (e) { var f = e.target.getAttribute && e.target.getAttribute('data-f'); if (f) { st[f] = e.target.value; render(); } });
  root.addEventListener('click', function (e) {
    var b = e.target.closest('.cs-reset');
    if (b) { st = { country: '', stake: '', driver: '', tier: '', region: '' }; Array.prototype.forEach.call(root.querySelectorAll('select'), function (s) { s.value = ''; }); render(); return; }
    b = e.target.closest('[data-open-case]');
    if (b) open('ALL', b, b.getAttribute('data-open-case'));
  });
  render();
})();
