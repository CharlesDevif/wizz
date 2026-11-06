/* ====================================================================
   Lot 2 : transfert de fichiers, tableau blanc partagé, Démineur Flags,
   surnoms, groupes de contacts, images perso animées.
   ==================================================================== */

/* ---------- Transfert de fichiers (Accepter / Enregistrer sous / Refuser) ---------- */
const xfers={}; // id -> {file, name, size, chunks:[], received, el, email, dir}
const CHUNK=48*1024, MAXFILE=20*1024*1024;
const fmtSize=n=>n>1048576?(n/1048576).toFixed(1)+' Mo':n>1024?Math.round(n/1024)+' Ko':n+' o';
function xferRow(email,id,html){ const conv=convs[email]; if(!conv) return null; let row=conv.hist.querySelector(`[data-xfer="${id}"]`); if(!row){ row=document.createElement('div'); row.className='sys xfer'; row.dataset.xfer=id; conv.hist.appendChild(row); } row.innerHTML=html; conv.hist.scrollTop=conv.hist.scrollHeight; return row; }
sendFile=function(email){
  if(email.startsWith('g:')){ sysMsg(email,'Le transfert de fichiers se fait en tête-à-tête.'); return; }
  const inp=document.createElement('input'); inp.type='file';
  inp.onchange=()=>{ const f=inp.files[0]; if(!f) return; const c=byEmail(email);
    if(f.size>MAXFILE){ sysMsg(email,`Fichier trop volumineux (max ${fmtSize(MAXFILE)}).`); return; }
    const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6); xfers[id]={file:f,name:f.name,size:f.size,email,dir:'out'};
    xferRow(email,id,`Vous envoyez <b>${esc(f.name)}</b> (${fmtSize(f.size)}) à ${esc(c.name)}. En attente de l'acceptation… <span class="link" data-cancel="${id}">Annuler</span>`);
    if(net.mode==='server') netSend({type:'file',to:email,kind:'offer',id,name:f.name,size:f.size});
    else setTimeout(()=>{ if(!xfers[id]) return; xferRow(email,id,`${esc(c.name)} a accepté <b>${esc(f.name)}</b>. Transfert en cours… (mode démo)`); setTimeout(()=>xferRow(email,id,`Le transfert de « ${esc(f.name)} » est terminé.`),2000); },1500);
  };
  inp.click();
};
async function xferSend(id){
  const x=xfers[id]; if(!x) return; const total=Math.ceil(x.size/CHUNK)||1;
  for(let i=0;i<total;i++){
    if(!xfers[id]) return;
    const buf=await x.file.slice(i*CHUNK,(i+1)*CHUNK).arrayBuffer(); const b64=btoa(String.fromCharCode(...new Uint8Array(buf)));
    netSend({type:'file',to:x.email,kind:'chunk',id,seq:i,total,data:b64});
    xferRow(x.email,id,`Envoi de <b>${esc(x.name)}</b>… ${Math.round((i+1)/total*100)} % <span class="xbar"><span style="width:${(i+1)/total*100}%"></span></span> <span class="link" data-cancel="${id}">Annuler</span>`);
    if(i%8===7) await new Promise(r=>setTimeout(r,20)); // laisse respirer le socket
  }
  xferRow(x.email,id,`Le transfert de « ${esc(x.name)} » est terminé.`); play('vimdone'); delete xfers[id];
}
function onFile(m){
  const email=m.from; const c=byEmail(email); if(!c) return; openConv(email); const id=m.id;
  switch(m.kind){
    case 'offer': play('newalert'); xfers[id]={name:m.name,size:m.size,email,dir:'in',chunks:[],received:0};
      xferRow(email,id,`${esc(c.name)} souhaite vous envoyer <b>${esc(m.name)}</b> (${fmtSize(m.size)}). <span class="link" data-accept="${id}">Accepter</span> (Alt+T) &nbsp; <span class="link" data-accept="${id}">Enregistrer sous…</span> &nbsp; <span class="link" data-decline="${id}">Refuser</span> (Alt+D)`);
      toast(c.name,`vous envoie le fichier ${m.name}`,null,null,()=>openConv(email)); break;
    case 'accept': if(xfers[id]){ xferRow(email,id,`${esc(c.name)} a accepté <b>${esc(xfers[id].name)}</b>. Transfert en cours…`); xferSend(id); } break;
    case 'decline': if(xfers[id]){ xferRow(email,id,`${esc(c.name)} a refusé le fichier « ${esc(xfers[id].name)} ».`); delete xfers[id]; } break;
    case 'cancel': if(xfers[id]){ xferRow(email,id,`${esc(c.name)} a annulé le transfert de « ${esc(xfers[id].name)} ».`); delete xfers[id]; } break;
    case 'chunk': { const x=xfers[id]; if(!x||x.dir!=='in') return; const bin=atob(m.data); const u8=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i); x.chunks[m.seq]=u8; x.received++;
      xferRow(email,id,`Réception de <b>${esc(x.name)}</b>… ${Math.round(x.received/m.total*100)} % <span class="xbar"><span style="width:${x.received/m.total*100}%"></span></span>`);
      if(x.received>=m.total){ const blob=new Blob(x.chunks); const url=URL.createObjectURL(blob); const isImg=/\.(png|jpe?g|gif|webp)$/i.test(x.name);
        xferRow(email,id,`Vous avez reçu <b>${esc(x.name)}</b> (${fmtSize(blob.size)}). <a href="${url}" download="${esc(x.name)}">Ouvrir / Enregistrer</a>${isImg?`<br><img src="${url}" style="max-width:100%;max-height:160px;border:1px solid #ddd;margin-top:3px">`:''}`); play('vimdone'); delete xfers[id]; }
      break; }
  }
}
document.addEventListener('click',e=>{
  const a=e.target.dataset.accept, d=e.target.dataset.decline, c=e.target.dataset.cancel; if(!a&&!d&&!c) return;
  const id=a||d||c; const x=xfers[id]; if(!x) return;
  if(a){ netSend({type:'file',to:x.email,kind:'accept',id}); xferRow(x.email,id,`Vous avez accepté <b>${esc(x.name)}</b>. Réception en cours…`); }
  if(d){ netSend({type:'file',to:x.email,kind:'decline',id}); xferRow(x.email,id,`Vous avez refusé le fichier « ${esc(x.name)} ».`); delete xfers[id]; }
  if(c){ netSend({type:'file',to:x.email,kind:'cancel',id}); xferRow(x.email,id,`Vous avez annulé le transfert de « ${esc(x.name)} ».`); delete xfers[id]; }
});

function growConv(email,h){ const conv=convs[email]; if(!conv) return; if(conv.el.offsetHeight<h){ conv.el.style.height=Math.min(h,innerHeight-60)+'px'; if(conv.el.offsetTop+h>innerHeight-40) conv.el.style.top=Math.max(0,innerHeight-40-h)+'px'; } }

/* ---------- Tableau blanc partagé (Activités) ---------- */
const boards={}; // email -> {cv, ctx}
function whiteboard(email,remoteOpen){
  const conv=convs[email]; if(!conv) return; if(boards[email]) return;
  const box=document.createElement('div'); box.className='gamebox wbbox'; conv.el.querySelector('.history').insertAdjacentElement('afterend',box);
  box.innerHTML=`<div class="gamehdr">Tableau blanc partagé <input type="color" class="wbc" value="#1E3F7A"> <span class="link wbclear">Effacer</span> <span class="link wbquit">Fermer</span></div><canvas class="wbcv" width="330" height="130" style="background:#fff;border:1px solid #A9C4E4;cursor:crosshair;touch-action:none;display:block;margin:3px auto 0"></canvas>`;
  growConv(email,600); const cv=box.querySelector('.wbcv'), x=cv.getContext('2d'); x.lineCap=x.lineJoin='round'; x.lineWidth=2; boards[email]={cv,ctx:x,box};
  let down=false, last=null; const pos=e=>{ const r=cv.getBoundingClientRect(); return [Math.round(e.clientX-r.left),Math.round(e.clientY-r.top)]; };
  const seg=(a,b,col,send)=>{ x.strokeStyle=col; x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); if(send) netSend({type:'wb',to:email,kind:'seg',a,b,col}); };
  cv.onpointerdown=e=>{ down=true; last=pos(e); cv.setPointerCapture(e.pointerId); };
  cv.onpointermove=e=>{ if(!down) return; const p=pos(e); seg(last,p,box.querySelector('.wbc').value,true); last=p; };
  cv.onpointerup=cv.onpointercancel=()=>down=false;
  box.querySelector('.wbclear').onclick=()=>{ x.clearRect(0,0,cv.width,cv.height); netSend({type:'wb',to:email,kind:'clear'}); };
  box.querySelector('.wbquit').onclick=()=>{ box.remove(); delete boards[email]; netSend({type:'wb',to:email,kind:'close'}); };
  if(!remoteOpen){ netSend({type:'wb',to:email,kind:'open'}); sysMsg(email,'Vous avez ouvert un tableau blanc partagé.'); }
}
function onWb(m){ const email=m.from; const c=byEmail(email); if(!c) return; openConv(email);
  switch(m.kind){ case 'open': sysMsg(email,`${c.name} a ouvert un tableau blanc partagé.`); whiteboard(email,true); play('newalert'); break;
    case 'seg': { const b=boards[email]; if(b){ b.ctx.strokeStyle=m.col; b.ctx.beginPath(); b.ctx.moveTo(m.a[0],m.a[1]); b.ctx.lineTo(m.b[0],m.b[1]); b.ctx.stroke(); } break; }
    case 'clear': { const b=boards[email]; if(b) b.ctx.clearRect(0,0,b.cv.width,b.cv.height); break; }
    case 'close': { const b=boards[email]; if(b){ b.box.remove(); delete boards[email]; sysMsg(email,`${c.name} a fermé le tableau blanc.`); } break; } } }

/* ---------- Démineur Flags (2 joueurs, 16×16, 51 drapeaux, premier à 26) ---------- */
const flags={}; // email -> {w,h,mines:Set,open:Set,owner:{},scores,me,turn,box}
function flagsBoard(w,h,n){ const s=new Set(); while(s.size<n) s.add(Math.floor(Math.random()*w*h)); return [...s]; }
function flagsStart(email,mines,meSym,turn){
  const g=flags[email]={w:16,h:16,mines:new Set(mines),open:new Set(),owner:{},scores:{X:0,O:0},me:meSym,turn}; const conv=convs[email];
  const box=document.createElement('div'); box.className='gamebox'; conv.el.querySelector('.history').insertAdjacentElement('afterend',box); g.box=box; growConv(email,760); flagsRender(email);
  sysMsg(email,'Démineur Flags : trouvez les drapeaux ! Un drapeau = 1 point et vous rejouez. Premier à 26.');
}
function flagsCount(g,i){ const x=i%g.w,y=Math.floor(i/g.w); let n=0; for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){ if(!dx&&!dy) continue; const X=x+dx,Y=y+dy; if(X<0||Y<0||X>=g.w||Y>=g.h) continue; if(g.mines.has(Y*g.w+X)) n++; } return n; }
function flagsReveal(g,i,who){ if(g.open.has(i)) return; g.open.add(i); if(g.mines.has(i)){ g.owner[i]=who; g.scores[who]++; return; } if(flagsCount(g,i)===0){ const x=i%g.w,y=Math.floor(i/g.w); for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){ const X=x+dx,Y=y+dy; if(X<0||Y<0||X>=g.w||Y>=g.h) continue; const j=Y*g.w+X; if(!g.mines.has(j)) flagsReveal(g,j,who); } } }
function flagsRender(email){
  const g=flags[email]; const other=g.me==='X'?'O':'X'; const won=g.scores.X>=26?'X':g.scores.O>=26?'O':null;
  const status=won?(won===g.me?'Vous avez gagné ! (Y)':'Vous avez perdu… :('):(g.turn===g.me?'À vous de jouer':'Au tour de l\'adversaire…');
  let cells=''; for(let i=0;i<g.w*g.h;i++){ if(!g.open.has(i)) cells+=`<div class="fc hid" data-i="${i}"></div>`; else if(g.mines.has(i)) cells+=`<div class="fc flag ${g.owner[i]===g.me?'mine':'theirs'}">⚑</div>`; else { const n=flagsCount(g,i); cells+=`<div class="fc n${n}">${n||''}</div>`; } }
  g.box.innerHTML=`<div class="gamehdr">Démineur Flags — ${renderEmoticons(status)} &nbsp; <span style="color:#3A60E0">Vous : ${g.scores[g.me]}</span> &nbsp; <span style="color:#D02020">Adv. : ${g.scores[other]}</span> <span class="link fquit">Quitter</span></div><div class="fgrid">${cells}</div>`;
  g.box.querySelector('.fquit').onclick=()=>{ flagsEnd(email); netSend({type:'game',to:email,kind:'fquit'}); };
  if(!won&&g.turn===g.me) g.box.querySelectorAll('.fc.hid').forEach(c=>c.onclick=()=>flagsMove(email,+c.dataset.i,true));
  if(won) play(won===g.me?'wink':'newalert');
}
function flagsMove(email,i,mine){
  const g=flags[email]; if(!g||g.open.has(i)) return; const who=mine?g.me:(g.me==='X'?'O':'X'); const wasMine=g.mines.has(i); flagsReveal(g,i,who);
  if(!wasMine) g.turn=who===g.me?(g.me==='X'?'O':'X'):g.me; // un drapeau fait rejouer
  flagsRender(email); if(mine){ netSend({type:'game',to:email,kind:'fmove',i}); play(wasMine?'outgoing':'type'); if(net.mode==='demo'&&g.turn!==g.me) setTimeout(()=>flagsBot(email),600); }
}
function flagsBot(email){ const g=flags[email]; if(!g||g.turn===g.me) return; const hid=[]; for(let i=0;i<g.w*g.h;i++) if(!g.open.has(i)) hid.push(i); if(!hid.length) return; const pick=Math.random()<.35?(hid.find(i=>g.mines.has(i))??hid[0]):hid[Math.floor(Math.random()*hid.length)]; flagsMove(email,pick,false); if(g.turn!==g.me&&!(g.scores.O>=26)) setTimeout(()=>flagsBot(email),600); }
function flagsEnd(email){ const g=flags[email]; if(g){ g.box.remove(); delete flags[email]; } }

/* Menu Jeux : Morpion ou Démineur Flags */
const _action2=action;
action=function(email,act,ev){
  if(act==='games'&&!email.startsWith('g:')){ if(games[email]||flags[email]) return; const r=ev.currentTarget.getBoundingClientRect();
    showMenu([{label:'Morpion',fn:()=>gameInvite(email)},{label:'Démineur Flags',fn:()=>{ if(net.mode==='demo'){ flagsStart(email,flagsBoard(16,16,51),'X','X'); return; } sysMsg(email,'Invitation à jouer au Démineur Flags envoyée…'); netSend({type:'game',to:email,kind:'finvite'}); }}],r.left,r.bottom); return; }
  if(act==='activities'&&!email.startsWith('g:')){ const r=ev.currentTarget.getBoundingClientRect(); showMenu([{label:'Tableau blanc partagé',fn:()=>whiteboard(email,false)},{label:'Partager mon écran',fn:()=>{ const c=byEmail(email); if(net.mode!=='server'){ sysMsg(email,'Le partage d\'écran nécessite le serveur (mode démo).'); return; } if(calls[email]){ hangup(email,true); return; } sysMsg(email,`Vous avez invité ${c.name} à voir votre écran. En attente de réponse…`); play('ring'); netSend({type:'rtc',to:email,kind:'invite',video:true,screen:true}); }}],r.left,r.bottom); return; }
  return _action2(email,act,ev);
};
const _onGame=onGame;
onGame=function(m){ const email=m.from; const c=byEmail(email); if(!c) return; openConv(email);
  switch(m.kind){
    case 'finvite': play('newalert'); dialog('Messenger',`<b>${renderEmoticons(c.name)}</b> vous invite à jouer au Démineur Flags.`,[{label:'Accepter',fn:()=>{ const mines=flagsBoard(16,16,51); netSend({type:'game',to:email,kind:'faccept',mines}); flagsStart(email,mines,'O','X'); }},{label:'Refuser',fn:()=>netSend({type:'game',to:email,kind:'decline'})}]); return;
    case 'faccept': flagsStart(email,m.mines,'X','X'); return;
    case 'fmove': flagsMove(email,m.i,false); return;
    case 'fquit': sysMsg(email,`${c.name} a quitté la partie.`); flagsEnd(email); return;
  }
  _onGame(m);
};

/* ---------- Surnoms & groupes de contacts (stockés localement, comme les paramètres du client) ---------- */
const NICKS=JSON.parse(localStorage.getItem('msn_nicks')||'{}'); const CGROUPS=JSON.parse(localStorage.getItem('msn_cgroups')||'{}'); let GROUP_NAMES=JSON.parse(localStorage.getItem('msn_groupnames')||'["Amis","Famille","Travail"]');
let viewByGroup=localStorage.getItem('msn_bygroup')==='1';
const saveLocal=()=>{ localStorage.setItem('msn_nicks',JSON.stringify(NICKS)); localStorage.setItem('msn_cgroups',JSON.stringify(CGROUPS)); localStorage.setItem('msn_groupnames',JSON.stringify(GROUP_NAMES)); localStorage.setItem('msn_bygroup',viewByGroup?'1':'0'); };
const displayName=c=>NICKS[c.email]||c.name;
const _renderContacts=renderContacts;
renderContacts=function(){
  const box=document.getElementById('contacts'); box.innerHTML='';
  const q=(document.getElementById('filter').value||'').toLowerCase();
  const list=contacts.filter(c=>!c.group).filter(c=>!q||displayName(c).toLowerCase().includes(q)||c.name.toLowerCase().includes(q)||(c.psm||'').toLowerCase().includes(q)||c.email.includes(q));
  const row=c=>{
    const d=document.createElement('div'); d.className='ct'+(c.status==='offline'||c.status==='blocked'?' off':'');
    const stTxt=c.status!=='online'?` <span style="color:#777">(${stLabel(c.status)})</span>`:'';
    d.innerHTML=`<svg class="sico"><use href="#${stIco(c.status)}"/></svg><span class="ct-name">${renderEmoticons(displayName(c))}${stTxt}</span>${c.psm?`<span class="ct-psm">- ${renderEmoticons(c.psm)}</span>`:''}`;
    d.title=`${c.name}\n${c.email}\n${stLabel(c.status)}${c.psm?'\n'+c.psm:''}`;
    d.ondblclick=()=>openConv(c.email); d.onclick=()=>{ box.querySelectorAll('.ct').forEach(x=>x.classList.remove('sel')); d.classList.add('sel'); };
    d.oncontextmenu=e=>{ e.preventDefault(); showMenu([
      {label:'Envoyer un message instantané',fn:()=>openConv(c.email)},
      {label:'Envoyer un fichier…',fn:()=>{ openConv(c.email); sendFile(c.email); }},
      {label:'Envoyer un Wizz',fn:()=>{ openConv(c.email); nudge(c.email,true); }},
      {sep:true},
      {label:'Renommer (surnom)…',fn:()=>ask('Renommer le contact',`Surnom pour ${c.name} (vide = pseudo d'origine) :`,NICKS[c.email]||'',n=>{ if(n.trim()) NICKS[c.email]=n.trim(); else delete NICKS[c.email]; saveLocal(); renderContacts(); })},
      {label:'Déplacer vers le groupe…',fn:()=>ask('Déplacer vers un groupe','Groupe ('+GROUP_NAMES.join(', ')+') ou nouveau nom :',CGROUPS[c.email]||GROUP_NAMES[0],g=>{ const gn=g.trim(); if(gn){ if(!GROUP_NAMES.includes(gn)) GROUP_NAMES.push(gn); CGROUPS[c.email]=gn; } else delete CGROUPS[c.email]; viewByGroup=true; saveLocal(); renderContacts(); })},
      {sep:true},
      c.status==='blocked'?{label:'Débloquer',fn:()=>{ c.status='offline'; netSend({type:'unblock',email:c.email}); renderContacts(); }}:{label:'Bloquer',fn:()=>{ c.status='blocked'; netSend({type:'block',email:c.email}); renderContacts(); }},
      {label:'Supprimer le contact',fn:()=>ask2('Supprimer le contact',`Supprimer <b>${renderEmoticons(c.name)}</b> de votre liste de contacts ?`,()=>{ contacts=contacts.filter(x=>x!==c); netSend({type:'remove',email:c.email}); renderContacts(); })},
    ],e.clientX,e.clientY); };
    return d;
  };
  const addGroup=(label,arr)=>{ const g=document.createElement('div'); g.className='grp'+(groupsOpen[label]===false?' closed':''); g.innerHTML=`<span class="tri"></span>${esc(label)} (${arr.filter(c=>c.status!=='offline'&&c.status!=='blocked').length}/${arr.length})`;
    g.onclick=()=>{ groupsOpen[label]=groupsOpen[label]===false; renderContacts(); }; const b=document.createElement('div'); b.className='grpbody'; arr.forEach(c=>b.appendChild(row(c))); box.appendChild(g); box.appendChild(b); };
  const sortSt=(a,b)=>((a.status==='offline'||a.status==='blocked')-(b.status==='offline'||b.status==='blocked'))||displayName(a).localeCompare(displayName(b));
  if(viewByGroup){ const names=[...GROUP_NAMES,'Autres contacts']; names.forEach(n=>{ const arr=list.filter(c=>(CGROUPS[c.email]||'Autres contacts')===n).sort(sortSt); if(arr.length||n!=='Autres contacts') addGroup(n,arr); }); }
  else { const on=list.filter(c=>c.status!=='offline'&&c.status!=='blocked'), off=list.filter(c=>c.status==='offline'||c.status==='blocked'); addGroup('En ligne',on); addGroup('Hors ligne',off); }
  // bascule du tri (menu Contacts)
  const bar=document.getElementById('sortbar')||(()=>{ const s=document.createElement('div'); s.id='sortbar'; box.parentNode.insertBefore(s,box); return s; })();
  bar.innerHTML=`<span class="link" id="sortToggle">${viewByGroup?'Trier par statut':'Trier par groupe'}</span>`; bar.querySelector('#sortToggle').onclick=()=>{ viewByGroup=!viewByGroup; saveLocal(); renderContacts(); };
};

/* Images perso animées : un GIF est conservé tel quel (pas de recadrage) */
pickDp=function(){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=()=>{ const f=inp.files[0]; if(!f) return;
    if(f.type==='image/gif'&&f.size<140000){ const r=new FileReader(); r.onload=()=>{ me.dp=r.result; renderMe(); pushProfile(); }; r.readAsDataURL(f); return; }
    if(f.type==='image/gif') toast('Messenger','GIF trop lourd pour rester animé (max 140 Ko) : il sera figé.');
    const img=new Image(); const url=URL.createObjectURL(f);
    img.onload=()=>{ const c=document.createElement('canvas'); c.width=c.height=96; const x=c.getContext('2d'); const s=Math.min(img.width,img.height); x.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,96,96); me.dp=c.toDataURL('image/jpeg',.85); URL.revokeObjectURL(url); renderMe(); pushProfile(); };
    img.src=url; };
  inp.click();
};
document.getElementById('myDp').onclick=()=>pickDp();

/* ---------- Branchement réseau ---------- */
const _onNet2=onNet;
onNet=function(m){ if(m.type==='file') return onFile(m); if(m.type==='wb') return onWb(m); return _onNet2(m); };
document.getElementById('filter').oninput=()=>renderContacts();
