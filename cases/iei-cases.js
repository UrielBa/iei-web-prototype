/* IEI Case Studies — filterable list. Reads IEI_DATA + IEI_CASES, renders into #ieiCases. */
(function () {
  'use strict';
  var D = window.IEI_DATA, K = window.IEI_CASES, root = document.getElementById('ieiCases');
  if (!D || !K || !root) return;
  var FLAGS = './Impact Economy Index_files/flags/4x3/', C = D.countries, M = D.meta, byId = {};
  C.forEach(function (c) { byId[c.id] = c; });
  var LEVC = ['#3DCC7D', '#77DAD9', '#FFBD87', '#F094B5'], dLev = {};
  M.levers.forEach(function (L, k) { L.drivers.forEach(function (id) { dLev[id] = k; }); });
  var TBG = { 'Early stage': '#DCE1FF', 'Developing': '#AEBAFF', 'Progressing': '#7084FF', 'Advanced': '#1B2A8F' };
  var TFG = { 'Early stage': '#0F1428', 'Developing': '#0F1428', 'Progressing': '#fff', 'Advanced': '#fff' };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uniq(a) { return Array.from(new Set(a)).sort(); }
  K = K.filter(function (k) { return byId[k.c]; });
  var st = { country: '', stake: '', driver: '', tier: '', region: '' };
  var stakes = uniq([].concat.apply([], K.map(function (k) { return k.s; })));
  var countries = uniq(K.map(function (k) { return byId[k.c].name; }));
  var regions = uniq(K.map(function (k) { return byId[k.c].region; }));
  var tiers = M.tiers.map(function (t) { return t.name; });
  function sel(key, label, opts) {
    return '<label class="cs-f"><span>' + label + '</span><select data-f="' + key + '"><option value="">All</option>' + opts.map(function (o) {
      var v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(v) + '">' + esc(l) + '</option>';
    }).join('') + '</select></label>';
  }
  var drvOpts = M.driverIds.map(function (id) { return [id, id + ' · ' + M.driverLabels[id].replace(/ \(e\.g\..*$/, '').slice(0, 60)]; });
  root.innerHTML = '<div class="cs-bar">' + sel('country', 'Country', countries) + sel('stake', 'Stakeholder', stakes) + sel('driver', 'Driver', drvOpts) + sel('tier', 'Tier', tiers) + sel('region', 'Region', regions) +
    '<button type="button" class="cs-reset">Reset</button></div><p class="cs-count" aria-live="polite"></p><div class="cs-grid"></div>' +
    '<p class="cs-note">Illustrative selection drawn from the Impact Policy Tracker 2025–26 research. The final case studies will replace these entries.</p>';
  var grid = root.querySelector('.cs-grid'), count = root.querySelector('.cs-count');
  function render() {
    var L = K.filter(function (k) {
      var c = byId[k.c];
      return (!st.country || c.name === st.country) && (!st.stake || k.s.indexOf(st.stake) >= 0) && (!st.driver || k.d.indexOf(st.driver) >= 0) &&
        (!st.tier || c.tier === st.tier) && (!st.region || c.region === st.region);
    });
    count.textContent = L.length + ' of ' + K.length + ' case studies';
    grid.innerHTML = L.length ? L.map(function (k) {
      var c = byId[k.c];
      return '<article class="cs-card"><div class="cs-top"><span class="cs-co"><img src="' + FLAGS + c.flag + '.svg" alt="">' + esc(c.name) + '</span>' +
        '<span class="cs-tier" style="background:' + TBG[c.tier] + ';color:' + TFG[c.tier] + '">' + esc(c.tier) + '</span></div>' +
        '<h3>' + esc(k.t) + '</h3><p>' + esc(k.x) + '</p>' +
        '<div class="cs-tags">' + k.s.map(function (s) { return '<span class="cs-st">' + esc(s) + '</span>'; }).join('') +
        k.d.map(function (id) { return '<span class="cs-dr" style="--a:' + LEVC[dLev[id]] + '" title="' + esc(M.driverLabels[id]) + '">' + id + '</span>'; }).join('') + '</div>' +
        '<button type="button" class="cs-go" data-c="' + c.id + '">View ' + esc(c.name) + ' profile →</button></article>';
    }).join('') : '<p class="cs-none">No case studies match these filters.</p>';
  }
  root.addEventListener('change', function (e) { var f = e.target.getAttribute && e.target.getAttribute('data-f'); if (f) { st[f] = e.target.value; render(); } });
  root.addEventListener('click', function (e) {
    var b = e.target.closest('.cs-reset');
    if (b) { st = { country: '', stake: '', driver: '', tier: '', region: '' }; Array.prototype.forEach.call(root.querySelectorAll('select'), function (s) { s.value = ''; }); render(); return; }
    b = e.target.closest('.cs-go');
    if (b && window.IEI_OPEN_COUNTRY) window.IEI_OPEN_COUNTRY(b.getAttribute('data-c'));
  });
  render();
})();
