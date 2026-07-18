(function(){
"use strict";
var APP="Kerbit";
var TAGLINE="Kerb it. Claim it. Or the truck takes it.";
var CATS=[["furniture","Furniture","🪑"],["electronics","Electronics","🔌"],["clothing","Clothing","👕"],["books","Books","📚"],["kitchen","Kitchen","🍳"],["toys","Toys","🧸"],["garden","Garden","🪴"],["other","Other","📦"]];
var PLATFORMS=["Marketplace","Gumtree","Freecycle","Olio"];
var FLAG_REASONS=["Not relevant / inappropriate","Not as described","Suspected scam","Unsafe item","Already gone / duplicate","Other"];
var WD=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var SHARE_URLS={Marketplace:"https://www.facebook.com/marketplace/create/item",Gumtree:"https://www.gumtree.com.au/p-post-ad.html",Freecycle:"https://www.freecycle.org/",Olio:"https://olioapp.com/"};
var PSEARCH_URLS={Marketplace:"https://www.facebook.com/marketplace/search/?query=",Gumtree:"https://www.gumtree.com.au/s-search.html?search=","eBay AU":"https://www.ebay.com.au/sch/i.html?_nkw="};

var me=null, items=[], notifs=[], receipts=[], unread=0, tab="feed", authMode="login", dbMode="demo", feedScope="suburb", searchQ="", catFilter="all";
var googleClientId=null, ebayEnabled=false, ebayResults=null, ebayLoading=false, leaderboard=null;
var draft={category:"other",platforms:["Marketplace","Freecycle"],media:[],priced:false};
var modalItemId=null, modalMiniMode=null, modalMiniId=null;
var io=null;

function esc(s){return s==null?"":String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function toast(msg,err){var el=document.getElementById("toast");el.textContent=msg;el.classList.toggle("err",!!err);el.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(function(){el.classList.remove("show");},3800);}
function fmtD(ts){return new Date(ts).toLocaleDateString(undefined,{month:"short",day:"numeric"});}
function fmtDT(ts){var d=new Date(ts);return fmtD(ts)+" "+d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});}
function daysTo(ts){return Math.ceil((ts-Date.now())/86400000);}
function money(n){return "$"+(Math.round(n*100)/100).toFixed(2);}
function theme(){return localStorage.getItem("kerbit-theme")||"light";}
function applyTheme(){document.documentElement.setAttribute("data-theme",theme());}
function btn(act,id,label,variant){return '<button class="pill'+(variant?" "+variant:"")+'" data-act="'+act+'" data-id="'+id+'">'+label+'</button>';}

function api(path,method,body){
  return fetch("/api"+path,{method:method||"GET",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:body?JSON.stringify(body):undefined})
  .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||"Request failed");return j;});});
}

/* ---------- boot ---------- */
function boot(){
  applyTheme();
  bindModalOnce();
  api("/config").then(function(j){googleClientId=j.googleClientId||null;ebayEnabled=!!j.ebayEnabled;if(!me)render();}).catch(function(){});
  api("/me").then(function(j){me=j.me;dbMode=j.dbMode;refresh();startPolling();}).catch(function(){render();});
}
function refresh(){
  return Promise.all([api("/items"),api("/notifications"),api("/receipts").catch(function(){return {receipts:[]};})]).then(function(r){
    items=r[0].items;notifs=r[1].notifications;unread=r[1].unread;receipts=r[2].receipts||[];render();
  }).catch(function(e){toast(e.message,true);render();});
}
var pollTimer=null;
function startPolling(){
  clearInterval(pollTimer);
  pollTimer=setInterval(function(){
    if(!me)return;
    api("/notifications").then(function(j){
      if(j.unread>unread)toast("🔔 "+j.notifications[0].text);
      notifs=j.notifications;unread=j.unread;paintBadge();
    }).catch(function(){});
  },25000);
}
function paintBadge(){document.querySelectorAll(".js-badge").forEach(function(b){b.style.display=unread?"":"none";b.textContent=unread;});}

/* ---------- scroll-reveal ---------- */
function initScrollAnim(){
  if(io)io.disconnect();
  io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}});
  },{threshold:.06,rootMargin:"0px 0px -30px 0px"});
  document.querySelectorAll(".reveal").forEach(function(el){io.observe(el);});
}

/* ---------- location ---------- */
function locate(inputId,btnEl){
  if(!navigator.geolocation){toast("Location isn't available in this browser — just type your suburb.",true);return;}
  var orig=btnEl.innerHTML;btnEl.disabled=true;btnEl.innerHTML="📍 Locating…";
  function reset(){btnEl.disabled=false;btnEl.innerHTML=orig;}
  navigator.geolocation.getCurrentPosition(function(pos){
    var lat=pos.coords.latitude,lon=pos.coords.longitude;
    fetch("https://api.bigdatacloud.net/data/reverse-geocode-client?latitude="+lat+"&longitude="+lon+"&localityLanguage=en")
    .then(function(r){return r.json();})
    .then(function(j){
      var name=j.locality||j.city||j.principalSubdivision||"";
      var el=document.getElementById(inputId);
      if(name&&el){el.value=name;toast("Set to "+name+" — you can change it any time.");}
      else toast("Couldn't work out your suburb — type it in manually.",true);
    }).catch(function(){toast("Couldn't reach the location service — type your suburb manually.",true);})
    .then(reset);
  },function(err){
    reset();
    toast(err.code===1?"Location permission denied — just type your suburb below.":"Couldn't get your location — type your suburb below.",true);
  },{timeout:8000,maximumAge:300000});
}

/* ---------- auth ---------- */
function googleIcon(){return '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3c-7.5 0-14 4.2-17.7 10.7z"/><path fill="#4CAF50" d="M24 45c5.4 0 10.3-1.8 14.1-5l-6.5-5.5c-2.1 1.5-4.8 2.5-7.6 2.5-5.3 0-9.8-3.4-11.4-8.1l-6.6 5.1C9.9 40.4 16.4 45 24 45z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.5 5.5C41.6 35.5 45 30.2 45 24c0-1.2-.1-2.4-.4-3.5z"/></svg>';}
function appleIcon(){return '<svg width="16" height="16" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 8 184.8 8 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-65.7-90-65.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>';}
function oauthButtonsHtml(){
  var google=googleClientId?'<div id="gsiBtn"></div>':'<button type="button" class="oauth-btn" data-act="google-soon">'+googleIcon()+'<span>Continue with Google</span></button>';
  var apple='<button type="button" class="oauth-btn apple" data-act="apple-soon">'+appleIcon()+'<span>Continue with Apple</span></button>';
  return '<div class="oauthstack">'+google+apple+'</div>';
}
function renderGoogleButton(attempts){
  if(!googleClientId)return;
  var big=document.getElementById("gsiBtn"),small=document.getElementById("gsiBtnSmall");
  if(!big&&!small)return;
  if(!(window.google&&google.accounts&&google.accounts.id)){
    if((attempts||0)<10)setTimeout(function(){renderGoogleButton((attempts||0)+1);},300);
    return;
  }
  google.accounts.id.initialize({client_id:googleClientId,callback:onGoogleCredential});
  if(big)google.accounts.id.renderButton(big,{theme:"outline",size:"large",shape:"pill",width:Math.min((big.parentElement||{}).offsetWidth||320,400)});
  if(small)google.accounts.id.renderButton(small,{theme:"outline",size:"medium",shape:"pill",text:"continue_with"});
}
function onGoogleCredential(response){
  api("/oauth/google","POST",{credential:response.credential}).then(function(j){
    me=j.me;
    toast(j.isNew?"Welcome! You appear as "+me.handle:"Welcome back, "+me.handle);
    refresh();startPolling();
  }).catch(function(err){toast(err.message,true);});
}
function viewAuth(){
  return authMode==="login"?viewAuthLogin():viewAuthSignup();
}
function viewAuthSignup(){
  return '<div class="authsplit"><div class="splitcard">'+
  '<div class="promo reveal">'+
    '<img src="/logo.svg" alt="">'+
    '<h1>'+APP+'</h1>'+
    '<p class="tag">'+TAGLINE+'</p>'+
    '<ul>'+
      '<li><span class="ck">✓</span>Post an item in under a minute — free, forever.</li>'+
      '<li><span class="ck">✓</span>Neighbours only ever see an anonymous handle like <b>Kerb-Wombat-482</b> — never your name or number.</li>'+
      '<li><span class="ck">✓</span>Nobody claims it? It\'s auto-booked for your council truck day, so nothing sits on the kerb.</li>'+
    '</ul>'+
  '</div>'+
  '<div class="formside reveal">'+
    '<h2>Create your account</h2>'+
    '<p class="sub">Takes about 30 seconds.</p>'+
    oauthButtonsHtml()+
    '<div class="divider">or sign up with email</div>'+
    '<form id="authForm">'+
    '<div class="field"><label for="a-email">Email</label><input id="a-email" type="email" required autocomplete="email"></div>'+
    '<div class="field"><label for="a-pass">Password</label><input id="a-pass" type="password" required minlength="6" autocomplete="new-password"></div>'+
    '<div class="field"><label for="a-suburb">Suburb</label><div class="field-inline"><input id="a-suburb" placeholder="e.g. Wentworthville" maxlength="40"><button type="button" class="locbtn" data-act="locate" data-target="a-suburb">📍 Locate</button></div><p class="hint">Or just type it — change it any time in Profile.</p></div>'+
    '<div class="field"><label for="a-day">Council truck day</label><select id="a-day">'+WD.map(function(w,i){return '<option value="'+i+'"'+(i===3?" selected":"")+'>'+w+'</option>';}).join("")+'</select></div>'+
    '<button type="submit" class="pill pri block">Create account</button>'+
    '</form>'+
    '<div class="switch">Already have an account? <a data-act="switch-auth">Log in</a></div>'+
    '<div class="legal" style="margin-top:16px"><a href="/privacy" target="_blank">Privacy</a> · <a href="/terms" target="_blank">Terms</a> · Works Australia-wide</div>'+
  '</div>'+
  '</div></div>';
}
function viewAuthLogin(){
  var googleLink=googleClientId?'<div id="gsiBtnSmall" style="display:flex;justify-content:center"></div>':'<button type="button" class="oauth-small" data-act="google-soon">'+googleIcon()+'<span>Continue with Google</span></button>';
  return '<div class="loginwrap">'+
  '<div class="loginhero reveal">'+
    '<img src="/logo.svg" alt="'+APP+' logo">'+
    '<h1>Welcome back</h1>'+
    '<p>'+TAGLINE+'</p>'+
  '</div>'+
  '<div class="authcard reveal">'+
  '<form id="authForm">'+
  '<div class="field"><label for="a-email">Email</label><input id="a-email" type="email" required autocomplete="email"></div>'+
  '<div class="field"><label for="a-pass">Password</label><input id="a-pass" type="password" required minlength="6" autocomplete="current-password"></div>'+
  '<button type="submit" class="pill pri block">Log in</button>'+
  '</form>'+
  '<div class="altauth">'+googleLink+'</div>'+
  '<div class="switch">New here? <a data-act="switch-auth">Create an account</a></div>'+
  '</div>'+
  '<div class="legal" style="margin-top:18px"><a href="/privacy" target="_blank">Privacy</a> · <a href="/terms" target="_blank">Terms</a> · Works Australia-wide</div>'+
  '</div>';
}

/* ---------- item helpers ---------- */
function stampFor(it){
  if(it.observation)return['Observation','s-obs'];
  switch(it.status){case"available":return[it.price>0?"For sale":"Free","s-av"];case"claimed":return["Claimed","s-cl"];case"booked_for_truck":return["Truck day","s-tr"];case"collected":return["Handed off","s-done"];case"collected_by_truck":return["Collected","s-done"];}
  return[it.status,"s-av"];
}
function mediaThumb(it){
  if(it.media&&it.media.length){var m=it.media[0];return m.type==="video"?'<video src="'+m.data+'" muted playsinline></video>':'<img src="'+m.data+'" alt="">';}
  var c=CATS.filter(function(x){return x[0]===it.category;})[0];
  return '<div class="emoji">'+(c?c[2]:"📦")+'</div>';
}
function stubFor(it){
  if(it.observation)return 'Hidden while '+it.flags+' flag'+(it.flags>1?"s are":" is")+' reviewed';
  if(it.status==="available"){var d=Math.max(daysTo(it.pickupAt),0);return 'Unclaimed after <span class="num">'+d+'d</span> → auto-booked for the truck';}
  if(it.status==="claimed"&&it.claim)return esc(it.claim.byHandle)+' has <span class="num">'+Math.max(daysTo(it.claim.expiresAt),0)+'d</span> to collect — or it goes back up';
  if(it.status==="booked_for_truck")return 'Nobody claimed it — booked for the council collection';
  return 'Posted '+fmtD(it.postedAt);
}
function primaryAction(it){
  if(it.mine){
    if(!it.observation&&it.status==="available")return btn("remove",it.id,"Remove","dgr sm");
    if(it.status==="claimed")return btn("handoff",it.id,"Confirm handoff","pri sm");
    if(!it.observation&&it.status==="booked_for_truck")return btn("truckdone",it.id,"Truck collected","pri sm");
    if((it.status==="collected"||it.status==="collected_by_truck")&&!it.rating)return btn("rate",it.id,"Rate","sm");
    if(it.rating)return '<span class="hint" style="margin:0">'+("★".repeat(it.rating))+'</span>';
    return "";
  }
  if(!it.observation&&it.status==="available")return btn("claim",it.id,(it.price>0?money(it.price):"Take it"),"pri sm");
  if((it.status==="collected"||it.status==="collected_by_truck")&&it.claim&&it.claim.byMe&&!it.rating)return btn("rate",it.id,"Rate","sm");
  return "";
}
function allActions(it){
  var acts="";
  if(it.mine){
    if(!it.observation&&it.status==="available")acts+=btn("remove",it.id,"Remove","dgr");
    else if(it.status==="claimed")acts+=btn("handoff",it.id,"Confirm handed off","pri");
    else if(!it.observation&&it.status==="booked_for_truck")acts+=btn("truckdone",it.id,"Truck collected it","pri");
    else if((it.status==="collected"||it.status==="collected_by_truck")&&!it.rating)acts+=btn("rate",it.id,"Rate handoff","");
    if(it.rating)acts+='<span class="hint" style="align-self:center;margin:0">Rated '+("★".repeat(it.rating))+'</span>';
  }else{
    if(!it.observation&&it.status==="available")acts+=btn("claim",it.id,(it.price>0?"Claim · "+money(it.price):"I'll take it"),"pri");
    if((it.status==="collected"||it.status==="collected_by_truck")&&it.claim&&it.claim.byMe&&!it.rating)acts+=btn("rate",it.id,"Rate handoff","");
    if(it.status!=="collected"&&it.status!=="collected_by_truck"&&!it.flaggedByMe)acts+=btn("flag",it.id,"⚑ Flag","gh");
  }
  return acts;
}
function shareBarHtml(it){
  if(!(it.mine&&it.status==="available"&&it.platforms.length))return "";
  return '<div class="sharebar"><div class="t">Spread it further</div><div class="sharebtns">'+
    it.platforms.map(function(p){return '<button class="pill gh sm" data-act="share" data-id="'+it.id+'" data-pf="'+p+'">'+p+' ↗</button>';}).join("")+
    '</div><p class="hint">Copies a ready-made listing + opens the platform\'s posting page. With an API token connected in Profile, this is fully automatic.</p></div>';
}

/* ---------- card (grid tile) ---------- */
function card(it,idx){
  var st=stampFor(it);
  var isNew=!it.observation&&it.status==="available"&&(Date.now()-it.postedAt)<86400000;
  var delay=((idx||0)%10)*45;
  return '<article class="card reveal'+(it.observation?" obs":"")+'" style="transition-delay:'+delay+'ms">'+
    '<div class="cmedia" data-act="open" data-id="'+it.id+'">'+
      mediaThumb(it)+
      '<span class="stamp '+st[1]+'">'+esc(st[0])+'</span>'+
      (isNew?'<span class="newchip">New</span>':"")+
      '<span class="pricebadge'+(it.price>0?"":" free")+'">'+(it.price>0?money(it.price):"Free")+'</span>'+
    '</div>'+
    '<div class="cbody" data-act="open" data-id="'+it.id+'">'+
      '<p class="ctt">'+esc(it.title)+'</p>'+
      '<div class="cm"><span>'+esc(it.poster.handle)+(it.poster.trusted?' <span class="trustchip">✓</span>':'')+'</span><span>·</span><span>'+esc(it.poster.suburb)+'</span></div>'+
    '</div>'+
    '<div class="cfoot"><span class="stubtxt">'+stubFor(it)+'</span>'+primaryAction(it)+
    '<button class="iconlink" data-act="open" data-id="'+it.id+'" title="Details">ℹ</button></div>'+
  '</article>';
}

/* ---------- item detail modal ---------- */
function bindModalOnce(){
  var ov=document.getElementById("modalOverlay");
  ov.addEventListener("click",function(e){
    if(e.target===ov){closeModalAll();return;}
    var a=e.target.closest("[data-act]");
    if(a){act(a.dataset.act,a.dataset.id,a);}
  });
  document.addEventListener("keydown",function(e){if(e.key==="Escape")closeModalAll();});
}
function closeModalAll(){modalItemId=null;modalMiniMode=null;modalMiniId=null;renderModal();}
function renderModal(){
  var ov=document.getElementById("modalOverlay");
  if(!modalItemId&&!modalMiniMode){ov.classList.remove("show");ov.innerHTML="";return;}
  var html=modalMiniMode==="flag"?flagModalHtml():modalMiniMode==="rate"?rateModalHtml():itemModalHtml(modalItemId);
  ov.innerHTML='<div class="modal">'+html+'</div>';
  ov.classList.add("show");
}
function itemModalHtml(id){
  var it=items.filter(function(x){return x.id===id;})[0];
  if(!it)return '<button class="modal-close" data-act="close-modal">×</button><div style="padding:60px 20px;text-align:center" class="hint">This tag is no longer available.</div>';
  var st=stampFor(it);
  var mediaHtml;
  if(it.media&&it.media.length){
    mediaHtml='<div class="gallery-scroll">'+it.media.map(function(m){return m.type==="video"?'<span><video src="'+m.data+'" controls muted playsinline></video></span>':'<span><img src="'+m.data+'" alt=""></span>';}).join("")+'</div>';
  }else{
    var c=CATS.filter(function(x){return x[0]===it.category;})[0];
    mediaHtml='<div class="emoji">'+(c?c[2]:"📦")+'</div>';
  }
  var trackHtml='<div class="track"><p class="tkt">Tracking</p>'+(it.history||[]).map(function(h){
    return '<div class="tki'+(h.alert?" alert":"")+'">'+esc(h.label)+'<span class="when">'+fmtDT(h.at)+'</span></div>';
  }).join("")+'</div>';
  return '<button class="modal-close" data-act="close-modal">×</button>'+
    '<div class="modal-hero"><span class="stamp '+st[1]+'" style="top:14px;right:14px">'+esc(st[0])+'</span>'+mediaHtml+'</div>'+
    '<div class="modal-body">'+
    '<span class="modal-price'+(it.price>0?"":" free")+'">'+(it.price>0?money(it.price)+" · cash-free at handoff":"Free")+'</span>'+
    '<h3 class="modal-title">'+esc(it.title)+'</h3>'+
    '<div class="modal-meta"><span>'+esc(it.poster.handle)+(it.poster.trusted?' <span class="trustchip">✓ trusted</span>':'')+'</span><span>·</span><span>📍 '+esc(it.poster.suburb)+'</span><span>·</span><span>'+fmtD(it.postedAt)+'</span></div>'+
    (it.desc?'<p class="modal-desc">'+esc(it.desc)+'</p>':'')+
    (it.platforms.length?'<div class="chips">'+it.platforms.map(function(p){return '<span class="chip">'+esc(p)+'</span>';}).join("")+'</div>':"")+
    '<div class="modal-stub">'+stubFor(it)+'</div>'+
    '<div class="modal-acts">'+allActions(it)+'</div>'+
    shareBarHtml(it)+trackHtml+
    '</div>';
}
function flagModalHtml(){
  return '<button class="modal-close" data-act="close-modal">×</button>'+
  '<div class="modal-body"><h3 class="modal-title">Why are you flagging this?</h3>'+
  '<p class="hint">Two flags move a tag straight to observation, hidden from everyone\'s feed.</p>'+
  '<div class="optlist">'+FLAG_REASONS.map(function(r){return '<button data-act="flag-reason" data-reason="'+esc(r)+'">'+esc(r)+'</button>';}).join("")+'</div>'+
  '</div>';
}
function rateModalHtml(){
  return '<button class="modal-close" data-act="close-modal">×</button>'+
  '<div class="modal-body" style="text-align:center"><h3 class="modal-title">Rate this handoff</h3>'+
  '<p class="hint">Tap a star.</p>'+
  '<div class="starpick">'+[1,2,3,4,5].map(function(n){return '<span data-act="rate-star" data-n="'+n+'">★</span>';}).join("")+'</div>'+
  '</div>';
}

/* ---------- feed ---------- */
function feedItems(){
  var act=items.filter(function(i){return !i.mine&&(i.status==="available"||i.status==="claimed"||i.status==="booked_for_truck")&&!i.observation;});
  if(feedScope==="suburb")act=act.filter(function(i){return (i.poster.suburb||"").toLowerCase()===(me.suburb||"").toLowerCase();});
  if(catFilter!=="all")act=act.filter(function(i){return i.category===catFilter;});
  if(searchQ){var q=searchQ.toLowerCase();
    act=act.filter(function(i){return (i.title+" "+(i.desc||"")+" "+i.category+" "+(i.poster.suburb||"")).toLowerCase().indexOf(q)>-1;});}
  return act;
}
function feedListHtml(){
  var act=feedItems();
  return act.length?act.map(function(it,i){return card(it,i);}).join(""):'<div class="empty reveal"><span class="big">🏷️</span>'+(searchQ?'Nothing matches "'+esc(searchQ)+'" on Kerbit — try the platform search below.':(feedScope==="suburb"?'No tags in '+esc(me.suburb)+' right now — try 🇦🇺 All Australia, or share the app link!':'No tags right now — share the app link so people can post!'))+'</div>';
}
function viewFeed(){
  var demo=dbMode==="demo"?'<div class="note demo-warn reveal">⚠️ Pilot demo storage: data may occasionally reset until the free database is attached (LAUNCH-KIT step 1).</div>':"";
  var search='<div class="searchwrap reveal"><span class="sic">🔍</span><input id="f-search" placeholder="Search bookshelf, couch, toys…" value="'+esc(searchQ)+'" autocomplete="off"></div>';
  var loc='<div class="locrow reveal">'+
    '<button class="locchip'+(feedScope==="suburb"?" on":"")+'" data-act="scope" data-id="suburb">📍 '+esc(me.suburb)+'</button>'+
    '<button class="locchip'+(feedScope==="all"?" on":"")+'" data-act="scope" data-id="all">🇦🇺 All Australia</button>'+
  '</div>';
  var catrail='<div class="catrail reveal">'+
    '<button class="cattile'+(catFilter==="all"?" on":"")+'" data-act="catf" data-id="all"><span class="circ">🏷️</span><span class="lbl">All</span></button>'+
    CATS.map(function(c){return '<button class="cattile'+(catFilter===c[0]?" on":"")+'" data-act="catf" data-id="'+c[0]+'"><span class="circ">'+c[2]+'</span><span class="lbl">'+c[1]+'</span></button>';}).join("")+
  '</div>';
  var psearch='<div class="psearch reveal">Can\'t find it on '+APP+'? Search the same thing everywhere:'+
    '<div class="pbtns">'+Object.keys(PSEARCH_URLS).map(function(p){
      return p==="eBay AU"
        ?'<button class="pill gh sm" data-act="ebaysearch">eBay AU 🔎</button>'
        :'<button class="pill gh sm" data-act="psearch" data-pf="'+p+'">'+p+' ↗</button>';
    }).join("")+'</div></div>';
  return demo+'<h2 class="st reveal">Nearby tags</h2>'+search+loc+catrail+'<div id="feedList" class="itemgrid">'+feedListHtml()+'</div>'+psearch+ebayPanelHtml();
}
function ebayPanelHtml(){
  if(ebayLoading)return '<div class="psearch reveal"><p class="hint" style="margin:0">🔎 Searching eBay AU…</p></div>';
  if(!ebayResults)return "";
  if(ebayResults.error)return '<div class="psearch reveal"><p class="hint" style="margin:0;color:var(--red)">'+esc(ebayResults.error)+'</p></div>';
  if(!ebayResults.items.length)return '<div class="psearch reveal"><p class="hint" style="margin:0">No eBay AU results for “'+esc(ebayResults.q)+'”.</p></div>';
  return '<div class="psearch reveal"><div style="font-weight:700;margin-bottom:10px">🛒 Also on eBay AU for “'+esc(ebayResults.q)+'”</div>'+
    '<div class="ebayrow">'+ebayResults.items.map(function(it){
      return '<a class="ebaycard" href="'+esc(it.url)+'" target="_blank" rel="noopener">'+
        (it.image?'<img src="'+esc(it.image)+'" alt="">':'<div class="ebayph">🛒</div>')+
        '<div class="et">'+esc(it.title)+'</div>'+
        (it.price?'<div class="ep">'+esc(it.price)+'</div>':'')+
      '</a>';
    }).join("")+'</div></div>';
}
function viewPost(){
  return '<h2 class="st reveal">Post something</h2><form id="postForm" novalidate class="reveal">'+
  '<div class="field"><label for="f-title">What is it?</label><input id="f-title" maxlength="70" required placeholder="e.g. Two-seater couch, minor wear" value="'+esc(draft.title||"")+'"></div>'+
  '<div class="field"><label>Photos &amp; video (up to 4)</label><input type="file" id="f-media" accept="image/*,video/*" multiple style="font-size:12px">'+
  '<div class="mediarow" id="mediaRow">'+draft.media.map(function(m,i){return '<span class="mth">'+(m.type==="video"?'<video src="'+m.data+'" muted></video>':'<img src="'+m.data+'">')+'<button type="button" class="x" data-act="delmedia" data-id="'+i+'">×</button></span>';}).join("")+'</div>'+
  '<p class="hint">Photos are resized on your device. Videos up to ~2.5MB for the pilot.</p></div>'+
  '<div class="field"><label>Category</label><div class="cats">'+CATS.map(function(c){return '<button type="button" class="cat'+(draft.category===c[0]?" on":"")+'" data-act="cat" data-id="'+c[0]+'"><span class="ic">'+c[2]+'</span>'+c[1]+'</button>';}).join("")+'</div></div>'+
  '<div class="field"><label for="f-desc">Condition</label><textarea id="f-desc" maxlength="240" placeholder="Works fine, one leg slightly wobbly...">'+esc(draft.desc||"")+'</textarea></div>'+
  '<div class="field"><label>Give away or sell?</label><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
  '<button type="button" class="pill'+(!draft.priced?" pri":"")+'" data-act="priced" data-id="0">Free</button>'+
  '<button type="button" class="pill'+(draft.priced?" pri":"")+'" data-act="priced" data-id="1">Priced</button>'+
  (draft.priced?'<input id="f-price" type="number" min="1" max="9999" placeholder="$" style="max-width:110px" value="'+esc(draft.price||"")+'">':"")+'</div>'+
  '<p class="hint">Priced tags get an official online receipt when the handoff is confirmed.</p></div>'+
  '<div class="field"><label>Also cross-post to</label><div class="pchecks">'+PLATFORMS.map(function(p){
    var on=draft.platforms.indexOf(p)>-1;var tok=me.platformsConnected.indexOf(p)>-1;
    return '<label><input type="checkbox" data-pf="'+p+'"'+(on?" checked":"")+'> '+p+(tok?' <span class="trustchip">●</span>':'')+'</label>';}).join("")+
  '</div><p class="hint">● = API token connected (auto-post). Without a token, '+APP+' prepares a one-tap share listing under your handle and link.</p></div>'+
  '<button type="submit" class="pill pri block">Post it</button></form>';
}
function viewMine(){
  var mine=items.filter(function(i){return i.mine;});
  var claimed=items.filter(function(i){return i.claim&&i.claim.byMe&&!i.mine;});
  var h='<h2 class="st reveal">My tags</h2><div id="feedList" class="itemgrid">'+(mine.length?mine.map(function(it,i){return card(it,i);}).join(""):'<div class="empty reveal"><span class="big">📌</span>Nothing posted yet — head to Post.</div>')+'</div>';
  if(claimed.length)h+='<h2 class="st reveal">Claimed by me</h2><div id="feedList2" class="itemgrid">'+claimed.map(function(it,i){return card(it,i);}).join("")+'</div>';
  return h;
}
function viewAlerts(){
  var h='<h2 class="st reveal">Notifications</h2>';
  h+=notifs.length?notifs.map(function(n,i){return '<div class="ntf reveal'+(n.read?"":" unread")+'" style="transition-delay:'+((i%10)*40)+'ms">'+esc(n.text)+'<span class="when">'+fmtDT(n.at)+'</span></div>';}).join(""):'<div class="empty reveal"><span class="big">🔔</span>Nothing yet.</div>';
  return h;
}
function impactHtml(){
  var rescued=items.filter(function(i){return i.status==="collected";}).length;
  var trucked=items.filter(function(i){return i.status==="collected_by_truck"||i.status==="booked_for_truck";}).length;
  var kg=Math.round((rescued*8+trucked*8));
  return '<div class="impact reveal"><div class="t">♻️ Community impact</div><div class="row">'+
  '<div><span class="n">'+rescued+'</span><div class="l">rescued by neighbours</div></div>'+
  '<div><span class="n">'+trucked+'</span><div class="l">truck-handled</div></div>'+
  '<div><span class="n">~'+kg+'kg</span><div class="l">waste diverted</div></div>'+
  '</div></div>';
}
function loadLeaderboard(){
  api("/leaderboard").then(function(j){leaderboard=j;render();}).catch(function(){leaderboard={leaderboard:[]};});
}
function ecoPointsHtml(){
  var t=me.tier;
  var pct=t.next?Math.max(6,Math.min(100,Math.round((me.ecoPoints/(me.ecoPoints+t.next.pointsToGo))*100))):100;
  return '<div class="ecocard reveal"><div class="t">'+t.icon+' '+esc(t.name)+'</div>'+
  '<div class="ecopts">'+me.ecoPoints+' <span>eco points</span></div>'+
  '<div class="ecobar"><div class="ecofill" style="width:'+pct+'%"></div></div>'+
  (t.next?'<p class="hint" style="margin:8px 0 0">'+t.next.pointsToGo+' points to '+t.next.icon+' '+esc(t.next.name)+'</p>':'<p class="hint" style="margin:8px 0 0">You\'ve reached the top tier!</p>')+
  '<p class="hint" style="margin-top:8px">+15 for handing off an item, +10 for claiming one, +5 when the truck collects it. Points are a fun way to track your impact — not redeemable for cash.</p>'+
  '</div>';
}
function leaderboardHtml(){
  if(!leaderboard)return '<fieldset class="reveal"><legend>🏆 Neighbourhood leaderboard</legend><p class="hint" style="margin:0">Loading…</p></fieldset>';
  var rows=leaderboard.leaderboard||[];
  if(!rows.length)return '<fieldset class="reveal"><legend>🏆 Neighbourhood leaderboard</legend><p class="hint" style="margin:0">Nobody\'s earned eco points in '+esc(leaderboard.suburb||me.suburb)+' yet — be the first!</p></fieldset>';
  return '<fieldset class="reveal"><legend>🏆 Leaderboard — '+esc(leaderboard.suburb||me.suburb)+'</legend>'+
  rows.map(function(r,i){
    return '<div class="lbrow'+(r.mine?" mine":"")+'"><span class="lbrank">#'+(i+1)+'</span><span class="lbname">'+esc(r.handle)+(r.trusted?' <span class="trustchip">✓</span>':'')+'</span><span class="lbtier">'+r.tier.icon+'</span><span class="lbpts">'+r.ecoPoints+'</span></div>';
  }).join("")+
  '</fieldset>';
}
function viewProfile(){
  var rcptRows=receipts.map(function(r){
    return '<div class="rcpt"><div><span class="rid">'+esc(r.id)+'</span><br><span style="color:var(--soft)">'+esc(r.title)+' · '+fmtDT(r.at)+'</span></div>'+
    '<div style="display:flex;gap:6px;align-items:center"><span class="ramt">'+money(r.amount)+'</span>'+
    '<button class="pill gh sm" data-act="receipt" data-id="'+esc(r.id)+'">🧾 View</button></div></div>';
  }).join("");

  var h='<h2 class="st reveal">Profile</h2><div class="pcard reveal"><div class="avatar">'+esc(me.handle.split("-")[1]?me.handle.split("-")[1][0]:"K")+'</div>'+
  '<div style="font-weight:700;font-family:\'Outfit\',sans-serif;font-size:17px">'+esc(me.handle)+'</div>'+
  '<div style="font-size:12px;color:var(--soft)">'+esc(me.suburb)+' · your anonymous public identity</div>'+
  '<div style="margin-top:12px"><button class="pill gh sm" data-act="new-handle">🔄 Generate new handle</button></div>'+
  '<p class="hint">Handles are picked automatically — you can\'t choose one, so nothing about it can identify you.</p>'+
  (me.avgRating?'<div style="font-size:13px;margin-top:6px;color:var(--amber)">'+"★".repeat(Math.round(me.avgRating))+' ('+me.avgRating.toFixed(1)+')</div>':"")+
  '<div class="stats"><div class="stat"><span class="n">'+items.filter(function(i){return i.mine;}).length+'</span><span class="l">Posted</span></div>'+
  '<div class="stat"><span class="n">'+me.handoffs+'</span><span class="l">Handed off</span></div>'+
  '<div class="stat"><span class="n">'+me.truckSaved+'</span><span class="l">Truck-saved</span></div></div>'+
  (me.trusted?'<div class="truststamp">✓ Trusted neighbour</div>':'<p class="hint" style="margin-top:14px">3 completed handoffs unlocks a trust stamp on your tags.</p>')+'</div>'+

  ecoPointsHtml()+
  impactHtml()+
  leaderboardHtml()+

  '<fieldset class="reveal"><legend>Receipts</legend>'+
  (rcptRows?rcptRows:'<p class="hint" style="margin:0">No receipts yet — a receipt is generated automatically whenever a priced tag\'s handoff is confirmed.</p>')+
  '</fieldset>'+

  '<fieldset class="reveal"><legend>Privacy</legend><p class="hint" style="margin-top:0">Neighbours only ever see <strong>'+esc(me.handle)+'</strong>. Your email ('+esc(me.email)+') is used for login only — never shown, never shared, no phone number ever required. All pickup coordination happens inside the app.</p></fieldset>'+

  '<fieldset class="reveal"><legend>Your details</legend>'+
  '<div class="field"><label for="p-name">Private name (optional)</label><input id="p-name" maxlength="30" value="'+esc(me.name||"")+'"></div>'+
  '<div class="field"><label for="p-suburb">Suburb</label><div class="field-inline"><input id="p-suburb" maxlength="40" value="'+esc(me.suburb)+'"><button type="button" class="locbtn" data-act="locate" data-target="p-suburb">📍 Locate</button></div></div>'+
  '<div class="field"><label for="p-day">Council truck day</label><select id="p-day">'+WD.map(function(w,i){return '<option value="'+i+'"'+(i===me.pickupWeekday?" selected":"")+'>'+w+'</option>';}).join("")+'</select>'+
  '<p class="hint">Drives the countdown and the auto-book-for-truck rule. Works for any suburb in Australia.</p></div>'+
  '<button class="pill pri" data-act="save-profile">Save details</button></fieldset>'+

  '<fieldset class="reveal"><legend>Platform connections</legend>'+
  '<p class="hint" style="margin-top:0">Paste an API token to enable direct auto-posting on your own account. No token? No problem — '+APP+' creates a one-tap share listing posted under your handle and link instead. Real Marketplace API access requires Meta developer approval; the plumbing here is ready for it.</p>'+
  PLATFORMS.map(function(p){var on=me.platformsConnected.indexOf(p)>-1;
    return '<div class="field"><label>'+p+(on?' <span class="trustchip">● connected</span>':'')+'</label><input id="tok-'+p+'" type="password" placeholder="'+(on?"Token saved — paste to replace":"Paste "+p+" API token (optional)")+'"></div>';}).join("")+
  '<button class="pill" data-act="save-tokens">Save tokens</button></fieldset>'+

  '<fieldset class="reveal"><legend>Account</legend><button class="pill dgr" data-act="logout">Log out</button></fieldset>'+
  '<div class="legal"><a href="/privacy" target="_blank">Privacy Policy</a> · <a href="/terms" target="_blank">Terms of Service</a><br>'+APP+' · made for Australian kerbs</div>';
  return h;
}

/* ---------- render ---------- */
function navItems(){
  return [["feed","🏷️","Feed"],["post","➕","Post"],["mine","📌","My Tags"],["alerts","🔔","Alerts"],["profile","👤","Profile"]];
}
function nextPickup(){
  var d=new Date();d.setHours(0,0,0,0);
  var diff=(me.pickupWeekday-d.getDay()+7)%7;d.setDate(d.getDate()+diff);
  return d.getTime();
}
function render(){
  var app=document.getElementById("app");
  if(!me){app.innerHTML=viewAuth();bind();initScrollAnim();renderGoogleButton();return;}
  var next=nextPickup();
  var d=daysTo(next);var lbl=d<=0?"Today":d===1?"Tomorrow":"in "+d+" days";
  var mainHtml=tab==="feed"?viewFeed():tab==="post"?viewPost():tab==="mine"?viewMine():tab==="alerts"?viewAlerts():viewProfile();
  var bell='<button class="iconbtn" data-tab="alerts" title="Notifications" style="position:relative">🔔'+(unread?'<span class="dock-badge js-badge">'+unread+'</span>':'')+'</button>';
  var themesw='<div class="themesw" data-act="theme" role="button" aria-label="Toggle theme"><span class="knob">'+(theme()==="dark"?"🌙":"☀️")+'</span></div>';
  var dock='<aside class="dock-desktop">'+
    '<div class="dbrand"><img src="/logo.svg" alt=""><span class="nm">'+APP+'</span></div>'+
    '<p class="dtag">'+TAGLINE+'</p>'+
    '<div class="dnav">'+navItems().map(function(n){
      return '<button data-tab="'+n[0]+'" class="'+(tab===n[0]?"on":"")+'"><span class="ic">'+n[1]+'</span>'+n[2]+
      (n[0]==="alerts"?'<span class="bdg js-badge" style="display:'+(unread?"":"none")+'">'+unread+'</span>':"")+'</button>';
    }).join("")+'</div>'+
    '<div class="banner" style="margin-top:20px;flex-direction:column;align-items:flex-start;gap:3px"><span class="lbl">Next truck day</span><span class="cnt">'+WD[me.pickupWeekday].slice(0,3)+' · '+lbl+'</span></div>'+
    '<div class="dfoot">Signed in as <b>'+esc(me.handle)+'</b><br><a href="/privacy" target="_blank">Privacy</a> · <a href="/terms" target="_blank">Terms</a></div>'+
  '</aside>';
  var mtop='<div class="mtop"><img src="/logo.svg" alt=""><span class="nm">'+APP+'</span>'+bell+themesw+'</div>';
  var dtop='<div class="dtopbar"><div class="right">'+bell+themesw+'</div></div>';
  var banner='<div class="banner reveal"><span class="lbl">Next truck day</span><span class="cnt">'+WD[me.pickupWeekday].slice(0,3)+' · '+lbl+'</span></div>';
  var dockm='<nav class="dock-mobile">'+navItems().map(function(n){
    return '<button data-tab="'+n[0]+'" class="'+(tab===n[0]?"on":"")+(n[0]==="post"?" post":"")+'"><span class="ic">'+n[1]+'</span>'+(n[0]==="post"?"":n[2])+
    (n[0]==="alerts"?'<span class="dock-badge js-badge" style="display:'+(unread?"":"none")+'">'+unread+'</span>':"")+'</button>';
  }).join("")+'</nav>';
  app.innerHTML='<div class="shell">'+dock+'<div class="content">'+mtop+dtop+banner+'<main id="main">'+mainHtml+'</main></div></div>'+dockm;
  bind();
  initScrollAnim();
}

/* ---------- events ---------- */
function bind(){
  var app=document.getElementById("app");
  app.onclick=function(e){
    var t=e.target.closest("[data-tab]");
    if(t){tab=t.dataset.tab;if(tab==="alerts"){api("/notifications/read","POST").then(function(){unread=0;notifs.forEach(function(n){n.read=true;});render();});}if(tab==="profile"&&!leaderboard)loadLeaderboard();render();return;}
    var a=e.target.closest("[data-act]");
    if(a){act(a.dataset.act,a.dataset.id,a);return;}
  };
  app.onchange=function(e){
    if(e.target.matches("[data-pf]")){
      var p=e.target.dataset.pf,i=draft.platforms.indexOf(p);
      if(e.target.checked&&i<0)draft.platforms.push(p);
      if(!e.target.checked&&i>-1)draft.platforms.splice(i,1);
    }
    if(e.target.id==="f-media")addMedia(e.target.files);
  };
  var fs=document.getElementById("f-search");
  if(fs)fs.oninput=function(){searchQ=fs.value;var fl=document.getElementById("feedList");if(fl)fl.innerHTML=feedListHtml();initScrollAnim();};
  var af=document.getElementById("authForm");
  if(af)af.onsubmit=function(e){
    e.preventDefault();
    var body={email:document.getElementById("a-email").value,password:document.getElementById("a-pass").value};
    if(authMode==="signup"){body.suburb=document.getElementById("a-suburb").value||"My suburb";body.pickupWeekday=parseInt(document.getElementById("a-day").value,10);}
    api("/"+authMode,"POST",body).then(function(j){me=j.me;toast(authMode==="signup"?"Welcome! You appear as "+me.handle:"Welcome back, "+me.handle);refresh();startPolling();}).catch(function(err){toast(err.message,true);});
  };
  var pf=document.getElementById("postForm");
  if(pf)pf.onsubmit=function(e){
    e.preventDefault();
    var title=document.getElementById("f-title").value.trim();
    if(!title){toast("Give it a short title first.",true);return;}
    var price=0;
    if(draft.priced){price=parseFloat((document.getElementById("f-price")||{}).value);if(isNaN(price)||price<1){toast("Enter a price of at least $1, or switch to Free.",true);return;}}
    api("/items","POST",{title:title,desc:document.getElementById("f-desc").value.trim(),category:draft.category,price:price,platforms:draft.platforms,media:draft.media})
    .then(function(j){
      draft={category:"other",platforms:["Marketplace","Freecycle"],media:[],priced:false};
      if(j.item&&j.item.platforms.length){
        var auto=j.item.platforms.filter(function(p){return me.platformsConnected.indexOf(p)>-1;});
        var manual=j.item.platforms.filter(function(p){return me.platformsConnected.indexOf(p)===-1;});
        if(navigator.clipboard)navigator.clipboard.writeText(shareText(j.item)).catch(function(){});
        var msg="Posted!";
        if(auto.length)msg+=" Queued for auto-posting to "+auto.join(", ")+".";
        if(manual.length)msg+=" Listing copied — tap the "+manual.join("/")+" buttons on your tag to post it there in one tap.";
        toast(msg);
      }else toast("Posted — your tag is live.");
      tab="mine";return refresh();
    })
    .catch(function(err){toast(err.message,true);});
  };
}

function addMedia(files){
  keepDraftFields();
  Array.prototype.slice.call(files||[]).forEach(function(file){
    if(draft.media.length>=4){toast("Max 4 attachments.",true);return;}
    if(file.type.indexOf("image/")===0){
      var rd=new FileReader();
      rd.onload=function(ev){var img=new Image();img.onload=function(){
        var s=Math.min(1,900/Math.max(img.width,img.height));
        var c=document.createElement("canvas");c.width=Math.max(1,Math.round(img.width*s));c.height=Math.max(1,Math.round(img.height*s));
        c.getContext("2d").drawImage(img,0,0,c.width,c.height);
        var q=0.7,out=c.toDataURL("image/jpeg",q);
        while(out.length>400*1024&&q>0.3){q-=0.15;out=c.toDataURL("image/jpeg",q);}
        draft.media.push({type:"image",data:out});render();
      };img.onerror=function(){toast("Couldn't read that photo.",true);};img.src=ev.target.result;};
      rd.readAsDataURL(file);
    }else if(file.type.indexOf("video/")===0){
      if(file.size>2.5*1024*1024){toast("Videos must be under 2.5MB for the pilot — trim it and retry.",true);return;}
      var rv=new FileReader();
      rv.onload=function(ev){draft.media.push({type:"video",data:ev.target.result});render();};
      rv.readAsDataURL(file);
    }else toast("Only photos and videos are supported.",true);
  });
}

function shareText(it){
  return it.title+(it.price>0?" — "+money(it.price):" — FREE")+"\n"+(it.desc||"")+"\nSuburb: "+me.suburb+"\nPosted via "+APP+" by "+me.handle+" — claim it here: "+location.origin;
}
function keepDraftFields(){
  var t=document.getElementById("f-title");if(t)draft.title=t.value;
  var d=document.getElementById("f-desc");if(d)draft.desc=d.value;
  var p=document.getElementById("f-price");if(p)draft.price=p.value;
}
function openReceipt(id){
  var r=receipts.filter(function(x){return x.id===id;})[0];
  if(!r)return;
  var w=window.open("","_blank","width=440,height=680");
  if(!w){toast("Allow pop-ups to view the receipt.",true);return;}
  var dark=theme()==="dark";
  w.document.write('<html><head><title>'+esc(r.id)+' — '+APP+' receipt</title>'+
  '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">'+
  '<style>'+
  'body{font-family:Inter,sans-serif;background:'+(dark?"#0F1412":"#F5F3EC")+';color:'+(dark?"#EAEEE9":"#171F1B")+';padding:26px 16px;display:flex;justify-content:center}'+
  '.paper{background:'+(dark?"#1A211E":"#fff")+';border-radius:24px;max-width:380px;width:100%;box-shadow:0 18px 50px -18px rgba(0,0,0,.35);overflow:hidden}'+
  '.top{background:linear-gradient(120deg,#0E7A6A,#0A5C50);color:#fff;padding:24px 26px 20px}'+
  '.top .app{display:flex;align-items:center;gap:10px;font-family:"Outfit",sans-serif;font-weight:800;font-size:19px}'+
  '.top .app img{width:34px;height:34px;border-radius:9px}'+
  '.top .sub{font-size:11px;opacity:.85;margin-top:3px}'+
  '.amt{font-family:"JetBrains Mono",monospace;font-size:36px;font-weight:700;margin:16px 0 2px}'+
  '.amt small{font-size:14px;opacity:.8}'+
  '.paid{display:inline-block;background:rgba(255,255,255,.18);border-radius:999px;font-size:10.5px;font-weight:700;padding:4px 11px;letter-spacing:.5px;text-transform:uppercase}'+
  '.body{padding:22px 26px}'+
  '.row{display:flex;justify-content:space-between;gap:12px;padding:9px 0;font-size:13px;border-bottom:1px solid '+(dark?"#262F2A":"#EFEDE0")+'}'+
  '.row:last-of-type{border-bottom:none}'+
  '.row .k{color:'+(dark?"#9BA69F":"#68716C")+'}'+
  '.row .v{font-weight:700;text-align:right}'+
  '.mono{font-family:"JetBrains Mono",monospace}'+
  '.tear{border-top:2px dashed '+(dark?"#333F39":"#D5D2C4")+';margin:4px 26px;position:relative}'+
  '.tear::before,.tear::after{content:"";position:absolute;top:-9px;width:18px;height:18px;border-radius:50%;background:'+(dark?"#0F1412":"#F5F3EC")+'}'+
  '.tear::before{left:-35px}.tear::after{right:-35px}'+
  '.foot{padding:16px 26px 24px;font-size:10.5px;color:'+(dark?"#6C7772":"#98A09B")+';text-align:center;line-height:1.6}'+
  '.print{display:block;margin:0 auto 20px;background:#0E7A6A;color:#fff;border:none;border-radius:999px;padding:11px 26px;font-family:Inter,sans-serif;font-weight:700;font-size:13px;cursor:pointer}'+
  '@media print{.print{display:none}body{background:#fff;padding:0}.paper{box-shadow:none}}'+
  '</style></head><body><div class="paper">'+
  '<div class="top"><div class="app"><img src="'+location.origin+'/logo.svg">'+APP+'</div><div class="sub">Official online receipt</div>'+
  '<div class="amt">'+money(r.amount)+' <small>AUD</small></div><span class="paid">'+esc(r.method||"Recorded")+'</span></div>'+
  '<div class="body">'+
  '<div class="row"><span class="k">Receipt no.</span><span class="v mono">'+esc(r.id)+'</span></div>'+
  '<div class="row"><span class="k">Date</span><span class="v">'+new Date(r.at).toLocaleString()+'</span></div>'+
  '<div class="row"><span class="k">Item</span><span class="v">'+esc(r.title)+'</span></div>'+
  '<div class="row"><span class="k">Seller</span><span class="v mono">'+esc(r.posterHandle)+'</span></div>'+
  '<div class="row"><span class="k">Buyer</span><span class="v mono">'+esc(r.claimerHandle||"—")+'</span></div>'+
  '<div class="row"><span class="k">Suburb</span><span class="v">'+esc(r.suburb||"")+'</span></div>'+
  '</div><div class="tear"></div>'+
  '<div class="foot">'+APP+' is a listing &amp; coordination service.<br>This receipt records the exchange between the two anonymous parties above.</div>'+
  '<button class="print" onclick="window.print()">🖨️ Print / Save as PDF</button>'+
  '</div></body></html>');
  w.document.close();
}
function act(action,id,el){
  if(action==="switch-auth"){authMode=authMode==="login"?"signup":"login";render();return;}
  if(action==="google-soon"){toast(googleClientId?"Google Sign-In is loading — try again in a second.":"Google Sign-In isn't connected yet — it needs a free Google Client ID.",true);return;}
  if(action==="apple-soon"){toast("Apple Sign-In is coming soon — it needs a paid Apple Developer account. Use email or Google for now.",true);return;}
  if(action==="theme"){localStorage.setItem("kerbit-theme",theme()==="dark"?"light":"dark");applyTheme();render();return;}
  if(action==="scope"){feedScope=id;render();return;}
  if(action==="catf"){catFilter=id;render();return;}
  if(action==="locate"){locate(el.dataset.target,el);return;}
  if(action==="psearch"){
    var q=(document.getElementById("f-search")||{value:searchQ}).value||"";
    window.open(PSEARCH_URLS[el.dataset.pf]+encodeURIComponent(q),"_blank");return;}
  if(action==="ebaysearch"){
    var eq=((document.getElementById("f-search")||{value:searchQ}).value||"").trim();
    if(!eq){toast("Type something to search first.",true);return;}
    if(!ebayEnabled){toast("eBay search isn't connected yet — it needs a free eBay Developer Client ID + Secret.",true);return;}
    ebayLoading=true;ebayResults=null;render();
    api("/search/ebay?q="+encodeURIComponent(eq)).then(function(j){ebayLoading=false;ebayResults={q:eq,items:j.results||[]};render();})
    .catch(function(e){ebayLoading=false;ebayResults={q:eq,error:e.message};render();});
    return;}
  if(action==="cat"){keepDraftFields();draft.category=id;render();return;}
  if(action==="priced"){keepDraftFields();draft.priced=id==="1";render();return;}
  if(action==="delmedia"){keepDraftFields();draft.media.splice(parseInt(id,10),1);render();return;}
  if(action==="receipt"){openReceipt(id);return;}
  if(action==="open"){modalItemId=id;modalMiniMode=null;renderModal();return;}
  if(action==="close-modal"){closeModalAll();return;}
  if(action==="new-handle"){
    api("/profile/newhandle","POST").then(function(j){me=j.me;toast("You're now "+me.handle+" — picked for you automatically.");refresh();}).catch(function(e){toast(e.message,true);});return;}
  if(action==="logout"){api("/logout","POST").then(function(){me=null;items=[];notifs=[];receipts=[];clearInterval(pollTimer);closeModalAll();render();});return;}
  if(action==="save-profile"){
    api("/profile","PUT",{name:document.getElementById("p-name").value,suburb:document.getElementById("p-suburb").value,pickupWeekday:parseInt(document.getElementById("p-day").value,10)})
    .then(function(j){me=j.me;toast("Details saved.");refresh();}).catch(function(e){toast(e.message,true);});return;}
  if(action==="save-tokens"){
    var toks={};PLATFORMS.forEach(function(p){var v=document.getElementById("tok-"+p).value.trim();if(v)toks[p]=v;});
    api("/profile","PUT",{platformTokens:toks}).then(function(j){me=j.me;toast("Tokens saved — auto-posting enabled for: "+(me.platformsConnected.join(", ")||"none yet"));render();}).catch(function(e){toast(e.message,true);});return;}
  if(action==="share"){
    var it=items.filter(function(i){return i.id===id;})[0];var pfm=el.dataset.pf;
    if(navigator.clipboard)navigator.clipboard.writeText(shareText(it)).catch(function(){});
    toast("Listing copied — opening "+pfm+"…");
    window.open(SHARE_URLS[pfm]||"about:blank","_blank");return;}
  if(action==="claim"){api("/items/"+id+"/claim","POST").then(function(){toast("Claimed! Collect within 2 days or it goes back up.");closeModalAll();refresh();}).catch(function(e){toast(e.message,true);refresh();});return;}
  if(action==="handoff"){api("/items/"+id+"/handoff","POST").then(function(j){toast(j.receipt?"Handoff confirmed — receipt "+j.receipt.id+" generated (see Profile).":"Nice — one more successful handoff.");closeModalAll();refresh();}).catch(function(e){toast(e.message,true);});return;}
  if(action==="truckdone"){api("/items/"+id+"/truckdone","POST").then(function(){toast("Logged as collected by the truck.");closeModalAll();refresh();}).catch(function(e){toast(e.message,true);});return;}
  if(action==="remove"){if(!confirm("Remove this tag?"))return;api("/items/"+id,"DELETE").then(function(){toast("Removed.");closeModalAll();refresh();}).catch(function(e){toast(e.message,true);});return;}
  if(action==="flag"){modalMiniMode="flag";modalMiniId=id;renderModal();return;}
  if(action==="flag-reason"){
    api("/items/"+modalMiniId+"/flag","POST",{reason:el.dataset.reason}).then(function(j){toast(j.observation?"Flagged — moved straight to observation.":"Flagged. Thanks for keeping the kerb safe.");closeModalAll();refresh();}).catch(function(e){toast(e.message,true);closeModalAll();});return;}
  if(action==="rate"){modalMiniMode="rate";modalMiniId=id;renderModal();return;}
  if(action==="rate-star"){
    var n=parseInt(el.dataset.n,10);
    api("/items/"+modalMiniId+"/rate","POST",{rating:n}).then(function(){toast("Thanks for rating it.");closeModalAll();refresh();}).catch(function(e){toast(e.message,true);closeModalAll();});return;}
}

boot();
})();
