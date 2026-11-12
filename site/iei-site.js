/* IEI site chrome: nav, hero stats, definition chips, insights, download form */
(function(){
'use strict';
document.documentElement.classList.add('js');
var D=window.IEI_DATA,C=D&&D.countries||[],T=D&&D.meta&&D.meta.tiers;
var LC=['#3DCC7D','#77DAD9','#FFBD87','#F094B5'],LN=['Accountability & Transparency','Procurement & Demand','Coordination & Support','Capital Allocation & Deployment'];
var TC=['#DCE1FF','#AEBAFF','#7084FF','#1B2A8F'],TN=['Early stage','Developing','Progressing','Advanced'];
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
function tier(x){return x<40?0:x<50?1:x<60?2:3}
function avg(a){return a.reduce(function(p,c){return p+c},0)/(a.length||1)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

/* ---- nav ---- */
var nav=$('.s-nav');
if(nav){
  var btn=$('.s-burger',nav),links=$$('.s-link[href^="#"]',nav);
  function close(){nav.classList.remove('is-open');btn.setAttribute('aria-expanded','false')}
  btn.addEventListener('click',function(){var o=nav.classList.toggle('is-open');btn.setAttribute('aria-expanded',o)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
  links.concat($$('.s-nav .s-btn')).forEach(function(a){a.addEventListener('click',close)});
  function stuck(){nav.classList.toggle('is-stuck',window.scrollY>8)}
  window.addEventListener('scroll',stuck,{passive:true});stuck();
  var secs=links.map(function(a){return document.getElementById(a.getAttribute('href').slice(1))});
  function spy(){var y=window.scrollY+120,cur=-1;secs.forEach(function(s,i){if(s&&s.getBoundingClientRect().top+window.scrollY<=y)cur=i});
    links.forEach(function(a,i){a.classList.toggle('is-active',i===cur);if(i===cur)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')})}
  window.addEventListener('scroll',spy,{passive:true});spy();
}

/* ---- reveal ---- */
var rev=$$('.s-reveal');
if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('s-in');io.unobserve(e.target)}})},{threshold:.15});
  rev.forEach(function(r){io.observe(r)});
}else rev.forEach(function(r){r.classList.add('s-in')});

/* ---- hero stats ---- */
if(C.length){
  var el=$('#sStats');
  if(el){
    var sc=C.map(function(c){return c.score}),n=C.length;
    var counts=[0,0,0,0];C.forEach(function(c){counts[tier(c.score)]++});
    var stats=[[n,'countries assessed'],['14','policy drivers across 4 levers'],[Math.round(avg(sc)),'average score out of 100'],[Math.min.apply(null,sc)+'–'+Math.max.apply(null,sc),'score range, lowest to highest']];
    el.innerHTML=stats.map(function(s,i){return '<div class="s-stat s-reveal" data-d="'+(i%4)+'"><b data-n="'+esc(s[0])+'">'+esc(s[0])+'</b><span>'+esc(s[1])+'</span></div>'}).join('')+
      '<div class="s-tiers s-reveal"><p>Countries by readiness tier</p><div class="s-tbar" role="img" aria-label="'+TN.map(function(t,i){return counts[i]+' '+t}).join(', ')+'">'+
      counts.map(function(k,i){return '<i style="flex:'+k+';background:'+TC[i]+'" title="'+TN[i]+': '+k+'"></i>'}).join('')+'</div><div class="s-tleg">'+
      counts.map(function(k,i){return '<span><i style="background:'+TC[i]+'"></i>'+TN[i]+' <small>'+k+' · '+(i==0?'<40':i==1?'40–49':i==2?'50–59':'≥60')+'</small></span>'}).join('')+'</div></div>';
    $$('.s-reveal',el).forEach(function(r){if('IntersectionObserver' in window)io.observe(r);else r.classList.add('s-in')});
    // count-up
    var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    $$('b[data-n]',el).forEach(function(b){var t=b.getAttribute('data-n');if(reduce||!/^\d+$/.test(t))return;t=+t;
      var o=new IntersectionObserver(function(e){if(!e[0].isIntersecting)return;o.disconnect();var s=performance.now();
        (function f(now){var p=Math.min(1,(now-s)/900);b.textContent=Math.round(t*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)})(s)},{threshold:.6});o.observe(b)});
  }
}

/* ---- definition chips -> lever deck ---- */
$$('.s-chip').forEach(function(c){c.addEventListener('click',function(){
  var i=+c.getAttribute('data-i'),t=document.getElementById('lever-tab-'+i),d=document.getElementById('leverDeck');
  if(t)t.click();if(d)d.scrollIntoView({behavior:'smooth',block:'start'});
})});

/* ---- how to read: tier list ---- */
(function(){var ul=$('#sTierList');if(!ul||!C.length)return;var k=[0,0,0,0];C.forEach(function(c){k[tier(c.score)]++});
  var rg=['below 40','40–49','50–59','60 and above'];
  ul.innerHTML=TN.map(function(t,i){return '<li><i style="background:'+TC[i]+'"></i><b>'+t+'</b><span>'+rg[i]+'</span><em>'+k[i]+' countries</em></li>'}).join('')})();

/* ---- insights (evidence computed from data) ---- */
function insights(){
  if(!C.length)return;
  // F1: lever correlation heat (pairwise r)
  function corr(a,b){var ma=avg(a),mb=avg(b),n=0,da=0,db=0;a.forEach(function(x,i){n+=(x-ma)*(b[i]-mb);da+=Math.pow(x-ma,2);db+=Math.pow(b[i]-mb,2)});return n/Math.sqrt(da*db)}
  var L=[0,1,2,3].map(function(k){return C.map(function(c){return c.l[k]})});
  var rs=[],pairs=[];for(var i=0;i<4;i++)for(var j=i+1;j<4;j++){var r=corr(L[i],L[j]);rs.push(r);pairs.push([i,j,r])}
  var rmin=Math.min.apply(null,rs),rmax=Math.max.apply(null,rs);
  var mx='<div class="s-mx"><span></span>'+[0,1,2,3].map(function(k){return '<i style="background:'+LC[k]+'" title="'+LN[k]+'"></i>'}).join('');
  for(i=0;i<4;i++){mx+='<i style="background:'+LC[i]+'" title="'+LN[i]+'"></i>';for(j=0;j<4;j++){
    if(i===j)mx+='<b class="d" aria-hidden="true">—</b>';else{var r=corr(L[i],L[j]);var a=((r-.4)/.35);a=Math.max(0,Math.min(1,a));
      mx+='<b style="background:rgba(112,132,255,'+(.15+.75*a).toFixed(2)+');color:'+(a>.55?'#fff':'#0F1428')+'" title="'+LN[i]+' × '+LN[j]+': r = '+r.toFixed(2)+'">'+r.toFixed(2).replace('0.','.')+'</b>'}}}
  mx+='</div>';
  var e1=mx+'<p class="s-cap">Every pair of levers is positively correlated (r = '+rmin.toFixed(2)+'–'+rmax.toFixed(2)+').<small>Pearson correlation of lever scores across '+C.length+' countries (n = '+C.length+'). An association, not evidence of cause and effect.</small></p>';
  // F2: tiers by income swarm-ish strip
  var inc=[['High Income','High'],['Upper Middle Income','Upper-middle'],['Lower Middle Income','Lower-middle'],['Low Income','Low']],rows=[];
  inc.forEach(function(g){var cs=C.filter(function(c){return c.income===g[0]});if(cs.length)rows.push([g[1],cs])});
  var W=300,x0=82,x1=W-8,min=25,max=80,rh=34,H=rows.length*rh+22;
  function X(v){return x0+(v-min)/(max-min)*(x1-x0)}
  var sv='<svg class="s-swarm" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Country scores by income group">';
  [40,50,60].forEach(function(t){sv+='<line x1="'+X(t)+'" x2="'+X(t)+'" y1="0" y2="'+(H-16)+'" stroke="#E3E6EE" stroke-dasharray="2 3"/><text x="'+X(t)+'" y="'+(H-4)+'" text-anchor="middle">'+t+'</text>'});
  rows.forEach(function(r,ri){var cy=ri*rh+16;sv+='<text class="rl" x="0" y="'+(cy+3)+'">'+r[0]+'</text><text x="0" y="'+(cy+14)+'">n = '+r[1].length+' · mean '+avg(r[1].map(function(c){return c.score})).toFixed(0)+'</text>';
    var placed=[];r[1].sort(function(a,b){return a.score-b.score}).forEach(function(c){var x=X(c.score),off=0,k=0;
      while(placed.some(function(p){return Math.abs(p.x-x)<7&&Math.abs(p.o-off)<7})){k++;off=(k%2?1:-1)*Math.ceil(k/2)*7;if(k>8)break}
      placed.push({x:x,o:off});sv+='<circle class="s-dot" tabindex="0" cx="'+x.toFixed(1)+'" cy="'+(cy+off*.9).toFixed(1)+'" r="4.2" fill="'+TC[tier(c.score)]+'"><title>'+esc(c.name)+' — '+c.score+'</title></circle>'})});
  sv+='</svg>';
  var hi=rows.length?rows[0][1]:[],lo=rows.length?rows[rows.length-1][1]:[];
  var rng=function(a){return Math.min.apply(null,a.map(function(c){return c.score}))+'–'+Math.max.apply(null,a.map(function(c){return c.score}))};
  var e2=sv+'<p class="s-cap">High-income economies span the whole scale ('+rng(rows[0][1])+'); every income group has overlap.<small>Each dot is a country, coloured by tier. Hover for the name.</small></p>';
  // F3: lever means
  var means=L.map(avg),lo4=means.indexOf(Math.min.apply(null,means));
  var e3='<div class="s-bars">'+means.map(function(m,k){return '<div class="s-bar'+(k===lo4?' low':'')+'" style="--c:'+LC[k]+'"><span>'+LN[k]+'</span><b>'+m.toFixed(1)+'</b><div><span style="width:'+m.toFixed(1)+'%"></span></div></div>'}).join('')+'</div>'+
    '<p class="s-cap">'+LN[lo4]+' is the weakest lever globally, '+(Math.max.apply(null,means)-means[lo4]).toFixed(0)+' points behind the strongest.<small>Average lever score across '+C.length+' countries.</small></p>';
  var ev=[e1,e2,e3];
  $$('.s-find').forEach(function(f,i){var h=$('.s-evid',f);if(h)h.innerHTML='<div class="s-evid-in"><p class="s-evid-t">In the data</p>'+ev[i]+'</div>'});
}
insights();

/* ---- download form ---- */
var form=$('#sForm');
if(form){
  // Set to a real endpoint (e.g. a Formspree/Forms URL) to collect leads; empty = nothing is sent anywhere.
  var ENDPOINT=form.getAttribute('data-endpoint')||'';
  var REPORT=form.getAttribute('data-report')||'';
  form.addEventListener('submit',function(e){e.preventDefault();
    var err=$('.s-err',form),ok=true;err.textContent='';
    $$('input[required],select[required]',form).forEach(function(f){var bad=f.type==='checkbox'?!f.checked:!f.value.trim();if(f.type==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value))bad=true;f.classList.toggle('bad',bad);if(bad)ok=false});
    if(!ok){err.textContent='Please complete the highlighted fields.';return}
    var data={};$$('input,select',form).forEach(function(f){if(f.name)data[f.name]=f.type==='checkbox'?f.checked:f.value});
    var done=function(){form.classList.add('is-done');var a=$('.s-getit',form);if(REPORT){a.href=REPORT;a.hidden=false}else a.hidden=true;var p=$('.s-ok p',form);if(!REPORT)p.textContent='Thank you. The report link will be shared as soon as it is published.'};
    if(ENDPOINT){fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(data)}).then(done,done)}else done();
  });
  $$('input,select',form).forEach(function(f){f.addEventListener('input',function(){f.classList.remove('bad')})});
}
})();
