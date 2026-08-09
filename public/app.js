(function(){
"use strict";
var APP="Dibs";
var TAGLINE="Call dibs before the truck does.";
/* Fields: [key, label, icon, kerb(1=free-giveaway/truck-day mechanic applies, 0=plain listing), primary(1=shown by default, 0=behind "More")]
   Mirrors the categories Australians expect from Facebook Marketplace/Gumtree, unified into one app. */
var CATS=[
  ["vehicles","Vehicles","",0,1],
  ["property_rent","Property for rent","",0,1],
  ["property_sale","Property for sale","",0,1],
  ["furniture","Furniture","",1,1],
  ["electronics","Electronics","",1,1],
  ["clothing","Clothing","",1,1],
  ["family","Family","",1,1],
  ["classifieds","Classifieds","",0,1],
  ["jobs","Jobs","",0,0],
  ["services","Services","",0,0],
  ["entertainment","Entertainment","",1,0],
  ["books","Books","",1,0],
  ["kitchen","Kitchen","",1,0],
  ["toys","Toys & Games","",1,0],
  ["garden","Garden & Outdoors","",1,0],
  ["sports","Sporting Goods","",1,0],
  ["pets","Pet Supplies","",1,0],
  ["homegoods","Home Goods","",1,0],
  ["homeimprove","Home Improvement Supplies","",1,0],
  ["music","Musical Instruments","",1,0],
  ["office","Office Supplies","",1,0],
  ["hobbies","Hobbies & Craft","",1,0],
  ["other","Other","",1,0]
];
function catKerb(catKey){var c=CATS.filter(function(x){return x[0]===catKey;})[0];return c?!!c[3]:true;}
/* Minimal line-icon set (feather/lucide-style) — replaces emoji for a cleaner, non-AI-slop look */
function ic(path){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';}
var ICONS={
  search:ic('<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.2" y2="16.2"/>'),
  all:ic('<path d="M20.4 12.6 12.6 20.4a2 2 0 0 1-2.8 0l-6.2-6.2a2 2 0 0 1 0-2.8L11.4 3.6A2 2 0 0 1 12.8 3H19a2 2 0 0 1 2 2v6.2a2 2 0 0 1-.6 1.4z"/><circle cx="8.2" cy="8.2" r="1.2" fill="currentColor" stroke="none"/>'),
  gift:ic('<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8"/><path d="M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8"/>'),
  vehicles:ic('<path d="M4 16.5V11l2.2-5A2 2 0 0 1 8.1 5h7.8a2 2 0 0 1 1.9 1.4L20 11v5.5"/><path d="M4 16.5h16v2a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1V17.5h-9V18.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><circle cx="7.5" cy="16.5" r="1.4"/><circle cx="16.5" cy="16.5" r="1.4"/><line x1="4" y1="11" x2="20" y2="11"/>'),
  property_rent:ic('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1H10v-5h4v5h3.5a1 1 0 0 0 1-1v-9"/><circle cx="12" cy="15.5" r="1"/>'),
  property_sale:ic('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9"/><path d="M9.5 20v-5.5A1.5 1.5 0 0 1 11 13h2a1.5 1.5 0 0 1 1.5 1.5V20"/><path d="M15 8.5V5h3v6"/>'),
  furniture:ic('<path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"/><path d="M4 12.5a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 12.5V17H4z"/><path d="M5 17v3M19 17v3"/>'),
  electronics:ic('<rect x="3" y="4.5" width="18" height="12" rx="1.5"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="16.5" x2="12" y2="20"/>'),
  clothing:ic('<path d="M8 4 4 7l2 3 2-1.3V20h8V8.7L18 10l2-3-4-3-2 2h-4z"/>'),
  family:ic('<circle cx="8.5" cy="8" r="2.8"/><circle cx="16" cy="9" r="2.2"/><path d="M3 20v-1.5A3.5 3.5 0 0 1 6.5 15h4A3.5 3.5 0 0 1 14 18.5V20"/><path d="M15.5 20v-1.2a3 3 0 0 1 3-3H19a2.5 2.5 0 0 1 2.5 2.5V20"/>'),
  classifieds:ic('<rect x="5" y="4" width="14" height="17" rx="1.5"/><path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1z"/><line x1="8.5" y1="11" x2="15.5" y2="11"/><line x1="8.5" y1="14.5" x2="15.5" y2="14.5"/><line x1="8.5" y1="18" x2="12.5" y2="18"/>'),
  jobs:ic('<rect x="3" y="7.5" width="18" height="12" rx="1.5"/><path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5"/><line x1="3" y1="12.5" x2="21" y2="12.5"/><path d="M10.5 12.5h3v2h-3z"/>'),
  services:ic('<path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4l-2.4 2.4-2-2z"/>'),
  entertainment:ic('<rect x="3" y="6" width="18" height="13" rx="1.5"/><path d="M3 10h18"/><path d="M6.5 6 8.5 10M11.5 6l2 4M16.5 6l2 4"/>'),
  books:ic('<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>'),
  kitchen:ic('<path d="M6 3v7a2.5 2.5 0 0 0 5 0V3"/><line x1="8.5" y1="10.5" x2="8.5" y2="21"/><path d="M16 3v6a2 2 0 0 1-2 2v0"/><line x1="16" y1="3" x2="16" y2="21"/>'),
  toys:ic('<path d="M12 3 6 9l6 6 6-6z"/><path d="M6 15l6 6 6-6"/>'),
  garden:ic('<path d="M12 21V10"/><path d="M12 10C7 10 5 6 5 3c4 0 7 2 7 7z"/><path d="M12 13c5 0 7-3.5 7-7-4 0-7 2-7 7z"/>'),
  sports:ic('<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7"/>'),
  pets:ic('<circle cx="7" cy="9" r="1.6"/><circle cx="12" cy="6.5" r="1.6"/><circle cx="17" cy="9" r="1.6"/><path d="M8.5 14c-2 .8-3 2.3-2.3 3.8 1 2 4 1.4 5.8.6 1.8.8 4.8 1.4 5.8-.6.7-1.5-.3-3-2.3-3.8-1.2-.5-1.8-1-3.5-1s-2.3.5-3.5 1z"/>'),
  homegoods:ic('<path d="M12 3v6"/><path d="M7 9h10l1.5 4.5a2 2 0 0 1-1.9 2.5H7.4a2 2 0 0 1-1.9-2.5z"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/>'),
  homeimprove:ic('<path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4l-2.4 2.4-2-2z"/><path d="M4 4l4 1 1 4"/>'),
  music:ic('<circle cx="6.5" cy="18" r="2.2"/><circle cx="17" cy="16" r="2.2"/><path d="M8.7 18V5.5L19.2 4v11.5"/>'),
  office:ic('<rect x="4" y="8" width="16" height="10" rx="1.5"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="4" y1="13" x2="20" y2="13"/>'),
  hobbies:ic('<path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.7 2-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1.1.9-2 2-2H17a4 4 0 0 0 4-4c0-4.4-4-7.8-9-7.8z"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="14" cy="7" r="1" fill="currentColor" stroke="none"/>'),
  other:ic('<path d="M21 8.5 12 3 3 8.5 12 14z"/><path d="M3 8.5V16l9 5.5 9-5.5V8.5"/><line x1="12" y1="14" x2="12" y2="21.5"/>'),
  truck:ic('<rect x="2.5" y="8" width="12" height="9" rx="1"/><path d="M14.5 11h3.5l3 3v3h-6.5z"/><circle cx="6.5" cy="18" r="1.6"/><circle cx="16.5" cy="18" r="1.6"/>'),
  compare:ic('<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="12" y1="4" x2="12" y2="20"/>'),
  bell:ic('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'),
  plus:ic('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
  pin:ic('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'),
  user:ic('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  sun:ic('<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.6" y1="4.6" x2="6" y2="6"/><line x1="18" y1="18" x2="19.4" y2="19.4"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.6" y1="19.4" x2="6" y2="18"/><line x1="18" y1="6" x2="19.4" y2="4.6"/>'),
  moon:ic('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
  locate:ic('<path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
  globe:ic('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
  cart:ic('<circle cx="9" cy="21" r="1.6"/><circle cx="19" cy="21" r="1.6"/><path d="M2.5 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L21.5 7H6"/>'),
  trophy:ic('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 5M17 6h3a3 3 0 0 1-3 5"/>'),
  leaf:ic('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'),
  external:ic('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>')
};
function catIcon(key){return ICONS[key]||ICONS.other;}
var CAT_SYNONYMS={
  vehicles:["car","cars","vehicle","vehicles","ute","suv","4wd","motorbike","motorcycle","van","auto","hatch","sedan","wagon"],
  property_rent:["rent","rental","lease","room","granny","share","tenant"],
  property_sale:["house","houses","apartment","unit","property","land","flat","buy"],
  classifieds:["classified","classifieds","notice","swap","trade"],
  jobs:["job","jobs","work","hiring","vacancy","career","casual","fulltime","parttime"],
  services:["service","services","cleaner","tutor","tutoring","mechanic","plumber","handyman","gardener","removalist"],
  furniture:["couch","sofa","chair","table","desk","bed","furniture","wardrobe","drawer","shelf"],
  electronics:["tv","laptop","phone","electronics","computer","monitor","console","camera"],
  clothing:["clothes","clothing","shirt","jacket","shoes","dress","jeans"],
  family:["baby","kids","pram","stroller","cot","highchair","family"],
  entertainment:["movie","movies","dvd","game","games","console","concert","ticket","tickets"],
  books:["book","books","novel","textbook","magazine"],
  kitchen:["kitchen","microwave","cookware","utensils","blender","kettle","fridge","washer"],
  toys:["toy","toys","lego","boardgame"],
  garden:["garden","plant","plants","pot","mower","outdoor","planter"],
  sports:["sports","bike","bicycle","gym","ball","surfboard","skateboard"],
  pets:["pet","pets","dog","cat","aquarium","cage","kennel"],
  homegoods:["homewares","decor","rug","curtain","cushion"],
  homeimprove:["tool","tools","drill","saw","diy","ladder","paint","renovation"],
  music:["guitar","piano","music","drum","keyboard","amp"],
  office:["printer","stationery","office","folder","binder"],
  hobbies:["hobby","craft","art","paint","collectible","puzzle"]
};
function parseSmartQuery(q){
  q=(q||"").toLowerCase().trim();
  var maxPrice=null;
  var m=q.match(/(?:under|below|less than|max|up to)\s*\$?(\d[\d,]*)/)||q.match(/\$(\d[\d,]*)/);
  if(m){maxPrice=Number(m[1].replace(/,/g,""));q=q.replace(m[0],"").trim();}
  var hayQ=" "+q+" ",catGuess=null;
  for(var i=0;i<CATS.length&&!catGuess;i++){if(hayQ.indexOf(" "+CATS[i][0]+" ")>-1||hayQ.indexOf(CATS[i][1].toLowerCase())>-1)catGuess=CATS[i][0];}
  if(!catGuess){outer:for(var k in CAT_SYNONYMS){var syns=CAT_SYNONYMS[k];for(var j=0;j<syns.length;j++){if(hayQ.indexOf(" "+syns[j]+" ")>-1){catGuess=k;break outer;}}}}
  var terms=q.split(/\s+/).filter(Boolean);
  return {maxPrice:maxPrice,catGuess:catGuess,terms:terms};
}
var PLATFORMS=["Marketplace","Gumtree","Freecycle","Olio"];
var FLAG_REASONS=["Not relevant / inappropriate","Not as described","Suspected scam","Unsafe item","Already gone / duplicate","Other"];
var WD=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var SHARE_URLS={Marketplace:"https://www.facebook.com/marketplace/create/item",Gumtree:"https://www.gumtree.com.au/p-post-ad.html",Freecycle:"https://www.freecycle.org/",Olio:"https://olioapp.com/"};
var PSEARCH_URLS={Marketplace:"https://www.facebook.com/marketplace/search/?query=",Gumtree:"https://www.gumtree.com.au/s-search.html?search=","eBay AU":"https://www.ebay.com.au/sch/i.html?_nkw="};
var EXTRA_PSEARCH_URLS={"Indeed AU":"https://au.indeed.com/jobs?q="};
var CAT_NOUN={vehicles:"car",property_rent:"rental",property_sale:"property",jobs:"job",services:"service",classifieds:"listing"};
var NO_EBAY_CATS=["property_rent","property_sale","jobs","services","classifieds"];
function psearchSites(activeCat){
  var sites={};for(var k in PSEARCH_URLS)sites[k]=PSEARCH_URLS[k];
  if(activeCat&&NO_EBAY_CATS.indexOf(activeCat)>-1)delete sites["eBay AU"];
  if(activeCat==="jobs")sites["Indeed AU"]=EXTRA_PSEARCH_URLS["Indeed AU"];
  return sites;
}
var SUBURB_EXAMPLES_BY_STATE={
  NSW:["Wentworthville","Bondi","Newtown","Parramatta","Coogee","Chatswood","Manly"],
  VIC:["St Kilda","Northcote","Fitzroy","Prahran","Brunswick","Carlton","Footscray"],
  QLD:["Fortitude Valley","New Farm","Toowong","West End","Paddington","Kelvin Grove","Chermside"],
  WA:["Fremantle","Subiaco","Leederville","Cottesloe","Scarborough","Victoria Park"],
  SA:["Glenelg","Norwood","Unley","Prospect","Semaphore","Henley Beach"],
  TAS:["Battery Point","North Hobart","Sandy Bay","Launceston","Glenorchy"],
  ACT:["Braddon","Kingston","Manuka","Dickson","Belconnen"],
  NT:["Nightcliff","Parap","Fannie Bay","Stuart Park","Palmerston"]
};
var suburbPhState="NSW",suburbPhIdx=Math.floor(Math.random()*7);
function suburbExamples(){return SUBURB_EXAMPLES_BY_STATE[suburbPhState]||SUBURB_EXAMPLES_BY_STATE.NSW;}
function suburbPlaceholderText(){var list=suburbExamples();return list[suburbPhIdx%list.length];}
var AU_STATES=[["NSW","New South Wales"],["VIC","Victoria"],["QLD","Queensland"],["WA","Western Australia"],["SA","South Australia"],["TAS","Tasmania"],["ACT","Australian Capital Territory"],["NT","Northern Territory"]];
var HERO_SLIDES=[
  {img:"https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&q=70&auto=format&fit=crop",eyebrow:"Vehicles",headline:"Find your next ride",cat:"vehicles"},
  {img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&q=70&auto=format&fit=crop",eyebrow:"Furniture",headline:"Give it a new home",cat:"furniture"},
  {img:"https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=70&auto=format&fit=crop",eyebrow:"Property for rent",headline:"A room, a rental, a start",cat:"property_rent"},
  {img:"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=70&auto=format&fit=crop",eyebrow:"Property for sale",headline:"Somewhere to call home",cat:"property_sale"},
  {img:"https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1600&q=70&auto=format&fit=crop",eyebrow:"Jobs",headline:"Your next role, nearby",cat:"jobs"},
  {img:"https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&q=70&auto=format&fit=crop",eyebrow:"Services",headline:"Get a hand from a neighbour",cat:"services"},
  {img:"https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1600&q=70&auto=format&fit=crop",eyebrow:"Electronics",headline:"Tech that still has life in it",cat:"electronics"},
  {img:"https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=1600&q=70&auto=format&fit=crop",eyebrow:"Garden & Outdoors",headline:"Grow something good",cat:"garden"},
  {img:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=70&auto=format&fit=crop",eyebrow:"Everything else",headline:"One app, every kerb",cat:"all"}
];
var heroIdx=0,heroTimer=null;
var SEARCH_EXAMPLES=["car under 15000","free couch","3br rental Parramatta","handyman services","gaming console","garden tools","free moving boxes","toddler toys","electric guitar","vintage bike","office desk","house for sale"];
var searchPhIdx=0;
function searchPlaceholderText(){return "Try “"+SEARCH_EXAMPLES[searchPhIdx%SEARCH_EXAMPLES.length]+"”…";}

/* ---------- animated example rotator ----------
   You can't animate a placeholder attribute, so for every field that shows an
   "e.g. …" hint we blank the real placeholder and lay a clipped overlay on top:
   the words are stacked, the outgoing one rides out the top while the next one
   springs up from below. Overlay is aria-hidden and pointer-events:none, so the
   input still reads and behaves normally; it hides the moment you type. */
var ROT_STEP_MS=2600, ROT_SETTLE_MS=1100;
var rotators=[], rotTimer=null;
/* Each letter is its own face on a barrel: the outgoing word rolls down and
   away while the incoming one rolls up into place, staggered left-to-right.
   Long strings get a tighter stagger so the whole word still lands in ~1s. */
function rotStagger(w){return Math.min(.055,.9/Math.max(w.length,1)).toFixed(3);}
function rollLetters(w){
  return w.split("").map(function(ch,i){
    return '<span class="exch" style="--i:'+i+'">'+(ch===" "?"&nbsp;":esc(ch))+'</span>';
  }).join("");
}
function stopRotators(){
  rotators.forEach(function(r){if(r.el&&r.el.parentNode)r.el.parentNode.removeChild(r.el);});
  rotators=[];
}
function rotSize(r){var w=r.spans[r.i].offsetWidth;if(w)r.slot.style.width=w+"px";}
function rotSync(r){r.el.classList.toggle("gone",!!r.input.value);}
function rotAdvance(r){
  if(r.paused||r.input.value||r.words.length<2)return;
  var prev=r.i;
  r.i=(r.i+1)%r.words.length;
  r.spans[prev].classList.remove("on");
  r.spans[prev].classList.add("out");
  r.spans[r.i].classList.add("on");
  rotSize(r);
  setTimeout(function(){                       // park the departed word back below, silently
    var s=r.spans[prev];
    if(!s.classList.contains("out"))return;
    s.classList.add("nt");
    s.classList.remove("out");
    void s.offsetWidth;
    s.classList.remove("nt");
  },ROT_SETTLE_MS);
}
function mountRotator(input,words,opts){
  if(!input||!words||!words.length)return null;
  var host=input.parentElement;
  if(!host)return null;
  opts=opts||{};
  if(getComputedStyle(host).position==="static")host.style.position="relative";
  var el=document.createElement("div");
  el.className="exrot";
  el.setAttribute("aria-hidden","true");
  el.innerHTML=(opts.lead?'<span class="exfix">'+esc(opts.lead)+'</span>':"")+
    '<span class="exslot">'+words.map(function(w,i){
      return '<span class="exword'+(i===0?" on":"")+'" style="--st:'+rotStagger(w)+'s">'+rollLetters(w)+'</span>';
    }).join("")+'</span>'+
    (opts.tail?'<span class="exfix">'+esc(opts.tail)+'</span>':"");
  var cs=getComputedStyle(input);
  el.style.fontFamily=cs.fontFamily;el.style.fontSize=cs.fontSize;
  el.style.fontWeight=cs.fontWeight;el.style.letterSpacing=cs.letterSpacing;
  el.style.paddingLeft=cs.paddingLeft;el.style.paddingRight=cs.paddingRight;
  host.appendChild(el);
  el.style.left=input.offsetLeft+"px";
  el.style.top=input.offsetTop+"px";
  el.style.width=input.offsetWidth+"px";
  el.style.height=input.offsetHeight+"px";
  var r={el:el,input:input,words:words,i:0,paused:false,
         slot:el.querySelector(".exslot"),spans:[].slice.call(el.querySelectorAll(".exword"))};
  input.placeholder="";
  rotSize(r);rotSync(r);
  input.addEventListener("input",function(){rotSync(r);});
  input.addEventListener("focus",function(){r.paused=true;});
  input.addEventListener("blur",function(){r.paused=false;});
  rotators.push(r);
  return r;
}
function mountRotators(){
  stopRotators();
  var s=document.getElementById("f-search");
  if(s)mountRotator(s,SEARCH_EXAMPLES,{lead:"Try “",tail:"”"});
  var kw=document.getElementById("f-kw"),kwEx=catExamples(catFilter);
  if(kw&&kwEx)mountRotator(kw,kwEx,{lead:"e.g. "});
  mountSuburbRotator();
  var ti=document.getElementById("f-title");
  if(ti)mountRotator(ti,TITLE_EXAMPLES,{lead:"e.g. "});
  if(!rotTimer)rotTimer=setInterval(function(){rotators.forEach(rotAdvance);},ROT_STEP_MS);
}
function mountSuburbRotator(){
  var sb=document.getElementById("a-suburb");
  if(sb)mountRotator(sb,suburbExamples(),{lead:"e.g. "});
}
function heroHtml(){
  var s=HERO_SLIDES[heroIdx%HERO_SLIDES.length];
  return '<div class="hero reveal" id="heroBox" style="background-image:linear-gradient(180deg,rgba(10,20,16,.05) 40%,rgba(10,20,16,.82)),url(&quot;'+s.img+'&quot;)" data-act="herogo" data-id="'+esc(s.cat)+'">'+
    '<div class="heroin">'+
      '<span class="heroeyebrow">'+esc(s.eyebrow)+'</span>'+
      '<h1 class="heroh">'+esc(s.headline)+'</h1>'+
      '<button type="button" class="pill pri" data-act="herogo" data-id="'+esc(s.cat)+'">Browse '+esc(s.eyebrow)+' →</button>'+
    '</div>'+
    '<div class="herodots">'+HERO_SLIDES.map(function(x,i){
      return '<button type="button" class="hdot'+(i===heroIdx?" on":"")+'" data-act="herodot" data-id="'+i+'"'+
             ' aria-label="Show '+esc(x.eyebrow)+'"'+(i===heroIdx?' aria-current="true"':"")+'></button>';
    }).join("")+'</div>'+
  '</div>';
}
function swapHero(){
  var h=document.getElementById("heroBox");
  if(!h)return;
  h.outerHTML=heroHtml();
  var nh=document.getElementById("heroBox");
  if(nh)nh.classList.add("in");
}
function startHeroRotation(){
  clearInterval(heroTimer);
  heroTimer=setInterval(function(){
    heroIdx=(heroIdx+1)%HERO_SLIDES.length;
    if(tab==="feed")swapHero();
  },5000);
}

var me=null, items=[], notifs=[], receipts=[], unread=0, tab="feed", authMode="login", dbMode="demo", feedScope="suburb", searchQ="", catFilter="all", showAllCats=false;
var filterMin="",filterMax="",filterKeyword="";
var CAT_FILTER_LABEL={vehicles:"Make or model",property_rent:"Bedrooms or feature",property_sale:"Bedrooms or feature",jobs:"Role or industry",services:"Type of service",classifieds:"Keyword"};
/* Example words for the animated rotators — one list per category, so the hint
   under every keyword box keeps cycling through things people actually search. */
var CAT_FILTER_EXAMPLES={
  vehicles:["Corolla","HiLux dual cab","Mazda 3 hatch","low kms, auto","Ranger XLT","diesel wagon","first car","7 seater"],
  property_rent:["2 bedroom","pet friendly","near the station","furnished studio","house with a yard","granny flat"],
  property_sale:["3 bedroom","renovated kitchen","big backyard","townhouse","first home","double garage"],
  jobs:["barista","warehouse, casual","weekend shifts","apprentice sparky","admin, part time","hospitality"],
  services:["cleaning","lawn mowing","furniture removal","handyman","end of lease clean","pet sitting"],
  classifieds:["anything, really","free to a good home","moving out sale","garage sale finds"],
  furniture:["two-seater couch","dining table","bookshelf","bed frame","office chair","outdoor setting"],
  electronics:["PS5","monitor","laptop","air fryer","noise cancelling headphones","projector"],
  clothing:["winter coat","school uniform","running shoes","vintage denim","formal dress"],
  family:["pram","cot","high chair","car seat","baby carrier"],
  entertainment:["board games","vinyl records","Switch games","DVD boxset"],
  books:["cookbooks","uni textbooks","crime novels","kids picture books"],
  kitchen:["stand mixer","air fryer","dinner set","coffee machine","slow cooker"],
  toys:["LEGO","trampoline","scooter","puzzles","dolls house"],
  garden:["pots and planters","lawn mower","outdoor setting","garden tools","BBQ"],
  sports:["surfboard","road bike","weights set","golf clubs","cricket gear"],
  pets:["dog crate","fish tank","cat tower","bird cage"],
  homegoods:["rug","floor lamp","mirror","curtains","artwork"],
  homeimprove:["power tools","paint","timber offcuts","tiles","ladder"],
  music:["acoustic guitar","keyboard","amp","drum kit","violin"],
  office:["standing desk","office chair","filing cabinet","monitor arm"],
  hobbies:["sewing machine","art supplies","camera gear","model kits"],
  other:["anything, really","free to a good home","moving out sale"]
};
function catExamples(cat){return CAT_FILTER_EXAMPLES[cat]||null;}
var TITLE_EXAMPLES=["Two-seater couch, minor wear","IKEA bookshelf, flat-packed","Bar fridge, works fine","Kids bike, 16 inch","Dining chairs x4","Box of moving boxes","Desk lamp, barely used","Pot plants, free to a good home"];
var googleClientId=null, ebayEnabled=false, domainEnabled=false, jobsEnabled=false, ebayResults=null, ebayLoading=false, leaderboard=null;
/* "From the web" — inline external results per category. Goods categories pull real
   eBay AU listings (images/prices) through our API proxy; categories whose big AU
   players offer no public API (Carsales, realestate.com.au, Seek…) get branded
   source tiles instead — never a fake scrape. */
var EXT_SEEDS={vehicles:"car",classifieds:"secondhand",furniture:"furniture",electronics:"electronics",clothing:"clothes",family:"baby kids",entertainment:"movies games",books:"books",kitchen:"kitchen appliances",toys:"toys games",garden:"garden outdoor",sports:"sporting goods",pets:"pet supplies",homegoods:"home decor",homeimprove:"power tools",music:"musical instruments",office:"office supplies",hobbies:"craft hobby",other:"secondhand"};
var EXT_LINK_SITES={
  vehicles:[["Carsales","https://www.carsales.com.au"],["Gumtree Cars","https://www.gumtree.com.au/s-cars-vans-utes/c18320"],["Marketplace","https://www.facebook.com/marketplace/category/vehicles"]],
  property_rent:[["realestate.com.au","https://www.realestate.com.au/rent"],["Domain","https://www.domain.com.au/rent"]],
  property_sale:[["realestate.com.au","https://www.realestate.com.au/buy"],["Domain","https://www.domain.com.au/sale"]],
  jobs:[["Seek","https://www.seek.com.au"],["Indeed AU","https://au.indeed.com/jobs?q="]],
  services:[["Airtasker","https://www.airtasker.com"],["hipages","https://hipages.com.au"]],
  classifieds:[["Gumtree","https://www.gumtree.com.au"],["Marketplace","https://www.facebook.com/marketplace"]]
};
var extLoading=false,extResults=null,extKey=null,extCache={},extTimer=null;
function extQueryFor(cat,q){
  q=(q||"").trim();
  if(q)return q;
  return EXT_SEEDS[cat]||"";
}
var DOMAIN_CATS={property_rent:"Rent",property_sale:"Sale"};
function loadExternal(cat,q,force){
  if(cat==="all"||cat==="free")cat=null;
  loadPriceIndex(cat);
  /* Property: real Domain.com.au listings when the API keys are configured */
  if(cat&&DOMAIN_CATS[cat]&&domainEnabled){
    var dKey="domain:"+cat+":"+feedScope+":"+(filterMax||"");
    if(!force&&extKey===dKey)return;
    extKey=dKey;
    if(extCache[dKey]){extResults={mode:"property",cat:cat,items:extCache[dKey]};extLoading=false;return;}
    extLoading=true;extResults=null;
    var dq="/search/domain?type="+DOMAIN_CATS[cat]+"&scope="+(feedScope==="all"?"all":"suburb")+(filterMax?"&maxPrice="+encodeURIComponent(filterMax):"");
    api(dq).then(function(j){
      if(extKey!==dKey)return;
      extCache[dKey]=j.results||[];
      extLoading=false;extResults={mode:"property",cat:cat,items:extCache[dKey]};
      repaintExternal();
    }).catch(function(e){
      if(extKey!==dKey)return;
      extLoading=false;extResults={mode:"error",error:e.message};
      repaintExternal();
    });
    return;
  }
  /* Services: Google Places if a key is set, otherwise OpenStreetMap — the
     backend picks, so there is always something real to show here. */
  if(cat==="services"){
    var sq=(q||"").trim();
    var sKey="svc:"+feedScope+":"+sq.toLowerCase();
    if(!force&&extKey===sKey)return;
    extKey=sKey;
    if(extCache[sKey]){extResults={mode:"services",cat:cat,items:extCache[sKey]};extLoading=false;return;}
    extLoading=true;extResults=null;
    api("/search/services?scope="+(feedScope==="all"?"all":"suburb")+(sq?"&q="+encodeURIComponent(sq):"")).then(function(j){
      if(extKey!==sKey)return;
      extCache[sKey]=j.results||[];
      extLoading=false;extResults={mode:"services",cat:cat,items:extCache[sKey]};
      repaintExternal();
    }).catch(function(e){
      if(extKey!==sKey)return;
      extLoading=false;extResults={mode:"error",error:e.message,cat:cat};
      repaintExternal();
    });
    return;
  }
  /* Property without Domain access: official ABS medians beat an empty panel */
  if(cat&&DOMAIN_CATS[cat]&&!domainEnabled){
    var pKey="absprop:"+feedScope;
    if(!force&&extKey===pKey)return;
    extKey=pKey;
    if(extCache[pKey]){extResults={mode:"propstats",cat:cat,stats:extCache[pKey]};extLoading=false;return;}
    extLoading=true;extResults=null;
    api("/search/property-stats?scope="+(feedScope==="all"?"all":"suburb")).then(function(j){
      if(extKey!==pKey)return;
      extCache[pKey]=j.stats||null;
      extLoading=false;extResults={mode:"propstats",cat:cat,stats:extCache[pKey]};
      repaintExternal();
    }).catch(function(e){
      if(extKey!==pKey)return;
      extLoading=false;extResults={mode:"error",error:e.message,cat:cat};
      repaintExternal();
    });
    return;
  }
  /* Jobs: real ads from Adzuna's AU index when a free key is configured */
  if(cat==="jobs"){
    loadJobInsight();
    var jq=(q||"").trim();
    var jKey="jobs:"+feedScope+":"+jq.toLowerCase();
    if(!force&&extKey===jKey)return;
    extKey=jKey;
    if(extCache[jKey]){extResults={mode:"jobs",cat:cat,items:extCache[jKey]};extLoading=false;return;}
    extLoading=true;extResults=null;
    api("/search/jobs?scope="+(feedScope==="all"?"all":"suburb")+(jq?"&q="+encodeURIComponent(jq):"")).then(function(j){
      if(extKey!==jKey)return;
      extCache[jKey]=j.results||[];
      extLoading=false;extResults={mode:"jobs",cat:cat,items:extCache[jKey]};
      repaintExternal();
    }).catch(function(e){
      if(extKey!==jKey)return;
      extLoading=false;extResults={mode:"error",error:e.message,cat:cat};
      repaintExternal();
    });
    return;
  }
  /* Only categories with nothing fetchable fall straight through to source links */
  if(cat&&EXT_LINK_SITES[cat]&&!EXT_SEEDS[cat]){extResults={mode:"links",cat:cat};extLoading=false;extKey=null;return;}
  var query=extQueryFor(cat,q);
  if(!query||!ebayEnabled){extResults=null;extLoading=false;extKey=null;return;}
  var key=(cat||"")+":"+query.toLowerCase();
  if(!force&&extKey===key)return;
  extKey=key;
  if(extCache[key]){extResults={mode:"results",q:query,cat:cat,items:extCache[key]};extLoading=false;return;}
  extLoading=true;extResults=null;
  api("/search/ebay?q="+encodeURIComponent(query)+(cat?"&cat="+encodeURIComponent(cat):"")).then(function(j){
    if(extKey!==key)return;
    extCache[key]=j.results||[];
    extLoading=false;extResults={mode:"results",q:query,cat:cat,items:extCache[key]};
    repaintExternal();
  }).catch(function(e){
    if(extKey!==key)return;
    extLoading=false;extResults={mode:"error",error:e.message,cat:cat};
    repaintExternal();
  });
}
function repaintExternal(){
  var box=document.getElementById("extPanel");
  if(box)box.outerHTML=externalPanelHtml();
  /* the empty state shrinks once real web results exist, so redraw it too */
  var fl=document.getElementById("feedList");
  if(fl&&!feedItems().length)fl.innerHTML=feedListHtml();
  initScrollAnim();
  var nb=document.getElementById("extPanel");
  if(nb)nb.querySelectorAll(".reveal").forEach(function(el){el.classList.add("in");});
}
var draft={category:"other",platforms:["Marketplace","Freecycle"],media:[],priced:false,concierge:false};
var modalItemId=null, modalMiniMode=null, modalMiniId=null;
var compareIds=[];
var io=null;

function esc(s){return s==null?"":String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function toast(msg,err){var el=document.getElementById("toast");el.textContent=msg;el.classList.toggle("err",!!err);el.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(function(){el.classList.remove("show");},3800);}
function fmtD(ts){return new Date(ts).toLocaleDateString(undefined,{month:"short",day:"numeric"});}
function fmtDT(ts){var d=new Date(ts);return fmtD(ts)+" "+d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});}
function daysTo(ts){return Math.ceil((ts-Date.now())/86400000);}
function money(n){n=Math.round(n*100)/100;var s=Number.isInteger(n)?String(n):n.toFixed(2);return "$"+s.replace(/\B(?=(\d{3})+(?!\d))/g,",");}
function theme(){return localStorage.getItem("dibs-theme")||"light";}
function applyTheme(){document.documentElement.setAttribute("data-theme",theme());}
function btn(act,id,label,variant){return '<button class="pill'+(variant?" "+variant:"")+'" data-act="'+act+'" data-id="'+id+'">'+label+'</button>';}

var guestMode=false;
function api(path,method,body){
  /* In guest mode every read carries an explicit marker — the server refuses to
     treat a request as a guest without it, so a signed-out visitor still lands
     on the login screen rather than being dropped into a tour. */
  if(guestMode)path+=(path.indexOf("?")>-1?"&":"?")+"guest=1";
  return fetch("/api"+path,{method:method||"GET",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:body?JSON.stringify(body):undefined})
  .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||"Request failed");return j;});});
}

/* ---------- boot ---------- */
function boot(){
  applyTheme();
  bindModalOnce();
  window.addEventListener("resize",function(){if(me)positionDockLiquid();});
  api("/config").then(function(j){googleClientId=j.googleClientId||null;ebayEnabled=!!j.ebayEnabled;domainEnabled=!!j.domainEnabled;jobsEnabled=!!j.jobsEnabled;if(!me)render();}).catch(function(){});
  api("/me").then(function(j){me=j.me;dbMode=j.dbMode;refresh();startPolling();}).catch(function(){render();});
}
function refresh(){
  return Promise.all([api("/items"),api("/notifications"),api("/receipts").catch(function(){return {receipts:[]};})]).then(function(r){
    items=r[0].items;notifs=r[1].notifications;unread=r[1].unread;receipts=r[2].receipts||[];render();
  }).catch(function(e){toast(e.message,true);render();});
}
var pollTimer=null;
function startPolling(){
  startHeroRotation();
  clearInterval(pollTimer);
  pollTimer=setInterval(function(){
    if(!me)return;
    api("/notifications").then(function(j){
      if(j.unread>unread)toast(j.notifications[0].text);
      notifs=j.notifications;unread=j.unread;paintBadge();
    }).catch(function(){});
  },25000);
}
/* ---------- goods: ABS price-index bar ---------- */
/* Only categories with a real CPI expenditure class get a bar — the backend
   returns null for the rest rather than stretching an unrelated series. */
var CPI_CATS={vehicles:1,furniture:1,clothing:1,electronics:1,homegoods:1,kitchen:1,toys:1,books:1,sports:1,garden:1,homeimprove:1};
var priceIdx=null, priceIdxKey=null;
function loadPriceIndex(cat){
  if(!cat||!CPI_CATS[cat]){priceIdx=null;priceIdxKey=null;return;}
  var k="cpi:"+cat+":"+feedScope;
  if(priceIdxKey===k)return;
  priceIdxKey=k; priceIdx=null;
  api("/search/price-index?cat="+encodeURIComponent(cat)+"&scope="+(feedScope==="all"?"all":"state")).then(function(j){
    if(priceIdxKey!==k)return;
    priceIdx=j.index||null;
    if(priceIdx)repaintExternal();
  }).catch(function(){});
}
function priceIndexHtml(cat){
  if(!priceIdx||!cat||!CPI_CATS[cat])return "";
  var c=priceIdx.change, up=c>0, flat=Math.abs(c)<0.05;
  return '<div class="jvbar">'+
    '<span class="jvn '+(flat?"":up?"up":"down")+'">'+(up?"+":"")+c.toFixed(1)+'%</span>'+
    '<span class="jvl">'+esc(priceIdx.label)+' in '+esc(priceIdx.region)+' vs a year ago'+
      (flat?'':up?' — secondhand sidesteps that':' — new prices are falling too')+
      '. ABS CPI, '+esc(priceIdx.period)+'</span>'+
  '</div>';
}

/* ---------- jobs: insight strip + career guides ---------- */
var jobInsight=null, jobInsightKey=null;
function initialsFor(s){
  var w=String(s||"").replace(/[^A-Za-z0-9 ]/g," ").trim().split(/\s+/);
  return ((w[0]||"?")[0]+(w[1]?w[1][0]:"")).toUpperCase();
}
function agoFrom(iso){
  var t=Date.parse(iso); if(isNaN(t))return "";
  var d=Math.floor((Date.now()-t)/86400000);
  if(d<=0)return "today"; if(d===1)return "yesterday";
  if(d<7)return d+"d ago"; if(d<31)return Math.floor(d/7)+"w ago";
  return Math.floor(d/30)+"mo ago";
}
function loadJobInsight(){
  var k="jv:"+feedScope;
  if(jobInsightKey===k)return;
  jobInsightKey=k;
  api("/search/job-insights?scope="+(feedScope==="all"?"all":"state")).then(function(j){
    if(jobInsightKey!==k)return;
    jobInsight=j.insight||null;
    if(jobInsight)repaintExternal();
  }).catch(function(){});
}
function jobInsightHtml(){
  if(!jobInsight)return "";
  var i=jobInsight, dir=i.change==null?"":(i.change>0?"up":i.change<0?"down":"");
  return '<div class="jvbar">'+
    '<span class="jvn">'+i.vacancies.toLocaleString()+'</span>'+
    '<span class="jvl">job vacancies in '+esc(i.region)+
      (i.change!=null?' <b class="'+dir+'">'+(i.change>0?"▲":i.change<0?"▼":"")+' '+Math.abs(i.change).toFixed(1)+'%</b> on last quarter':'')+
      ' — ABS, '+esc(i.period)+'</span>'+
  '</div>';
}
/* Curated links to the authoritative Australian sources, not invented articles —
   pay rates, tax file numbers and job-seeker support all live on .gov.au. */
var JOB_GUIDES=[
  ["Check the award rate for your job","Fair Work's calculator gives the legal minimum pay, penalty rates and overtime for your role.","https://calculate.fairwork.gov.au/"],
  ["Your rights at work","What every employee in Australia is entitled to — leave, breaks, notice and unfair dismissal.","https://www.fairwork.gov.au/employment-conditions/national-employment-standards"],
  ["Apply for a Tax File Number","You'll need a TFN before your first pay, or you'll be taxed at the top rate.","https://www.ato.gov.au/individuals-and-families/tax-file-number/apply-for-a-tfn"],
  ["Working holiday & visa work rights","Check what your visa allows before you accept a role.","https://immi.homeaffairs.gov.au/visas/working-in-australia"],
  ["Help while you look for work","JobSeeker payment eligibility and employment services through Services Australia.","https://www.servicesaustralia.gov.au/jobseeker-payment"],
];
function jobGuidesHtml(){
  return '<div class="jguides">'+
    '<div class="jgh">Before you apply</div>'+
    JOB_GUIDES.map(function(g){
      return '<a class="jguide" href="'+esc(g[2])+'" target="_blank" rel="noopener">'+
        '<span class="jgt">'+esc(g[0])+' <span class="ic-inline">'+ICONS.external+'</span></span>'+
        '<span class="jgd">'+esc(g[1])+'</span>'+
      '</a>';
    }).join("")+
    '<p class="hint" style="margin:8px 0 0">Official Australian government sources — Dibs just points you at them.</p>'+
  '</div>';
}

/* render() rebuilds the strip, so the chosen tile can end up scrolled off to one
   side — especially for categories late in the list. Bring it back into view. */
function scrollCatIntoView(id){
  requestAnimationFrame(function(){
    var el=document.querySelector('[data-act="catf"][data-id="'+id+'"]');
    if(!el||!el.parentElement)return;
    var strip=el.parentElement;
    if(strip.scrollWidth<=strip.clientWidth)return;
    var target=el.offsetLeft-(strip.clientWidth/2)+(el.offsetWidth/2);
    strip.scrollTo({left:Math.max(0,target),behavior:"smooth"});
  });
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
  var orig=btnEl.innerHTML;btnEl.disabled=true;btnEl.innerHTML="Locating…";
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
      '<li><span class="ck">✓</span>Neighbours only ever see an anonymous handle like <b>Wombat-482</b> — never your name or number.</li>'+
      '<li><span class="ck">✓</span>Nobody claims it? It\'s auto-booked for your council truck day, so nothing sits on the kerb.</li>'+
      '<li><span class="ck">✓</span>Also unifies vehicles, property, jobs and services in one place — no more juggling five different marketplace apps.</li>'+
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
    '<div class="field"><label for="a-suburb">Suburb</label><div class="field-inline"><input id="a-suburb" placeholder="e.g. '+esc(suburbPlaceholderText())+'" maxlength="40"><button type="button" class="locbtn" data-act="locate" data-target="a-suburb">'+ICONS.locate+'<span>Locate</span></button></div><p class="hint">Or just type it — change it any time in Profile.</p></div>'+
    '<div class="field"><label for="a-state">State</label><select id="a-state">'+AU_STATES.map(function(s){return '<option value="'+s[0]+'"'+(s[0]===suburbPhState?" selected":"")+'>'+s[1]+' ('+s[0]+')</option>';}).join("")+'</select></div>'+
    '<div class="field"><label for="a-day">Council truck day</label><select id="a-day">'+WD.map(function(w,i){return '<option value="'+i+'"'+(i===3?" selected":"")+'>'+w+'</option>';}).join("")+'</select></div>'+
    '<button type="submit" class="pill pri block">Create account</button>'+
    '</form>'+
    '<div class="switch">Already have an account? <a data-act="switch-auth">Log in</a></div>'+
    '<div class="switch">Just looking? <a data-act="guest">Have a look around first</a></div>'+
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
  '<div class="switch">Just looking? <a data-act="guest">Have a look around first</a></div>'+
  '</div>'+
  '<div class="legal" style="margin-top:18px"><a href="/privacy" target="_blank">Privacy</a> · <a href="/terms" target="_blank">Terms</a> · Works Australia-wide</div>'+
  '</div>';
}

/* ---------- guest mode ----------
   A signed-out look around. Everything that writes is intercepted before it can
   reach the server, so a guest gets a clear prompt instead of a 401. */
var GUEST_BLOCKED={
  claim:"claim an item", unclaim:"change a claim", flag:"report a listing",
  "new-handle":"change your handle", concierge:"request council pickup",
  priced:"post a listing", save:"save a listing", rate:"leave a rating",
  handoff:"confirm a handoff", del:"delete a listing", compare:"compare listings",
};
function enterGuest(){
  tab="feed";guestMode=true;
  api("/me").then(function(j){
    me=j.me;dbMode=j.dbMode;
    return api("/items").then(function(r){items=r.items||[];render();});
  }).catch(function(){toast("Couldn't start the tour — try again.",true);});
}
function guestBannerHtml(){
  if(!me||!me.guest)return "";
  return '<div class="note guestbar reveal">'+
    "You're browsing as a guest around "+esc(me.suburb)+" — listings, jobs, services and market data are live. "+
    '<a data-act="switch-auth" class="glink">Create a free account</a> to post or claim anything.'+
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
  return '<div class="emoji">'+catIcon(it.category)+'</div>';
}
function stubFor(it){
  var concierge=it.mine&&it.concierge&&it.concierge.requested?'<span class="ic-inline">'+ICONS.truck+'</span> Concierge requested — ':'';
  if(it.observation)return concierge+'Hidden while '+it.flags+' flag'+(it.flags>1?"s are":" is")+' reviewed';
  if(it.status==="available"){
    if(!catKerb(it.category))return concierge+'Listed '+fmtD(it.postedAt)+' — message the poster to arrange a time';
    var d=Math.max(daysTo(it.pickupAt),0);return concierge+'Unclaimed after <span class="num">'+d+'d</span> → auto-booked for the truck';
  }
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
    if(it.status!=="collected"&&it.status!=="collected_by_truck"&&!it.flaggedByMe)acts+=btn("flag",it.id,"Flag","gh");
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
      (it.sample?'<span class="newchip sample">Sample</span>':isNew?'<span class="newchip">New</span>':"")+
      '<span class="pricebadge'+(it.price>0?"":" free")+'">'+(it.price>0?money(it.price):"Free")+'</span>'+
    '</div>'+
    '<div class="cbody" data-act="open" data-id="'+it.id+'">'+
      '<p class="ctt">'+esc(it.title)+'</p>'+
      '<div class="cm"><span>'+esc(it.poster.handle)+(it.poster.trusted?' <span class="trustchip">✓</span>':'')+'</span><span>·</span><span>'+esc(it.poster.suburb)+'</span></div>'+
    '</div>'+
    '<div class="cfoot"><span class="stubtxt">'+stubFor(it)+'</span>'+primaryAction(it)+
    '<button class="iconlink'+(compareIds.indexOf(it.id)>-1?" on":"")+'" data-act="togglecompare" data-id="'+it.id+'" title="Add to compare">'+ICONS.compare+'</button>'+
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
  var html=modalMiniMode==="flag"?flagModalHtml():modalMiniMode==="rate"?rateModalHtml():modalMiniMode==="compare"?compareModalHtml():itemModalHtml(modalItemId);
  ov.innerHTML='<div class="modal">'+html+'</div>';
  ov.classList.add("show");
  if(modalItemId&&!modalMiniMode){
    var it=items.filter(function(x){return x.id===modalItemId;})[0];
    if(it&&it.poster&&it.poster.suburb)loadSuburbMap(it.poster.suburb,"map-"+it.id);
  }
}
var SUBURB_GEO_CACHE={};
function loadSuburbMap(suburb,boxId){
  var box=document.getElementById(boxId);
  if(!box)return;
  function showFallback(){
    var q=encodeURIComponent(suburb+", Australia");
    box.innerHTML='<a class="pill gh sm" href="https://www.openstreetmap.org/search?query='+q+'" target="_blank" rel="noopener">View '+esc(suburb)+' on the map ↗</a>';
  }
  function render(geo){
    var d=0.045;
    var bbox=(geo.lon-d)+","+(geo.lat-d)+","+(geo.lon+d)+","+(geo.lat+d);
    box.innerHTML='<iframe title="Map of '+esc(suburb)+'" loading="lazy" style="border:0;width:100%;height:170px;border-radius:14px" src="https://www.openstreetmap.org/export/embed.html?bbox='+bbox+'&marker='+geo.lat+','+geo.lon+'&layer=mapnik"></iframe>'+
      '<p class="hint" style="margin:4px 0 0">Approximate area only — exact location is shared after a claim is confirmed.</p>';
  }
  if(SUBURB_GEO_CACHE[suburb]){render(SUBURB_GEO_CACHE[suburb]);return;}
  fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=au&q="+encodeURIComponent(suburb+", Australia"))
    .then(function(r){return r.json();})
    .then(function(j){
      if(!j||!j.length){showFallback();return;}
      var geo={lat:Number(j[0].lat),lon:Number(j[0].lon)};
      SUBURB_GEO_CACHE[suburb]=geo;
      if(document.getElementById(boxId))render(geo);
    })
    .catch(showFallback);
}
function itemModalHtml(id){
  var it=items.filter(function(x){return x.id===id;})[0];
  if(!it)return '<button class="modal-close" data-act="close-modal">×</button><div style="padding:60px 20px;text-align:center" class="hint">This tag is no longer available.</div>';
  var st=stampFor(it);
  var mediaHtml;
  if(it.media&&it.media.length){
    mediaHtml='<div class="gallery-scroll">'+it.media.map(function(m){return m.type==="video"?'<span><video src="'+m.data+'" controls muted playsinline></video></span>':'<span><img src="'+m.data+'" alt=""></span>';}).join("")+'</div>';
  }else{
    mediaHtml='<div class="emoji">'+catIcon(it.category)+'</div>';
  }
  var trackHtml='<div class="track"><p class="tkt">Tracking</p>'+(it.history||[]).map(function(h){
    return '<div class="tki'+(h.alert?" alert":"")+'">'+esc(h.label)+'<span class="when">'+fmtDT(h.at)+'</span></div>';
  }).join("")+'</div>';
  return '<button class="modal-close" data-act="close-modal">×</button>'+
    '<div class="modal-hero"><span class="stamp '+st[1]+'" style="top:14px;right:14px">'+esc(st[0])+'</span>'+mediaHtml+'</div>'+
    '<div class="modal-body">'+
    '<span class="modal-price'+(it.price>0?"":" free")+'">'+(it.price>0?money(it.price)+" · cash-free at handoff":"Free")+'</span>'+
    '<h3 class="modal-title">'+esc(it.title)+'</h3>'+
    '<div class="modal-meta"><span>'+esc(it.poster.handle)+(it.poster.trusted?' <span class="trustchip">✓ trusted</span>':'')+'</span><span>·</span><span>'+esc(it.poster.suburb)+'</span><span>·</span><span>'+fmtD(it.postedAt)+'</span></div>'+
    '<div class="modal-map" id="map-'+it.id+'"><p class="hint" style="margin:0">Loading map…</p></div>'+
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
function compareModalHtml(){
  var its=compareIds.map(function(id){return items.filter(function(x){return x.id===id;})[0];}).filter(Boolean);
  if(!its.length)return '<button class="modal-close" data-act="close-modal">×</button><div style="padding:40px 20px;text-align:center" class="hint">Nothing to compare — tap the compare icon on an item first.</div>';
  return '<button class="modal-close" data-act="close-modal">×</button>'+
    '<div class="modal-body"><h3 class="modal-title">Compare '+its.length+' item'+(its.length>1?"s":"")+'</h3>'+
    '<div class="comparegrid">'+its.map(function(it){
      var c=CATS.filter(function(x){return x[0]===it.category;})[0];
      return '<div class="comparecard">'+
        '<div class="cmp-media">'+mediaThumb(it)+'</div>'+
        '<div class="cmp-title">'+esc(it.title)+'</div>'+
        '<div class="cmp-price'+(it.price>0?"":" free")+'">'+(it.price>0?money(it.price):"Free")+'</div>'+
        '<div class="cmp-row"><span>Category</span><b>'+(c?esc(c[1]):"Other")+'</b></div>'+
        '<div class="cmp-row"><span>Suburb</span><b>'+esc(it.poster.suburb)+'</b></div>'+
        '<div class="cmp-row"><span>Posted</span><b>'+fmtD(it.postedAt)+'</b></div>'+
        '<div class="cmp-row"><span>Poster</span><b>'+esc(it.poster.handle)+'</b></div>'+
        '<button type="button" class="pill gh sm" data-act="open" data-id="'+it.id+'">View details</button>'+
        '<button type="button" class="pill dgr sm" data-act="togglecompare" data-id="'+it.id+'">Remove</button>'+
      '</div>';
    }).join("")+'</div></div>';
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
  if(catFilter==="free")act=act.filter(function(i){return i.price===0;});
  else if(catFilter!=="all"){
    act=act.filter(function(i){return i.category===catFilter;});
    if(filterMin!=="")act=act.filter(function(i){return i.price>=Number(filterMin);});
    if(filterMax!=="")act=act.filter(function(i){return i.price<=Number(filterMax);});
    if(filterKeyword){var fkw=filterKeyword.toLowerCase();act=act.filter(function(i){return (i.title+" "+(i.desc||"")).toLowerCase().indexOf(fkw)>-1;});}
  }
  if(searchQ){
    var sp=parseSmartQuery(searchQ);
    act=act.filter(function(i){
      if(sp.maxPrice!=null&&i.price>sp.maxPrice)return false;
      if(sp.catGuess)return i.category===sp.catGuess;
      if(!sp.terms.length)return true;
      var hay=(i.title+" "+(i.desc||"")+" "+i.category+" "+(i.poster.suburb||"")).toLowerCase();
      return sp.terms.some(function(t){return hay.indexOf(t)>-1;});
    }).map(function(i){
      var hay=(i.title+" "+(i.desc||"")+" "+i.category).toLowerCase();
      i._score=(sp.catGuess&&i.category===sp.catGuess?5:0)+sp.terms.reduce(function(s,t){return s+(hay.indexOf(t)>-1?1:0);},0);
      return i;
    }).sort(function(a,b){return b._score-a._score;});
  }
  return act;
}
function currentSearchText(){
  var fs=document.getElementById("f-search");
  if(fs&&fs.value)return fs.value;
  var fkw=document.getElementById("f-kw");
  if(fkw&&fkw.value)return fkw.value;
  return searchQ||filterKeyword||"";
}
function quickMatches(query){
  if(!query)return [];
  var q=query.toLowerCase();
  var pool=items.filter(function(i){return !i.mine&&(i.status==="available"||i.status==="claimed"||i.status==="booked_for_truck")&&!i.observation;});
  if(catFilter!=="all"&&catFilter!=="free")pool=pool.filter(function(i){return i.category===catFilter;});
  return pool.filter(function(i){
    var hay=(i.title+" "+(i.desc||"")+" "+i.category+" "+(i.poster.suburb||"")).toLowerCase();
    return hay.indexOf(q)>-1;
  }).slice(0,5);
}
function dropdownHtml(query){
  var matches=quickMatches(query);
  if(matches.length){
    return matches.map(function(it){
      return '<div class="ddrow">'+
        '<button type="button" class="ddthumb" data-act="open" data-id="'+it.id+'">'+mediaThumb(it)+'</button>'+
        '<button type="button" class="ddinfo" data-act="open" data-id="'+it.id+'"><span class="ddtt">'+esc(it.title)+'</span><span class="ddmeta">'+(it.price>0?money(it.price):"Free")+' · '+esc(it.poster.suburb)+'</span></button>'+
        '<button type="button" class="iconlink'+(compareIds.indexOf(it.id)>-1?" on":"")+'" data-act="togglecompare" data-id="'+it.id+'" title="Add to compare">'+ICONS.compare+'</button>'+
      '</div>';
    }).join("");
  }
  var sp=parseSmartQuery(query);
  var activeCat=sp.catGuess||(catFilter!=="all"&&catFilter!=="free"?catFilter:null);
  var sites=psearchSites(activeCat);
  return '<div class="ddempty">No matches on '+APP+' yet — try elsewhere:</div>'+
    '<div class="ddelsewhere">'+Object.keys(sites).map(function(p){
      return p==="eBay AU"
        ?'<button type="button" class="pill gh sm" data-act="ebaysearch">eBay AU</button>'
        :'<button type="button" class="pill gh sm" data-act="psearch" data-pf="'+p+'">'+p+' ↗</button>';
    }).join("")+'</div>';
}
function updateDropdown(boxId,query){
  var box=document.getElementById(boxId);
  if(!box)return;
  if(!query){box.hidden=true;box.innerHTML="";return;}
  box.innerHTML=dropdownHtml(query);
  box.hidden=false;
}
function filterPanelHtml(){
  if(catFilter==="all"||catFilter==="free")return "";
  var kwLabel=CAT_FILTER_LABEL[catFilter]||"Keyword";
  var kwEx=catExamples(catFilter);
  var kwPh=kwEx?"e.g. "+kwEx[0]:"Refine your search";
  return '<div class="filterpanel reveal">'+
    '<div class="fprow"><label>Min $</label><input type="number" id="f-min" min="0" value="'+esc(filterMin)+'" placeholder="0"></div>'+
    '<div class="fprow"><label>Max $</label><input type="number" id="f-max" min="0" value="'+esc(filterMax)+'" placeholder="Any"></div>'+
    '<div class="fprow grow" style="position:relative"><label>'+esc(kwLabel)+'</label><input type="text" id="f-kw" value="'+esc(filterKeyword)+'" placeholder="'+esc(kwPh)+'" autocomplete="off"><div class="searchdrop" id="kwDrop" hidden></div></div>'+
    '<button type="button" class="pill gh sm" data-act="clearfilters">Clear</button>'+
  '</div>';
}
function feedListHtml(){
  var act=feedItems();
  if(act.length)return act.map(function(it,i){return card(it,i);}).join("");
  /* If the web panel below is about to fill the screen with real listings, the
     big empty state is just a hole between the filters and the goods. */
  var webComing=extLoading||(extResults&&((extResults.items&&extResults.items.length)||extResults.mode==="links"||(extResults.mode==="propstats"&&extResults.stats)));
  var msg=searchQ?'Nothing matches "'+esc(searchQ)+'" on '+APP+' yet':
          (feedScope==="suburb"?'Nothing in '+esc(me.suburb)+' yet — try All Australia':'Nothing posted here yet');
  if(webComing)return '<div class="emptyslim reveal">'+msg+' — here\'s what\'s live elsewhere:</div>';
  return '<div class="empty reveal"><span class="big">'+ICONS.all+'</span>'+msg+(searchQ?' — try the links below.':', or share the app link!')+'</div>';
}
function viewFeed(){
  var guestbar=guestBannerHtml();
  var demo=dbMode==="demo"?'<div class="note demo-warn reveal">Heads up — pilot demo storage: data may occasionally reset until the free database is attached (LAUNCH-KIT step 1).</div>':"";
  var search='<div class="searchwrap reveal"><span class="sic">'+ICONS.search+'</span><input id="f-search" placeholder="'+esc(searchPlaceholderText())+'" value="'+esc(searchQ)+'" autocomplete="off"><div class="searchdrop" id="searchDrop" hidden></div></div>';
  var loc='<div class="locrow reveal">'+
    '<button class="locchip'+(feedScope==="suburb"?" on":"")+'" data-act="scope" data-id="suburb"><span class="ci">'+ICONS.locate+'</span>'+esc(me.suburb)+'</button>'+
    '<button class="locchip'+(feedScope==="all"?" on":"")+'" data-act="scope" data-id="all"><span class="ci">'+ICONS.globe+'</span>All Australia</button>'+
  '</div>';
  var catList=showAllCats?CATS:CATS.filter(function(c){return c[4];});
  var catrail='<div class="catrail reveal">'+
    '<button class="cattile'+(catFilter==="all"?" on":"")+'" data-act="catf" data-id="all"><span class="circ">'+ICONS.all+'</span><span class="lbl">All</span></button>'+
    '<button class="cattile'+(catFilter==="free"?" on":"")+'" data-act="catf" data-id="free"><span class="circ">'+ICONS.gift+'</span><span class="lbl">Free stuff</span></button>'+
    catList.map(function(c){return '<button class="cattile'+(catFilter===c[0]?" on":"")+'" data-act="catf" data-id="'+c[0]+'"><span class="circ">'+catIcon(c[0])+'</span><span class="lbl">'+c[1]+'</span></button>';}).join("")+
    '<button class="cattile" data-act="togglecats"><span class="circ">'+(showAllCats?"–":"+")+'</span><span class="lbl">'+(showAllCats?"Less":"More")+'</span></button>'+
  '</div>';
  var searchSp=searchQ?parseSmartQuery(searchQ):null;
  var activeCat=(searchSp&&searchSp.catGuess)||(catFilter!=="all"&&catFilter!=="free"?catFilter:null);
  var noun=activeCat&&CAT_NOUN[activeCat];
  var psearchHeading=noun?"Can't find that "+noun+" on "+APP+"? Search the same thing everywhere:":"Can't find it on "+APP+"? Search the same thing everywhere:";
  var sites=psearchSites(activeCat);
  var psearch='<div class="psearch reveal">'+esc(psearchHeading)+
    '<div class="pbtns">'+Object.keys(sites).map(function(p){
      return p==="eBay AU"
        ?'<button class="pill gh sm" data-act="ebaysearch">eBay AU</button>'
        :'<button class="pill gh sm" data-act="psearch" data-pf="'+p+'">'+p+' ↗</button>';
    }).join("")+'</div></div>';
  return guestbar+demo+heroHtml()+'<h2 class="st reveal">Fresh near you</h2>'+search+loc+catrail+filterPanelHtml()+'<div id="feedList" class="itemgrid">'+feedListHtml()+'</div>'+externalPanelHtml()+psearch;
}
function externalPanelHtml(){
  var inner="";
  if(extLoading){
    inner='<div class="ebayrow">'+[1,2,3,4].map(function(){return '<div class="ebaycard shimmer"><div class="ebayph"></div><div class="et">&nbsp;</div></div>';}).join("")+'</div>';
  }else if(extResults&&extResults.mode==="links"){
    var cdef=CATS.filter(function(c){return c[0]===extResults.cat;})[0];
    inner=priceIndexHtml(extResults.cat)+'<p class="hint" style="margin:0 0 10px">'+esc(cdef?cdef[1]:"This category")+' listings live on these sites — they don\'t offer public feeds, so browsing opens in a new tab:</p>'+
      '<div class="extgrid">'+EXT_LINK_SITES[extResults.cat].map(function(s){
        var url=s[1]+(s[1].indexOf("?q=")>-1?encodeURIComponent(searchQ||filterKeyword||""):"");
        return '<a class="extsite" href="'+esc(url)+'" target="_blank" rel="noopener"><span class="xn">'+esc(s[0])+'</span><span class="xh">Browse '+esc(s[0])+' <span class="ic-inline">'+ICONS.external+'</span></span></a>';
      }).join("")+'</div>';
  }else if(extResults&&extResults.mode==="property"){
    var pcd=CATS.filter(function(c){return c[0]===extResults.cat;})[0];
    var where=feedScope==="all"?("across "+esc(me.state||"Australia")):("near "+esc(me.suburb));
    if(!extResults.items.length){
      inner='<p class="hint" style="margin:0">No '+esc(pcd?pcd[1].toLowerCase():"property")+' listings '+where+' right now.</p>'+
        '<div class="ddelsewhere" style="padding:10px 0 0"><a class="pill gh sm" style="text-decoration:none" href="https://www.domain.com.au/'+(extResults.cat==="property_rent"?"rent":"sale")+'" target="_blank" rel="noopener">Browse Domain <span class="ic-inline">'+ICONS.external+'</span></a></div>';
    }else{
      inner='<p class="hint" style="margin:0 0 10px">Live listings '+where+', straight from Domain.</p>'+
      '<div class="ebayrow">'+extResults.items.map(function(it){
        var specs=[];
        if(it.beds!=null)specs.push(it.beds+" bed");
        if(it.baths!=null)specs.push(it.baths+" bath");
        if(it.carspaces)specs.push(it.carspaces+" car");
        return '<a class="ebaycard" href="'+esc(it.url)+'" target="_blank" rel="noopener">'+
          (it.image?'<img src="'+esc(it.image)+'" alt="" loading="lazy">':'<div class="ebayph">'+catIcon(extResults.cat)+'</div>')+
          (it.price?'<div class="ep">'+esc(it.price)+'</div>':'')+
          '<div class="et">'+esc(it.title)+'</div>'+
          (specs.length?'<div class="espec">'+esc(specs.join(" · "))+'</div>':'')+
          '<span class="esrc">Domain</span>'+
        '</a>';
      }).join("")+'</div>'+
      '<a class="pill gh sm" style="display:inline-block;margin-top:10px;text-decoration:none" href="https://www.domain.com.au/'+(extResults.cat==="property_rent"?"rent":"sale")+'" target="_blank" rel="noopener">More on Domain <span class="ic-inline">'+ICONS.external+'</span></a>';
    }
  }else if(extResults&&extResults.mode==="services"){
    var swhere=feedScope==="all"?"across Australia":("around "+esc(me.suburb));
    if(!extResults.items.length){
      inner='<p class="hint" style="margin:0">No listed trades or services '+swhere+' yet — try All Australia, or a keyword like “cleaning”.</p>';
    }else{
      var ssrc=extResults.items[0].source;
      inner='<p class="hint" style="margin:0 0 10px">Local businesses '+swhere+', via '+esc(ssrc)+'.</p>'+
      '<div class="jobrow">'+extResults.items.map(function(it){
        var stars=it.rating?('★ '+it.rating.toFixed(1)+(it.reviews?' ('+it.reviews+')':'')):null;
        return '<a class="jobcard" href="'+esc(it.url)+'" target="_blank" rel="noopener">'+
          '<div class="jt">'+esc(it.title)+'</div>'+
          (it.where?'<div class="jm">'+esc(it.where)+'</div>':'')+
          ((it.kind||stars)?'<div class="jtags">'+[it.kind,stars].filter(Boolean).map(function(t){return '<span class="jtag">'+esc(t)+'</span>';}).join("")+'</div>':'')+
          '<span class="esrc">'+esc(it.source)+'</span>'+
        '</a>';
      }).join("")+'</div>'+
      '<div class="ddelsewhere" style="padding:10px 0 0">'+(EXT_LINK_SITES.services||[]).map(function(s){
        return '<a class="pill gh sm" style="text-decoration:none" href="'+esc(s[1])+'" target="_blank" rel="noopener">'+esc(s[0])+' <span class="ic-inline">'+ICONS.external+'</span></a>';
      }).join("")+'</div>';
    }
  }else if(extResults&&extResults.mode==="propstats"){
    var pst=extResults.stats;
    var plinks='<div class="ddelsewhere" style="padding:10px 0 0">'+(EXT_LINK_SITES[extResults.cat]||[]).map(function(s){
      return '<a class="pill gh sm" style="text-decoration:none" href="'+esc(s[1])+'" target="_blank" rel="noopener">'+esc(s[0])+' <span class="ic-inline">'+ICONS.external+'</span></a>';
    }).join("")+'</div>';
    if(!pst){
      inner='<p class="hint" style="margin:0">Market figures are unavailable right now.</p>'+plinks;
    }else{
      inner='<p class="hint" style="margin:0 0 10px">What places actually sold for in '+esc(pst.region)+' — official ABS figures, '+esc(pst.period)+'.</p>'+
      '<div class="statrow">'+pst.rows.map(function(r){
        var dir=r.change==null?"":(r.change>0?"up":r.change<0?"down":"flat");
        return '<div class="statcard">'+
          '<div class="sl">'+esc(r.label)+'</div>'+
          '<div class="sv">'+money(r.median)+'</div>'+
          (r.change!=null?'<div class="sc '+dir+'">'+(r.change>0?"▲ ":r.change<0?"▼ ":"")+Math.abs(r.change).toFixed(1)+'% on last quarter</div>':'')+
          (r.transfers!=null?'<div class="sm">'+r.transfers.toLocaleString()+' sold that quarter</div>':'')+
        '</div>';
      }).join("")+'</div>'+
      '<p class="hint" style="margin:10px 0 0">Live listings need a Domain agreement — these are the medians behind them.</p>'+plinks;
    }
  }else if(extResults&&extResults.mode==="jobs"){
    var jwhere=feedScope==="all"?"across Australia":("near "+esc(me.suburb));
    if(!extResults.items.length){
      inner='<p class="hint" style="margin:0">No job ads '+jwhere+' right now — try All Australia or a different keyword.</p>';
    }else{
      var jremote=extResults.items[0].remote;
      inner=jobInsightHtml()+
      '<p class="hint" style="margin:0 0 10px">'+(jremote
        ?'Remote roles open to Australia, via '+esc(extResults.items[0].source)+'.'
        :'Live job ads '+jwhere+'.')+'</p>'+
      '<div class="jobrow">'+extResults.items.map(function(it){
        var tags=[it.salary,it.contract,it.remote?"Remote":null].filter(Boolean);
        return '<a class="jobcard" href="'+esc(it.url)+'" target="_blank" rel="noopener">'+
          '<div class="jhead">'+
            '<span class="jlogo">'+(it.logo
              ?'<img src="'+esc(it.logo)+'" alt="" loading="lazy" referrerpolicy="no-referrer">'
              :'<span class="jinit">'+esc(initialsFor(it.company||it.title))+'</span>')+'</span>'+
            '<span class="jheadtxt">'+
              '<span class="jt">'+esc(it.title)+'</span>'+
              (it.company?'<span class="jco">'+esc(it.company)+'</span>':'')+
            '</span>'+
          '</div>'+
          (it.location?'<div class="jm"><span class="ic-inline">'+ICONS.locate+'</span> '+esc(it.location)+'</div>':'')+
          (tags.length?'<div class="jtags">'+tags.map(function(t){return '<span class="jtag">'+esc(t)+'</span>';}).join("")+'</div>':'')+
          '<div class="jfoot">'+
            '<span class="esrc">'+esc(it.source||"Adzuna")+(it.posted?' · '+esc(agoFrom(it.posted)):'')+'</span>'+
            '<span class="jgo">View role <span class="ic-inline">'+ICONS.external+'</span></span>'+
          '</div>'+
        '</a>';
      }).join("")+'</div>'+
      jobGuidesHtml()+
      '<div class="ddelsewhere" style="padding:10px 0 0">'+(EXT_LINK_SITES.jobs||[]).map(function(s){
        return '<a class="pill gh sm" style="text-decoration:none" href="'+esc(s[1])+'" target="_blank" rel="noopener">'+esc(s[0])+' <span class="ic-inline">'+ICONS.external+'</span></a>';
      }).join("")+'</div>';
    }
  }else if(extResults&&extResults.mode==="error"){
    inner='<p class="hint" style="margin:0;color:var(--red)">'+esc(extResults.error)+'</p>';
  }else if(extResults&&extResults.mode==="results"){
    if(!extResults.items.length){
      inner='<p class="hint" style="margin:0">No eBay AU results for “'+esc(extResults.q)+'”.</p>';
    }else{
      inner=priceIndexHtml(extResults.cat)+'<div class="ebayrow">'+extResults.items.map(function(it){
        return '<a class="ebaycard" href="'+esc(it.url)+'" target="_blank" rel="noopener">'+
          (it.image?'<img src="'+esc(it.image)+'" alt="" loading="lazy">':'<div class="ebayph">'+ICONS.cart+'</div>')+
          '<div class="et">'+esc(it.title)+'</div>'+
          (it.price?'<div class="ep">'+esc(it.price)+'</div>':'')+
          '<span class="esrc">eBay AU</span>'+
        '</a>';
      }).join("")+'</div>'+
      '<div class="ddelsewhere" style="padding:10px 0 0">'+
        '<a class="pill gh sm" style="text-decoration:none" href="https://www.ebay.com.au/sch/i.html?_nkw='+encodeURIComponent(extResults.q)+'" target="_blank" rel="noopener">More on eBay AU <span class="ic-inline">'+ICONS.external+'</span></a>'+
        /* categories that also have big AU sites with no public feed keep their links here */
        (EXT_LINK_SITES[extResults.cat]||[]).map(function(s){
          return '<a class="pill gh sm" style="text-decoration:none" href="'+esc(s[1])+'" target="_blank" rel="noopener">'+esc(s[0])+' <span class="ic-inline">'+ICONS.external+'</span></a>';
        }).join("")+
      '</div>';
    }
  }else{
    /* No listings to show, but the ABS price bar is independent of them — it
       shouldn't disappear just because a source is unkeyed or returned nothing. */
    var soloIdx=priceIndexHtml(catFilter);
    if(soloIdx)return '<div id="extPanel"><h2 class="st reveal">Market snapshot</h2><div class="psearch reveal">'+soloIdx+
      '<p class="hint" style="margin:0">New-price movement from the ABS Consumer Price Index — secondhand prices track their own course.</p></div></div>';
    return '<div id="extPanel"></div>';
  }
  return '<div id="extPanel"><h2 class="st reveal">From the web</h2><div class="psearch reveal">'+inner+
  '<p class="hint" style="margin:10px 0 0">Buying happens on the source site — Dibs shows you what\'s out there in one place.</p></div></div>';
}
function viewPost(){
  return '<h2 class="st reveal">Post something</h2><form id="postForm" novalidate class="reveal">'+
  '<div class="field"><label for="f-title">What is it?</label><input id="f-title" maxlength="70" required placeholder="e.g. Two-seater couch, minor wear" value="'+esc(draft.title||"")+'"></div>'+
  '<div class="field"><label>Photos &amp; video (up to 4)</label><input type="file" id="f-media" accept="image/*,video/*" multiple style="font-size:12px">'+
  '<div class="mediarow" id="mediaRow">'+draft.media.map(function(m,i){return '<span class="mth">'+(m.type==="video"?'<video src="'+m.data+'" muted></video>':'<img src="'+m.data+'">')+'<button type="button" class="x" data-act="delmedia" data-id="'+i+'">×</button></span>';}).join("")+'</div>'+
  '<p class="hint">Photos are resized on your device. Videos up to ~2.5MB for the pilot.</p></div>'+
  '<div class="field"><label>Category</label><div class="cats">'+CATS.map(function(c){return '<button type="button" class="cat'+(draft.category===c[0]?" on":"")+'" data-act="cat" data-id="'+c[0]+'"><span class="ic">'+catIcon(c[0])+'</span>'+c[1]+'</button>';}).join("")+'</div></div>'+
  '<div class="field"><label for="f-desc">Condition</label><textarea id="f-desc" maxlength="240" placeholder="Works fine, one leg slightly wobbly...">'+esc(draft.desc||"")+'</textarea></div>'+
  '<div class="field"><label>Give away or sell?</label><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
  '<button type="button" class="pill'+(!draft.priced?" pri":"")+'" data-act="priced" data-id="0">Free</button>'+
  '<button type="button" class="pill'+(draft.priced?" pri":"")+'" data-act="priced" data-id="1">Priced</button>'+
  (draft.priced?'<input id="f-price" type="number" min="1" max="2000000" placeholder="$" style="max-width:110px" value="'+esc(draft.price||"")+'">':"")+'</div>'+
  '<p class="hint">Priced listings get an official online receipt when the handoff is confirmed.</p></div>'+
  (catKerb(draft.category)?'<div class="field"><label>Council pickup help</label>'+
  '<button type="button" class="pill'+(draft.concierge?" pri":"")+'" data-act="concierge" data-id="'+(draft.concierge?"0":"1")+'"><span class="ic-inline">'+ICONS.truck+'</span> '+(draft.concierge?"Concierge requested":"Ask Dibs Concierge to coordinate pickup")+'</button>'+
  (draft.concierge?'<input id="f-concierge-addr" placeholder="e.g. 12 Smith Street, '+esc(me.suburb||"your suburb")+'" maxlength="200" style="margin-top:8px;width:100%" value="'+esc(draft.conciergeAddress||"")+'">'+
  '<p class="hint">Include the street number — this is the real collection address, kept private and separate from your public suburb.</p>':"")+
  '<p class="hint">Optional. We flag your listing for manual council-pickup coordination and keep your address private — it is never shown to other users, only used to help arrange collection.</p></div>':"")+
  '<div class="field"><label>Also cross-post to</label><div class="pchecks">'+PLATFORMS.map(function(p){
    var on=draft.platforms.indexOf(p)>-1;var tok=me.platformsConnected.indexOf(p)>-1;
    return '<label><input type="checkbox" data-pf="'+p+'"'+(on?" checked":"")+'> '+p+(tok?' <span class="trustchip">●</span>':'')+'</label>';}).join("")+
  '</div><p class="hint">● = API token connected (auto-post). Without a token, '+APP+' prepares a one-tap share listing under your handle and link.</p></div>'+
  '<button type="submit" class="pill pri block">Post it</button></form>';
}
function viewMine(){
  var mine=items.filter(function(i){return i.mine;});
  var claimed=items.filter(function(i){return i.claim&&i.claim.byMe&&!i.mine;});
  var h='<h2 class="st reveal">My stuff</h2><div id="feedList" class="itemgrid">'+(mine.length?mine.map(function(it,i){return card(it,i);}).join(""):'<div class="empty reveal"><span class="big">'+ICONS.pin+'</span>Nothing posted yet — head to Post.</div>')+'</div>';
  if(claimed.length)h+='<h2 class="st reveal">Claimed by me</h2><div id="feedList2" class="itemgrid">'+claimed.map(function(it,i){return card(it,i);}).join("")+'</div>';
  return h;
}
/* ---------- admin console (only rendered when me.isAdmin) ---------- */
var adminData=null, adminLoading=false;
function loadAdmin(){
  if(adminLoading)return;
  adminLoading=true;
  api("/admin/overview").then(function(j){
    adminLoading=false;adminData=j;render();
  }).catch(function(e){
    adminLoading=false;adminData={error:e.message};render();
  });
}
function setConcierge(id,status){
  var note=(document.getElementById("cnote-"+id)||{}).value||"";
  api("/admin/concierge","POST",{id:id,status:status,note:note}).then(function(){
    toast("Marked "+status+" — the poster has been notified.");
    adminData=null;loadAdmin();
  }).catch(function(e){toast(e.message,true);});
}
var CSTAGES=[["pending","Pending"],["arranged","Arranged"],["done","Done"]];
function viewAdmin(){
  if(!me.isAdmin)return '<div class="empty reveal">Not available.</div>';
  var h='<h2 class="st reveal">Admin</h2>';
  if(adminLoading&&!adminData)return h+'<div class="empty reveal">Loading…</div>';
  if(!adminData)return h+'<div class="empty reveal">Loading…</div>';
  if(adminData.error)return h+'<div class="empty reveal">'+esc(adminData.error)+'</div>';
  var s=adminData.stats;
  h+='<div class="statrow reveal" style="margin-bottom:18px">'+
    [["Users",s.users],["Live listings",s.items],["Claimed",s.claimed],["Handed over",s.handedOver],
     ["Pickup requests",s.concierge],["Open pickups",s.conciergeOpen],["Flagged",s.flagged]]
    .map(function(x){return '<div class="statcard"><div class="sl">'+x[0]+'</div><div class="sv">'+x[1]+'</div></div>';}).join("")+
  '</div>';

  h+='<h2 class="st reveal">Council pickup queue</h2>';
  if(!adminData.concierge.length){
    h+='<div class="empty reveal"><span class="big">'+ICONS.truck+'</span>No pickup requests yet. Post something in a kerbside category with “Ask Dibs Concierge” ticked to create one.</div>';
  }else{
    h+='<div class="reveal">'+adminData.concierge.map(function(c){
      return '<div class="cqcard">'+
        '<div class="cqtop"><span class="cqt">'+esc(c.title)+'</span><span class="cqbadge '+esc(c.status)+'">'+esc(c.status)+'</span></div>'+
        '<div class="cqmeta">'+esc(c.suburb||"")+(c.contact?' · '+esc(c.contact.handle):'')+(c.requestedAt?' · '+fmtDT(c.requestedAt):'')+'</div>'+
        (c.address?'<div class="cqaddr"><span class="ic-inline">'+ICONS.locate+'</span> '+esc(c.address)+'</div>':'')+
        (c.contact?'<div class="cqmeta">'+esc(c.contact.email)+'</div>':'')+
        '<input id="cnote-'+esc(c.id)+'" class="cqnote" placeholder="Note (e.g. council booked for Tue)" maxlength="300" value="'+esc(c.note||"")+'">'+
        '<div class="cqacts">'+CSTAGES.map(function(st){
          return '<button class="pill sm'+(c.status===st[0]?" pri":"")+'" data-act="cstage" data-id="'+esc(c.id)+'|'+st[0]+'">'+st[1]+'</button>';
        }).join("")+'</div>'+
      '</div>';
    }).join("")+'</div>';
  }

  h+='<div class="cqacts reveal" style="margin:-6px 0 18px">'+
     '<button class="pill sm" data-act="seed" data-id="add">Add sample listings</button>'+
     '<button class="pill gh sm" data-act="seed" data-id="remove">Remove samples</button></div>';

  h+='<h2 class="st reveal">Flagged listings</h2>';
  if(!adminData.flagged||!adminData.flagged.length){
    h+='<div class="empty reveal"><span class="big">'+ICONS.leaf+'</span>Nothing flagged. Clean house.</div>';
  }else{
    h+='<div class="reveal">'+adminData.flagged.map(function(f){
      return '<div class="cqcard">'+
        '<div class="cqtop"><span class="cqt">'+esc(f.title)+'</span>'+
          '<span class="cqbadge '+(f.observed?"pending":"")+'">'+f.count+' flag'+(f.count===1?"":"s")+(f.observed?" · hidden":"")+'</span></div>'+
        '<div class="cqmeta">'+esc([f.suburb,f.poster].filter(Boolean).join(" · "))+'</div>'+
        '<div class="cqmeta">Reasons: '+esc(f.reasons.join(", "))+'</div>'+
        '<div class="cqacts">'+
          '<button class="pill sm" data-act="mod" data-id="'+esc(f.id)+'|clear">Keep live</button>'+
          '<button class="pill sm dgr" data-act="mod" data-id="'+esc(f.id)+'|remove">Remove listing</button>'+
        '</div>'+
      '</div>';
    }).join("")+'</div>';
  }

  h+='<h2 class="st reveal">Users <span class="hint" style="font-weight:400">('+adminData.users.length+')</span></h2>';
  h+='<div class="cqacts reveal" style="margin-bottom:10px">'+
     '<a class="pill gh sm" href="/api/admin/export?what=users">Export users CSV</a>'+
     '<a class="pill gh sm" href="/api/admin/export?what=concierge">Export pickups CSV</a></div>';
  h+='<div class="tablewrap reveal"><table class="atable"><thead><tr>'+
     '<th>Handle</th><th>Email</th><th>Suburb</th><th>Joined</th><th>Posts</th><th>Handoffs</th><th>Points</th><th>Role</th></tr></thead><tbody>'+
     adminData.users.map(function(u){
       var role=u.root?'<span class="cqbadge done">owner</span>':u.coAdmin?'<span class="cqbadge arranged">co-admin</span>':'<span class="hint">member</span>';
       var ctl="";
       if(me.isRootAdmin&&!u.root){
         ctl='<button class="pill sm'+(u.coAdmin?"":" pri")+'" data-act="role" data-id="'+esc(u.id)+'|'+(u.coAdmin?"0":"1")+'">'+
             (u.coAdmin?"Revoke":"Make co-admin")+'</button>';
       }
       return '<tr><td><b>'+esc(u.handle)+'</b></td>'+
         '<td class="mono">'+esc(u.email||"—")+'</td>'+
         '<td>'+esc([u.suburb,u.state].filter(Boolean).join(", ")||"—")+'</td>'+
         '<td>'+(u.joined?fmtDT(u.joined):"—")+'</td>'+
         '<td>'+u.posts+'</td><td>'+u.handoffs+'</td><td>'+u.ecoPoints+'</td>'+
         '<td>'+role+(ctl?'<div style="margin-top:6px">'+ctl+'</div>':'')+'</td></tr>';
     }).join("")+'</tbody></table></div>'+
     '<p class="hint">Visible only to administrators. Emails and pickup addresses are personal data — treat them accordingly.'+
     (me.isRootAdmin?' Only the owner account can grant or revoke co-admins.':' Co-admins can moderate but cannot change roles.')+'</p>';
  return h;
}
function viewAlerts(){
  var h='<h2 class="st reveal">Notifications</h2>';
  h+=notifs.length?notifs.map(function(n,i){return '<div class="ntf reveal'+(n.read?"":" unread")+'" style="transition-delay:'+((i%10)*40)+'ms">'+esc(n.text)+'<span class="when">'+fmtDT(n.at)+'</span></div>';}).join(""):'<div class="empty reveal"><span class="big">'+ICONS.bell+'</span>Nothing yet.</div>';
  return h;
}
function impactHtml(){
  var rescued=items.filter(function(i){return i.status==="collected";}).length;
  var trucked=items.filter(function(i){return i.status==="collected_by_truck"||i.status==="booked_for_truck";}).length;
  var kg=Math.round((rescued*8+trucked*8));
  return '<div class="impact reveal"><div class="t"><span class="sect-ic">'+ICONS.leaf+'</span>Community impact</div><div class="row">'+
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
  if(!leaderboard)return '<fieldset class="reveal"><legend><span class="sect-ic">'+ICONS.trophy+'</span>Neighbourhood leaderboard</legend><p class="hint" style="margin:0">Loading…</p></fieldset>';
  var rows=leaderboard.leaderboard||[];
  if(!rows.length)return '<fieldset class="reveal"><legend><span class="sect-ic">'+ICONS.trophy+'</span>Neighbourhood leaderboard</legend><p class="hint" style="margin:0">Nobody\'s earned eco points in '+esc(leaderboard.suburb||me.suburb)+' yet — be the first!</p></fieldset>';
  return '<fieldset class="reveal"><legend><span class="sect-ic">'+ICONS.trophy+'</span>Leaderboard — '+esc(leaderboard.suburb||me.suburb)+'</legend>'+
  rows.map(function(r,i){
    return '<div class="lbrow'+(r.mine?" mine":"")+'"><span class="lbrank">#'+(i+1)+'</span><span class="lbname">'+esc(r.handle)+(r.trusted?' <span class="trustchip">✓</span>':'')+'</span><span class="lbtier">'+r.tier.icon+'</span><span class="lbpts">'+r.ecoPoints+'</span></div>';
  }).join("")+
  '</fieldset>';
}
function viewProfile(){
  var rcptRows=receipts.map(function(r){
    return '<div class="rcpt"><div><span class="rid">'+esc(r.id)+'</span><br><span style="color:var(--soft)">'+esc(r.title)+' · '+fmtDT(r.at)+'</span></div>'+
    '<div style="display:flex;gap:6px;align-items:center"><span class="ramt">'+money(r.amount)+'</span>'+
    '<button class="pill gh sm" data-act="receipt" data-id="'+esc(r.id)+'">View</button></div></div>';
  }).join("");

  var h='<h2 class="st reveal">Profile</h2><div class="pcard reveal"><div class="avatar">'+esc((me.handle||"D")[0])+'</div>'+
  '<div style="font-weight:700;font-family:\'Manrope\',sans-serif;font-size:17px">'+esc(me.handle)+'</div>'+
  '<div style="font-size:12px;color:var(--soft)">'+esc(me.suburb)+' · your anonymous public identity</div>'+
  (me.handleLocked
    ? '<div style="margin-top:12px"><span class="cqbadge done">Administrator</span></div>'+
      '<p class="hint">The owner account always appears as <b>Admin</b> — fixed, and not regenerable.</p>'
    : '<div style="margin-top:12px"><button class="pill gh sm" data-act="new-handle">Generate new handle</button></div>'+
      '<p class="hint">Handles are picked automatically — you can\'t choose one, so nothing about it can identify you.</p>')+
  (me.avgRating?'<div style="font-size:13px;margin-top:6px;color:var(--amber)">'+"★".repeat(Math.round(me.avgRating))+' ('+me.avgRating.toFixed(1)+')</div>':"")+
  '<div class="stats"><div class="stat"><span class="n">'+items.filter(function(i){return i.mine;}).length+'</span><span class="l">Posted</span></div>'+
  '<div class="stat"><span class="n">'+me.handoffs+'</span><span class="l">Handed off</span></div>'+
  '<div class="stat"><span class="n">'+me.truckSaved+'</span><span class="l">Truck-saved</span></div></div>'+
  (me.trusted?'<div class="truststamp">✓ Trusted neighbour</div>':'<p class="hint" style="margin-top:14px">3 completed handoffs unlocks a trust stamp on your listings.</p>')+'</div>'+

  ecoPointsHtml()+
  impactHtml()+
  leaderboardHtml()+

  '<fieldset class="reveal"><legend>Receipts</legend>'+
  (rcptRows?rcptRows:'<p class="hint" style="margin:0">No receipts yet — a receipt is generated automatically whenever a priced listing\'s handoff is confirmed.</p>')+
  '</fieldset>'+

  '<fieldset class="reveal"><legend>Privacy</legend><p class="hint" style="margin-top:0">Neighbours only ever see <strong>'+esc(me.handle)+'</strong>. Your email ('+esc(me.email)+') is used for login only — never shown, never shared, no phone number ever required. All pickup coordination happens inside the app.</p></fieldset>'+

  '<fieldset class="reveal"><legend>Your details</legend>'+
  '<div class="field"><label for="p-name">Private name (optional)</label><input id="p-name" maxlength="30" value="'+esc(me.name||"")+'"></div>'+
  '<div class="field"><label for="p-suburb">Suburb</label><div class="field-inline"><input id="p-suburb" maxlength="40" value="'+esc(me.suburb)+'"><button type="button" class="locbtn" data-act="locate" data-target="p-suburb">'+ICONS.locate+'<span>Locate</span></button></div></div>'+
  '<div class="field"><label for="p-state">State</label><select id="p-state">'+AU_STATES.map(function(s){return '<option value="'+s[0]+'"'+(s[0]===me.state?" selected":"")+'>'+s[1]+' ('+s[0]+')</option>';}).join("")+'</select></div>'+
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
  if(me&&me.guest)return [["feed",ICONS.all,"Shop"]];
  var n=[["feed",ICONS.all,"Shop"],["post",ICONS.plus,"Post"],["mine",ICONS.pin,"My stuff"],["alerts",ICONS.bell,"Alerts"],["profile",ICONS.user,"Profile"]];
  if(me&&me.isAdmin)n.push(["admin",ICONS.trophy,"Admin"]);
  return n;
}
function nextPickup(){
  var d=new Date();d.setHours(0,0,0,0);
  var diff=(me.pickupWeekday-d.getDay()+7)%7;d.setDate(d.getDate()+diff);
  return d.getTime();
}
function tickerHtml(){
  var msgs=["Free to list","Australia-wide","Call dibs before the truck does","No names, just handles","Cars · couches · rentals · jobs · free stuff"];
  var one=msgs.map(function(m){return '<span>'+m+'</span>';}).join("");
  return '<div class="ticker" aria-hidden="true"><div class="tickertrack">'+one+one+'</div></div>';
}
function render(){
  var app=document.getElementById("app");
  if(!me){app.innerHTML=tickerHtml()+viewAuth();bind();initScrollAnim();mountRotators();renderGoogleButton();return;}
  var next=nextPickup();
  var d=daysTo(next);var lbl=d<=0?"Today":d===1?"Tomorrow":"in "+d+" days";
  var mainHtml=tab==="feed"?viewFeed():tab==="post"?viewPost():tab==="mine"?viewMine():tab==="alerts"?viewAlerts():tab==="admin"?viewAdmin():viewProfile();
  // a guest has no notifications and no account to attach them to
  var bell=(me&&me.guest)?"":'<button class="iconbtn" data-tab="alerts" title="Notifications" style="position:relative">'+ICONS.bell+(unread?'<span class="dock-badge js-badge">'+unread+'</span>':'')+'</button>';
  var themesw='<div class="themesw" data-act="theme" role="button" aria-label="Toggle theme"><span class="knob">'+(theme()==="dark"?ICONS.moon:ICONS.sun)+'</span></div>';
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
  var urgent=d<=1;
  var banner='<div class="banner reveal'+(urgent?" urgent":"")+'"><span class="lbl">Next truck day</span><span class="cnt">'+WD[me.pickupWeekday].slice(0,3)+' · '+lbl+'</span></div>';
  var dockm='<nav class="dock-mobile"><div class="dock-liquid" id="dockLiquidM"></div>'+navItems().map(function(n){
    return '<button data-tab="'+n[0]+'" class="'+(tab===n[0]?"on":"")+(n[0]==="post"?" post":"")+'"><span class="ic">'+n[1]+'</span>'+(n[0]==="post"?"":n[2])+
    (n[0]==="alerts"?'<span class="dock-badge js-badge" style="display:'+(unread?"":"none")+'">'+unread+'</span>':"")+'</button>';
  }).join("")+'</nav>';
  var compareBar=compareIds.length?'<div class="comparebar reveal"><span>'+compareIds.length+'/3 selected</span><button type="button" class="pill pri sm" data-act="opencompare">Compare</button><button type="button" class="iconlink" data-act="clearcompare" title="Clear">×</button></div>':"";
  app.innerHTML=tickerHtml()+'<div class="shell">'+dock+'<div class="content">'+mtop+dtop+banner+'<main id="main">'+mainHtml+'</main></div></div>'+compareBar+dockm;
  bind();
  initScrollAnim();
  mountRotators();
  positionDockLiquid();
}
function positionDockLiquid(){
  var nav=document.querySelector(".dock-mobile"),ind=document.getElementById("dockLiquidM");
  if(!nav||!ind)return;
  var active=nav.querySelector("button.on:not(.post)");
  if(!active){ind.style.opacity=0;return;}
  var navRect=nav.getBoundingClientRect(),r=active.getBoundingClientRect();
  ind.style.opacity=1;
  ind.style.left=(r.left-navRect.left)+"px";
  ind.style.width=r.width+"px";
}

/* ---------- events ---------- */
function bind(){
  var app=document.getElementById("app");
  app.onclick=function(e){
    var t=e.target.closest("[data-tab]");
    if(t){tab=t.dataset.tab;if(tab==="alerts"){api("/notifications/read","POST").then(function(){unread=0;notifs.forEach(function(n){n.read=true;});render();});}if(tab==="profile"&&!leaderboard)loadLeaderboard();if(tab==="admin")loadAdmin();render();return;}
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
    if(e.target.id==="a-state"){
      suburbPhState=e.target.value;
      var sb=document.getElementById("a-suburb"),old=null;
      rotators=rotators.filter(function(r){       // swap the suburb list for the new state's
        if(r.input!==sb)return true;
        old=r;return false;
      });
      if(old&&old.el.parentNode)old.el.parentNode.removeChild(old.el);
      if(sb&&!sb.value)mountSuburbRotator();
    }
  };
  var fs=document.getElementById("f-search");
  if(fs){
    fs.oninput=function(){
      searchQ=fs.value;var fl=document.getElementById("feedList");if(fl)fl.innerHTML=feedListHtml();initScrollAnim();updateDropdown("searchDrop",searchQ);
      clearTimeout(extTimer);
      extTimer=setTimeout(function(){loadExternal(catFilter,searchQ);repaintExternal();},600);
    };
    fs.onfocus=function(){if(fs.value)updateDropdown("searchDrop",fs.value);};
    fs.onblur=function(){setTimeout(function(){updateDropdown("searchDrop","");},150);};
  }
  var fmin=document.getElementById("f-min"),fmax=document.getElementById("f-max"),fkw=document.getElementById("f-kw");
  function refreshFeedList(){var fl=document.getElementById("feedList");if(fl)fl.innerHTML=feedListHtml();initScrollAnim();}
  if(fmin)fmin.oninput=function(){filterMin=fmin.value;refreshFeedList();};
  if(fmax)fmax.oninput=function(){filterMax=fmax.value;refreshFeedList();};
  if(fkw){
    fkw.oninput=function(){
      filterKeyword=fkw.value;refreshFeedList();updateDropdown("kwDrop",filterKeyword);
      clearTimeout(extTimer);
      extTimer=setTimeout(function(){loadExternal(catFilter,filterKeyword);repaintExternal();},600);
    };
    fkw.onfocus=function(){if(fkw.value)updateDropdown("kwDrop",fkw.value);};
    fkw.onblur=function(){setTimeout(function(){updateDropdown("kwDrop","");},150);};
  }
  var af=document.getElementById("authForm");
  if(af)af.onsubmit=function(e){
    e.preventDefault();
    var body={email:document.getElementById("a-email").value,password:document.getElementById("a-pass").value};
    if(authMode==="signup"){body.suburb=document.getElementById("a-suburb").value||"My suburb";body.state=document.getElementById("a-state").value;body.pickupWeekday=parseInt(document.getElementById("a-day").value,10);}
    api("/"+authMode,"POST",body).then(function(j){me=j.me;toast(authMode==="signup"?"Welcome! You appear as "+me.handle:"Welcome back, "+me.handle);refresh();startPolling();}).catch(function(err){toast(err.message,true);});
  };
  var pf=document.getElementById("postForm");
  if(pf)pf.onsubmit=function(e){
    e.preventDefault();
    var title=document.getElementById("f-title").value.trim();
    if(!title){toast("Give it a short title first.",true);return;}
    var price=0;
    if(draft.priced){price=parseFloat((document.getElementById("f-price")||{}).value);if(isNaN(price)||price<1){toast("Enter a price of at least $1, or switch to Free.",true);return;}}
    var concierge=draft.concierge&&catKerb(draft.category);
    var conciergeAddress=concierge?((document.getElementById("f-concierge-addr")||{}).value||"").trim():"";
    if(concierge&&!conciergeAddress){toast("Add a street address so Dibs Concierge can coordinate pickup, or turn it off.",true);return;}
    if(concierge&&!/\d/.test(conciergeAddress)){toast("That doesn't look like a street address — include the street number (e.g. 12 Smith Street).",true);return;}
    api("/items","POST",{title:title,desc:document.getElementById("f-desc").value.trim(),category:draft.category,price:price,platforms:draft.platforms,media:draft.media,concierge:concierge,conciergeAddress:conciergeAddress})
    .then(function(j){
      draft={category:"other",platforms:["Marketplace","Freecycle"],media:[],priced:false,concierge:false};
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
  var ca=document.getElementById("f-concierge-addr");if(ca)draft.conciergeAddress=ca.value;
}
function openReceipt(id){
  var r=receipts.filter(function(x){return x.id===id;})[0];
  if(!r)return;
  var w=window.open("","_blank","width=440,height=680");
  if(!w){toast("Allow pop-ups to view the receipt.",true);return;}
  var dark=theme()==="dark";
  w.document.write('<html><head><title>'+esc(r.id)+' — '+APP+' receipt</title>'+
  '<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">'+
  '<style>'+
  'body{font-family:Inter,sans-serif;background:'+(dark?"#0F1412":"#F5F3EC")+';color:'+(dark?"#EAEEE9":"#171F1B")+';padding:26px 16px;display:flex;justify-content:center}'+
  '.paper{background:'+(dark?"#1A211E":"#fff")+';border-radius:24px;max-width:380px;width:100%;box-shadow:0 18px 50px -18px rgba(0,0,0,.35);overflow:hidden}'+
  '.top{background:linear-gradient(120deg,#0E7A6A,#0A5C50);color:#fff;padding:24px 26px 20px}'+
  '.top .app{display:flex;align-items:center;gap:10px;font-family:"Manrope",sans-serif;font-weight:800;font-size:19px}'+
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
  '<button class="print" onclick="window.print()">Print / Save as PDF</button>'+
  '</div></body></html>');
  w.document.close();
}
function act(action,id,el){
  if(action==="switch-auth"){authMode=authMode==="login"?"signup":"login";render();return;}
  if(action==="google-soon"){toast(googleClientId?"Google Sign-In is loading — try again in a second.":"Google Sign-In isn't connected yet — it needs a free Google Client ID.",true);return;}
  if(action==="apple-soon"){toast("Apple Sign-In is coming soon — it needs a paid Apple Developer account. Use email or Google for now.",true);return;}
  if(action==="theme"){localStorage.setItem("dibs-theme",theme()==="dark"?"light":"dark");applyTheme();render();return;}
  if(action==="scope"){feedScope=id;render();return;}
  if(action==="guest"){enterGuest();return;}
  if(me&&me.guest&&action==="switch-auth"){me=null;guestMode=false;authMode="signup";render();return;}
  if(me&&me.guest&&GUEST_BLOCKED[action]){
    toast("Create a free account to "+GUEST_BLOCKED[action]+" — it takes about ten seconds.",true);
    return;
  }
  if(action==="cstage"){var p=String(id).split("|");setConcierge(p[0],p[1]);return;}
  if(action==="mod"){
    var m=String(id).split("|");
    if(m[1]==="remove"&&!confirm("Remove this listing? The poster will be notified."))return;
    api("/admin/moderate","POST",{id:m[0],action:m[1]}).then(function(){
      toast(m[1]==="clear"?"Flags cleared — listing stays live.":"Listing removed.");
      adminData=null;loadAdmin();
    }).catch(function(e){toast(e.message,true);});
    return;
  }
  if(action==="seed"){
    api("/admin/seed","POST",{action:id}).then(function(j){
      toast(id==="add"?("Added "+j.created+" sample listings — they're badged Sample."):("Removed "+j.removed+" samples."));
      adminData=null;loadAdmin();refresh();
    }).catch(function(e){toast(e.message,true);});
    return;
  }
  if(action==="role"){
    var r=String(id).split("|");
    api("/admin/role","POST",{id:r[0],coAdmin:r[1]==="1"}).then(function(j){
      toast(j.coAdmin?"Co-admin access granted.":"Co-admin access revoked.");
      adminData=null;loadAdmin();
    }).catch(function(e){toast(e.message,true);});
    return;
  }
  if(action==="catf"){catFilter=id;filterMin="";filterMax="";filterKeyword="";loadExternal(id,searchQ);render();scrollCatIntoView(id);return;}
  if(action==="togglecats"){showAllCats=!showAllCats;render();return;}
  if(action==="clearfilters"){filterMin="";filterMax="";filterKeyword="";render();return;}
  if(action==="herogo"){
    catFilter=id;tab="feed";filterMin="";filterMax="";filterKeyword="";
    loadExternal(id,searchQ);
    var cdef=CATS.filter(function(c){return c[0]===id;})[0];
    if(cdef&&!cdef[4])showAllCats=true;
    render();
    var rail=document.querySelector(".catrail");if(rail)rail.scrollIntoView({behavior:"smooth",block:"center"});
    return;}
  if(action==="herodot"){
    var hi=parseInt(id,10);
    heroIdx=isNaN(hi)?0:hi;
    swapHero();
    startHeroRotation();   // give the slide you picked a full turn instead of yanking it in a second
    return;
  }
  if(action==="locate"){locate(el.dataset.target,el);return;}
  if(action==="psearch"){
    var q=currentSearchText();
    var pfUrl=PSEARCH_URLS[el.dataset.pf]||EXTRA_PSEARCH_URLS[el.dataset.pf];
    window.open(pfUrl+encodeURIComponent(q),"_blank");return;}
  if(action==="ebaysearch"){
    var eq=currentSearchText().trim();
    if(!eq){toast("Type something to search first.",true);return;}
    if(!ebayEnabled){toast("eBay search isn't connected yet — it needs a free eBay Developer Client ID + Secret.",true);return;}
    loadExternal(catFilter,eq,true);
    render();
    var xp=document.getElementById("extPanel");if(xp)xp.scrollIntoView({behavior:"smooth",block:"center"});
    return;}
  if(action==="cat"){keepDraftFields();draft.category=id;render();return;}
  if(action==="priced"){keepDraftFields();draft.priced=id==="1";render();return;}
  if(action==="concierge"){keepDraftFields();draft.concierge=id==="1";render();return;}
  if(action==="delmedia"){keepDraftFields();draft.media.splice(parseInt(id,10),1);render();return;}
  if(action==="receipt"){openReceipt(id);return;}
  if(action==="open"){modalItemId=id;modalMiniMode=null;renderModal();return;}
  if(action==="togglecompare"){
    var ci=compareIds.indexOf(id);
    if(ci>-1)compareIds.splice(ci,1);
    else{
      if(compareIds.length>=3){toast("You can compare up to 3 items at a time.",true);return;}
      compareIds.push(id);
    }
    if(modalMiniMode==="compare"){if(compareIds.length)renderModal();else closeModalAll();}
    render();
    return;
  }
  if(action==="opencompare"){if(!compareIds.length){toast("Tap the compare icon on a tag first.",true);return;}modalMiniMode="compare";modalItemId=null;renderModal();return;}
  if(action==="clearcompare"){compareIds=[];render();if(modalMiniMode==="compare")closeModalAll();return;}
  if(action==="close-modal"){closeModalAll();return;}
  if(action==="new-handle"){
    api("/profile/newhandle","POST").then(function(j){me=j.me;toast("You're now "+me.handle+" — picked for you automatically.");refresh();}).catch(function(e){toast(e.message,true);});return;}
  if(action==="logout"){api("/logout","POST").then(function(){me=null;items=[];notifs=[];receipts=[];clearInterval(pollTimer);closeModalAll();render();});return;}
  if(action==="save-profile"){
    api("/profile","PUT",{name:document.getElementById("p-name").value,suburb:document.getElementById("p-suburb").value,state:document.getElementById("p-state").value,pickupWeekday:parseInt(document.getElementById("p-day").value,10)})
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
