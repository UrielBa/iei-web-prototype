/* IEI site chrome: nav, hero stats, definition chips, insights, download form */
(function(){
'use strict';
document.documentElement.classList.add('js');
var D=window.IEI_DATA,C=D&&D.countries||[],T=D&&D.meta&&D.meta.tiers;
var LC=['#3DCC7D','#77DAD9','#F094B5','#FFBD87'],LN=['Accountability & Transparency','Procurement & Demand','Capital Allocation & Deployment','Coordination & Support'];
var ST=T||[],TC=ST.map(function(t){return t.bg}),TN=ST.map(function(t){return t.name}),TR=ST.map(function(t){return t.min+'–'+t.max});
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
function tier(x){for(var i=ST.length-1;i>0;i--)if(x>=ST[i].min)return i;return 0}
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
  /* active state is set by the router (site/iei-router.js) */
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
    var counts=ST.map(function(){return 0});C.forEach(function(c){counts[tier(c.score)]++});
    var stats=[[n,'countries assessed'],['14','drivers and 38 indicators across 4 levers'],[Math.round(avg(sc)),'average score on a 1–100 scale'],[Math.min.apply(null,sc)+'–'+Math.max.apply(null,sc),'score range, lowest to highest']];
    el.innerHTML=stats.map(function(s,i){return '<div class="s-stat s-reveal" data-d="'+(i%4)+'"><b data-n="'+esc(s[0])+'">'+esc(s[0])+'</b><span>'+esc(s[1])+'</span></div>'}).join('')+
      '<div class="s-tiers s-reveal"><p>Number of countries by maturity stage <small class="s-tnote">(figures are numbers of countries, not scores)</small></p><div class="s-tbar" role="img" aria-label="'+TN.map(function(t,i){return counts[i]+' '+t}).join(', ')+'">'+
      counts.map(function(k,i){return '<i style="flex:'+k+';background:'+TC[i]+'" title="'+TN[i]+': '+k+'"></i>'}).join('')+'</div><div class="s-tleg">'+
      counts.map(function(k,i){return '<span><i style="background:'+TC[i]+'"></i>'+TN[i]+' <small>'+k+' · '+TR[i]+'</small></span>'}).join('')+'</div></div>';
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
  if(window.IEI_openLevers)window.IEI_openLevers();t=document.getElementById('lever-tab-'+i);if(t&&t.getAttribute('aria-expanded')!=='true')t.click();var pz=document.getElementById('sPyrX');if(pz)pz.scrollIntoView({behavior:'smooth',block:'start'});
})});

/* ---- how to read: tier list ---- */
(function(){var ul=$('#sTierList');if(!ul||!C.length)return;var k=ST.map(function(){return 0});C.forEach(function(c){k[tier(c.score)]++});
  ul.innerHTML=TN.map(function(t,i){return '<li><i style="background:'+TC[i]+'"></i><b>'+ST[i].stage+'. '+t+'</b><span>'+TR[i]+'</span><em>'+k[i]+' '+(k[i]===1?'country':'countries')+'</em>'+(ST[i].desc?'<small class="s-tdesc">'+esc(ST[i].desc)+'</small>':'')+'</li>'}).join('')})();

/* ---- insights (evidence computed from data) ---- */
function insights(){
  if(!C.length)return;
  var IND=window.IEI_IND||{inds:[],vals:{}},TT=function(x){return window.IEI_T?window.IEI_T(x):x};
  function dotSvg(list,opt){// one-row swarm on the 1-100 scale with stage bands
    var W=300,x0=6,x1=W-6,H=opt.h||92,cy=opt.cy||42,X=function(v){return x0+(v-1)/99*(x1-x0)};
    var sv='<svg class="s-swarm s-stagestrip" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(opt.label)+'">';
    ST.forEach(function(t,i){var a=X(t.min),b=X(Math.min(100,t.max+0.1));sv+='<rect x="'+a.toFixed(1)+'" y="4" width="'+(b-a).toFixed(1)+'" height="'+(cy*2-8)+'" fill="'+t.bg+'" opacity="'+(i>=4?'.13':'.3')+'"/><text x="'+((a+b)/2).toFixed(1)+'" y="'+(cy*2+10)+'" text-anchor="middle">'+esc(t.stage)+'</text>'});
    [20,40,50,60,80].forEach(function(v){sv+='<line x1="'+X(v)+'" x2="'+X(v)+'" y1="4" y2="'+(cy*2-4)+'" stroke="#fff" stroke-width="1.2"/>'});
    var placed=[];list.slice().sort(function(a,b){return a.score-b.score}).forEach(function(c){var x=X(c.score),off=0,k=0;
      while(placed.some(function(p){return Math.abs(p.x-x)<7&&Math.abs(p.o-off)<7})){k++;off=(k%2?1:-1)*Math.ceil(k/2)*7;if(k>10)break}
      placed.push({x:x,o:off});sv+='<circle class="s-dot" tabindex="0" cx="'+x.toFixed(1)+'" cy="'+(cy+off*.9).toFixed(1)+'" r="4.2" fill="'+TC[tier(c.score)]+'" stroke="#0F1428" stroke-opacity=".25" stroke-width=".6" data-c="'+c.id+'" data-k="sc" aria-label="'+esc(c.name)+'"></circle>'});
    return sv+'</svg>';
  }
  // M1: where the 54 countries sit across the six maturity stages
  var cnt=ST.map(function(){return 0});C.forEach(function(c){cnt[tier(c.score)]++});
  var e1=dotSvg(C,{label:'Country scores on the 1–100 scale, grouped by maturity stage',h:100,cy:44})+
    '<p class="s-cap">No country has reached the Thriving stage (80 and above); the highest score is '+Math.max.apply(null,C.map(function(c){return c.score}))+'.<small>Each dot is a country, coloured by maturity stage. Hover for the name.</small></p>';
  // M2: indicator averages, foundations vs outcome-directing approaches
  function iavg(id){var v=[];Object.keys(IND.vals).forEach(function(k){var e=IND.vals[k][id];if(e&&e.s!=null)v.push(e.s)});return v.length?avg(v):null}
  var nm={};IND.inds.forEach(function(m){nm[m.id]=m.name});
  var G=[['Foundations','#2942B5',['3.B.1','1.A.2','1.C.1','2.C.1']],['Directing capital and activity to outcomes','#F094B5',['2.B.3','3.E.3','3.B.4','3.E.4']]];
  var e2='<div class="s-ibars">'+G.map(function(g){return '<p class="s-ibh"><i style="background:'+g[1]+'"></i>'+esc(g[0])+'</p>'+g[2].map(function(id){var m=iavg(id);if(m==null)return '';
    return '<div class="s-bar" style="--c:'+g[1]+'"><span>'+esc(nm[id]||id)+'</span><b>'+m.toFixed(1)+'</b><div><span style="width:'+m.toFixed(1)+'%"></span></div></div>'}).join('')}).join('')+'</div>'+
    '<p class="s-cap">Average indicator scores across '+C.length+' countries.<small>Foundations are the transparency, accountability and integrity mechanisms that make impact credible.</small></p>';
  // M3: income groups
  var inc=[['High Income','High'],['Upper Middle Income','Upper-middle'],['Lower Middle Income','Lower-middle'],['Low Income','Low']],rows=[];
  inc.forEach(function(g){var cs=C.filter(function(c){return c.income===g[0]});if(cs.length)rows.push([g[1],cs])});
  var W=300,x0=82,x1=W-8,min=20,max=80,rh=34,H=rows.length*rh+22,LBL={GBR:1,FRA:1,FIN:1,RUS:1,SAU:1};
  function X(v){return x0+(v-min)/(max-min)*(x1-x0)}
  var sv='<svg class="s-swarm" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Country scores by income group">';
  [20,40,50,60,80].forEach(function(t){sv+='<line x1="'+X(t)+'" x2="'+X(t)+'" y1="0" y2="'+(H-16)+'" stroke="#E2DFDA" stroke-dasharray="2 3"/><text x="'+X(t)+'" y="'+(H-4)+'" text-anchor="middle">'+t+'</text>'});
  rows.forEach(function(r,ri){var cy=ri*rh+16;sv+='<text class="rl" x="0" y="'+(cy+3)+'">'+r[0]+'</text><text x="0" y="'+(cy+14)+'">n = '+r[1].length+' · mean '+avg(r[1].map(function(c){return c.score})).toFixed(0)+'</text>';
    var placed=[];r[1].sort(function(a,b){return a.score-b.score}).forEach(function(c){var x=X(c.score),off=0,k=0;
      while(placed.some(function(p){return Math.abs(p.x-x)<7&&Math.abs(p.o-off)<7})){k++;off=(k%2?1:-1)*Math.ceil(k/2)*7;if(k>8)break}
      placed.push({x:x,o:off});sv+='<circle class="s-dot'+(LBL[c.id]?' hl':'')+'" tabindex="0" cx="'+x.toFixed(1)+'" cy="'+(cy+off*.9).toFixed(1)+'" r="4.2" fill="'+TC[tier(c.score)]+'" data-c="'+c.id+'" data-k="sc" aria-label="'+esc(c.name)+'"></circle>'})});
  sv+='</svg>';
  var by={};C.forEach(function(c){by[c.id]=c});
  var adv=C.filter(function(c){return c.tier===TN[4]}),advHi=adv.filter(function(c){return c.income==='High Income'}).length;
  var chip=function(id){var c=by[id];return c?'<button type="button" class="s-cchip" data-c="'+c.id+'" data-dtip-go="'+c.id+'"><img src="../Impact Economy Index_files/flags/4x3/'+c.flag+'.svg" alt="">'+esc(TT(c.name))+' <b>'+c.score+'</b></button>':''};
  var e3=sv+'<div class="s-cchips"><span>'+esc(TT('Above income peers'))+'</span>'+['GBR','FRA','FIN'].map(chip).join('')+'</div><div class="s-cchips"><span>'+esc(TT('Below GDP-predicted score'))+'</span>'+['RUS','SAU'].map(chip).join('')+'</div>'+
    '<p class="s-cap">'+(advHi===adv.length?'All '+adv.length+' Advanced countries are high-income':advHi+' of '+adv.length+' Advanced countries are high-income')+', yet high-income economies range from '+Math.min.apply(null,rows[0][1].map(function(c){return c.score}))+' to '+Math.max.apply(null,rows[0][1].map(function(c){return c.score}))+'.<small>Each dot is a country, coloured by maturity stage. Hover for the name.</small></p>';
  // M4: outcome comparisons from the report (SPI, EPI and WEF data are not part of this site)
  var e4='<div class="s-cchips"><span>'+esc(TT('Above what social outcomes alone would predict'))+'</span>'+['KEN','ZAF'].map(chip).join('')+'</div><div class="s-cchips"><span>'+esc(TT('Below the broader trendline'))+'</span>'+['RUS','SAU'].map(chip).join('')+'</div>'+
    '<p class="s-cap">Index scores compared with the Social Progress Index.<small>Source: Impact Economy Index 2026 report. The Index measures conditions that may contribute to growth quality and social progress over time, not the outcomes themselves.</small></p>';
  // NEW M1: Index scores vs outcome indices (SPI, EPI): association, computed live
  function corr(X,Y){var mx=avg(X),my=avg(Y),a=0,b=0,d=0;X.forEach(function(x,i){a+=(x-mx)*(Y[i]-my);b+=(x-mx)*(x-mx);d+=(Y[i]-my)*(Y[i]-my)});return a/Math.sqrt(b*d)}
  function pcorr(k){var P=C.filter(function(c){return c.x&&c.x[k]!=null&&c.x.gdppc});var S=P.map(function(c){return c.score}),Y=P.map(function(c){return c.x[k]}),G=P.map(function(c){return Math.log(c.x.gdppc)});
    var rxy=corr(S,Y),rxz=corr(S,G),ryz=corr(Y,G);return (rxy-rxz*ryz)/Math.sqrt((1-rxz*rxz)*(1-ryz*ryz))}
  function scat(k,label){
    var P=C.filter(function(c){return c.x&&c.x[k]!=null});if(P.length<5)return {svg:'',r:null,n:0};
    var X=P.map(function(c){return c.score}),Y=P.map(function(c){return c.x[k]}),r=corr(X,Y);
    var W=300,H=210,l=34,rr=8,t=10,b=30,x0=20,x1=80,y0=Math.floor(Math.min.apply(null,Y)/10)*10,y1=Math.ceil(Math.max.apply(null,Y)/10)*10;
    var sx=function(v){return l+(v-x0)/(x1-x0)*(W-l-rr)},sy=function(v){return H-b-(v-y0)/(y1-y0)*(H-t-b)};
    var mx=avg(X),my=avg(Y),num=0,den=0;X.forEach(function(x,i){num+=(x-mx)*(Y[i]-my);den+=(x-mx)*(x-mx)});var sl=num/den,ic=my-sl*mx;
    var sv='<svg class="s-swarm s-scat" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(label)+' plotted against Index score">';
    [20,40,60,80].forEach(function(v){sv+='<line x1="'+sx(v)+'" x2="'+sx(v)+'" y1="'+t+'" y2="'+(H-b)+'" stroke="#E4E6EF"/><text x="'+sx(v)+'" y="'+(H-b+14)+'" text-anchor="middle">'+v+'</text>'});
    for(var g=y0;g<=y1;g+=Math.max(10,Math.round((y1-y0)/40)*10)){sv+='<line x1="'+l+'" x2="'+(W-rr)+'" y1="'+sy(g)+'" y2="'+sy(g)+'" stroke="#E4E6EF"/><text x="'+(l-5)+'" y="'+(sy(g)+3)+'" text-anchor="end">'+g+'</text>'}
    sv+='<line x1="'+sx(x0)+'" y1="'+sy(sl*x0+ic)+'" x2="'+sx(x1)+'" y2="'+sy(sl*x1+ic)+'" stroke="#0F1428" stroke-width="1.5" stroke-dasharray="5 4"/>';
    P.forEach(function(c){sv+='<circle class="s-dot" tabindex="0" cx="'+sx(c.score).toFixed(1)+'" cy="'+sy(c.x[k]).toFixed(1)+'" r="4.2" fill="#6478FF" fill-opacity=".85" stroke="#0F1428" stroke-opacity=".35" stroke-width=".6" data-c="'+c.id+'" data-k="sc" aria-label="'+esc(c.name)+'"></circle>'});
    sv+='<text x="'+(W-rr)+'" y="'+(H-2)+'" text-anchor="end">Index score →</text><text x="'+l+'" y="'+(t-1)+'">'+esc(label)+' ↑</text></svg>';
    return {svg:sv,r:r,n:P.length};
  }
  var sp=scat('spi','Social Progress Index'),ep=scat('epi','Environmental Performance Index');
  var n1='<div class="s-scats"><figure>'+sp.svg+'<figcaption>Social Progress Index · r = '+(sp.r==null?'–':sp.r.toFixed(2))+'</figcaption></figure><figure>'+ep.svg+'<figcaption>Environmental Performance Index · r = '+(ep.r==null?'–':ep.r.toFixed(2))+'</figcaption></figure></div>'+
    '<p class="s-cap">Across '+sp.n+' countries, higher Index scores go with better social and environmental outcomes. After accounting for income (GDP per capita), the association weakens but remains positive (partial r = '+pcorr('spi').toFixed(2)+' for SPI, '+pcorr('epi').toFixed(2)+' for EPI).'+
    '<small>The Social Progress Index measures how well countries meet people’s basic needs, wellbeing and opportunity; the Environmental Performance Index measures environmental health and ecosystem vitality. The IEI measures the conditions and behaviours that make such outcomes more likely, not the outcomes themselves. Correlation does not establish cause. Each dot is a country; hover for the name.</small></p>';
  // NEW M2: stages + income
  var n2=e1+sv+'<div class="s-cchips"><span>'+esc(TT('Above income peers'))+'</span>'+['GBR','FRA','FIN'].map(chip).join('')+'</div><div class="s-cchips"><span>'+esc(TT('Below income peers'))+'</span>'+['RUS','SAU'].map(chip).join('')+'</div>'+
    '<p class="s-cap">'+(advHi===adv.length?'All '+adv.length+' Advanced countries are high-income':advHi+' of '+adv.length+' Advanced countries are high-income')+', yet high-income economies range from '+Math.min.apply(null,rows[0][1].map(function(c){return c.score}))+' to '+Math.max.apply(null,rows[0][1].map(function(c){return c.score}))+'.<small>Each dot is a country, coloured by maturity stage. Hover for the name.</small></p>';
  // NEW M3: frameworks vs practice, by actor (live indicator averages)
  var PAIRS=[['Governments','2.B.2','Social-value procurement framework','2.B.3','Outcomes-based procurement'],['Companies','1.A.2','Corporate sustainability reporting','3.E.4','Leading corporates’ social practices'],['Consumers','2.C.3','Climate influences household decisions','2.C.2','Certified sustainable consumption']];
  var n3='<div class="s-pairs"><p class="s-pkey"><span><i class="f"></i>Framework or intent</span><span><i class="p"></i>Practice</span></p>'+PAIRS.map(function(p){var a=iavg(p[1]),b=iavg(p[3]);if(a==null||b==null)return '';
    return '<div class="s-pair"><p class="s-pact">'+esc(p[0])+'</p><div class="s-bar f"><span>'+esc(p[2])+'</span><b>'+a.toFixed(0)+'</b><div><span style="width:'+a.toFixed(1)+'%"></span></div></div><div class="s-bar p"><span>'+esc(p[4])+'</span><b>'+b.toFixed(0)+'</b><div><span style="width:'+b.toFixed(1)+'%"></span></div></div></div>'}).join('')+'</div>';
  var LA=(window.IEI_DATA&&window.IEI_DATA.meta.levers)||[],lav=LA.map(function(L,k){return {n:L.name,v:avg(C.map(function(c){return c.l[k]}))}}).sort(function(a,b){return b.v-a.v});
  n3+='<p class="s-cap">Average indicator scores across '+C.length+' countries.'+(lav.length?' '+esc(lav[0].n)+' is the highest-scoring lever ('+lav[0].v.toFixed(1)+'); '+esc(lav[lav.length-1].n)+' the lowest ('+lav[lav.length-1].v.toFixed(1)+').':'')+'<small>Frameworks are the rules, policies and stated intentions; practice is what governments, companies and consumers actually do.</small></p>';
  // NEW M4: pathways (from the 2026 report draft; illustrative groupings)
  var PW=[['Policy-led','Regulation, carbon pricing and social-economy law lead; investors and outcomes buyers still to follow.',['DEU','ITA','ESP','KOR']],
    ['Catalysed private capital','Private impact investment and investor rules lead, with development finance as catalyst.',['ZAF','KEN','COL','BRA','IND']],
    ['Market-led','Capital markets and investor regulation lead; shared standards such as taxonomies and disclosure lag.',['USA','CAN','CHE','JPN']],
    ['Donor- and philanthropy-anchored','Concessional and philanthropic capital lead; domestic frameworks and public finance still to catch up.',['HND','KHM','ZMB','BFA']],
    ['Emerging integrated','Policy, public capital instruments and private markets reinforce one another.',['GBR','FRA','NLD','SWE','AUS']]];
  var n4='<div class="s-paths">'+PW.map(function(p){return '<div class="s-path"><p class="s-pname">'+esc(p[0])+'</p><p class="s-pdesc">'+esc(p[1])+'</p><div class="s-cchips">'+p[2].map(chip).join('')+'</div></div>'}).join('')+'</div>'+
    '<p class="s-cap">Common starting points identified in the 2026 report.<small>Illustrative groupings, not formal classifications; countries can show features of more than one pathway.</small></p>';
  // live numbers in the message text
  var hi=rows[0][1].map(function(c){return c.score}),LIVE={'r-spi':sp.r==null?'':sp.r.toFixed(2),'r-epi':ep.r==null?'':ep.r.toFixed(2),'max':Math.max.apply(null,C.map(function(c){return c.score})),'hi-min':Math.min.apply(null,hi),'hi-max':Math.max.apply(null,hi),'n':C.length,'c1':cnt[1],'c2':cnt[2],'c3':cnt[3],'c4':cnt[4]};
  $$('[data-live]').forEach(function(el){var v=LIVE[el.getAttribute('data-live')];if(v!==''&&v!=null)el.textContent=v});
  // report message 2: foundations vs approaches directing capital/activity to outcomes (navy vs lilac)
  var GF=[['Foundations','#0F1428',['3.B.1','1.A.2','1.C.1','2.C.1']],['Directing capital and activity to outcomes','#6478FF',['2.B.3','3.E.3','3.B.4','3.E.4']]];
  var m2='<div class="s-ibars">'+GF.map(function(g){return '<p class="s-ibh"><i style="background:'+g[1]+'"></i>'+esc(g[0])+'</p>'+g[2].map(function(id){var m=iavg(id);if(m==null)return '';
    return '<div class="s-bar" style="--c:'+g[1]+'"><span>'+esc(nm[id]||id)+'</span><b>'+m.toFixed(1)+'</b><div><span style="width:'+m.toFixed(1)+'%"></span></div></div>'}).join('')}).join('')+'</div>'+
    '<p class="s-cap">Average indicator scores across '+C.length+' countries.<small>Foundations are the transparency, accountability and integrity mechanisms that make impact credible.</small></p><p class="s-pact s-pgap">The same gap, actor by actor</p>'+n3;
  // report message 1: stages; message 3: income
  var m1=e1+'<p class="s-cap">No country has reached the Thriving stage (80 and above); the highest score is '+LIVE.max+'.<small>Each dot is a country, coloured by maturity stage. Hover for the name.</small></p>';
  var m3=sv+'<div class="s-cchips"><span>'+esc(TT('Above income peers'))+'</span>'+['GBR','FRA','FIN'].map(chip).join('')+'</div><div class="s-cchips"><span>'+esc(TT('Below income peers'))+'</span>'+['RUS','SAU'].map(chip).join('')+'</div>'+
    '<p class="s-cap">'+(advHi===adv.length?'All '+adv.length+' Advanced countries are high-income':advHi+' of '+adv.length+' Advanced countries are high-income')+', yet high-income economies range from '+LIVE['hi-min']+' to '+LIVE['hi-max']+'.<small>Each dot is a country, coloured by maturity stage. Hover for the name.</small></p>';
  var m4=n1.replace('<p class="s-cap">','<p class="s-cap">The 2026 report also finds higher scores go with stronger conditions for innovative, inclusive, sustainable and resilient growth (World Economic Forum Future of Growth Framework, 46 countries); those data are not shown here. ');
  // strategic message 2: leading-edge models
  var sd=[0,0,0,0];C.forEach(function(c){var k=Math.max(0,Math.min(3,+c.stars||0));sd[k]++});
  var star=C.filter(function(c){return +c.stars>0}).length,three=C.filter(function(c){return +c.stars>=3});
  LIVE.star=star;
  var s2='<div class="s-ibars">'+[[1,'One leading-edge model'],[2,'Two models'],[3,'All three models'],[0,'None yet']].map(function(r){var v=sd[r[0]];return '<div class="s-bar" style="--c:'+(r[0]?'#6478FF':'#C9CEE0')+'"><span>'+esc(r[1])+'</span><b>'+v+'</b><div><span style="width:'+(v/C.length*100).toFixed(1)+'%"></span></div></div>'}).join('')+'</div>'+
    (three.length?'<div class="s-cchips"><span>'+esc(TT('All three models'))+'</span>'+three.map(function(c){return chip(c.id)}).join('')+'</div>':'')+
    '<p class="s-cap">Countries by number of leading-edge impact models in place.<small>Leading-edge models are recognised with a star and do not count towards the score: outcomes-based commissioning readiness, a Just Transition country platform and an impact wholesaler.</small></p>';
  // strategic message 3: frameworks ahead of practice; emerging vs high income
  var eb=C.filter(function(c){return c.e!=null&&c.b!=null}),ebA=eb.filter(function(c){return c.e>c.b}).length;
  var HI=C.filter(function(c){return c.income==='High Income'}),EM=C.filter(function(c){return c.income!=='High Income'});
  function gav(L,id){var v=[];L.forEach(function(c){var e=(IND.vals[c.id]||{})[id];if(e&&e.s!=null)v.push(e.s)});return v.length?avg(v):null}
  var CMPI=[['3.B.1','Sustainable finance taxonomy'],['2.B.3','Outcomes-based procurement'],['3.B.2','Corporate sustainable debt issuance'],['3.A.1','Rules enabling institutional investment'],['3.E.3','Leading corporates’ environmental practices'],['3.E.4','Leading corporates’ social practices']];
  var s3='<p class="s-cap s-capt">In '+ebA+' of '+eb.length+' countries, enabling conditions (policies, rules, institutions) score higher than behaviour (what companies, investors and consumers do).</p>'+
    '<div class="s-pairs"><p class="s-pkey"><span><i class="f"></i>Emerging and developing economies</span><span><i class="p"></i>High-income economies</span></p>'+CMPI.map(function(p){var a=gav(EM,p[0]),b=gav(HI,p[0]);if(a==null||b==null)return '';
    return '<div class="s-pair"><p class="s-pact">'+esc(p[1])+'</p><div class="s-bar f"><span>Emerging and developing</span><b>'+a.toFixed(0)+'</b><div><span style="width:'+a.toFixed(1)+'%"></span></div></div><div class="s-bar p"><span>High-income</span><b>'+b.toFixed(0)+'</b><div><span style="width:'+b.toFixed(1)+'%"></span></div></div></div>'}).join('')+'</div>'+
    '<p class="s-cap">Average indicator scores by income group.<small>Emerging and developing economies are all countries outside the World Bank high-income group ('+EM.length+' countries); high-income ('+HI.length+').</small></p>';
  // strategic message 4: no Thriving yet
  var s4=e1+'<p class="s-cap">No country has reached the Thriving stage (80 and above); the highest score is '+LIVE.max+'.<small>Each dot is a country, coloured by maturity stage. Hover for the name.</small></p>';
  $$('[data-live="star"]').forEach(function(el){el.textContent=star});
  var br=function(h,t){return '<p class="s-bridge"><a href="'+h+'">'+esc(t)+' <span aria-hidden="true">→</span></a></p>'};
  var ev=[m4+br('#explore&tab=country','See social progress and environmental context in any country profile'),s2+br('#case-studies','See examples of these models in the case studies'),s3+br('#explore&tab=country','Compare enabling conditions and behaviour by country'),s4+br('#explore','See where every country stands')];
  $$('.s-find').forEach(function(f,i){var h=$('.s-evid',f);if(h)h.innerHTML='<div class="s-evid-in"><p class="s-evid-t">In the data</p>'+ev[i]+'</div>'});
  // country tooltip on the insight dots: flag, name, values; tap pins it with a link to the profile
  (function(){
    var T=function(x){return window.IEI_T?window.IEI_T(x):x},byId={};C.forEach(function(c){byId[c.id]=c});
    var tip=document.createElement('div');tip.className='s-dtip';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.appendChild(tip);
    var cur=null,pinned=false;
    function html(c,k){
      var v=k==='eb'?'<span>'+esc(T('Enabling conditions'))+' <b>'+Math.round(c.e)+'</b></span><span>'+esc(T('Behaviour'))+' <b>'+Math.round(c.b)+'</b></span>'
                    :'<span>'+esc(T('Score'))+' <b>'+c.score+'</b></span><span>'+esc(T(TN[tier(c.score)]))+'</span><span>'+esc(T(c.income||''))+'</span>';
      return '<div class="s-dtip-h"><img src="../Impact Economy Index_files/flags/4x3/'+c.flag+'.svg" alt=""><strong>'+esc(T(c.name))+'</strong></div><div class="s-dtip-v">'+v+'</div>'+
        '<a class="s-dtip-a" href="#country='+c.id+'" data-dtip-go="'+c.id+'">'+esc(T('Open full country profile ↗').replace(/\s*↗$/,''))+' →</a>';
    }
    function show(el){
      var c=byId[el.getAttribute('data-c')];if(!c)return;
      if(cur&&cur!==el)cur.classList.remove('on');cur=el;el.classList.add('on');
      tip.innerHTML=html(c,el.getAttribute('data-k'));tip.hidden=false;tip.classList.toggle('pin',pinned);
      var r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight,x=r.left+r.width/2-w/2,y=r.top-h-10;
      x=Math.max(8,Math.min(x,document.documentElement.clientWidth-w-8));if(y<8)y=r.bottom+10;
      tip.style.left=(x+window.scrollX)+'px';tip.style.top=(y+window.scrollY)+'px';
    }
    function hide(){if(pinned)return;tip.hidden=true;if(cur)cur.classList.remove('on');cur=null}
    document.addEventListener('mouseover',function(e){var d=e.target.closest&&e.target.closest('.s-find .s-dot');if(d&&!pinned)show(d)});
    document.addEventListener('mouseout',function(e){var d=e.target.closest&&e.target.closest('.s-find .s-dot');if(d)hide()});
    document.addEventListener('focusin',function(e){var d=e.target.closest&&e.target.closest('.s-find .s-dot');if(d){pinned=false;show(d)}});
    document.addEventListener('focusout',function(e){var d=e.target.closest&&e.target.closest('.s-find .s-dot');if(d&&!pinned)hide()});
    document.addEventListener('click',function(e){
      var go=e.target.closest&&e.target.closest('[data-dtip-go]');
      if(go){e.preventDefault();pinned=false;hide();tip.hidden=true;location.hash='country='+go.getAttribute('data-dtip-go');var t=document.getElementById('country')||document.getElementById('ieiCountry');if(t)t.scrollIntoView({behavior:'smooth'});return}
      var d=e.target.closest&&e.target.closest('.s-find .s-dot');
      if(d){pinned=true;show(d);return}
      if(pinned&&!(e.target.closest&&e.target.closest('.s-dtip'))){pinned=false;hide()}
    });
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!tip.hidden){pinned=false;hide()}});
    window.addEventListener('scroll',function(){if(!tip.hidden&&!pinned)hide()},{passive:true});
  })();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',insights);else insights();

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
  function route(){var f=location.hash.replace(/^#/,'').split('&')[0];return f.indexOf('=')<0?f:''}
  function get(){var h=location.hash.replace(/^#/,''),o={};if(h.indexOf('=')<0)return o;h.split('&').forEach(function(p){var i=p.indexOf('=');if(i>0)o[decodeURIComponent(p.slice(0,i))]=decodeURIComponent(p.slice(i+1))});return o}
  function str(o){var k=['country','cmp','vs','open','map','lang'];return Object.keys(o).filter(function(x){return o[x]!=null&&o[x]!==''}).sort(function(a,b){return k.indexOf(a)-k.indexOf(b)}).map(function(x){return encodeURIComponent(x)+'='+encodeURIComponent(o[x]).replace(/%2C/g,',')}).join('&')}
  function set(patch){var o=get();for(var k in patch)o[k]=patch[k];var s=str(o),r=route();if(r)s=r+(s?'&'+s:'');try{history.replaceState(null,'',location.pathname+location.search+(s?'#'+s:''))}catch(e){}}
  function url(){return location.href.split('#')[0]+(location.hash||'')}
  return {get:get,set:set,url:url,route:route};
})();
/* ---- interactive framework pyramid ---- */
(function(){
  function init(){
    var root=document.querySelector('.s-pyr');if(!root||root.__init)return;root.__init=1;
    var D=window.IEI_DATA,M=D&&D.meta,C=D&&D.countries||[],I=window.IEI_IND||{inds:[],vals:{}};if(!M)return;
    var T=function(x){return window.IEI_T?window.IEI_T(x):x};
    var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
    var LC=['#3DCC7D','#77DAD9','#F094B5','#FFBD87'],LOGIC=[['Better information','Long-term risks, costs and opportunities become visible.'],['Demand signals impact','Governments, businesses and consumers buy what creates value.'],['Capital follows','Funders make that demand investable and finance it.'],['Coordination accelerates','Institutions cut barriers, align incentives and set standards.']];
    var DID=M.driverIds,mean=function(a){a=a.filter(function(v){return v!=null&&!isNaN(v)});return a.length?a.reduce(function(s,v){return s+v},0)/a.length:null};
    var dAvg={};DID.forEach(function(id,i){dAvg[id]=mean(C.map(function(c){return c.d[i]}))});
    var lAvg=M.levers.map(function(L){return mean(C.map(function(c){return mean(L.drivers.map(function(d){return c.d[DID.indexOf(d)]}))}))});
    var iAvg=function(id){return mean(Object.keys(I.vals).map(function(k){var e=I.vals[k][id];return e&&e.s}))};
    var lev=function(id){return +String(id).charAt(0)-1};
    var hint=T('Hover a code to see what it measures; select it to see it on the map.');
    function cap(){return '<p class="s-pyr-cap" aria-live="polite">'+esc(hint)+'</p>'}
    var X={};
    X[1]='<blockquote class="s-pyr-q">'+esc(T('An impact economy is an economic system where all participants put long-term economic, social and environmental value at the heart of decision making.'))+'</blockquote>';
    X[2]='';
    M.levers.forEach(function(L,k){var tb=document.getElementById('lever-tab-'+k);if(tb&&!tb.querySelector('.lever-avg')&&lAvg[k]!=null){var a=document.createElement('span');a.className='lever-avg';a.innerHTML='<span>'+esc(T('Global average'))+'</span><strong>'+lAvg[k].toFixed(1)+'</strong>';var ar=tb.querySelector('.lever-arrow');tb.insertBefore(a,ar)}});
    X[3]='<div class="s-pyr-drv">'+M.levers.map(function(L,k){return '<div class="g" style="--c:'+LC[k]+'"><span class="gl">'+esc(T(L.name))+'</span><div>'+L.drivers.map(function(d){var a=dAvg[d];return '<button type="button" class="s-pyr-chip" data-map="d'+d+'" data-cap="'+esc(d+' · '+T(M.driverLabels[d]))+(a==null?'':' · '+esc(T('Global average'))+' '+a.toFixed(1))+'"><span>'+d+'</span><i style="width:'+(a||0).toFixed(0)+'%"></i></button>'}).join('')+'</div></div>'}).join('')+'</div>'+cap();
    var byD={};I.inds.forEach(function(m){(byD[m.driver]=byD[m.driver]||[]).push(m)});
    var TY={E:'Enabling condition',B:'Behaviour',L:'Leading-edge impact model'};
    X[4]='<div class="s-pyr-ind">'+DID.map(function(d){var k=lev(d);return '<div class="col" style="--c:'+LC[k]+'"><span class="cd">'+d+'</span><div class="dots">'+(byD[d]||[]).map(function(m){var a=m.star?null:iAvg(m.id),t=T(TY[m.type]||'')+(m.key?' · '+T('Key impact model'):'');
      return '<button type="button" class="s-pyr-dot t'+(m.star?'L':m.type)+(m.key?' k':'')+'"'+(m.star?'':' data-map="i'+m.id+'"')+' data-cap="'+esc(m.id+' · '+T(m.name)+' · '+t)+(a==null?'':' · '+esc(T('Global average'))+' '+a.toFixed(1))+'" aria-label="'+esc(m.id+' '+T(m.name))+'">'+(m.star?'★':'')+'</button>'}).join('')+'</div></div>'}).join('')+'</div>'+
      '<p class="s-pyr-leg"><span><i class="tE"></i>'+esc(T('Enabling condition'))+'</span><span><i class="tB"></i>'+esc(T('Behaviour'))+'</span><span><i class="tE k"></i>'+esc(T('Key impact model'))+'</span><span><i class="tL">★</i>'+esc(T('Leading-edge impact model'))+'</span></p>'+cap();
    var rows=[].slice.call(root.querySelectorAll('.s-pyr-row')),cur=0,det=root.querySelector('.s-pyr-detail');
    function open(n){
      if(cur===n)return;cur=n;
      rows.forEach(function(r){var on=+r.getAttribute('data-l')===n;r.classList.toggle('on',on);r.querySelector('.s-pyr-shape').setAttribute('aria-expanded',on?'true':'false')});
      root.classList.add('has-on');det.setAttribute('data-l',n);
      var deck=document.getElementById('leverDeck'),hold=document.getElementById('leverHold');
      if(!hold){hold=document.createElement('div');hold.id='leverHold';hold.hidden=true;root.parentNode.parentNode.appendChild(hold)}
      if(deck&&det.contains(deck))hold.appendChild(deck);if(deck)deck.hidden=(n!==2);
      var dd=rows[n-1].querySelector('.s-pyr-txt>p');det.innerHTML='<div class="s-pyr-dx"><p class="s-pyr-dd">'+(dd?dd.innerHTML:'')+'</p>'+(n===2?'<div class="s-pyr-deckslot"></div>':X[n])+'</div>';
      if(n===2&&deck)det.querySelector('.s-pyr-deckslot').appendChild(deck);
    }
    window.IEI_openLevers=function(){cur=0;open(2)};
    rows.forEach(function(r){var n=+r.getAttribute('data-l');
      r.querySelector('.s-pyr-shape').addEventListener('click',function(){open(n)});
      r.querySelector('.s-pyr-txt>p').addEventListener('click',function(){open(n)});
      r.querySelector('.s-pyr-shape').addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(n)}});
    });
    root.addEventListener('mouseover',function(e){var b=e.target.closest('[data-cap]');if(!b)return;var c=root.querySelector('.s-pyr-detail .s-pyr-cap');if(c){c.textContent=b.getAttribute('data-cap');c.classList.add('live')}});
    root.addEventListener('focusin',function(e){var b=e.target.closest('[data-cap]');if(!b)return;var c=root.querySelector('.s-pyr-detail .s-pyr-cap');if(c){c.textContent=b.getAttribute('data-cap');c.classList.add('live')}});
    root.addEventListener('mouseout',function(e){var b=e.target.closest('[data-cap]');if(!b||(e.relatedTarget&&b.contains(e.relatedTarget)))return;var c=root.querySelector('.s-pyr-detail .s-pyr-cap');if(c){c.textContent=hint;c.classList.remove('live')}});
    root.addEventListener('click',function(e){
      var mp=e.target.closest('[data-map]');if(mp){var sel=document.querySelector('.ix-drvsel');if(sel){sel.value=mp.getAttribute('data-map');sel.dispatchEvent(new Event('change',{bubbles:true}));if(window.IEI_GO)window.IEI_GO('explore',{tab:'map'});else{var ex=document.getElementById('explore');if(ex)ex.scrollIntoView({behavior:'smooth',block:'start'})}}}
    });
    open(2);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* ---- generic "show more" toggles: detail stays one click away ---- */
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('.s-more[aria-controls]');if(!b)return;
  var t=document.getElementById(b.getAttribute('aria-controls'));if(!t)return;
  var open=t.hidden;t.hidden=!open;b.setAttribute('aria-expanded',open);
  var sp=b.querySelector('span'),T=window.IEI_T||function(x){return x};
  if(sp){if(!b.dataset.l0)b.dataset.l0=sp.textContent;sp.textContent=open?(b.classList.contains('s-evbtn')?T('Hide the data'):T('Hide the country list')):b.dataset.l0;}
});
