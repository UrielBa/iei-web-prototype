/* IEI Case Studies: filterable section + contextual popup (lever / driver / indicator). Reads IEI_DATA + IEI_CASES. */
(function () {
  'use strict';
  var D = window.IEI_DATA, K = window.IEI_CASES;
  if (!D || !K) return;
  var FLAGS = '../Impact Economy Index_files/flags/4x3/', C = D.countries, M = D.meta, byId = {};
  C.forEach(function (c) { byId[c.id] = c; });
  var LEVC = ['#3DCC7D', '#77DAD9', '#F094B5', '#FFBD87'];
  var TBG = {}, TFG = {}; M.tiers.forEach(function (t) { TBG[t.name] = t.bg; TFG[t.name] = t.fg; });
  var LEVN = M.levers.map(function (l) { return l.name; });
  var REGMAP = { 'Europe': 'Europe & Middle East', 'Africa': 'Africa', 'Asia': 'Asia Pacific', 'Americas': 'Latin America' };
  var SICON = { 'Policymaker': 'government', 'Investor': 'investors', 'Philanthropy & DFI': 'blended-finance', 'Corporate': 'supply-demand', 'Ecosystem builder': 'community', 'Civil society & consumers': 'social-demand' };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uniq(a) { return Array.from(new Set(a)).sort(); }
  function safeUrl(u) { return /^https?:\/\//i.test(u) ? u : ''; }

  K.forEach(function (k) {
    var c = k.c && byId[k.c];
    k.tier = c ? c.tier : ''; k.region = c ? c.region : (REGMAP[k.reg] || k.reg);
    k.drivers = uniq(k.i.map(function (x) { return x.slice(0, 3); }));
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
    function rank(k) { var i = k.i[0]; return (s.t === 'I' ? i === s.v : s.t === 'D' ? i.slice(0, 3) === s.v : i.charAt(0) === String(s.v)) ? 0 : 1; }
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
  window.IEI_CASES_MATCH = function (scope) { return match(scope); };

  /* ---------- card + detail html ---------- */
  function tags(k) {
    var ic = SICON[k.s];
    return '<div class="cs-tags">' + '<span class="cs-st">' + '' + esc(k.s) + '</span>' +
      k.i.map(function (id) { return '<span class="cs-dr" style="--a:' + LEVC[parseInt(id.charAt(0), 10) - 1] + '">' + esc(id) + '</span>'; }).join('') + '</div>';
  }
  function countryLine(k) {
    return '<span class="cs-co">' + (k.flag ? '<img src="' + FLAGS + k.flag + '.svg" alt="">' : '') + esc(k.cn) + '</span>' +
      (k.tier ? '<span class="cs-tier" style="background:' + TBG[k.tier] + ';color:' + TFG[k.tier] + '">' + esc(k.tier) + '</span>' : '');
  }
  function levOf(k) { return parseInt(k.i[0].charAt(0), 10) || 1; }
  var PH = window.IEI_CASE_PHOTOS || {};
  function photo(k) { return PH[String(k.id)] || null; }
  function credit(ph) {
    return '<span class="cp-credit">Photo: ' + esc(ph.a) + ' · ' + esc(ph.l) + ' · <a href="' + esc(ph.p) + '" target="_blank" rel="noopener">Wikimedia Commons</a></span>';
  }
  function indName(id) {
    var I = (window.IEI_IND && window.IEI_IND.inds) || [], m = I.filter(function (x) { return x.id === id; })[0];
    return m ? m.name : (M.driverLabels[id] || '');
  }
  function detail(k) {
    var link = safeUrl(k.url), c = k.c && byId[k.c], L = levOf(k), ic = SICON[k.s];
    var paras = k.x.slice(), glance = null;
    if (k.b && k.b.slice(-1) !== '…' && paras.length && paras[0].indexOf(k.b) === 0) { glance = k.b; paras[0] = paras[0].slice(k.b.length).trim(); if (!paras[0]) paras.shift(); }
    var chunks = [];
    paras.forEach(function (p) {
      var sent = p.split(/(?<=[.!?])\s+(?=[A-Z“"(])/), buf = [];
      sent.forEach(function (x) { buf.push(x.trim()); if (buf.length === 3) { chunks.push(buf.join(' ')); buf = []; } });
      if (buf.length) chunks.push(buf.join(' '));
    });
    var lead = !glance && chunks.length ? chunks.shift() : null;
    return '<article class="cp-detail">' +
      (photo(k) ? '<figure class="cp-photo"><img src="' + esc(photo(k).u) + '" alt="' + esc(photo(k).c) + '" loading="lazy" referrerpolicy="no-referrer"><figcaption><span class="cp-cap">' + esc(photo(k).c) + '</span>' + credit(photo(k)) + '</figcaption></figure>' : '') +
      '<div class="cp-facts">' +
        '<div class="cp-fact"><span class="cp-fk">Country</span><span class="cp-fv">' + (k.flag ? '<img class="cp-flag" src="' + FLAGS + k.flag + '.svg" alt="">' : '') + esc(k.cn) + '</span>' +
          (c ? '<span class="cp-fs">IEI score ' + c.score + ' · <span class="cs-tier" style="background:' + TBG[c.tier] + ';color:' + TFG[c.tier] + '">' + esc(c.tier) + '</span></span>' : '<span class="cp-fs">Not scored in the Index</span>') + '</div>' +
        '<div class="cp-fact"><span class="cp-fk">Most useful for</span><span class="cp-fv">' + '' + esc(k.s) + '</span>' + (k.sa ? '<span class="cp-fs">Also ' + esc(k.sa) + '</span>' : '') + '</div>' +
        '<div class="cp-fact"><span class="cp-fk">Region · income</span><span class="cp-fv">' + esc(k.region) + '</span><span class="cp-fs">' + esc(k.inc) + '</span></div>' +
      '</div>' +
      (glance ? '<div class="cp-glance"><span class="cp-fk">At a glance</span><p>' + esc(glance) + '</p></div>' : '') +
      '<div class="cp-text">' + (lead ? '<p class="cp-lead">' + esc(lead) + '</p>' : '') + chunks.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' +
      '<div class="cp-inds"><span class="cp-fk">Where it shows up in the Index</span><ul>' + k.i.map(function (id) {
        return '<li><span class="cs-dr" style="--a:' + LEVC[parseInt(id.charAt(0), 10) - 1] + '">' + esc(id) + '</span>' + esc(indName(id)) + '</li>';
      }).join('') + '</ul></div>' +
      '<div class="cp-src">' + (k.src ? '<p><span class="cp-fk">Source</span>' + esc(k.src) + '</p>' : '') +
      '<div class="cp-actions">' + (link ? '<a class="cp-link" href="' + esc(link) + '" target="_blank" rel="noopener">Open source ↗</a>' : '') +
      (k.c ? '<button type="button" class="cp-prof" data-c="' + k.c + '">View ' + esc(k.cn) + ' profile →</button>' : '') + '</div></div></article>';
  }
  function brief(k) {
    return '<button type="button" class="cp-card" data-case="' + esc(k.id) + '">' + (photo(k) ? '<img class="cp-thumb" src="' + esc(photo(k).u) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '') + '<span class="cp-cbody"><span class="cs-top">' + countryLine(k) + '</span><b>' + esc(k.t) + '</b><span class="cp-b">' + esc(k.b) + '</span>' +
      tags(k) + '<span class="cp-more">Read more →</span></span></button>';
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
    var o = e.target.closest && e.target.closest('[data-case-open]');
    if (o) { e.preventDefault(); open(o.getAttribute('data-case-scope') || 'ALL', o, o.getAttribute('data-case-open')); return; }
    var b = e.target.closest && e.target.closest('[data-cases]');
    if (b) { e.preventDefault(); open(b.getAttribute('data-cases'), b); }
  });

  /* ---------- section with filters ---------- */
  function stakes2(k) { return String(k.sa || '').split(/[;,]/).map(function (x) { return x.trim(); }).filter(Boolean); }
  var root = document.getElementById('ieiCases');
  if (!root) return;
  var st = { q: '', country: '', stake: '', driver: '', tier: '', region: '' }, showAll = false, FIRST = 6, CHIPS = root.hasAttribute('data-chips');
  var LBL = { country: 'Country', driver: 'Driver', stake: 'Stakeholder', tier: 'Stage', region: 'Region' };
  function sel(key, label, opts) {
    return '<label class="cs-f"><span>' + label + '</span><select data-f="' + key + '"><option value="">All</option>' + opts.map(function (o) {
      var v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(v) + '">' + esc(l) + '</option>';
    }).join('') + '</select></label>';
  }
  var drvOpts = M.driverIds.map(function (id) { return [id, id + ' · ' + M.driverLabels[id].replace(/ \(e\.g\..*$/, '')]; });
  root.innerHTML = '<div class="cs-bar">' +
    '<label class="cs-f cs-search"><span>Search</span><input type="search" data-f="q" placeholder="Search case studies…" autocomplete="off"></label>' +
    sel('country', 'Country', uniq(K.map(function (k) { return k.cn; }))) + sel('driver', 'Driver', drvOpts) +
    '<button type="button" class="cs-morebtn" aria-expanded="false" aria-controls="csMore">More filters <span class="cs-mn" hidden></span></button>' +
    '<button type="button" class="cs-reset">Clear all</button></div>' +
    '<div class="cs-more" id="csMore" hidden>' + sel('stake', 'Stakeholder (primary or secondary)', uniq(K.reduce(function (a, k) { return a.concat([k.s]).concat(stakes2(k)); }, []).filter(Boolean))) +
    sel('tier', 'Maturity stage', M.tiers.map(function (t) { return t.name; })) + sel('region', 'Region', uniq(K.map(function (k) { return k.region; }))) + '</div>' +
    (CHIPS ? '<div class="cs-chips" aria-live="polite"></div>' : '') +
    '<p class="cs-count" aria-live="polite"></p><div class="cs-grid"></div><button type="button" class="s-more cs-all" aria-expanded="false"><span></span><i aria-hidden="true"></i></button>' +
    '<p class="cs-note">Working draft: first selection of case studies (November 2026). Maturity stage is shown for countries in the 54-economy sample.</p>';
  var grid = root.querySelector('.cs-grid'), count = root.querySelector('.cs-count'), allBtn = root.querySelector('.cs-all'), chips = root.querySelector('.cs-chips');
  function norm(x) { return String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function label(key, v) { if (key === 'driver') { var o = drvOpts.filter(function (d) { return d[0] === v; })[0]; return o ? o[1] : v; } return v; }
  function render() {
    var q = norm(st.q);
    var L = K.filter(function (k) {
      return (!q || norm(k.t + ' ' + k.b + ' ' + k.cn + ' ' + k.s).indexOf(q) >= 0) &&
        (!st.country || k.cn === st.country) && (!st.stake || k.s === st.stake || stakes2(k).indexOf(st.stake) >= 0) && (!st.driver || k.drivers.indexOf(st.driver) >= 0) &&
        (!st.tier || k.tier === st.tier) && (!st.region || k.region === st.region);
    });
    var nMore = ['stake', 'tier', 'region'].filter(function (k) { return st[k]; }).length, mn = root.querySelector('.cs-mn');
    mn.hidden = !nMore; mn.textContent = '(' + nMore + ')';
    if (chips) chips.innerHTML = Object.keys(LBL).filter(function (k) { return st[k]; }).map(function (k) {
      return '<button type="button" class="cs-chip" data-clear="' + k + '" aria-label="Remove filter ' + esc(LBL[k]) + ': ' + esc(label(k, st[k])) + '">' + esc(LBL[k]) + ': ' + esc(label(k, st[k])) + ' <span aria-hidden="true">×</span></button>';
    }).join('');
    count.textContent = L.length + ' of ' + K.length + ' case studies';
    var more = L.length > FIRST && !showAll;
    allBtn.hidden = L.length <= FIRST; allBtn.setAttribute('aria-expanded', showAll);
    allBtn.querySelector('span').textContent = showAll ? 'Show fewer case studies' : 'Show all ' + L.length + ' case studies';
    if (more) L = L.slice(0, FIRST);
    grid.innerHTML = L.length ? L.map(function (k) {
      return '<article class="cs-card">' + (photo(k) ? '<img class="cs-photo" src="' + esc(photo(k).u) + '" alt="' + esc(photo(k).c) + '" loading="lazy" referrerpolicy="no-referrer">' : '') + '<div class="cs-top">' + countryLine(k) + '</div><h3>' + esc(k.t) + '</h3><p>' + esc(k.b) + '</p>' + tags(k) +
        '<button type="button" class="cs-go" data-open-case="' + esc(k.id) + '">Read the case →</button></article>';
    }).join('') : '<p class="cs-none">No case studies match these filters.</p>';
  }
  function clearAll() { st = { q: '', country: '', stake: '', driver: '', tier: '', region: '' }; Array.prototype.forEach.call(root.querySelectorAll('[data-f]'), function (s) { s.value = ''; }); render(); }
  root.addEventListener('change', function (e) { var f = e.target.getAttribute && e.target.getAttribute('data-f'); if (f) { st[f] = e.target.value; render(); } });
  root.addEventListener('input', function (e) { if (e.target.getAttribute && e.target.getAttribute('data-f') === 'q') { st.q = e.target.value; render(); } });
  root.addEventListener('click', function (e) {
    var b = e.target.closest('.cs-reset');
    if (b) { clearAll(); return; }
    if ((b = e.target.closest('.cs-morebtn'))) { var pn = document.getElementById('csMore'), o = pn.hidden; pn.hidden = !o; b.setAttribute('aria-expanded', o); return; }
    if ((b = e.target.closest('[data-clear]'))) { var k = b.getAttribute('data-clear'); st[k] = ''; var s2 = root.querySelector('[data-f="' + k + '"]'); if (s2) s2.value = ''; render(); return; }
    if (e.target.closest('.cs-all')) { showAll = !showAll; render(); return; }
    b = e.target.closest('[data-open-case]');
    if (b) open('ALL', b, b.getAttribute('data-open-case'));
  });
  render();
})();
