const { chromium } = require('playwright');
const S='/tmp/msn-tests/';
(async()=>{
  const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--auto-select-desktop-capture-source=Entire screen','--auto-select-tab-capture-source-by-title=Messenger']}); const errs=[];
  const mk=async()=>{ const c=await b.newContext({viewport:{width:1024,height:720},permissions:['microphone','camera']}); const p=await c.newPage(); p.on('pageerror',e=>errs.push('PAGE '+e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('CON '+m.text()); }); p.on('dialog',d=>d.accept()); await p.goto('http://localhost:'+(process.env.PORT||8080)+'/'); return p; };
  const reg=async(p,email,name)=>{ await p.click('#regLink'); await p.fill('#email',email); await p.fill('#pwd','1234'); await p.fill('#regName',name); await p.click('#btnLogin'); await p.waitForFunction(()=>document.getElementById('loginErr').textContent.includes('créé')); await p.fill('#email',email); await p.fill('#pwd','1234'); await p.click('#btnLogin'); await p.waitForSelector('#mainWin',{state:'visible'}); await p.click('.dialog:has-text("MSN Today") .btn'); };
  const add=async(from,to,toPage)=>{ await from.click('.addrow .link'); await from.fill('#addEmail',to); await from.click('.dialog .btn'); await toPage.waitForSelector('.dialog'); await toPage.click('.dialog .btn'); await from.waitForFunction(e=>[...document.querySelectorAll('.ct')].some(c=>c.title.includes(e)&&c.title.includes('En ligne')),to); };
  const A=await mk(),B=await mk(),C=await mk();
  await reg(A,'alice@h.fr','Alice'); await reg(B,'bob@h.fr','Bob'); await reg(C,'carol@h.fr','Carol');
  await add(A,'bob@h.fr',B); await add(A,'carol@h.fr',C);
  // groupe : Alice ouvre conv avec Bob, invite Carol
  await A.dblclick('.ct:has-text("Bob")'); await A.click('[data-act="invite"]'); await A.check('.dialog input[type=checkbox]'); await A.click('.dialog .btn:has-text("OK")');
  await A.waitForSelector('.convWin[data-cid^="g:"]'); await A.fill('.convWin[data-cid^="g:"] textarea','salut tout le monde (L)'); await A.keyboard.press('Enter');
  await B.waitForSelector('.convWin[data-cid^="g:"] .msg'); await C.waitForSelector('.convWin[data-cid^="g:"] .msg');
  await C.fill('.convWin[data-cid^="g:"] textarea','coucou !! (*)'); await C.keyboard.press('Enter');
  await A.waitForFunction(()=>document.querySelectorAll('.convWin[data-cid^="g:"] .msg').length>=2); await B.waitForFunction(()=>document.querySelectorAll('.convWin[data-cid^="g:"] .msg').length>=2);
  console.log('group OK');
  // morpion Alice-Bob
  await A.click('.convWin[data-cid="bob@h.fr"] .title'); await A.click('.convWin[data-cid="bob@h.fr"] [data-act="games"]'); await A.click('#ctxMenu .mi:has-text("Morpion")'); await B.waitForSelector('.dialog:has-text("Morpion")'); await B.click('.dialog .btn:has-text("Accepter")');
  await A.waitForSelector('.convWin[data-cid="bob@h.fr"] .ttt'); await A.click('.convWin[data-cid="bob@h.fr"] .cell[data-i="4"]'); await B.waitForFunction(()=>document.querySelector('.convWin[data-cid="alice@h.fr"] .cell[data-i="4"]').textContent==='X');
  await B.click('.convWin[data-cid="alice@h.fr"] .title'); await B.click('.convWin[data-cid="alice@h.fr"] .cell[data-i="0"]'); await A.waitForFunction(()=>document.querySelector('.convWin[data-cid="bob@h.fr"] .cell[data-i="0"]').textContent==='O');
  console.log('game OK');
  // appel audio Alice -> Bob
  await A.click('.convWin[data-cid="bob@h.fr"] [data-act="audio"]'); await B.waitForSelector('.dialog:has-text("appel audio")'); await B.click('.dialog .btn:has-text("Accepter")');
  await A.waitForSelector('.callbox'); await B.waitForSelector('.callbox');
  await A.waitForFunction(()=>{ const v=document.querySelector('.callbox .rv'); return v&&v.srcObject&&v.srcObject.getTracks().length>0; },null,{timeout:10000});
  console.log('call connected, remote tracks received');
  await A.screenshot({path:S+'f1_call_game.png'}); await B.screenshot({path:S+'f2_bob.png'});
  await A.click('.callbox .hang'); await B.waitForFunction(()=>!document.querySelector('.callbox'));
  console.log('hangup OK');
  // partage d'écran Alice -> Bob
  await A.click('.convWin[data-cid="bob@h.fr"] .title'); await A.click('.convWin[data-cid="bob@h.fr"] [data-act="activities"]'); await A.click('#ctxMenu .mi:has-text("Partager mon écran")');
  await B.waitForSelector('.dialog:has-text("partager son écran")'); await B.click('.dialog .btn:has-text("Accepter")');
  await B.waitForFunction(()=>{ const v=document.querySelector('.callbox.screen .rv'); return v&&v.srcObject&&v.srcObject.getVideoTracks().length>0; },null,{timeout:15000});
  console.log('screen share: remote video track received');
  await B.screenshot({path:'/tmp/msn-tests/screenshare.png'}); await A.click('.callbox .hang'); await B.waitForFunction(()=>!document.querySelector('.callbox')); console.log('errors:',errs); await b.close();
})().catch(e=>{ console.error('FAIL',e.message); process.exit(1); });
