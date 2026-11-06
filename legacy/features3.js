/* ====================================================================
   Lot 3 : Solitaire Showdown (course de solitaire à deux), fenêtre
   « MSN Today » à la connexion, son de connexion, inactivité automatique.
   ==================================================================== */

/* ---------- Solitaire Showdown ----------
   Chacun joue sa propre réussite (Klondike simplifié : 7 colonnes, pioche, 4 fondations).
   Les 4 fondations sont PARTAGÉES : le premier à y poser une carte marque le point. Score = cartes posées. */
const SUITS=['♠','♥','♦','♣'], RED=s=>s==='♥'||s==='♦';
const solit={}; // email -> état
function deck(seed){ let s=seed; const rnd=()=>{ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; }; const d=[]; for(const su of SUITS) for(let v=1;v<=13;v++) d.push({v,su}); for(let i=d.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [d[i],d[j]]=[d[j],d[i]]; } return d; }
function solitStart(email,seed,meSym){
  const d=deck(seed^(meSym==='X'?0:0x5bd1e995)); const cols=[]; for(let c=0;c<7;c++){ cols.push(d.splice(0,c+1).map((k,i)=>({...k,up:i===c}))); }
  const g=solit[email]={cols,stock:d,waste:[],found:{'♠':0,'♥':0,'♦':0,'♣':0},scores:{X:0,O:0},me:meSym,sel:null,box:null};
  const conv=convs[email]; const box=document.createElement('div'); box.className='gamebox'; conv.el.querySelector('.history').insertAdjacentElement('afterend',box); g.box=box; growConv(email,720); solitRender(email);
  sysMsg(email,'Solitaire Showdown : même donne pour les deux joueurs, fondations partagées. Le premier à poser une carte marque le point. Premier à 27 !');
}
const cardTxt=k=>({1:'A',11:'J',12:'Q',13:'K'}[k.v]||k.v)+k.su;
function solitRender(email){
  const g=solit[email]; const other=g.me==='X'?'O':'X'; const won=g.scores.X>=27?'X':g.scores.O>=27?'O':null;
  const card=(k,where,i,j)=>k.up?`<div class="card ${RED(k.su)?'red':''} ${g.sel&&g.sel.w===where&&g.sel.i===i&&g.sel.j===j?'sel':''}" data-w="${where}" data-i="${i}" data-j="${j}">${cardTxt(k)}</div>`:`<div class="card back" data-w="${where}" data-i="${i}" data-j="${j}"></div>`;
  let h=`<div class="gamehdr">Solitaire Showdown — <span style="color:#3A60E0">Vous : ${g.scores[g.me]}</span> &nbsp; <span style="color:#D02020">Adv. : ${g.scores[other]}</span> ${won?(won===g.me?' — <b>Vous avez gagné ! (Y)</b>':' — <b>Perdu… :(</b>'):''}<span class="link squit">Quitter</span></div>`;
  h+=`<div class="solit"><div class="srow"><div class="card ${g.stock.length?'back':'empty'}" data-w="stock">${g.stock.length?'':'↻'}</div>${g.waste.length?card(g.waste[g.waste.length-1],'waste',0,0):'<div class="card empty"></div>'}<div class="spacer"></div>${SUITS.map(s=>`<div class="card found ${RED(s)?'red':''}" data-w="found" data-s="${s}">${g.found[s]?cardTxt({v:g.found[s],su:s}):s}</div>`).join('')}</div><div class="scols">${g.cols.map((col,i)=>`<div class="scol" data-w="col" data-i="${i}">${col.map((k,j)=>card(k,'col',i,j)).join('')||'<div class="card empty" data-w="col" data-i="'+i+'" data-j="-1"></div>'}</div>`).join('')}</div></div>`;
  g.box.innerHTML=h.replace('(Y)',emoHtml(EMO_MAP.get('(Y)'))).replace(':(',emoHtml(EMO_MAP.get(':(')));
  g.box.querySelector('.squit').onclick=()=>{ solitEnd(email); netSend({type:'game',to:email,kind:'squit'}); };
  if(won) return;
  g.box.querySelectorAll('[data-w]').forEach(el=>el.onclick=()=>solitClick(email,el.dataset));
}
function solitClick(email,d){
  const g=solit[email];
  if(d.w==='stock'){ if(g.stock.length) g.waste.push({...g.stock.pop(),up:true}); else { g.stock=g.waste.reverse().map(k=>({...k,up:false})); g.waste=[]; } g.sel=null; return solitRender(email); }
  const pick=()=>{ if(!g.sel) return null; if(g.sel.w==='waste') return [g.waste[g.waste.length-1]]; return g.cols[g.sel.i].slice(g.sel.j); };
  const remove=()=>{ if(g.sel.w==='waste') g.waste.pop(); else { g.cols[g.sel.i].splice(g.sel.j); const col=g.cols[g.sel.i]; if(col.length) col[col.length-1].up=true; } };
  if(d.w==='found'){ const run=pick(); if(run&&run.length===1){ const k=run[0]; if(k.su===d.s&&k.v===g.found[d.s]+1){ remove(); g.found[d.s]=k.v; g.scores[g.me]++; netSend({type:'game',to:email,kind:'sfound',s:d.s,v:k.v}); play('outgoing'); if(net.mode==='demo') setTimeout(()=>solitBot(email),800); } } g.sel=null; return solitRender(email); }
  if(d.w==='waste'){ g.sel=g.sel&&g.sel.w==='waste'?null:{w:'waste',i:0,j:0}; return solitRender(email); }
  if(d.w==='col'){ const i=+d.i, j=+d.j; const col=g.cols[i];
    if(g.sel&&!(g.sel.w==='col'&&g.sel.i===i)){ const run=pick(); const top=col[col.length-1]; const ok=run&&(top?(top.up&&top.v===run[0].v+1&&RED(top.su)!==RED(run[0].su)):run[0].v===13); if(ok){ remove(); col.push(...run); g.sel=null; } else g.sel=null; return solitRender(email); }
    if(j>=0&&col[j]&&col[j].up){ g.sel=(g.sel&&g.sel.i===i&&g.sel.j===j)?null:{w:'col',i,j}; } else g.sel=null; return solitRender(email); }
}
function solitBot(email){ const g=solit[email]; if(!g||g.scores.O>=27) return; const s=SUITS[Math.floor(Math.random()*4)]; if(Math.random()<.5){ g.scores.O++; g.found[s]=Math.max(g.found[s],Math.min(13,g.found[s]+1)); solitRender(email); } }
function solitEnd(email){ const g=solit[email]; if(g){ g.box.remove(); delete solit[email]; } }
const _onGame3=onGame;
onGame=function(m){ const email=m.from; const c=byEmail(email); if(!c) return; openConv(email);
  switch(m.kind){
    case 'sinvite': play('newalert'); dialog('Messenger',`<b>${renderEmoticons(c.name)}</b> vous invite à jouer au Solitaire Showdown.`,[{label:'Accepter',fn:()=>{ const seed=Math.floor(Math.random()*1e9); netSend({type:'game',to:email,kind:'saccept',seed}); solitStart(email,seed,'O'); }},{label:'Refuser',fn:()=>netSend({type:'game',to:email,kind:'decline'})}]); return;
    case 'saccept': solitStart(email,m.seed,'X'); return;
    case 'sfound': { const g=solit[email]; if(!g) return; const other=g.me==='X'?'O':'X'; g.scores[other]++; if(m.v>g.found[m.s]) g.found[m.s]=m.v; solitRender(email); play('type'); return; }
    case 'squit': sysMsg(email,`${c.name} a quitté la partie.`); solitEnd(email); return;
  }
  _onGame3(m);
};
const _action3=action;
action=function(email,act,ev){
  if(act==='games'&&!email.startsWith('g:')){ if(games[email]||flags[email]||solit[email]) return; const r=ev.currentTarget.getBoundingClientRect();
    showMenu([{label:'Morpion',fn:()=>gameInvite(email)},
      {label:'Démineur Flags',fn:()=>{ if(net.mode==='demo'){ flagsStart(email,flagsBoard(16,16,51),'X','X'); return; } sysMsg(email,'Invitation à jouer au Démineur Flags envoyée…'); netSend({type:'game',to:email,kind:'finvite'}); }},
      {label:'Solitaire Showdown',fn:()=>{ if(net.mode==='demo'){ solitStart(email,42,'X'); return; } sysMsg(email,'Invitation à jouer au Solitaire Showdown envoyée…'); netSend({type:'game',to:email,kind:'sinvite'}); }}],r.left,r.bottom); return; }
  return _action3(email,act,ev);
};

/* ---------- « MSN Today » à la connexion + son de connexion ---------- */
const _finishLogin=finishLogin;
window._showTodayDialog=function(){
  const w=dialog('MSN Today',`<div style="display:flex;gap:10px"><svg width="56" height="56"><use href="#logo"/></svg><div><b style="font-size:13px;color:#1E3F7A">Bienvenue sur Messenger !</b><br><br>
    <b>Astuces de l'époque</b><br>• Tapez <b>(L)</b> pour un cœur, <b>(K)</b> pour un bisou, <b>(6)</b> pour le diable.<br>• Maintenez <b>F2</b> pour envoyer un voice clip.<br>• Le bouton ⚡ envoie un <b>Wizz</b> (une fois toutes les 10 s, sinon c'est du spam).<br>• Clic droit sur un contact pour lui donner un surnom.<br><br>
    <label><input type="checkbox" id="todayOff">Ne plus afficher MSN Today à la connexion</label></div></div>`,[{label:'Fermer',fn:w=>{ if(w.querySelector('#todayOff').checked) localStorage.setItem('msn_today_off','1'); }}]);
  w.style.width='420px'; w.style.left='calc(50% - 210px)';
};
finishLogin=function(){ _finishLogin(); play('online'); if(localStorage.getItem('msn_today_off')!=='1') window._showTodayDialog(); };

/* ---------- Inactif automatique (5 min sans activité, comme l'original) ---------- */
let idleTimer=null, idleBefore=null;
function idleReset(){ clearTimeout(idleTimer); if(idleBefore){ me.status=idleBefore; idleBefore=null; renderMe(); netSend({type:'status',status:me.status}); }
  idleTimer=setTimeout(()=>{ if(me.status==='online'){ idleBefore='online'; me.status='away'; renderMe(); netSend({type:'status',status:'away'}); document.getElementById('myStatusTxt').textContent='(Inactif)'; } },5*60*1000); }
['mousemove','keydown','mousedown','touchstart'].forEach(ev=>document.addEventListener(ev,idleReset,{passive:true})); idleReset();
