const { chromium } = require('playwright');
const S='/tmp/msn-tests/';
(async()=>{
  const b=await chromium.launch(); const errs=[];
  const mk=async()=>{ const c=await b.newContext({viewport:{width:1024,height:720}}); const p=await c.newPage(); p.on('pageerror',e=>errs.push('PAGE '+e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('CON '+m.text()); }); p.on('dialog',d=>d.accept()); await p.goto('http://localhost:'+(process.env.PORT||8080)+'/'); return p; };
  const reg=async(p,email,pass,name)=>{ await p.click('#regLink'); await p.fill('#email',email); await p.fill('#pwd',pass); await p.fill('#regName',name); await p.click('#btnLogin'); await p.waitForFunction(()=>document.getElementById('loginErr').textContent.includes('créé'),null,{timeout:5000}); };
  const login=async(p,email,pass)=>{ await p.fill('#email',email); await p.fill('#pwd',pass); await p.click('#btnLogin'); await p.waitForSelector('#mainWin',{state:'visible',timeout:8000}); await p.click('.dialog:has-text("MSN Today") .btn'); };
  const A=await mk(), B=await mk();
  await reg(A,'alice@hotmail.fr','1234','Alice (L)'); await login(A,'alice@hotmail.fr','1234');
  await reg(B,'bob@hotmail.fr','1234','xX_Bob_Xx'); await login(B,'bob@hotmail.fr','1234');
  // Alice ajoute Bob
  await A.click('.addrow .link'); await A.fill('#addEmail','bob@hotmail.fr'); await A.click('.dialog .btn'); await B.waitForSelector('.dialog',{timeout:5000});
  await B.screenshot({path:S+'e1_invite.png'});
  await B.click('.dialog .btn'); // Autoriser
  await A.waitForFunction(()=>[...document.querySelectorAll('.ct')].some(c=>c.title.includes('bob@')&&c.title.includes('En ligne')),null,{timeout:5000});
  // Alice ouvre la conv et envoie
  await A.dblclick('.ct:has-text("Bob")'); await A.fill('.convWin textarea','salut bob (L) ça va ? :D'); await A.keyboard.press('Enter');
  await B.waitForSelector('.convWin .msg',{timeout:5000});
  await B.fill('.convWin textarea','yo alice (H)'); await B.keyboard.press('Enter');
  await A.waitForFunction(()=>document.querySelectorAll('.convWin .msg').length>=2,null,{timeout:5000});
  // wizz
  await B.click('[data-act="nudge"]'); await A.waitForSelector('.sys.nudge',{timeout:5000});
  // wink
  await B.click('[data-act="wink"]'); await B.click('#winkPicker .mi:nth-child(3)'); await A.waitForSelector('.wink-overlay',{timeout:5000});
  await A.screenshot({path:S+'e2_alice.png'}); await B.screenshot({path:S+'e3_bob.png'});
  // statut + psm
  await B.click('#myName'); await B.click('#ctxMenu .mi:nth-child(2)'); // Occupé
  await A.waitForFunction(()=>document.querySelector('.ct[title*="bob@"]').title.includes('Occupé'),null,{timeout:5000});
  // hors ligne : Bob se déconnecte, Alice envoie, Bob revient
  await B.close(); await A.waitForFunction(()=>document.querySelector('.ct[title*="bob@"]').title.includes('Hors ligne'),null,{timeout:5000});
  await A.fill('.convWin textarea','t\'es parti ? :('); await A.keyboard.press('Enter'); await A.waitForTimeout(500);
  const B2=await mk(); await login(B2,'bob@hotmail.fr','1234'); await B2.waitForSelector('.convWin .msg',{timeout:5000});
  const txt=await B2.textContent('.convWin .history'); console.log('offline delivered:',txt.includes("t'es parti"));
  await B2.screenshot({path:S+'e4_offline.png'});
  console.log('errors:',errs); await b.close();
})().catch(e=>{ console.error('FAIL',e.message); process.exit(1); });
