/* IEI site chrome: nav, hero stats, definition chips, insights, download form */
(function(){
'use strict';
document.documentElement.classList.add('js');
var D=window.IEI_DATA,C=D&&D.countries||[],T=D&&D.meta&&D.meta.tiers;
var LC=['#3DCC7D','#77DAD9','#FFBD87','#F094B5'],LN=['Accountability & Transparency','Procurement & Demand','Coordination & Support','Capital Allocation & Deployment'];
var TC=['#BFEDEC','#77DAD9','#6478FF','#2942B5'],TN=['Early stage','Developing','Progressing','Advanced'];
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
  // F1: enabling (x) vs behaviour (y), coloured by income group
  var IC={'High Income':'#2942B5','Upper Middle Income':'#6478FF','Lower Middle Income':'#3DCC7D','Low Income':'#FFBD87'},IN={'High Income':'High','Upper Middle Income':'Upper-middle','Lower Middle Income':'Lower-middle','Low Income':'Low'};
  var P=C.filter(function(c){return c.e!=null&&c.b!=null});
  var ex=P.map(function(c){return c.e}),bx=P.map(function(c){return c.b}),rEB=corr(ex,bx),me=avg(ex),mb=avg(bx);
  var lo=Math.floor(Math.min(Math.min.apply(null,ex),Math.min.apply(null,bx))/10)*10,hi=Math.ceil(Math.max(Math.max.apply(null,ex),Math.max.apply(null,bx))/10)*10;
  var S=260,pd=30,sx=function(v){return pd+(v-lo)/(hi-lo)*(S-pd-8)},sy=function(v){return S-pd-(v-lo)/(hi-lo)*(S-pd-8)};
  var sc='<svg class="s-scat" viewBox="0 0 '+S+' '+S+'" role="img" aria-label="Enabling conditions score against behaviour score for '+P.length+' countries">';
  for(var t=lo;t<=hi;t+=10){sc+='<line x1="'+sx(t)+'" x2="'+sx(t)+'" y1="'+sy(lo)+'" y2="'+sy(hi)+'" stroke="#EEECE8"/><line y1="'+sy(t)+'" y2="'+sy(t)+'" x1="'+sx(lo)+'" x2="'+sx(hi)+'" stroke="#EEECE8"/><text x="'+sx(t)+'" y="'+(S-pd+14)+'" text-anchor="middle">'+t+'</text><text x="'+(pd-5)+'" y="'+(sy(t)+3)+'" text-anchor="end">'+t+'</text>'}
  sc+='<line x1="'+sx(lo)+'" y1="'+sy(lo)+'" x2="'+sx(hi)+'" y2="'+sy(hi)+'" stroke="#0F1428" stroke-dasharray="3 3" opacity=".35"/>';
  sc+='<line x1="'+sx(me)+'" x2="'+sx(me)+'" y1="'+sy(lo)+'" y2="'+sy(hi)+'" stroke="#9AA0B2" stroke-width=".8"/><line y1="'+sy(mb)+'" y2="'+sy(mb)+'" x1="'+sx(lo)+'" x2="'+sx(hi)+'" stroke="#9AA0B2" stroke-width=".8"/>';
  sc+='<text class="ax" x="'+sx(hi)+'" y="'+(S-2)+'" text-anchor="end">Enabling conditions →</text><text class="ax" x="'+(pd+4)+'" y="'+(sy(hi)+9)+'">↑ Behaviour</text>';
  P.forEach(function(c){sc+='<circle class="s-dot" tabindex="0" cx="'+sx(c.e).toFixed(1)+'" cy="'+sy(c.b).toFixed(1)+'" r="4.3" fill="'+(IC[c.income]||'#999')+'" stroke="#fff" stroke-width=".8"><title>'+esc(c.name)+': enabling '+Math.round(c.e)+', behaviour '+Math.round(c.b)+'</title></circle>'});
  sc+='</svg><div class="s-scleg">'+Object.keys(IC).filter(function(k){return P.some(function(c){return c.income===k})}).map(function(k){return '<span><i style="background:'+IC[k]+'"></i>'+IN[k]+'</span>'}).join('')+'</div>';
  var ahead=P.filter(function(c){return c.e>c.b}).length;
  var e1=sc+'<p class="s-cap">Enabling conditions and behaviour move together (r = '+rEB.toFixed(2)+'), but in '+ahead+' of '+P.length+' countries policies are ahead of practice (dots below the dashed line).<small>Each dot is a country, coloured by income group. Grey lines mark the averages. An association, not evidence of cause and effect.</small></p>';
  // F2: tiers by income swarm-ish strip
  var inc=[['High Income','High'],['Upper Middle Income','Upper-middle'],['Lower Middle Income','Lower-middle'],['Low Income','Low']],rows=[];
  inc.forEach(function(g){var cs=C.filter(function(c){return c.income===g[0]});if(cs.length)rows.push([g[1],cs])});
  var W=300,x0=82,x1=W-8,min=25,max=80,rh=34,H=rows.length*rh+22;
  function X(v){return x0+(v-min)/(max-min)*(x1-x0)}
  var sv='<svg class="s-swarm" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Country scores by income group">';
  [40,50,60].forEach(function(t){sv+='<line x1="'+X(t)+'" x2="'+X(t)+'" y1="0" y2="'+(H-16)+'" stroke="#E2DFDA" stroke-dasharray="2 3"/><text x="'+X(t)+'" y="'+(H-4)+'" text-anchor="middle">'+t+'</text>'});
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
/* data version line and change log */
(function(){var V=window.IEI_VERSION;if(!V)return;function e(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
document.querySelectorAll('[data-ver-line]').forEach(function(el){el.innerHTML='Data: <b>'+e(V.label)+'</b> · updated '+e(V.updated)+' · <a href="#dataVersion">What changed</a>'});
var box=document.getElementById('dataVersion');if(box)box.innerHTML='<details><summary>Data version: '+e(V.label)+' · updated '+e(V.updated)+'</summary><p>'+e(V.source)+'. '+e(V.status)+'</p><ul>'+V.log.map(function(x){return '<li><b>'+e(x.date)+'</b> '+e(x.text)+'</li>'}).join('')+'</ul></details>';
document.addEventListener('click',function(ev){var a=ev.target.closest&&ev.target.closest('a[href="#dataVersion"]');if(a&&box){var d=box.querySelector('details');if(d)d.open=true}});})();
/* shared view state in the URL hash: #country=ARG&cmp=region&vs=BRA&open=1A,2B&map=i1A.1 */
window.IEI_HASH=(function(){
  function get(){var h=location.hash.replace(/^#/,''),o={};if(h.indexOf('=')<0)return o;h.split('&').forEach(function(p){var i=p.indexOf('=');if(i>0)o[decodeURIComponent(p.slice(0,i))]=decodeURIComponent(p.slice(i+1))});return o}
  function str(o){var k=['country','cmp','vs','open','map','lang'];return Object.keys(o).filter(function(x){return o[x]!=null&&o[x]!==''}).sort(function(a,b){return k.indexOf(a)-k.indexOf(b)}).map(function(x){return encodeURIComponent(x)+'='+encodeURIComponent(o[x]).replace(/%2C/g,',')}).join('&')}
  function set(patch){var o=get();for(var k in patch)o[k]=patch[k];var s=str(o);try{history.replaceState(null,'',location.pathname+location.search+(s?'#'+s:''))}catch(e){}}
  function url(){return location.href.split('#')[0]+(location.hash||'')}
  return {get:get,set:set,url:url};
})();
