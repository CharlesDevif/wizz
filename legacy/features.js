/* ====================================================================
   Fonctionnalités avancées : émoticônes perso, conversations à plusieurs,
   appels audio/vidéo (WebRTC), Morpion, Dynamic Backgrounds.
   Chargé après app.js ; étend/surcharge ses fonctions.
   ==================================================================== */

/* ---------- Émoticônes personnalisées ---------- */
const CUSTOM=JSON.parse(localStorage.getItem('msn_custom')||'{}'); // shortcut -> {name,data}
let activeCustom=null; // émoticônes perso de l'expéditeur du message en cours de rendu
const _renderEmoticons=renderEmoticons;
renderEmoticons=function(text){
  text=String(text); const map=Object.assign({},CUSTOM,activeCustom||{});
  const keys=Object.keys(map).sort((a,b)=>b.length-a.length); if(!keys.length) return _renderEmoticons(text);
  let out='',i=0; outer: while(i<text.length){ for(const k of keys){ if(text.startsWith(k,i)){ out+=`<span class="emo" title="${esc(map[k].name)}  ${esc(k)}"><img src="${map[k].data}" alt="" style="width:19px;height:19px;vertical-align:top"></span>`; i+=k.length; continue outer; } }
    // on accumule le texte normal et on le passe au rendu standard par segments
    let j=i; while(j<text.length&&!keys.some(k=>text.startsWith(k,j))) j++; out+=_renderEmoticons(text.slice(i,j)); i=j; }
  return out;
};
function usedCustom(text){ const u={}; for(const k in CUSTOM) if(text.includes(k)) u[k]=CUSTOM[k]; return Object.keys(u).length?u:null; }
function customDialog(){
  const list=()=>Object.entries(CUSTOM).map(([k,v])=>`<div style="display:flex;align-items:center;gap:8px;padding:2px 0"><img src="${v.data}" style="width:19px;height:19px"> <b>${esc(k)}</b> <span style="color:#555">${esc(v.name)}</span> <span class="link" data-del="${esc(k)}" style="margin-left:auto">Supprimer</span></div>`).join('')||'<i style="color:#777">Aucune émoticône personnalisée.</i>';
  const w=dialog('Mes émoticônes',`<div id="cuList" style="max-height:140px;overflow:auto;border:1px solid #A9C4E4;background:#fff;padding:4px;margin-bottom:8px">${list()}</div>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:5px 8px;align-items:center"><span>Image :</span><input type="file" id="cuFile" accept="image/*"><span>Raccourci :</span><input type="text" id="cuKey" placeholder="ex: (moi) ou *lol*" maxlength="12"><span>Nom :</span><input type="text" id="cuName" placeholder="Nom de l'émoticône"></div>
    <div style="color:#555;font-size:10px;margin-top:6px">L'image est réduite à 19×19 comme à l'époque. Le raccourci est converti dans vos messages et transmis à vos contacts.</div>`,
    [{label:'Ajouter',fn:w=>{ const f=w.querySelector('#cuFile').files[0], k=w.querySelector('#cuKey').value.trim(), n=w.querySelector('#cuName').value.trim()||k; if(!f||!k||k.length<2){ toast('Messenger','Choisissez une image et un raccourci d\'au moins 2 caractères.'); return false; }
      const img=new Image(); const url=URL.createObjectURL(f); img.onload=()=>{ const c=document.createElement('canvas'); c.width=c.height=19; c.getContext('2d').drawImage(img,0,0,19,19); CUSTOM[k]={name:n,data:c.toDataURL('image/png')}; localStorage.setItem('msn_custom',JSON.stringify(CUSTOM)); URL.revokeObjectURL(url); toast('Messenger',`Émoticône ${k} ajoutée.`); }; img.src=url; }},{label:'Fermer'}]);
  w.querySelector('#cuList').onclick=e=>{ const k=e.target.dataset.del; if(k){ delete CUSTOM[k]; localStorage.setItem('msn_custom',JSON.stringify(CUSTOM)); w.querySelector('#cuList').innerHTML=list(); } };
}
document.querySelector('#emoPicker .foot .link').onclick=()=>{ hideEmoPicker(); customDialog(); };

/* addMsg avec émoticônes perso de l'expéditeur */
const _addMsg=addMsg;
addMsg=function(email,who,text,mine,font,custom){ activeCustom=custom||null; try{ _addMsg(email,who,text,mine,font); } finally{ activeCustom=null; } };
const _receive=receive;
receive=function(email,m,wasOffline){ if(m.group) return groupReceive(m); activeCustom=m.custom||null; try{ _receive(email,m,wasOffline); } finally{ activeCustom=null; } };
const _sendMsg=sendMsg;
sendMsg=function(key){
  if(key.startsWith('g:')) return groupSend(key);
  const conv=convs[key]; const ta=conv.el.querySelector('textarea'); const t=ta.value.replace(/\s+$/,''); if(!t) return;
  const custom=usedCustom(t);
  if(net.mode==='server'){ ta.value=''; addMsg(key,me.name,t,true,me.font,custom); play('outgoing'); netSend({type:'msg',to:key,text:t,font:me.font,custom}); return; }
  activeCustom=custom; try{ _sendMsg(key); } finally{ activeCustom=null; }
};

/* ---------- Conversations à plusieurs ---------- */
const groups={}; // id -> {id, members:[email], names:{email:name}}
function groupKey(id){ return 'g:'+id; }
function openGroupConv(g){
  const key=groupKey(g.id); if(convs[key]){ convs[key].el.classList.remove('hidden'); bringFront(convs[key].el); return convs[key]; }
  const others=g.members.filter(e=>e!==me.email);
  // on réutilise la fenêtre de conversation standard via un contact fictif
  const fake={email:key,name:others.map(e=>g.names[e]||e).join(', '),status:'online',psm:'',dp:null,group:true};
  contacts.push(fake); const conv=openConv(key); contacts.splice(contacts.indexOf(fake),1);
  conv.group=g; conv.el.querySelector('.t-text').textContent=`Conversation (${g.members.length} participants)`;
  conv.el.querySelector('.toline').innerHTML=`À : ${others.map(e=>`<b>${renderEmoticons(g.names[e]||e)}</b> &lt;${esc(e)}&gt;`).join(' ; ')}`;
  conv.el.querySelector('.ct-dp').innerHTML=`<svg><use href="#ico-invite"/></svg>`;
  sysMsg(key,`Conversation à plusieurs : ${g.members.map(e=>g.names[e]||e).join(', ')}.`);
  return conv;
}
function inviteDialogGroup(fromKey){
  if(net.mode!=='server'){ sysMsg(fromKey,'Les conversations à plusieurs nécessitent le serveur (mode démo).'); return; }
  const base=fromKey.startsWith('g:')?groups[fromKey.slice(2)].members.slice():[me.email,fromKey];
  const cands=contacts.filter(c=>c.status!=='offline'&&c.status!=='blocked'&&!c.group&&!base.includes(c.email));
  if(!cands.length){ sysMsg(fromKey,'Aucun autre contact en ligne à inviter.'); return; }
  dialog('Inviter quelqu\'un dans cette conversation',`<div>Sélectionnez les contacts à inviter :</div><div style="max-height:160px;overflow:auto;border:1px solid #A9C4E4;background:#fff;padding:4px;margin-top:6px">${cands.map(c=>`<label style="display:block;padding:2px"><input type="checkbox" value="${esc(c.email)}"><svg width="14" height="14" style="vertical-align:-2px"><use href="#${stIco(c.status)}"/></svg> ${renderEmoticons(c.name)}</label>`).join('')}</div>`,
    [{label:'OK',fn:w=>{ const sel=[...w.querySelectorAll('input:checked')].map(i=>i.value); if(!sel.length) return false;
      const id=fromKey.startsWith('g:')?fromKey.slice(2):(Date.now().toString(36)+Math.random().toString(36).slice(2,6));
      const g=groups[id]||(groups[id]={id,members:base.slice(),names:{}}); g.names[me.email]=me.name; contacts.forEach(c=>{ if(g.members.includes(c.email)) g.names[c.email]=c.name; });
      sel.forEach(e=>{ if(!g.members.includes(e)){ g.members.push(e); g.names[e]=(byEmail(e)||{}).name||e; } });
      // informer tous les membres (les anciens reçoivent la liste mise à jour)
      g.members.filter(e=>e!==me.email).forEach(e=>netSend({type:'group',to:e,group:true,action:'members',id,members:g.members,names:g.names}));
      const conv=openGroupConv(g); conv.group=g; conv.el.querySelector('.t-text').textContent=`Conversation (${g.members.length} participants)`;
      conv.el.querySelector('.toline').innerHTML=`À : ${g.members.filter(e=>e!==me.email).map(e=>`<b>${renderEmoticons(g.names[e]||e)}</b>`).join(' ; ')}`;
      sysMsg(groupKey(id),`Vous avez invité ${sel.map(e=>g.names[e]).join(', ')}.`);
      if(!fromKey.startsWith('g:')) sysMsg(fromKey,`Une conversation à plusieurs a été ouverte dans une nouvelle fenêtre.`); }},{label:'Annuler'}]);
}
function groupSend(key){
  const conv=convs[key]; const g=conv.group; const ta=conv.el.querySelector('textarea'); const t=ta.value.replace(/\s+$/,''); if(!t) return; ta.value='';
  const custom=usedCustom(t); addMsg(key,me.name,t,true,me.font,custom); play('outgoing');
  g.members.filter(e=>e!==me.email).forEach(e=>netSend({type:'msg',to:e,text:t,font:me.font,custom,group:{id:g.id,members:g.members,names:g.names}}));
}
function groupReceive(m){
  const gi=m.group; const g=groups[gi.id]||(groups[gi.id]={id:gi.id,members:gi.members,names:gi.names||{}}); Object.assign(g.names,gi.names||{}); g.members=gi.members;
  const key=groupKey(g.id); const conv=openGroupConv(g); const name=g.names[m.from]||(byEmail(m.from)||{}).name||m.from;
  if(m.nudge){ sysMsg(key,`${name} vient de vous envoyer un Wizz !`,'nudge'); conv.el.classList.remove('shake'); void conv.el.offsetWidth; conv.el.classList.add('shake'); play('nudge'); return; }
  addMsg(key,name,m.text,false,m.font,m.custom); setStatusLine(key,`Dernier message reçu le ${new Date().toLocaleDateString('fr-FR')} à ${now()}.`,false);
  if(me.status!=='busy'&&me.status!=='phone'){ play('newalert'); if(conv.el.classList.contains('inactive')||conv.el.classList.contains('hidden')) toast(name,m.text,null,null,()=>openGroupConv(g)); }
}
const _nudge=nudge;
nudge=function(key,fromMe){
  if(!key.startsWith('g:')) return _nudge(key,fromMe);
  const conv=convs[key]; const g=conv.group; const t=Date.now(); if(t-conv.lastNudge<10000){ sysMsg(key,'Vous ne pouvez pas envoyer un Wizz aussi souvent.'); return; } conv.lastNudge=t;
  sysMsg(key,'Vous venez d\'envoyer un Wizz !','nudge'); conv.el.classList.remove('shake'); void conv.el.offsetWidth; conv.el.classList.add('shake'); play('nudge');
  g.members.filter(e=>e!==me.email).forEach(e=>netSend({type:'msg',to:e,nudge:true,group:{id:g.id,members:g.members,names:g.names}}));
};

/* ---------- Appels audio / vidéo (WebRTC) ---------- */
const RTC_CFG={iceServers:[{urls:'stun:stun.l.google.com:19302'}]};
const calls={}; // email -> {pc, stream, video, dlg}
function callUI(email,on,video,screen){
  const conv=convs[email]; if(!conv) return; let box=conv.el.querySelector('.callbox');
  if(!on){ if(box) box.remove(); conv.el.querySelector('.convright').style.display=''; return; }
  conv.el.querySelector('.convright').style.display='none';
  if(!box){ box=document.createElement('div'); box.className='callbox'; conv.el.querySelector('.convmain').appendChild(box); }
  box.classList.toggle('screen',!!screen);
  box.innerHTML=`<div class="callhdr">${screen?'Partage d\'écran':video?'Appel vidéo':'Appel audio'} <span class="calltime">00:00</span></div><video class="rv" autoplay playsinline ${video?'':'style="display:none"'}></video><video class="lv" autoplay playsinline muted ${video?'':'style="display:none"'}></video>${video?'':'<div class="audioico"><svg width="48" height="48"><use href="#ico-audio"/></svg></div>'}<button class="btn hang">Raccrocher</button>`;
  box.querySelector('.hang').onclick=()=>hangup(email,true);
  const t0=Date.now(); box.timer=setInterval(()=>{ const s=Math.floor((Date.now()-t0)/1000); box.querySelector('.calltime').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); },1000);
}
async function startCall(email,video,isCaller,screen){
  if(net.mode!=='server'){ sysMsg(email,'Les appels nécessitent le serveur (mode démo).'); return; }
  try{
    let stream; if(screen==='view'){ stream=new MediaStream(); } else if(screen){ stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false}); stream.getVideoTracks()[0].onended=()=>hangup(email,true); } else stream=await navigator.mediaDevices.getUserMedia({audio:true,video:video?{width:320,height:240}:false});
    const pc=new RTCPeerConnection(RTC_CFG); calls[email]={pc,stream,video,screen};
    stream.getTracks().forEach(t=>pc.addTrack(t,stream)); if(screen==='view') pc.addTransceiver('video',{direction:'recvonly'});
    pc.onicecandidate=e=>{ if(e.candidate) netSend({type:'rtc',to:email,kind:'ice',cand:e.candidate}); };
    pc.ontrack=e=>{ const conv=convs[email]; const v=conv&&conv.el.querySelector('.rv'); if(v&&v.srcObject!==e.streams[0]) v.srcObject=e.streams[0]; };
    pc.onconnectionstatechange=()=>{ if(['failed','disconnected','closed'].includes(pc.connectionState)) hangup(email,false); };
    callUI(email,true,video,screen); const lv=convs[email].el.querySelector('.lv'); if(lv) lv.srcObject=stream;
    if(isCaller){ const offer=await pc.createOffer(); await pc.setLocalDescription(offer); netSend({type:'rtc',to:email,kind:'offer',sdp:offer}); }
    return pc;
  }catch(e){ sysMsg(email,'Impossible de démarrer l\'appel : '+e.message); netSend({type:'rtc',to:email,kind:'hangup'}); }
}
function hangup(email,notify){
  const c=calls[email]; if(c){ c.pc.close(); c.stream.getTracks().forEach(t=>t.stop()); delete calls[email]; }
  const conv=convs[email]; if(conv){ const box=conv.el.querySelector('.callbox'); if(box) clearInterval(box.timer); callUI(email,false); sysMsg(email,'L\'appel est terminé.'); }
  if(notify) netSend({type:'rtc',to:email,kind:'hangup'});
}
let ringTimer=null;
async function onRtc(m){
  const email=m.from; const c=byEmail(email); if(!c) return; openConv(email);
  switch(m.kind){
    case 'invite': { play('ring'); ringTimer=setInterval(()=>play('ring'),2500); const what=m.screen?'partager son écran avec vous':`démarrer un appel ${m.video?'vidéo':'audio'}`;
      const d=dialog('Messenger',`<div style="display:flex;gap:10px;align-items:center"><svg width="32" height="32"><use href="#ico-${m.screen?'act':m.video?'video':'audio'}"/></svg><div><b>${renderEmoticons(c.name)}</b> vous invite à ${what}.<br><br>Voulez-vous accepter ?</div></div>`,
        [{label:'Accepter',fn:()=>{ clearInterval(ringTimer); netSend({type:'rtc',to:email,kind:'accept',video:m.video,screen:m.screen}); startCall(email,m.video,false,m.screen?'view':false); }},{label:'Refuser',fn:()=>{ clearInterval(ringTimer); netSend({type:'rtc',to:email,kind:'decline'}); }}]);
      sysMsg(email,`${c.name} vous invite à ${what}.`); break; }
    case 'accept': sysMsg(email,`${c.name} a accepté l'invitation. Connexion…`); startCall(email,m.video,true,m.screen?true:false); break;
    case 'decline': sysMsg(email,`${c.name} a refusé l'invitation.`); break;
    case 'offer': { const call=calls[email]; if(!call) return; await call.pc.setRemoteDescription(m.sdp); const ans=await call.pc.createAnswer(); await call.pc.setLocalDescription(ans); netSend({type:'rtc',to:email,kind:'answer',sdp:ans}); break; }
    case 'answer': { const call=calls[email]; if(call) await call.pc.setRemoteDescription(m.sdp); break; }
    case 'ice': { const call=calls[email]; if(call) try{ await call.pc.addIceCandidate(m.cand); }catch(e){} break; }
    case 'hangup': clearInterval(ringTimer); document.querySelectorAll('.dialog').forEach(d=>{ if(d.textContent.includes('vous invite à démarrer')) d.remove(); }); if(calls[email]) hangup(email,false); else sysMsg(email,`${c.name} a annulé l'appel.`); break;
  }
}

/* ---------- Morpion ---------- */
const games={}; // key -> {board, me:'X'|'O', turn, el}
function gameRender(key){
  const g=games[key]; const conv=convs[key]; let box=conv.el.querySelector('.gamebox');
  if(!box){ box=document.createElement('div'); box.className='gamebox'; conv.el.querySelector('.history').insertAdjacentElement('afterend',box); }
  const win=gameWinner(g.board); const full=g.board.every(x=>x);
  const status=win?(win==='draw'?'Match nul !':(win===g.me?'Vous avez gagné ! (Y)':'Vous avez perdu… :('))+' ':(g.turn===g.me?'À vous de jouer ('+g.me+')':'Au tour de l\'adversaire…');
  box.innerHTML=`<div class="gamehdr">Morpion — ${renderEmoticons(status)} <span class="link gquit">Quitter</span></div><div class="ttt">${g.board.map((v,i)=>`<div class="cell ${v?'':'free'}" data-i="${i}">${v||''}</div>`).join('')}</div>`;
  box.querySelector('.gquit').onclick=()=>{ gameEnd(key); netSend({type:'game',to:key,kind:'quit'}); };
  if(!win&&g.turn===g.me) box.querySelectorAll('.cell.free').forEach(c=>c.onclick=()=>gameMove(key,+c.dataset.i,true));
}
function gameWinner(b){ const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; for(const [a,b2,c] of L) if(b[a]&&b[a]===b[b2]&&b[a]===b[c]) return b[a]; return b.every(x=>x)?'draw':null; }
function gameMove(key,i,mine){
  const g=games[key]; if(!g||g.board[i]) return; g.board[i]=mine?g.me:(g.me==='X'?'O':'X'); g.turn=mine?(g.me==='X'?'O':'X'):g.me; gameRender(key);
  if(mine){ netSend({type:'game',to:key,kind:'move',i}); play('type'); if(net.mode==='demo') setTimeout(()=>{ const free=g.board.map((v,j)=>v?-1:j).filter(j=>j>=0); if(free.length&&!gameWinner(g.board)) gameMove(key,free[Math.floor(Math.random()*free.length)],false); },700); }
  const w=gameWinner(g.board); if(w){ play(w===g.me?'wink':'newalert'); sysMsg(key,w==='draw'?'Morpion : match nul.':(w===g.me?'Morpion : vous avez gagné !':'Morpion : vous avez perdu.')); }
}
function gameEnd(key){ delete games[key]; const conv=convs[key]; if(conv){ const b=conv.el.querySelector('.gamebox'); if(b) b.remove(); } }
function gameStart(key,meSym,turn){ games[key]={board:Array(9).fill(''),me:meSym,turn}; gameRender(key); sysMsg(key,'La partie de Morpion commence. '+(turn===meSym?'Vous commencez.':'L\'adversaire commence.')); }
function gameInvite(key){
  if(net.mode==='demo'){ gameStart(key,'X','X'); return; }
  sysMsg(key,'Invitation à jouer au Morpion envoyée. En attente de réponse…'); netSend({type:'game',to:key,kind:'invite'});
}
function onGame(m){
  const key=m.from; const c=byEmail(key); if(!c) return; openConv(key);
  switch(m.kind){
    case 'invite': play('newalert'); dialog('Messenger',`<b>${renderEmoticons(c.name)}</b> vous invite à jouer au Morpion.`,[{label:'Accepter',fn:()=>{ netSend({type:'game',to:key,kind:'accept'}); gameStart(key,'O','X'); }},{label:'Refuser',fn:()=>netSend({type:'game',to:key,kind:'decline'})}]); break;
    case 'accept': gameStart(key,'X','X'); break;
    case 'decline': sysMsg(key,`${c.name} a refusé l'invitation.`); break;
    case 'move': gameMove(key,m.i,false); break;
    case 'quit': sysMsg(key,`${c.name} a quitté la partie.`); gameEnd(key); break;
  }
}

/* ---------- Dynamic Backgrounds (animés) ---------- */
BGS.push({n:'— Dynamiques —',css:null},{n:'Bulles animées',cls:'dyn-bubbles'},{n:'Neige',cls:'dyn-snow'},{n:'Cœurs flottants',cls:'dyn-hearts'});
bgMenu=function(btn,email){
  showMenu(BGS.map(b=>({label:b.n,dis:b.css===null,fn:()=>{ const h=convs[email].hist; h.classList.remove('dyn-bubbles','dyn-snow','dyn-hearts'); h.style.background=''; h.style.color='';
    if(b.cls){ h.classList.add(b.cls); } else { h.style.background=b.css||''; if(b.n==='Nuit') h.style.color='#fff'; } }})),btn.getBoundingClientRect().left,btn.getBoundingClientRect().top-10);
};

/* ---------- Branchements ---------- */
const _onNet=onNet;
onNet=function(m){
  switch(m.type){
    case 'rtc': onRtc(m); return;
    case 'game': onGame(m); return;
    case 'group': { if(m.action==='members'){ const g=groups[m.id]||(groups[m.id]={id:m.id,members:[],names:{}}); g.members=m.members; Object.assign(g.names,m.names||{}); const conv=openGroupConv(g); conv.group=g; conv.el.querySelector('.t-text').textContent=`Conversation (${g.members.length} participants)`; conv.el.querySelector('.toline').innerHTML=`À : ${g.members.filter(e=>e!==me.email).map(e=>`<b>${renderEmoticons(g.names[e]||e)}</b>`).join(' ; ')}`; const inviter=(g.names[m.from]||m.from); sysMsg(groupKey(m.id),`${inviter} a mis à jour les participants : ${g.members.map(e=>g.names[e]||e).join(', ')}.`); } return; }
    case 'nudge': if(m.group){ groupReceive({...m,nudge:true}); return; } break;
  }
  _onNet(m);
};
const _action=action;
action=function(email,act,ev){
  const c=byEmail(email); const isGroup=email.startsWith('g:');
  switch(act){
    case 'audio': case 'video': if(isGroup){ sysMsg(email,'Les appels ne sont disponibles qu\'en tête-à-tête.'); return; } if(calls[email]){ hangup(email,true); return; }
      if(net.mode!=='server'){ sysMsg(email,`Invitation ${act==='video'?'vidéo':'audio'} envoyée à ${c.name}…`); play('ring'); setTimeout(()=>sysMsg(email,`${c.name} a refusé l'invitation. (Mode démo : les appels réels marchent avec le serveur.)`),3000); return; }
      sysMsg(email,`Vous avez invité ${c.name} à démarrer un appel ${act==='video'?'vidéo':'audio'}. En attente de réponse…`); play('ring'); netSend({type:'rtc',to:email,kind:'invite',video:act==='video'}); return;
    case 'games': if(isGroup){ sysMsg(email,'Les jeux se jouent en tête-à-tête.'); return; } if(games[email]) return; gameInvite(email); return;
    case 'invite': inviteDialogGroup(email); return;
    case 'activities': sysMsg(email,'Activités (tableau blanc partagé) : l\'écriture manuscrite ✎ en est la version solo pour l\'instant.'); return;
    case 'block': case 'file': if(isGroup){ sysMsg(email,'Non disponible dans une conversation à plusieurs.'); return; } break;
  }
  _action(email,act,ev);
};
