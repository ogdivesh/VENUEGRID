/* ================= JAVASCRIPT ================= */
const CUR="₹",$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,"0"),fmt=n=>CUR+Math.round(n).toLocaleString("en-IN");
const iso=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const off=n=>{const d=new Date();d.setDate(d.getDate()+n);return iso(d)};
const days=(a,b)=>Math.round((new Date(b+"T00:00")-new Date(a+"T00:00"))/864e5)+1;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const FAC=["Parking","Wi-Fi","A/C","Catering","Stage","AV system","Accessible"];

/* --- Venue profiles --- */
const V=[
 {id:1,name:"Grand Meridian Ballroom",area:"Downtown",cap:600,price:85000,fac:["Parking","A/C","Catering","Stage","Wi-Fi"],desc:"Chandeliered ballroom for weddings, galas and large conferences."},
 {id:2,name:"The Loft Studio",area:"Arts District",cap:150,price:28000,fac:["Wi-Fi","A/C","AV system","Accessible"],desc:"Bright industrial space for meetups, workshops and product demos."},
 {id:3,name:"Lakeside Garden Resort",area:"Lakeview",cap:300,price:60000,fac:["Parking","Catering","Stage","Accessible"],desc:"Open lawns by the water, ideal for receptions and retreats."},
 {id:4,name:"Heritage Hall",area:"Old Town",cap:400,price:45000,fac:["Parking","Stage","A/C","Accessible"],desc:"Restored historic hall with a full stage and gallery seating."},
 {id:5,name:"Skyline Conference Centre",area:"Business Park",cap:250,price:52000,fac:["Wi-Fi","A/C","AV system","Parking","Catering"],desc:"Modern conference floors with breakout rooms and live-stream gear."},
 {id:6,name:"Courtyard Pavilion",area:"Riverside",cap:100,price:18000,fac:["Parking","Catering"],desc:"Intimate covered courtyard for birthdays and small celebrations."}
];

/* --- Pricing: base x days + 8% service fee + 18% tax --- */
const quote=(v,s,e)=>{const d=days(s,e),sub=v.price*d,fee=sub*.08,tax=(sub+fee)*.18;return{d,sub,fee,tax,total:sub+fee+tax}};

/* --- State & storage (localStorage, wrapped in try/catch) --- */
let S={b:[],n:1},cm=new Date(),M=null;cm.setDate(1);
const mk=(vid,event,org,o,len,guests,status)=>{const v=V.find(x=>x.id==vid),s=off(o),e=off(o+len-1);return{id:S.n++,vid,event,org,start:s,end:e,guests,status,total:quote(v,s,e).total}};
function load(){
 try{const r=localStorage.getItem("venuegrid-v1");if(r){S=JSON.parse(r);return}}catch(e){}
 S={b:[],n:1};
 S.b=[mk(1,"Tech Summit 2026","Aarav Mehta",5,3,450,"Confirmed"),mk(1,"Wedding Reception","Simran Kaur",14,1,500,"Pending"),
  mk(2,"Startup Meetup","Riya Sharma",3,1,120,"Confirmed"),mk(3,"Corporate Retreat","Kabir Singh",8,2,80,"Confirmed"),
  mk(4,"Art Expo","Neha Gupta",10,4,200,"Pending"),mk(4,"Book Fair","Dev Malhotra",12,2,150,"Pending"),mk(5,"Product Launch","Tara Nair",20,1,250,"Confirmed")];
}
const save=()=>{try{localStorage.setItem("venuegrid-v1",JSON.stringify(S))}catch(e){}};
const toast=t=>{const el=$("#toast");el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,3200)};

/* --- Conflict detection: any CONFIRMED booking overlapping [s,e] on the same venue --- */
const clash=(vid,s,e,skip)=>S.b.filter(x=>x.vid==vid&&x.id!=skip&&x.status=="Confirmed"&&x.start<=e&&s<=x.end);
const compete=b=>S.b.some(x=>x.vid==b.vid&&x.id!=b.id&&x.status=="Pending"&&x.start<=b.end&&b.start<=x.end);

/* --- Availability calendar (shared by modal and owner view) --- */
function drawCals(){
 $$(".calbox").forEach(el=>{
  const vid=+el.dataset.vid,y=cm.getFullYear(),m=cm.getMonth(),n=new Date(y,m+1,0).getDate();
  let g=["S","M","T","W","T","F","S"].map(d=>`<b>${d}</b>`).join("")+"<i></i>".repeat(cm.getDay());
  for(let d=1;d<=n;d++){
   const k=y+"-"+pad(m+1)+"-"+pad(d),bs=S.b.filter(x=>x.vid==vid&&x.start<=k&&k<=x.end);
   const c=bs.some(x=>x.status=="Confirmed")?"bk":bs.some(x=>x.status=="Pending")?"pd":"";
   g+=`<span class="${c}" title="${c=="bk"?"Booked":c=="pd"?"Pending request":"Available"}">${d}</span>`;
  }
  el.innerHTML=`<div class="calhead"><button class="ghost sm" data-nav="-1">‹</button><strong>${cm.toLocaleString("en",{month:"long",year:"numeric"})}</strong><button class="ghost sm" data-nav="1">›</button></div><div class="cal">${g}</div><p class="legend"><span class="dot bk"></span>Booked<span class="dot pd"></span>Pending<span class="dot"></span>Free</p>`;
 });
}

/* --- Organizer: discovery --- */
function renderFind(){
 const q=$("#fQ").value.toLowerCase(),cap=+$("#fCap").value||0,bud=+$("#fBud").value||Infinity,s=$("#fFrom").value;
 let e=$("#fTo").value||s;if(e<s)e=s;
 const fac=$$("#facs input:checked").map(i=>i.value),hide=$("#fHide").checked;
 const list=V.filter(v=>v.cap>=cap&&v.price<=bud&&fac.every(f=>v.fac.includes(f))&&(v.name+v.area).toLowerCase().includes(q))
  .map(v=>({v,busy:!!s&&clash(v.id,s,e).length>0})).filter(x=>!(hide&&x.busy)).sort((a,b)=>a.busy-b.busy);
 $("#count").textContent=list.length+" venue"+(list.length==1?"":"s")+" found";
 $("#grid").innerHTML=list.map(({v,busy})=>`<article class="card ${busy?"dim":""}"><div class="banner" style="--h:${v.id*57}">${v.name}</div><div class="cbody">
  <div class="mute">${v.area} · up to ${v.cap} guests</div><div><b>${fmt(v.price)}</b> <span class="mute">/ day</span></div>
  <div class="tags">${v.fac.map(f=>`<span class="tag">${f}</span>`).join("")}</div>
  ${s?`<span class="badge ${busy?"busy":"free"}">${busy?"Booked on your dates":"Available on your dates"}</span>`:""}
  <button class="btn" data-open="${v.id}">View &amp; request booking</button></div></article>`).join("")||`<p class="empty">No venues match these filters. Try widening capacity or budget.</p>`;
}

/* --- Venue profile + booking request modal --- */
function openVenue(id){
 const v=V.find(x=>x.id==id);M=id;
 $("#mbody").innerHTML=`<h2>${v.name}</h2><div class="mute">${v.area} · capacity ${v.cap} · ${fmt(v.price)} / day</div><p>${v.desc}</p>
 <div class="tags">${v.fac.map(f=>`<span class="tag">${f}</span>`).join("")}</div>
 <div class="two"><div class="calbox" data-vid="${id}"></div>
 <form id="bf" autocomplete="off"><h3 style="margin:0">Request a booking</h3>
  <label>Event name<input id="bEv" required></label><label>Your name<input id="bOrg" required></label>
  <div class="r2"><label>Start<input type="date" id="bS" min="${off(0)}" required></label><label>End<input type="date" id="bE" min="${off(0)}" required></label></div>
  <label>Guests<input type="number" id="bG" min="1" required></label>
  <div id="qt"></div><button class="btn" id="bGo" type="submit">Send request</button></form></div>`;
 $("#bS").value=$("#fFrom").value;$("#bE").value=$("#fTo").value||$("#fFrom").value;$("#bG").value=$("#fCap").value;
 drawCals();updQuote();$("#modal").hidden=false;
}
function updQuote(){
 const v=V.find(x=>x.id==M),s=$("#bS").value,e=$("#bE").value,g=+$("#bG").value;let err="",warn="",q="";
 if(!s||!e)err="Choose start and end dates.";
 else if(e<s)err="End date must be on or after the start date.";
 else{
  const c=clash(v.id,s,e);
  if(c.length)err=`Conflict: already booked for “${esc(c[0].event)}” (${c[0].start} to ${c[0].end}). Pick different dates.`;
  else if(S.b.some(x=>x.vid==v.id&&x.status=="Pending"&&x.start<=e&&s<=x.end))warn="Another request is pending for these dates. The owner decides who is confirmed.";
  const p=quote(v,s,e);
  q=`<div class="quote"><div><span>${fmt(v.price)} × ${p.d} day${p.d>1?"s":""}</span><span>${fmt(p.sub)}</span></div><div><span>Service fee (8%)</span><span>${fmt(p.fee)}</span></div><div><span>Tax (18%)</span><span>${fmt(p.tax)}</span></div><div><b>Total</b><b>${fmt(p.total)}</b></div></div>`;
 }
 if(!err&&g>v.cap)err=`Guest count exceeds the venue capacity of ${v.cap}.`;
 $("#qt").innerHTML=q+(err?`<div class="msg e">${err}</div>`:"")+(warn?`<div class="msg w">${warn}</div>`:"");
 $("#bGo").disabled=!!err;return err;
}
function submitBooking(ev){
 ev.preventDefault();if(updQuote())return;
 const v=V.find(x=>x.id==M),s=$("#bS").value,e=$("#bE").value;
 S.b.push({id:S.n++,vid:v.id,event:$("#bEv").value.trim(),org:$("#bOrg").value.trim(),start:s,end:e,guests:+$("#bG").value,status:"Pending",total:quote(v,s,e).total});
 save();$("#modal").hidden=true;renderAll();toast("Request sent. Status: Pending owner approval.");
}

/* --- Owner dashboard --- */
function renderOwner(){
 const vid=+$("#oV").value,bs=S.b.filter(x=>x.vid==vid).sort((a,b)=>a.start.localeCompare(b.start));
 const conf=bs.filter(x=>x.status=="Confirmed");
 $("#stats").innerHTML=`<div class="stat"><span class="mute">Pending requests</span><b>${bs.filter(x=>x.status=="Pending").length}</b></div><div class="stat"><span class="mute">Confirmed bookings</span><b>${conf.length}</b></div><div class="stat"><span class="mute">Confirmed revenue</span><b>${fmt(conf.reduce((a,x)=>a+x.total,0))}</b></div>`;
 $("#oCal").dataset.vid=vid;drawCals();
 $("#rows").innerHTML=bs.map(b=>`<tr><td>${b.id}</td><td><b>${esc(b.event)}</b><br><span class="mute">${esc(b.org)}</span></td><td>${b.start}<br>to ${b.end}</td><td>${b.guests}</td><td>${fmt(b.total)}</td>
  <td><span class="badge ${b.status}">${b.status}</span>${b.status=="Pending"&&compete(b)?`<br><span class="badge comp">Competing request</span>`:""}</td>
  <td>${b.status=="Pending"?`<button class="btn sm" data-act="Confirmed" data-id="${b.id}">Approve</button><button class="btn sm bad" data-act="Rejected" data-id="${b.id}">Reject</button>`:""}${b.status=="Confirmed"?`<button class="btn sm bad" data-act="Cancelled" data-id="${b.id}">Cancel</button>`:""}</td></tr>`).join("")||`<tr><td colspan="7" class="empty">No booking requests yet.</td></tr>`;
}
function setStatus(id,st){
 const b=S.b.find(x=>x.id==id);
 if(st=="Confirmed"){
  const c=clash(b.vid,b.start,b.end,b.id);
  if(c.length)return toast(`Cannot approve: overlaps confirmed booking #${c[0].id} (${c[0].event}).`);
  b.status=st;let n=0;
  S.b.forEach(x=>{if(x.vid==b.vid&&x.id!=b.id&&x.status=="Pending"&&x.start<=b.end&&b.start<=x.end){x.status="Rejected";n++}});
  toast("Booking confirmed."+(n?` ${n} overlapping request${n>1?"s":""} auto-rejected.`:""));
 }else{b.status=st;toast("Booking "+st.toLowerCase()+".")}
 save();renderAll();
}

/* --- Wiring --- */
function renderAll(){renderFind();renderOwner()}
document.addEventListener("click",e=>{
 const t=e.target.closest("button");if(!t)return;
 if(t.dataset.view){$$("nav button").forEach(b=>b.classList.toggle("on",b==t));$("#find").hidden=t.dataset.view!="find";$("#owner").hidden=t.dataset.view!="owner"}
 if(t.dataset.open)openVenue(t.dataset.open);
 if(t.dataset.nav){cm.setMonth(cm.getMonth()+ +t.dataset.nav);drawCals()}
 if(t.dataset.act)setStatus(+t.dataset.id,t.dataset.act);
 if(t.id=="close")$("#modal").hidden=true;
 if(t.id=="reset"){$$("#filters input").forEach(i=>i.type=="checkbox"?i.checked=false:i.value="");renderFind()}
 if(t.id=="theme"){const r=document.documentElement,cur=r.dataset.theme||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");r.dataset.theme=cur=="dark"?"light":"dark"}
});
$("#modal").addEventListener("click",e=>{if(e.target.id=="modal")$("#modal").hidden=true});
$("#filters").addEventListener("input",renderFind);
$("#mbody").addEventListener("input",e=>{if(e.target.closest("#bf"))updQuote()});
$("#mbody").addEventListener("submit",submitBooking);
$("#oV").addEventListener("change",renderOwner);
$("#facs").innerHTML=FAC.map(f=>`<label><input type="checkbox" value="${f}">${f}</label>`).join("");
$("#oV").innerHTML=V.map(v=>`<option value="${v.id}">${v.name}</option>`).join("");
load();renderAll();
