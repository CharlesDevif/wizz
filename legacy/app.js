/* ====================================================================
   Messenger 7.5 — logique client
   Mode serveur : la page est servie par server.js (WebSocket même origine).
   Mode démo    : ouverte en file:// → contacts bots locaux.
   ==================================================================== */

/* ---------- Émoticônes : 76 officielles, raccourcis exacts du client ---------- */
const EMOTICONS = [
 ["Sourire",[":)",":-)"],"🙂","smile"],["Grand sourire",[":D",":-D",":d"],"😀","open-mouthed-smile"],["Clin d'œil",[";)",";-)"],"😉","winking-smile"],
 ["Surpris",[":-O",":o",":O"],"😲","surprised-smile"],["Tire la langue",[":P",":-P",":p"],"😛","smile-with-tongue-out"],["Cool",["(H)","(h)"],"😎","hot-smile"],
 ["En colère",[":@",":-@"],"😡","angry-smile"],["Gêné",[":$",":-$"],"😳","embarrassed-smile"],["Confus",[":S",":-S",":s"],"😕","confused-smile"],
 ["Triste",[":(",":-("],"☹️","sad-smile"],["Pleure",[":'("],"😢","crying-face"],["Déçu",[":|",":-|"],"😐","disappointed-smile"],
 ["Diable",["(6)"],"😈","devil"],["Ange",["(A)","(a)"],"😇","angel"],["Cœur rouge",["(L)","(l)"],"❤️","red-heart"],["Cœur brisé",["(U)","(u)"],"💔","broken-heart"],
 ["Messenger",["(M)","(m)"],"👥","messenger"],["Chat",["(@)"],"😺","cat-face"],["Chien",["(&)"],"🐶","dog-face"],["Lune endormie",["(S)","(s)"],"🌜","sleeping-half-moon"],
 ["Étoile",["(*)"],"⭐","star"],["Pellicule",["(~)"],"🎞️","filmstrip"],["Note",["(8)"],"🎵","note"],["E-mail",["(E)","(e)"],"✉️","e-mail"],
 ["Rose rouge",["(F)","(f)"],"🌹","red-rose"],["Rose fanée",["(W)","(w)"],"🥀","wilted-rose"],["Horloge",["(O)","(o)"],"🕑","clock"],["Lèvres rouges",["(K)","(k)"],"👄","red-lips"],
 ["Cadeau",["(G)","(g)"],"🎁","gift-with-a-bow"],["Gâteau d'anniversaire",["(^)"],"🎂","birthday-cake"],["Appareil photo",["(P)","(p)"],"📷","camera"],["Ampoule",["(I)","(i)"],"💡","light-bulb"],
 ["Tasse de café",["(C)","(c)"],"☕","coffee-cup"],["Téléphone",["(T)","(t)"],"📞","telephone-receiver"],["Câlin gauche",["({)"],"🫂","left-hug"],["Câlin droit",["(})"],"🫂","right-hug"],
 ["Bière",["(B)","(b)"],"🍺","beer-mug"],["Cocktail",["(D)","(d)"],"🍸","martini-glass"],["Garçon",["(Z)","(z)"],"👦","boy"],["Fille",["(X)","(x)"],"👧","girl"],
 ["Pouce levé",["(Y)","(y)"],"👍","thumbs-up"],["Pouce baissé",["(N)","(n)"],"👎","thumbs-down"],["Chauve-souris",[":[",":-["],"🦇","vampire-bat"],["Chèvre",["(nnh)","(nah)"],"🐐","goat"],
 ["Soleil",["(#)"],"☀️","sun"],["Arc-en-ciel",["(R)","(r)"],"🌈","rainbow"],["Motus",[":-#"],"🤐","dont-tell-anyone-smile"],["Grimace",["8o|"],"😬","baring-teeth-smile"],
 ["Intello",["8-|"],"🤓","nerd-smile"],["Sarcastique",["^o)"],"🤨","sarcastic-smile"],["Secret",[":-*"],"🤫","secret-telling-smile"],["Malade",["+o("],"🤢","sick-smile"],
 ["Escargot",["(sn)"],"🐌","snail"],["Tortue",["(tu)"],"🐢","turtle"],["Assiette",["(pl)"],"🍽️","plate"],["Bol",["(||)"],"🥣","bowl"],
 ["Pizza",["(pi)"],"🍕","pizza"],["Ballon de foot",["(so)"],"⚽","soccer-ball"],["Voiture",["(au)"],"🚗","auto"],["Avion",["(ap)"],"✈️","airplane"],
 ["Parapluie",["(um)"],"☂️","umbrella"],["Île",["(ip)"],"🏝️","island-with-a-palm-tree"],["Ordinateur",["(co)"],"🖥️","computer"],["Téléphone portable",["(mp)"],"📱","mobile-phone"],
 ["Je reviens",["(brb)"],"🔙","be-right-back"],["Orage",["(st)"],"🌧️","storm-cloud"],["High five",["(h5)"],"🙏","high-five"],["Argent",["(mo)"],"💰","money"],
 ["Mouton noir",["(bah)"],"🐑","black-sheep"],["Je ne sais pas",[":^)"],"🤷","i-dont-know-smile"],["Réfléchit",["*-)"],"🤔","thinking-smile"],["Éclair",["(li)"],"⚡","lightning"],
 ["Fête",["<:o)","<o)"],"🥳","party-smile"],["Roule des yeux",["8-)"],"🙄","eye-rolling-smile"],["Endormi",["|-)"],"😪","sleepy-smile"],["Lapin",["('.')"],"🐰","bunny"]
];
const EMO_MAP = new Map(); EMOTICONS.forEach(e=>e[1].forEach(s=>EMO_MAP.set(s,e)));
const EMO_KEYS = [...EMO_MAP.keys()].sort((a,b)=>b.length-a.length);
const SVG = window.EMO_SVG||{};
const esc = s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function emoHtml(e,k){ const svg=SVG[e[3]]; return `<span class="emo" title="${esc(e[0])}  ${esc(k||e[1][0])}">${svg||e[2]}</span>`; }
function renderEmoticons(text){
  let out="", i=0; text=String(text);
  outer: while(i<text.length){
    for(const k of EMO_KEYS){ if(text.startsWith(k,i)){ out+=emoHtml(EMO_MAP.get(k),k); i+=k.length; continue outer; } }
    out+=esc(text[i]); i++;
  }
  return out;
}

/* ---------- Sons synthétisés (calqués sur les fichiers d'origine de la 7.5) ---------- */
let AC=null, muted=localStorage.getItem('msn_muted')==='1';
function ac(){ if(!AC) AC=new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==='suspended') AC.resume(); return AC; }
function tone(ctx,{f,f2=null,t0,dur,type='sine',g=0.25,a=0.005,r=null}){
  const o=ctx.createOscillator(), gn=ctx.createGain(); o.type=type;
  o.frequency.setValueAtTime(f,t0); if(f2) o.frequency.exponentialRampToValueAtTime(f2,t0+dur);
  gn.gain.setValueAtTime(0,t0); gn.gain.linearRampToValueAtTime(g,t0+a); gn.gain.exponentialRampToValueAtTime(0.0001,t0+(r||dur));
  o.connect(gn).connect(ctx.destination); o.start(t0); o.stop(t0+(r||dur)+0.02);
}
const SOUNDS={
  newalert(c,t){ tone(c,{f:440,t0:t,dur:.12,g:.3,type:'triangle'}); tone(c,{f:1180,t0:t,dur:.12,g:.08}); tone(c,{f:587,t0:t+.14,dur:.45,g:.3,type:'triangle'}); tone(c,{f:1174,t0:t+.14,dur:.45,g:.07}); },
  online(c,t){ tone(c,{f:300,t0:t,dur:1.3,g:.3,type:'triangle',a:.02}); tone(c,{f:600,t0:t,dur:1.0,g:.08}); tone(c,{f:900,t0:t,dur:.6,g:.04}); },
  nudge(c,t){ const o=c.createOscillator(),g=c.createGain(),l=c.createOscillator(),lg=c.createGain();
    o.type='sawtooth'; o.frequency.setValueAtTime(200,t); o.frequency.linearRampToValueAtTime(260,t+.45); o.frequency.linearRampToValueAtTime(200,t+.85);
    l.frequency.value=28; lg.gain.value=.35; l.connect(lg).connect(g.gain);
    g.gain.setValueAtTime(.55,t); g.gain.setValueAtTime(.55,t+.6); g.gain.exponentialRampToValueAtTime(.001,t+.89);
    const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=900;
    o.connect(f).connect(g).connect(c.destination); o.start(t); l.start(t); o.stop(t+.9); l.stop(t+.9);
    tone(c,{f:780,t0:t,dur:.8,g:.06,type:'square'}); },
  newemail(c,t){ tone(c,{f:300,t0:t,dur:.3,g:.25,type:'triangle'}); tone(c,{f:400,t0:t+.2,dur:.35,g:.25,type:'triangle'}); tone(c,{f:780,t0:t+.5,dur:.9,g:.25,type:'triangle'}); },
  ring(c,t){ for(let i=0;i<2;i++){ tone(c,{f:1180,t0:t+i*.45,dur:.35,g:.2}); tone(c,{f:1160,t0:t+i*.45,dur:.35,g:.1}); } },
  vimdone(c,t){ tone(c,{f:520,t0:t,dur:.5,g:.25,type:'triangle'}); tone(c,{f:1040,t0:t+.2,dur:.3,g:.12}); },
  type(c,t){ tone(c,{f:1800,f2:600,t0:t,dur:.04,g:.12,type:'square'}); },
  outgoing(c,t){ tone(c,{f:880,f2:1320,t0:t,dur:.09,g:.12}); },
  wink(c,t){ for(let i=0;i<6;i++) tone(c,{f:600+i*120,t0:t+i*.08,dur:.1,g:.15,type:'triangle'}); tone(c,{f:1320,t0:t+.5,dur:.5,g:.2}); },
};
function play(name){ if(muted||!SOUNDS[name]) return; try{ const c=ac(); SOUNDS[name](c,c.currentTime); }catch(e){} }
function toggleMute(){ muted=!muted; localStorage.setItem('msn_muted',muted?'1':'0'); document.getElementById('mute').textContent=muted?'🔇 sons coupés':'🔊 sons activés'; }
document.getElementById('mute').textContent=muted?'🔇 sons coupés':'🔊 sons activés';

/* ---------- État ---------- */
const STATUSES=[
  {id:'online',label:'En ligne',ico:'st-online'},{id:'busy',label:'Occupé(e)',ico:'st-busy'},{id:'brb',label:'De retour dans une minute',ico:'st-away'},
  {id:'away',label:'Absent(e)',ico:'st-away'},{id:'phone',label:'Au téléphone',ico:'st-busy'},{id:'lunch',label:'Parti(e) manger',ico:'st-away'},{id:'hidden',label:'Hors ligne',ico:'st-offline'},
];
const stById=id=>STATUSES.find(s=>s.id===id)||STATUSES[0];
const stIco=s=>({online:'st-online',busy:'st-busy',phone:'st-busy',away:'st-away',brb:'st-away',lunch:'st-away',offline:'st-offline',blocked:'st-blocked',hidden:'st-offline'})[s]||'st-offline';
const stLabel=s=>({online:'En ligne',busy:'Occupé(e)',phone:'Au téléphone',away:'Absent(e)',brb:'De retour dans une minute',lunch:'Parti(e) manger',offline:'Hors ligne',blocked:'Bloqué(e)',hidden:'Hors ligne'})[s]||'';
const me={name:'Moi',psm:'',status:'online',email:'',dp:null,font:JSON.parse(localStorage.getItem('msn_font')||'null')||{family:'Microsoft Sans Serif',size:12,color:'#000000',bold:false,italic:false}};
let contacts=[]; // {email,name,psm,status,dp,bot?}
const DEMO=[
  {email:'julie@hotmail.fr',name:'Julie ♥ (K) je t\'aime mon chéri (L)',psm:'♫ Tragédie – Hey Oh',status:'online',bot:'julie'},
  {email:'nico@hotmail.fr',name:'[K-Maro] -=Nico=- en mode révisions :S',psm:'bac dans 3 jours au secours',status:'busy',bot:'nico'},
  {email:'maman@wanadoo.fr',name:'Maman',psm:'',status:'online',bot:'maman'},
  {email:'melissa@hotmail.fr',name:'•°o.O MeLiSsA O.o°• ~ (*) ~',psm:'qui veut aller au ciné samedi ?',status:'away',bot:'melissa'},
  {email:'thomas@hotmail.fr',name:'Thomas (6)',psm:'',status:'offline',bot:'thomas'},
  {email:'kevin@hotmail.fr',name:'Kévin du lycée',psm:'',status:'offline'},
  {email:'michel@free.fr',name:'Tonton Michel',psm:'',status:'offline'},
  {email:'sasuke@hotmail.fr',name:'xX_DaRk_SaSuKe_Xx',psm:'rejoignez ma guilde sur dofus',status:'offline',bot:'sasuke'},
];
const groupsOpen={}; const convs={}; let zTop=10;
const byEmail=e=>contacts.find(c=>c.email===e);

/* ---------- Réseau ---------- */
const IS_TAURI=!!window.__TAURI__;
const SERVER_URL=(localStorage.getItem('msn_server')||'').trim();
const net={ ws:null, ready:false, mode:(SERVER_URL||location.protocol==='http:'||location.protocol==='https:')?'server':'demo', queue:[] };
function wsUrl(){ if(SERVER_URL){ const u=SERVER_URL.replace(/^https?:\/\//,m=>m==='https://'?'wss://':'ws://'); return /^wss?:\/\//.test(u)?u:'wss://'+u; } return (location.protocol==='https:'?'wss://':'ws://')+location.host; }
function netSend(o){ if(net.mode!=='server') return false; const s=JSON.stringify(o); if(net.ws&&net.ws.readyState===1) net.ws.send(s); else net.queue.push(s); return true; }
function netConnect(cb){
  if(net.mode!=='server') return cb&&cb();
  if(!SERVER_URL&&!/^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname)&&!/^[^.]+\.(fr|com|net|org|io|app|dev)$/.test(location.hostname)&&location.hostname.split('.').length>2&&/claude\.ai$/.test(location.hostname)){ net.mode='demo'; return cb&&cb(); }
  let ws; try{ ws=net.ws=new WebSocket(wsUrl()); }catch(e){ net.mode='demo'; return cb&&cb(); }
  const guard=setTimeout(()=>{ if(!net.ready){ net.mode='demo'; try{ ws.close(); }catch(e){} cb&&cb(); } },3000);
  ws.onopen=()=>{ clearTimeout(guard); net.ready=true; net.queue.forEach(s=>ws.send(s)); net.queue=[]; cb&&cb(); };
  ws.onmessage=ev=>{ let m; try{ m=JSON.parse(ev.data);}catch(e){return;} onNet(m); };
  ws.onclose=()=>{ net.ready=false; if(document.getElementById('mainWin').style.display==='flex'){ toast('Messenger','Connexion au serveur perdue. Reconnexion…'); setTimeout(()=>netConnect(()=>netSend({type:'login',email:me.email,pass:me.pass,status:me.status})),2000); } };
  ws.onerror=()=>{ if(!net.ready&&net.mode==='server'){ clearTimeout(guard); net.mode='demo'; cb&&cb(); } };
}
function onNet(m){
  switch(m.type){
    case 'error': loginError(m.msg); if(document.getElementById('mainWin').style.display==='flex') toast('Messenger',m.msg); break;
    case 'registered': loginError('Compte créé ! Vous pouvez vous connecter.',true); setRegisterMode(false); break;
    case 'welcome':
      Object.assign(me,{name:m.me.name,psm:m.me.psm,dp:m.me.dp});
      contacts=m.contacts; finishLogin();
      (m.pending||[]).forEach(u=>inviteDialog(u));
      (m.offline||[]).forEach(o=>{ const c=byEmail(o.from)||{email:o.from,name:o.from}; receive(c.email,o,true); });
      break;
    case 'kicked': alert('Vous avez été déconnecté car vous vous êtes connecté depuis un autre emplacement.'); location.reload(); break;
    case 'contacts': contacts=m.contacts; renderContacts(); break;
    case 'presence': { let c=byEmail(m.user.email); if(!c){ contacts.push(c={...m.user}); } const was=c.status; Object.assign(c,m.user); renderContacts();
      if(was==='offline'&&c.status!=='offline'){ toast(c.name,'vient de se connecter',stIco(c.status),'online'); if(convs[c.email]) sysMsg(c.email,`${c.name} vient de se connecter.`); }
      if(was!=='offline'&&c.status==='offline'&&convs[c.email]) sysMsg(c.email,`${c.name} vient de se déconnecter.`);
      const w=convs[c.email]; if(w){ updateInfobar(c.email); w.el.querySelector('.ct-status-in-to').textContent=stLabel(c.status); w.el.querySelector('.to-ico use').setAttribute('href','#'+stIco(c.status)); w.el.querySelector('.ct-dp').innerHTML=dpHtml(c.dp); w.el.querySelector('.t-text').textContent=c.name+' - Conversation'; }
      break; }
    case 'invite': inviteDialog(m.user); break;
    case 'msg': receive(m.from,m); break;
    case 'nudge': nudge(m.from,false); break;
    case 'typing': { const c=byEmail(m.from); if(c&&convs[m.from]) showTyping(m.from,c.name); break; }
    case 'voice': { const c=byEmail(m.from); if(!c) break; openConv(m.from); addVoice(m.from,c.name,m.data,false); play('newalert'); break; }
    case 'ink': { const c=byEmail(m.from); if(!c) break; openConv(m.from); addInk(m.from,c.name,m.data,false); play('newalert'); break; }
    case 'wink': { const c=byEmail(m.from); if(!c) break; openConv(m.from); sysMsg(m.from,`${c.name} vous a envoyé le Wink « ${WINKS[m.id]?WINKS[m.id].name:m.id} ».`); playWink(m.id); break; }
    case 'offline-stored': if(convs[m.to]) sysMsg(m.to,'Message hors ligne enregistré. Il sera remis dès la connexion du contact.'); break;
  }
}

/* ---------- Fenêtres ---------- */
function bringFront(el){ document.querySelectorAll('.win').forEach(w=>w.classList.add('inactive')); el.classList.remove('inactive'); el.style.zIndex=++zTop; updateTasks(); }
function makeDraggable(win){
  const t=win.querySelector('.title'); let sx,sy,ox,oy,drag=false;
  t.addEventListener('mousedown',e=>{ if(e.target.closest('.tbtn')) return; drag=true; sx=e.clientX; sy=e.clientY; ox=win.offsetLeft; oy=win.offsetTop; bringFront(win); e.preventDefault(); });
  window.addEventListener('mousemove',e=>{ if(!drag) return; win.style.left=Math.max(-win.offsetWidth+60,ox+e.clientX-sx)+'px'; win.style.top=Math.max(0,oy+e.clientY-sy)+'px'; });
  window.addEventListener('mouseup',()=>drag=false);
  win.addEventListener('mousedown',()=>bringFront(win));
}
function minimize(id){ document.getElementById(id).classList.add('hidden'); updateTasks(); }
function updateTasks(){
  const tb=document.getElementById('tasks'); tb.innerHTML='';
  document.querySelectorAll('.win').forEach(w=>{
    if((w.id==='loginWin'||w.id==='mainWin')&&w.style.display==='none') return;
    if(w.classList.contains('dialog')) return;
    const b=document.createElement('div'); b.className='task'+(w.classList.contains('inactive')||w.classList.contains('hidden')?'':' active');
    b.innerHTML=`<svg width="14" height="14"><use href="#logo"/></svg><span>${esc(w.querySelector('.t-text').textContent)}</span>`;
    b.onclick=()=>{ w.classList.remove('hidden'); bringFront(w); }; tb.appendChild(b);
  });
}
document.querySelectorAll('.win').forEach(makeDraggable);
function tick(){ document.getElementById('clock').textContent=new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}); }
tick(); setInterval(tick,10000);
const now=()=>new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
const dpHtml=dp=>dp?`<img src="${dp}" alt="">`:'<svg><use href="#av-default"/></svg>';

/* Petite boîte de dialogue XP générique */
function dialog(title,bodyHtml,buttons){
  const w=document.createElement('div'); w.className='win dialog'; w.style.width='340px'; w.style.left='calc(50% - 170px)'; w.style.top='200px';
  w.innerHTML=`<div class="title"><svg class="t-ico"><use href="#logo"/></svg><span class="t-text">${esc(title)}</span><span class="tbtn close">✕</span></div><div class="body" style="padding:14px 12px 10px;gap:12px"><div class="dlg-body">${bodyHtml}</div><div style="display:flex;justify-content:flex-end;gap:6px"></div></div>`;
  const row=w.querySelector('.body > div:last-child');
  buttons.forEach(b=>{ const btn=document.createElement('button'); btn.className='btn'; btn.textContent=b.label; btn.onclick=()=>{ if(b.fn&&b.fn(w)===false) return; w.remove(); }; row.appendChild(btn); });
  w.querySelector('.close').onclick=()=>w.remove();
  document.getElementById('desktop').appendChild(w); makeDraggable(w); bringFront(w); return w;
}

/* ---------- Connexion / inscription ---------- */
let registerMode=false, loginTimer=null;
function setRegisterMode(on){ registerMode=on; document.getElementById('btnLogin').textContent=on?'Créer le compte':'Se connecter'; document.getElementById('regFields').classList.toggle('hidden',!on); document.getElementById('regLink').textContent=on?'J\'ai déjà un compte':'Obtenir un nouveau compte'; }
document.getElementById('regLink').onclick=()=>setRegisterMode(!registerMode);
function loginError(msg,ok){ const e=document.getElementById('loginErr'); e.textContent=msg; e.style.color=ok?'#2A7E2A':'#C00'; cancelLogin(true); }
document.getElementById('btnLogin').onclick=()=>{
  ac();
  const email=document.getElementById('email').value.trim().toLowerCase(), pass=document.getElementById('pwd').value;
  document.getElementById('loginErr').textContent='';
  if(net.mode==='server'){
    if(registerMode){ document.getElementById('loginForm').style.display='none'; document.getElementById('connecting').style.display='block'; document.getElementById('connText').textContent='Création du compte…';
      netConnect(()=>netSend({type:'register',email,pass,name:document.getElementById('regName').value.trim()||email.split('@')[0]})); return; }
    me.email=email; me.pass=pass; me.status=STATUSES[document.getElementById('loginStatus').selectedIndex].id;
    document.getElementById('loginForm').style.display='none'; document.getElementById('connecting').style.display='block';
    const steps=['Connexion en cours…','Vérification du mot de passe…','Chargement de la liste de contacts…']; let i=0; document.getElementById('connText').textContent=steps[0];
    loginTimer=setInterval(()=>{ i++; if(i<steps.length) document.getElementById('connText').textContent=steps[i]; else clearInterval(loginTimer); },700);
    netConnect(()=>{ if(net.mode==='server') netSend({type:'login',email,pass,status:me.status}); else demoLogin(email); });
  } else demoLogin(email);
};
function demoLogin(email){
  me.email=email||'toi@hotmail.fr'; me.name=me.email.split('@')[0]; me.status=STATUSES[document.getElementById('loginStatus').selectedIndex].id;
  contacts=DEMO.map(c=>({...c}));
  document.getElementById('loginForm').style.display='none'; document.getElementById('connecting').style.display='block';
  const steps=['Connexion en cours…','Vérification du mot de passe…','Chargement de la liste de contacts…']; let i=0; document.getElementById('connText').textContent=steps[0];
  loginTimer=setInterval(()=>{ i++; if(i<steps.length) document.getElementById('connText').textContent=steps[i]; else { clearInterval(loginTimer); finishLogin();
    setTimeout(()=>setContactStatus('thomas@hotmail.fr','online'),4000); setTimeout(()=>setContactStatus('sasuke@hotmail.fr','online'),11000); setTimeout(()=>botSays('julie@hotmail.fr','coucou (L) t\'es là ?'),7000); } },700);
}
function cancelLogin(keep){ clearInterval(loginTimer); document.getElementById('loginForm').style.display='block'; document.getElementById('connecting').style.display='none'; }
function finishLogin(){
  clearInterval(loginTimer);
  document.getElementById('loginWin').style.display='none';
  const m=document.getElementById('mainWin'); m.style.display='flex'; bringFront(m);
  renderMe(); renderContacts();
  if(net.mode==='demo') toast('Messenger','Mode démo : contacts simulés. Lancez server.js pour le vrai temps réel.');
}
function signOut(){ location.reload(); }

/* ---------- Moi ---------- */
function renderMe(){
  const st=stById(me.status);
  document.getElementById('myNameTxt').innerHTML=renderEmoticons(me.name);
  document.getElementById('myStatusTxt').textContent=`(${st.label})`;
  document.getElementById('myPsm').innerHTML=me.psm?renderEmoticons(me.psm):'&lt;Tapez un message personnel&gt;';
  document.getElementById('myDp').innerHTML=dpHtml(me.dp);
  document.querySelector('#trayIco use').setAttribute('href','#'+st.ico);
  document.querySelectorAll('.my-dp-in-conv').forEach(d=>d.innerHTML=dpHtml(me.dp));
}
function pushProfile(){ netSend({type:'profile',name:me.name,psm:me.psm,dp:me.dp}); }
document.getElementById('myPsm').onclick=function(){
  if(this.querySelector('input')) return;
  const inp=document.createElement('input'); inp.type='text'; inp.value=me.psm; inp.maxLength=129; this.innerHTML=''; this.appendChild(inp); inp.focus();
  const done=()=>{ me.psm=inp.value.trim(); renderMe(); pushProfile(); };
  inp.onblur=done; inp.onkeydown=e=>{ if(e.key==='Enter') inp.blur(); if(e.key==='Escape'){ inp.value=me.psm; inp.blur(); } };
};
document.getElementById('myName').onclick=function(e){
  e.stopPropagation(); const r=this.getBoundingClientRect();
  const items=STATUSES.map(s=>({label:s.label,ico:s.ico,bold:s.id===me.status,fn:()=>{ me.status=s.id; renderMe(); netSend({type:'status',status:s.id}); }}));
  items.push({sep:true},{label:'Modifier le pseudo…',fn:()=>ask('Modifier mon pseudo','Nouveau pseudo (les émoticônes marchent, ex: (L) ou (*)) :',me.name,n=>{ if(n&&n.trim()){ me.name=n.trim().slice(0,129); renderMe(); pushProfile(); } })});
  items.push({label:'Modifier mon image perso…',fn:pickDp},{sep:true},{label:'Se déconnecter',fn:signOut});
  showMenu(items,r.left,r.bottom);
};
document.getElementById('myDp').onclick=pickDp;
function pickDp(){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=()=>{ const f=inp.files[0]; if(!f) return; const img=new Image(); const url=URL.createObjectURL(f);
    img.onload=()=>{ const c=document.createElement('canvas'); c.width=c.height=96; const x=c.getContext('2d'); const s=Math.min(img.width,img.height); x.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,96,96); me.dp=c.toDataURL('image/jpeg',.85); URL.revokeObjectURL(url); renderMe(); pushProfile(); };
    img.src=url; };
  inp.click();
}

/* ---------- Menus ---------- */
function showMenu(items,x,y){
  closeMenu(); const m=document.createElement('div'); m.className='menu'; m.id='ctxMenu';
  items.forEach(it=>{ if(it.sep){ const s=document.createElement('div'); s.className='sep'; m.appendChild(s); return; }
    const d=document.createElement('div'); d.className='mi'+(it.dis?' dis':''); d.innerHTML=(it.ico?`<svg class="sico"><use href="#${it.ico}"/></svg>`:'')+(it.bold?`<b>${esc(it.label)}</b>`:esc(it.label));
    if(!it.dis) d.onclick=()=>{ closeMenu(); it.fn&&it.fn(); }; m.appendChild(d); });
  document.body.appendChild(m); m.style.left=Math.min(x,innerWidth-m.offsetWidth-4)+'px'; m.style.top=Math.min(y,innerHeight-m.offsetHeight-34)+'px';
}
function closeMenu(){ const m=document.getElementById('ctxMenu'); if(m) m.remove(); }
document.addEventListener('mousedown',e=>{ if(!e.target.closest('#ctxMenu')) closeMenu(); if(!e.target.closest('#emoPicker')&&!e.target.closest('.fbtn-emo')) hideEmoPicker(); if(!e.target.closest('#winkPicker')&&!e.target.closest('[data-act=wink]')) hideWinkPicker(); });

/* ---------- Liste de contacts ---------- */
function renderContacts(){
  const box=document.getElementById('contacts'); box.innerHTML='';
  const q=(document.getElementById('filter').value||'').toLowerCase();
  const list=contacts.filter(c=>!q||c.name.toLowerCase().includes(q)||(c.psm||'').toLowerCase().includes(q)||c.email.includes(q));
  const on=list.filter(c=>c.status!=='offline'&&c.status!=='blocked'), off=list.filter(c=>c.status==='offline'||c.status==='blocked');
  const addGroup=(label,arr)=>{
    const g=document.createElement('div'); g.className='grp'+(groupsOpen[label]===false?' closed':''); g.innerHTML=`<span class="tri"></span>${esc(label)} (${arr.filter(c=>c.status!=='offline'&&c.status!=='blocked').length}/${arr.length})`;
    g.onclick=()=>{ groupsOpen[label]=groupsOpen[label]===false; renderContacts(); };
    const b=document.createElement('div'); b.className='grpbody';
    arr.forEach(c=>{
      const d=document.createElement('div'); d.className='ct'+(c.status==='offline'||c.status==='blocked'?' off':'');
      const stTxt=c.status!=='online'?` <span style="color:#777">(${stLabel(c.status)})</span>`:'';
      d.innerHTML=`<svg class="sico"><use href="#${stIco(c.status)}"/></svg><span class="ct-name">${renderEmoticons(c.name)}${stTxt}</span>${c.psm?`<span class="ct-psm">- ${renderEmoticons(c.psm)}</span>`:''}`;
      d.title=`${c.name}\n${c.email}\n${stLabel(c.status)}${c.psm?'\n'+c.psm:''}`;
      d.ondblclick=()=>openConv(c.email);
      d.onclick=()=>{ box.querySelectorAll('.ct').forEach(x=>x.classList.remove('sel')); d.classList.add('sel'); };
      d.oncontextmenu=e=>{ e.preventDefault(); showMenu([
        {label:'Envoyer un message instantané',fn:()=>openConv(c.email)},
        {label:'Envoyer un fichier…',fn:()=>{ openConv(c.email); sendFile(c.email); }},
        {label:'Envoyer un Wizz',fn:()=>{ openConv(c.email); nudge(c.email,true); }},
        {sep:true},
        c.status==='blocked'?{label:'Débloquer',fn:()=>{ c.status='offline'; netSend({type:'unblock',email:c.email}); renderContacts(); }}:{label:'Bloquer',fn:()=>{ c.status='blocked'; netSend({type:'block',email:c.email}); renderContacts(); }},
        {label:'Supprimer le contact',fn:()=>ask2('Supprimer le contact',`Supprimer <b>${renderEmoticons(c.name)}</b> de votre liste de contacts ?`,()=>{ contacts=contacts.filter(x=>x!==c); netSend({type:'remove',email:c.email}); renderContacts(); })},
      ],e.clientX,e.clientY); };
      b.appendChild(d);
    });
    box.appendChild(g); box.appendChild(b);
  };
  addGroup('En ligne',on); addGroup('Hors ligne',off);
}
document.getElementById('filter').oninput=renderContacts;
function addContactPrompt(){
  dialog('Ajouter un contact',`<div>Tapez l'adresse de messagerie complète de votre contact :</div><input type="text" id="addEmail" style="width:100%;margin-top:6px" placeholder="exemple@hotmail.fr"><div style="color:#555;margin-top:8px;font-size:10px">Votre contact recevra une invitation et devra l'accepter pour que vous le voyiez en ligne.</div>`,
    [{label:'Suivant >',fn:w=>{ const a=w.querySelector('#addEmail').value.trim().toLowerCase(); if(!a) return false;
       if(net.mode==='server') netSend({type:'add',email:a}); else { contacts.push({email:a,name:a,psm:'',status:'offline'}); renderContacts(); }
       toast('Messenger',`Une invitation a été envoyée à ${a}.`); }},{label:'Annuler'}]);
  setTimeout(()=>document.getElementById('addEmail')?.focus(),50);
}
function inviteDialog(u){
  play('newalert');
  dialog('Messenger',`<div style="display:flex;gap:10px;align-items:center"><svg width="32" height="32"><use href="#st-online"/></svg><div><b>${renderEmoticons(u.name)}</b> (${esc(u.email)}) vous a ajouté(e) à sa liste de contacts.<br><br>Souhaitez-vous :</div></div>`,
    [{label:'Autoriser et ajouter',fn:()=>netSend({type:'accept',email:u.email})},{label:'Refuser',fn:()=>netSend({type:'decline',email:u.email})}]);
}
function setContactStatus(email,status){ // mode démo
  const c=byEmail(email); if(!c) return; const was=c.status; c.status=status; renderContacts();
  if(was==='offline'&&status!=='offline'){ toast(c.name,'vient de se connecter',stIco(status),'online'); if(convs[email]) sysMsg(email,`${c.name} vient de se connecter.`); }
  const w=convs[email]; if(w){ updateInfobar(email); w.el.querySelector('.ct-status-in-to').textContent=stLabel(status); w.el.querySelector('.to-ico use').setAttribute('href','#'+stIco(status)); }
}

/* ---------- Toasts ---------- */
function toast(title,text,ico,sound,onclick){
  const t=document.createElement('div'); t.className='toast';
  t.innerHTML=`<svg class="sico"><use href="#${ico||'logo'}"/></svg><div class="tt"><b>${renderEmoticons(title)}</b>${renderEmoticons(text)}</div><span class="x">✕</span>`;
  t.querySelector('.x').onclick=e=>{ e.stopPropagation(); t.remove(); }; t.onclick=()=>{ t.remove(); onclick&&onclick(); };
  document.getElementById('toasts').appendChild(t); if(sound) play(sound);
  if(IS_TAURI&&document.hidden){ try{ window.__TAURI__.notification.sendNotification({title:String(title).replace(/<[^>]+>/g,''),body:String(text)}); }catch(e){} try{ window.__TAURI__.window.getCurrentWindow().requestUserAttention(2); }catch(e){} }
  setTimeout(()=>{ t.style.transition='opacity .4s'; t.style.opacity='0'; setTimeout(()=>t.remove(),400); },6000);
}

/* ---------- Conversation ---------- */
function openConv(email){
  const c=byEmail(email); if(!c) return null;
  if(convs[email]){ convs[email].el.classList.remove('hidden'); bringFront(convs[email].el); return convs[email]; }
  const w=document.createElement('div'); w.className='win convWin'; w.dataset.cid=email;
  const n=Object.keys(convs).length; w.style.left=(80+n*28)+'px'; w.style.top=(60+n*28)+'px';
  w.innerHTML=`
    <div class="title"><svg class="t-ico"><use href="#logo"/></svg><span class="t-text">${esc(c.name)} - Conversation</span><span class="tbtn tb-min">_</span><span class="tbtn">□</span><span class="tbtn close">✕</span></div>
    <div class="menubar"><span>Fichier</span><span>Edition</span><span>Actions</span><span>Outils</span><span>Aide</span></div>
    <div class="body">
      <div class="ctoolbar">
        <div class="ctool" data-act="invite"><svg class="ico"><use href="#ico-invite"/></svg>Inviter</div>
        <div class="ctool" data-act="file"><svg class="ico"><use href="#ico-file"/></svg>Envoyer des fichiers</div>
        <div class="ctool" data-act="video"><svg class="ico"><use href="#ico-video"/></svg>Vidéo</div>
        <div class="ctool" data-act="audio"><svg class="ico"><use href="#ico-audio"/></svg>Voix</div>
        <div class="ctool" data-act="activities"><svg class="ico"><use href="#ico-act"/></svg>Activités</div>
        <div class="ctool" data-act="games"><svg class="ico"><use href="#ico-games"/></svg>Jeux</div>
        <div class="ctool right small" data-act="block" title="Bloquer"><svg class="ico"><use href="#ico-block"/></svg></div>
        <div class="ctool small" data-act="colors" title="Couleurs"><svg class="ico"><use href="#ico-color"/></svg></div>
        <div class="cbrand"><svg width="16" height="16"><use href="#logo"/></svg><b>Messenger</b></div>
      </div>
      <div class="convmain">
        <div class="convleft">
          <div class="toline"><svg class="to-ico" width="14" height="14" style="vertical-align:-2px"><use href="#${stIco(c.status)}"/></svg> À : <b>${renderEmoticons(c.name)}</b> &lt;${esc(c.email)}&gt; <span style="color:#777">(<span class="ct-status-in-to">${stLabel(c.status)}</span>)</span></div>
          <div class="infobar hidden"><span class="iico">i</span><span class="itxt"></span></div>
          <div class="history"></div>
          <div class="fmtbar">
            <div class="fbtn lab" data-act="font" title="Modifier la police et la couleur du texte"><svg><use href="#ico-font"/></svg>Police<span class="dd">▼</span></div>
            <div class="fbtn fbtn-emo" title="Sélectionner une émoticône"><svg><use href="#ico-smile"/></svg><span class="dd">▼</span></div>
            <div class="fbtn lab" data-act="voice" title="Message vocal : maintenir F2 (ou ce bouton) pour parler"><svg><use href="#ico-voice"/></svg>Message vocal</div>
            <div class="fbtn lab" data-act="wink" title="Sélectionner un clin d'œil (Wink)"><svg><use href="#ico-wink"/></svg>Clins d'œil<span class="dd">▼</span></div>
            <div class="fbtn" data-act="bg" title="Sélectionner un arrière-plan"><svg><use href="#ico-bg"/></svg><span class="dd">▼</span></div>
            <div class="fbtn" data-act="dp" title="Sélectionner une image perso"><svg><use href="#ico-dp"/></svg><span class="dd">▼</span></div>
            <div class="fsep"></div>
            <div class="fbtn" data-act="nudge" title="Envoyer un Wizz"><svg><use href="#ico-nudge"/></svg></div>
            <div class="fbtn" data-act="ink" title="Écriture manuscrite"><svg><use href="#ico-ink"/></svg></div>
          </div>
          <div class="inputrow">
            <textarea spellcheck="false"></textarea>
            <div class="sendcol"><button class="btn send">Envoyer</button><button class="btn search">Rechercher</button></div>
          </div>
          <div class="modetabs"><span class="mt" data-act="ink">Manuscrit</span><span class="mt on">Texte</span></div>
        </div>
        <div class="convright">
          <div class="dpwrap"><div class="dp ct-dp">${dpHtml(c.dp)}</div><div class="dpctl"><span title="Masquer">◂</span></div></div>
          <div class="dpwrap"><div class="dp my-dp-in-conv">${dpHtml(me.dp)}</div><div class="dpctl"><span title="Options">▾</span></div></div>
        </div>
      </div>
      <div class="statusbar"><svg class="pen hidden"><use href="#ico-pen"/></svg><span class="stxt"></span></div>
    </div>`;
  document.getElementById('desktop').appendChild(w); makeDraggable(w); bringFront(w);
  const conv=convs[email]={el:w,hist:w.querySelector('.history'),lastNudge:0,typingTimer:null,lastTypingSent:0,bg:null};
  const ta=w.querySelector('textarea'); applyFontToInput(ta);
  w.querySelector('.close').onclick=()=>{ w.remove(); delete convs[email]; updateTasks(); };
  w.querySelector('.tb-min').onclick=()=>{ w.classList.add('hidden'); updateTasks(); };
  w.querySelector('.send').onclick=()=>sendMsg(email);
  w.querySelector('.search').onclick=()=>{ const q=ta.value.trim(); if(q) window.open('https://www.bing.com/search?q='+encodeURIComponent(q)); };
  ta.onkeydown=e=>{ if(e.key==='Enter'&&!e.shiftKey&&!e.ctrlKey){ e.preventDefault(); sendMsg(email); } if(e.key==='F2'&&!e.repeat){ e.preventDefault(); voiceStart(email); } };
  ta.onkeyup=e=>{ if(e.key==='F2'){ e.preventDefault(); voiceStop(); } };
  ta.oninput=()=>{ const t=Date.now(); if(t-conv.lastTypingSent>4000){ conv.lastTypingSent=t; netSend({type:'typing',to:email}); } };
  w.querySelector('.fbtn-emo').onclick=e=>{ e.stopPropagation(); showEmoPicker(e.currentTarget,ta); };
  w.querySelectorAll('[data-act]').forEach(b=>{ b.onclick=ev=>action(email,b.dataset.act,ev); if(b.dataset.act==='voice'){ b.onmousedown=ev=>{ ev.preventDefault(); voiceStart(email); }; b.onmouseup=b.onmouseleave=()=>voiceStop(); b.onclick=null; } });
  ta.focus();
  if(c.status==='offline') sysMsg(email,`${c.name} est hors ligne. Les messages que vous envoyez seront remis à sa prochaine connexion.`);
  updateInfobar(email); updateTasks(); return conv;
}
const fmtTs=()=>`<span class="ts">[${now()}]</span>`;
function fontStyle(f){ if(!f) return ''; return `font-family:'${esc(f.family||'Microsoft Sans Serif')}';font-size:${+f.size||12}px;color:${esc(f.color||'#000')};${f.bold?'font-weight:bold;':''}${f.italic?'font-style:italic;':''}`; }
function addMsg(email,who,text,mine,font){
  const conv=convs[email]; if(!conv) return;
  const d=document.createElement('div'); d.className='msg'+(mine?' me':'');
  d.innerHTML=`<div class="who">${fmtTs()}${renderEmoticons(who)} dit :</div><div class="txt" style="${fontStyle(font)}">${renderEmoticons(text)}</div>`;
  conv.hist.appendChild(d); conv.hist.scrollTop=conv.hist.scrollHeight;
}
function sysMsg(email,text,cls=''){ const conv=convs[email]; if(!conv) return; const d=document.createElement('div'); d.className='sys '+cls; d.innerHTML=renderEmoticons(text); conv.hist.appendChild(d); conv.hist.scrollTop=conv.hist.scrollHeight; }
function setStatusLine(email,text,pen){ const conv=convs[email]; if(!conv) return; conv.el.querySelector('.stxt').textContent=text; conv.el.querySelector('.pen').classList.toggle('hidden',!pen); }
function showTyping(email,name){ const conv=convs[email]; if(!conv) return; setStatusLine(email,`${name} est en train d'écrire un message…`,true); clearTimeout(conv.typingTimer); conv.typingTimer=setTimeout(()=>setStatusLine(email,'',false),6000); }
function sendMsg(email){
  const conv=convs[email]; const ta=conv.el.querySelector('textarea'); const t=ta.value.replace(/\s+$/,''); if(!t) return;
  ta.value=''; addMsg(email,me.name,t,true,me.font); play('outgoing');
  const c=byEmail(email);
  if(net.mode==='server'){ netSend({type:'msg',to:email,text:t,font:me.font}); return; }
  if(c.status==='offline'){ sysMsg(email,'Message hors ligne enregistré. Il sera remis dès la connexion du contact.'); return; }
  if(c.bot) botReply(email,t);
}
function receive(email,m,wasOffline){
  const c=byEmail(email)||{name:email}; const conv=openConv(email)||convs[email]; if(!conv) return;
  clearTimeout(conv.typingTimer);
  if(wasOffline) sysMsg(email,`Message reçu pendant votre absence (${new Date(m.ts).toLocaleString('fr-FR')}) :`);
  addMsg(email,c.name,m.text,false,m.font); setStatusLine(email,`Dernier message reçu le ${new Date().toLocaleDateString('fr-FR')} à ${now()}.`,false);
  const isBusy=me.status==='busy'||me.status==='phone';
  if(!isBusy){ play('newalert'); if(conv.el.classList.contains('inactive')||conv.el.classList.contains('hidden')) toast(c.name,m.text,null,null,()=>openConv(email)); }
}
function nudge(email,fromMe){
  const conv=openConv(email); const c=byEmail(email); const t=Date.now();
  if(fromMe){ if(t-conv.lastNudge<10000){ sysMsg(email,'Vous ne pouvez pas envoyer un Wizz aussi souvent. Veuillez patienter quelques secondes.'); return; } conv.lastNudge=t; netSend({type:'nudge',to:email}); }
  sysMsg(email,fromMe?'Vous venez d\'envoyer un Wizz !':`${c.name} vient de vous envoyer un Wizz !`,'nudge');
  conv.el.classList.remove('shake'); void conv.el.offsetWidth; conv.el.classList.add('shake'); play('nudge');
  if(fromMe&&net.mode==='demo'&&c.bot&&c.status!=='offline') setTimeout(()=>{ const r=['arrête de me wizzer !!','WIZZ TOI MEME :@','jsuis là jsuis là','(6)']; botSays(email,r[Math.floor(Math.random()*r.length)]); },1500);
}
function sendFile(email){
  const inp=document.createElement('input'); inp.type='file';
  inp.onchange=()=>{ const f=inp.files[0]; if(!f) return; const c=byEmail(email);
    sysMsg(email,`Vous envoyez ${f.name} (${(f.size/1024).toFixed(0)} Ko) à ${c.name}. En attente de l'acceptation…`);
    if(f.type.startsWith('image/')&&f.size<300000){ const r=new FileReader(); r.onload=()=>{ addInk(email,me.name,r.result,true,f.name); netSend({type:'ink',to:email,data:r.result,name:f.name}); }; r.readAsDataURL(f); }
    else setTimeout(()=>sysMsg(email,'Le transfert de gros fichiers arrive dans une prochaine version. Les images < 300 Ko sont envoyées directement.'),800); };
  inp.click();
}

/* ---------- Voice clips (maintenir F2) ---------- */
let rec=null, recChunks=[], recFor=null, recTimer=null;
async function voiceStart(email){
  if(rec) return; if(!navigator.mediaDevices){ sysMsg(email,'Micro non disponible dans ce navigateur.'); return; }
  try{ const stream=await navigator.mediaDevices.getUserMedia({audio:true}); rec=new MediaRecorder(stream); recChunks=[]; recFor=email;
    rec.ondataavailable=e=>recChunks.push(e.data);
    rec.onstop=()=>{ stream.getTracks().forEach(t=>t.stop()); const blob=new Blob(recChunks,{type:rec.mimeType||'audio/webm'}); rec=null; if(blob.size<2000) return;
      const r=new FileReader(); r.onload=()=>{ addVoice(email,me.name,r.result,true); netSend({type:'voice',to:email,data:r.result}); play('vimdone'); }; r.readAsDataURL(blob); };
    rec.start(); setStatusLine(email,'Enregistrement du voice clip… (15 s max, relâchez pour envoyer)',false);
    recTimer=setTimeout(voiceStop,15000);
  }catch(e){ sysMsg(email,'Impossible d\'accéder au micro : '+e.message); }
}
function voiceStop(){ clearTimeout(recTimer); if(rec&&rec.state==='recording'){ rec.stop(); setStatusLine(recFor,'',false); } }
function addVoice(email,who,dataUrl,mine){
  const conv=convs[email]; if(!conv) return; const d=document.createElement('div'); d.className='msg'+(mine?' me':'');
  d.innerHTML=`<div class="who">${fmtTs()}${renderEmoticons(who)} ${mine?'envoie':'vous envoie'} un voice clip :</div><div class="txt"><span class="vclip"><button class="btn" style="min-width:0;padding:1px 8px">▶</button> <span class="vbar"></span> <span class="vdur">voice clip</span></span></div>`;
  const a=new Audio(dataUrl); const b=d.querySelector('button'); b.onclick=()=>{ if(a.paused){ a.play(); b.textContent='■'; } else { a.pause(); a.currentTime=0; b.textContent='▶'; } }; a.onended=()=>b.textContent='▶';
  a.onloadedmetadata=()=>{ if(isFinite(a.duration)) d.querySelector('.vdur').textContent=Math.round(a.duration)+' s'; };
  conv.hist.appendChild(d); conv.hist.scrollTop=conv.hist.scrollHeight;
}

/* ---------- Encre manuscrite ---------- */
function inkDialog(email){
  const w=dialog('Écriture manuscrite',`<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px"><span>Couleur :</span><input type="color" id="inkColor" value="#000000"><span>Épaisseur :</span><input type="range" id="inkW" min="1" max="8" value="2" style="width:80px"><button class="btn" id="inkClear" style="min-width:0">Effacer</button></div><canvas id="inkCv" width="300" height="120" style="background:#fff;border:1px solid #7F9DB9;cursor:crosshair;touch-action:none"></canvas>`,
    [{label:'Envoyer',fn:w=>{ const cv=w.querySelector('#inkCv'); const data=cv.toDataURL('image/png'); addInk(email,me.name,data,true); netSend({type:'ink',to:email,data}); play('outgoing'); }},{label:'Annuler'}]);
  w.style.width='330px';
  const cv=w.querySelector('#inkCv'), x=cv.getContext('2d'); let down=false; x.lineCap=x.lineJoin='round';
  const pos=e=>{ const r=cv.getBoundingClientRect(); return [e.clientX-r.left,e.clientY-r.top]; };
  cv.onpointerdown=e=>{ down=true; x.strokeStyle=w.querySelector('#inkColor').value; x.lineWidth=w.querySelector('#inkW').value; x.beginPath(); x.moveTo(...pos(e)); cv.setPointerCapture(e.pointerId); };
  cv.onpointermove=e=>{ if(!down) return; x.lineTo(...pos(e)); x.stroke(); };
  cv.onpointerup=cv.onpointercancel=()=>down=false;
  w.querySelector('#inkClear').onclick=()=>x.clearRect(0,0,cv.width,cv.height);
}
function addInk(email,who,dataUrl,mine,name){
  const conv=convs[email]; if(!conv) return; const d=document.createElement('div'); d.className='msg'+(mine?' me':'');
  d.innerHTML=`<div class="who">${fmtTs()}${renderEmoticons(who)} ${name?`envoie l'image « ${esc(name)} »`:'dit (encre) '} :</div><div class="txt"><img src="${dataUrl}" alt="" style="max-width:100%;max-height:160px;border:1px solid #ddd;background:#fff"></div>`;
  conv.hist.appendChild(d); conv.hist.scrollTop=conv.hist.scrollHeight;
}

/* ---------- Police & couleur ---------- */
function applyFontToInput(ta){ ta.style.cssText+=';'+fontStyle(me.font); }
function fontDialog(){
  const f=me.font; const fam=['Microsoft Sans Serif','Tahoma','Verdana','Arial','Comic Sans MS','Times New Roman','Courier New','Trebuchet MS','Georgia','Impact'];
  dialog('Modifier ma police',`<div style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;align-items:center">
    <span>Police :</span><select id="fFam">${fam.map(x=>`<option ${x===f.family?'selected':''}>${x}</option>`).join('')}</select>
    <span>Taille :</span><select id="fSize">${[8,9,10,11,12,14,16,18,20,24].map(x=>`<option ${x==f.size?'selected':''}>${x}</option>`).join('')}</select>
    <span>Couleur :</span><input type="color" id="fCol" value="${f.color}">
    <span>Style :</span><span><label><input type="checkbox" id="fB" ${f.bold?'checked':''}>Gras</label> &nbsp; <label><input type="checkbox" id="fI" ${f.italic?'checked':''}>Italique</label></span></div>
    <div style="margin-top:10px;border:1px solid #7F9DB9;background:#fff;padding:6px;min-height:30px" id="fPrev">Aperçu : Salut, ça va ? (L)</div>`,
    [{label:'OK',fn:w=>{ me.font={family:w.querySelector('#fFam').value,size:+w.querySelector('#fSize').value,color:w.querySelector('#fCol').value,bold:w.querySelector('#fB').checked,italic:w.querySelector('#fI').checked}; localStorage.setItem('msn_font',JSON.stringify(me.font)); document.querySelectorAll('.convWin textarea').forEach(applyFontToInput); }},{label:'Annuler'}]);
  const upd=()=>{ const w=document.querySelector('.dialog'); const p=w.querySelector('#fPrev'); p.style.cssText=fontStyle({family:w.querySelector('#fFam').value,size:+w.querySelector('#fSize').value,color:w.querySelector('#fCol').value,bold:w.querySelector('#fB').checked,italic:w.querySelector('#fI').checked})+';margin-top:10px;border:1px solid #7F9DB9;background:#fff;padding:6px;min-height:30px'; p.innerHTML='Aperçu : Salut, ça va ? '+renderEmoticons('(L)'); };
  document.querySelectorAll('.dialog #fFam,.dialog #fSize,.dialog #fCol,.dialog #fB,.dialog #fI').forEach(el=>el.oninput=upd); upd();
}

/* ---------- Winks (animations plein-fenêtre, recréations) ---------- */
const WINKS={
  kiss:{name:'Bisou',emo:'(K)',run:o=>{ for(let i=0;i<14;i++){ const s=document.createElement('span'); s.className='wk-item'; s.innerHTML=emoHtml(EMO_MAP.get('(K)')); s.style.left=Math.random()*90+'%'; s.style.animationDelay=(i*.12)+'s'; o.appendChild(s);} }},
  hearts:{name:'Pluie de cœurs',emo:'(L)',run:o=>{ for(let i=0;i<18;i++){ const s=document.createElement('span'); s.className='wk-item wk-fall'; s.innerHTML=emoHtml(EMO_MAP.get('(L)')); s.style.left=Math.random()*92+'%'; s.style.animationDelay=(i*.1)+'s'; o.appendChild(s);} }},
  sheep:{name:'Mouton fou',emo:'(bah)',run:o=>{ const s=document.createElement('span'); s.className='wk-run'; s.innerHTML=emoHtml(EMO_MAP.get('(bah)')); o.appendChild(s); }},
  boom:{name:'Explosion',emo:'(li)',run:o=>{ const s=document.createElement('div'); s.className='wk-boom'; o.appendChild(s); o.closest('.win').classList.add('shake'); setTimeout(()=>o.closest('.win').classList.remove('shake'),900); }},
  party:{name:'Fiesta',emo:'<:o)',run:o=>{ for(let i=0;i<30;i++){ const s=document.createElement('span'); s.className='wk-conf'; s.style.left=Math.random()*100+'%'; s.style.background=['#F03030','#FFD12E','#3A8AE8','#8CC43F','#F0507A'][i%5]; s.style.animationDelay=(Math.random()*.8)+'s'; o.appendChild(s);} const f=document.createElement('span'); f.className='wk-item wk-big'; f.innerHTML=emoHtml(EMO_MAP.get('<:o)')); o.appendChild(f); }},
};
function playWink(id,email){
  const wk=WINKS[id]; if(!wk) return; const target=(email&&convs[email])?convs[email].el.querySelector('.history'):document.querySelector('.convWin:not(.inactive) .history')||document.body;
  const o=document.createElement('div'); o.className='wink-overlay'; target.appendChild(o); wk.run(o); play('wink'); setTimeout(()=>o.remove(),3200);
}
function showWinkPicker(btn,email){
  hideWinkPicker(); const p=document.createElement('div'); p.id='winkPicker'; p.className='menu';
  p.innerHTML=`<div style="padding:3px 6px;color:#1E3F7A;font-weight:bold">Winks</div>`;
  Object.entries(WINKS).forEach(([id,w])=>{ const d=document.createElement('div'); d.className='mi'; d.innerHTML=`<span class="sico" style="left:6px">${emoHtml(EMO_MAP.get(w.emo))}</span>${esc(w.name)}`; d.onclick=()=>{ hideWinkPicker(); sysMsg(email,`Vous avez envoyé le Wink « ${w.name} ».`); playWink(id,email); netSend({type:'wink',to:email,id}); }; p.appendChild(d); });
  document.body.appendChild(p); const r=btn.getBoundingClientRect(); p.style.left=r.left+'px'; p.style.top=(r.top-p.offsetHeight-2)+'px'; p.style.zIndex=++zTop+1;
}
function hideWinkPicker(){ const p=document.getElementById('winkPicker'); if(p) p.remove(); }

/* ---------- Arrière-plans ---------- */
const BGS=[{n:'Aucun',css:''},{n:'Ciel',css:'linear-gradient(180deg,#CFE6FF,#fff)'},{n:'Bulles',css:'radial-gradient(circle at 20% 30%,#D6EBFF 0 8%,transparent 9%),radial-gradient(circle at 70% 60%,#E0F0FF 0 12%,transparent 13%),radial-gradient(circle at 40% 85%,#D6EBFF 0 6%,transparent 7%),#fff'},{n:'Cœurs',css:'radial-gradient(circle at 15% 20%,#FFD6E0 0 5%,transparent 6%),radial-gradient(circle at 80% 70%,#FFD6E0 0 7%,transparent 8%),#FFF5F8'},{n:'Nuit',css:'linear-gradient(180deg,#0A1E5A,#3A6EA5)'},{n:'Zèbre',css:'repeating-linear-gradient(135deg,#fff 0 10px,#F0F0F0 10px 20px)'}];
function bgMenu(btn,email){
  showMenu(BGS.map(b=>({label:b.n,fn:()=>{ const h=convs[email].hist; h.style.background=b.css||''; if(b.n==='Nuit') h.style.color='#fff'; else h.style.color=''; }})),btn.getBoundingClientRect().left,btn.getBoundingClientRect().top-10);
}

function action(email,act,ev){
  const c=byEmail(email); const btn=ev&&ev.currentTarget;
  switch(act){
    case 'nudge': nudge(email,true); break;
    case 'file': sendFile(email); break;
    case 'font': fontDialog(); break;
    case 'ink': inkDialog(email); break;
    case 'wink': showWinkPicker(btn,email); break;
    case 'bg': case 'colors': bgMenu(btn,email); break;
    case 'dp': pickDp(); break;
    case 'block': if(c.status==='blocked'){ c.status='offline'; netSend({type:'unblock',email}); sysMsg(email,`Vous avez débloqué ${c.name}.`); } else { c.status='blocked'; netSend({type:'block',email}); sysMsg(email,`Vous avez bloqué ${c.name}.`); } renderContacts(); break;
    case 'video': case 'audio': sysMsg(email,`Invitation ${act==='video'?'vidéo':'audio'} envoyée à ${c.name}. En attente de réponse…`); play('ring'); setTimeout(()=>sysMsg(email,`${c.name} a refusé l'invitation. (Appels : prochaine version, via WebRTC.)`),3500); break;
    case 'games': sysMsg(email,'Jeux : Morpion, Démineur Flags, Solitaire Showdown… (prochaine version)'); break;
    case 'activities': sysMsg(email,'Activités : Tableau blanc, Partage d\'application… (prochaine version)'); break;
    case 'invite': sysMsg(email,'Conversations à plusieurs : prochaine version.'); break;
  }
}

/* ---------- Sélecteur d'émoticônes ---------- */
const picker=document.getElementById('emoPicker'), grid=document.getElementById('emoGrid');
EMOTICONS.forEach(e=>{ const d=document.createElement('div'); d.className='e'; d.innerHTML=emoHtml(e); d.title=`${e[0]}  ${e[1][0]}`; d.dataset.s=e[1][0]; grid.appendChild(d); });
let pickerTarget=null;
function showEmoPicker(btn,ta){ pickerTarget=ta; const r=btn.getBoundingClientRect(); picker.style.display='block'; picker.style.zIndex=++zTop+1; picker.style.left=Math.min(r.left,innerWidth-picker.offsetWidth-6)+'px'; picker.style.top=Math.max(0,r.top-picker.offsetHeight-2)+'px'; }
function hideEmoPicker(){ picker.style.display='none'; }
grid.onclick=e=>{ const d=e.target.closest('.e'); if(!d||!pickerTarget) return; const ta=pickerTarget, s=d.dataset.s+' '; const p=ta.selectionStart; ta.value=ta.value.slice(0,p)+s+ta.value.slice(ta.selectionEnd); ta.selectionStart=ta.selectionEnd=p+s.length; ta.focus(); hideEmoPicker(); };

/* ---------- Bots de démo ---------- */
const BOTS={
  julie:{lines:['tu fais quoi ce soir ?','jtm (K)','mdr','t trop chou (L)(L)(L)','attends ma mère m\'appelle brb','jsuis revenue (brb)','on se voit demain ? :$']},
  nico:{lines:['jpeux pas parler je révise :S','t\'as la correction du dm de maths ?','OMG (6)','lol','bon jvais me coucher |-)','(y)']},
  maman:{lines:['Coucou mon chéri c\'est maman. Tu rentres à quelle heure ?','N\'oublie pas de sortir les poubelles','Comment on met une émoticône ?','Bisous (L)','Qui est Julie ?']},
  melissa:{lines:['salut !! (*)','ciné samedi ???','ptdr','t\'as vu la nouvelle de star ac','(H)','je dois y aller ++']},
  thomas:{lines:['yo','t\'as fini le level 12 ?','(6)(6)(6)','ptdr nul','msn bug chez toi aussi ?','a+']},
  sasuke:{lines:['yo frère','viens sur dofus','jai eu un dofus pourpre (Y)','t\'as msn plus ?','xD']},
};
function botSays(email,text){ const c=byEmail(email); if(!c||c.status==='offline'||c.status==='blocked') return;
  openConv(email); showTyping(email,c.name); play('type'); setTimeout(()=>receive(email,{text}),900+Math.min(2500,text.length*60)); }
function botReply(email,userText){
  const c=byEmail(email); const b=BOTS[c.bot]; if(!b) return; let r=b.lines[Math.floor(Math.random()*b.lines.length)];
  if(/wizz|nudge/i.test(userText)){ setTimeout(()=>nudge(email,false),1200); return; }
  if(/\(L\)|\(K\)|jtm|je t'aime/i.test(userText)) r=c.bot==='maman'?'Moi aussi mon chéri (L)':'(L)(L)(L) moi aussi';
  if(/\?$/.test(userText)&&Math.random()<.4) r=['oui','non','jsp','mdr non','ptetre'][Math.floor(Math.random()*5)];
  setTimeout(()=>botSays(email,r),600+Math.random()*1500);
}

/* Champ Serveur : visible hors navigateur (Tauri / fichier local) */
(function(){ const row=document.getElementById('serverRow'), inp=document.getElementById('serverUrl'); if(!row) return;
  if(location.protocol!=='http:'&&location.protocol!=='https:'){ row.classList.remove('hidden'); inp.value=SERVER_URL; inp.onchange=()=>{ localStorage.setItem('msn_server',inp.value.trim()); location.reload(); }; } })();

/* Barre d'info jaune (statut du contact), comme la 7.5 */
function updateInfobar(email){ const conv=convs[email]; const c=byEmail(email); if(!conv||!c||c.group) return; const bar=conv.el.querySelector('.infobar'); if(!bar) return;
  const txt=({away:` ne répondra peut-être pas car son statut est Absent(e).`,brb:` ne répondra peut-être pas car son statut est De retour dans une minute.`,busy:` ne répondra peut-être pas car son statut est Occupé(e).`,phone:` ne répondra peut-être pas car son statut est Au téléphone.`,lunch:` ne répondra peut-être pas car son statut est Parti(e) manger.`,offline:` est hors ligne. Le message sera remis à sa prochaine connexion.`})[c.status];
  bar.classList.toggle('hidden',!txt); bar.querySelector('.itxt').innerHTML=txt?renderEmoticons(c.name)+esc(txt):''; }
function showToday(){ if(window._showTodayDialog) window._showTodayDialog(); }
function webSearch(){ const q=document.getElementById('filter').value.trim(); if(q) window.open('https://www.bing.com/search?q='+encodeURIComponent(q)); }

/* Dialogues XP de saisie / confirmation (remplacent prompt/confirm) */
function ask(title,label,value,cb){ const w=dialog(title,`<div>${esc(label)}</div><input type="text" id="askInp" style="width:100%;margin-top:6px" value="${esc(value||'')}">`,[{label:'OK',fn:w=>cb(w.querySelector('#askInp').value)},{label:'Annuler'}]); const i=w.querySelector('#askInp'); i.focus(); i.select(); i.onkeydown=e=>{ if(e.key==='Enter'){ cb(i.value); w.remove(); } }; }
function ask2(title,html,cb){ dialog(title,html,[{label:'Oui',fn:()=>cb(true)},{label:'Non'}]); }
