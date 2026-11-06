const { chromium } = require('playwright');
const S='/tmp/msn-tests/';
(async()=>{
  const b=await chromium.launch(); const errs=[];
  const mk=async()=>{ const c=await b.newContext({viewport:{width:1024,height:720}}); const p=await c.newPage(); p.on('pageerror',e=>errs.push('PAGE '+e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('CON '+m.text()); }); await p.goto('http://localhost:'+(process.env.PORT||8080)+'/'); return p; };
  const reg=async(p,email,name)=>{ await p.click('#regLink'); await p.fill('#email',email); await p.fill('#pwd','1234'); await p.fill('#regName',name); await p.click('#btnLogin'); await p.waitForFunction(()=>document.getElementById('loginErr').textContent.includes('créé')); await p.fill('#email',email); await p.fill('#pwd','1234'); await p.click('#btnLogin'); await p.waitForSelector('#mainWin',{state:'visible'}); await p.click('.dialog:has-text("MSN Today") .btn'); };
  const A=await mk(),B=await mk(); await reg(A,'alice@h.fr','Alice'); await reg(B,'bob@h.fr','Bob');
  await A.click('.addrow .link'); await A.fill('#addEmail','bob@h.fr'); await A.click('.dialog .btn'); await B.waitForSelector('.dialog'); await B.click('.dialog .btn');
  await A.waitForFunction(()=>[...document.querySelectorAll('.ct')].some(c=>c.title.includes('bob@')&&c.title.includes('En ligne')));
  // surnom + groupe
  await A.click('.ct:has-text("Bob")',{button:'right'}); await A.click('#ctxMenu .mi:has-text("Renommer")'); await A.fill('#askInp','Bobby le boss'); await A.click('.dialog .btn:has-text("OK")');
  await A.waitForSelector('.ct:has-text("Bobby le boss")'); console.log('nick OK');
  await A.click('.ct:has-text("Bobby")',{button:'right'}); await A.click('#ctxMenu .mi:has-text("Déplacer")'); await A.fill('#askInp','Famille'); await A.click('.dialog .btn:has-text("OK")');
  await A.waitForSelector('.grp:has-text("Famille (1/1)")'); console.log('group OK');
  // transfert de fichier 300 Ko
  await A.dblclick('.ct:has-text("Bobby")'); const [fc]=await Promise.all([A.waitForEvent('filechooser'),A.click('[data-act="file"]')]); await fc.setFiles(S+'test.bin');
  await B.waitForSelector('[data-accept]'); await B.click('[data-accept]'); await B.waitForFunction(()=>document.querySelector('.xfer') && document.querySelector('.xfer').textContent.includes('Vous avez reçu'),null,{timeout:20000});
  await A.waitForFunction(()=>document.querySelector('.xfer').textContent.includes('terminé'));
  const size=await B.evaluate(async()=>{ const a=document.querySelector('.xfer a'); const r=await fetch(a.href); return (await r.arrayBuffer()).byteLength; }); console.log('file received bytes:',size);
  // tableau blanc
  await A.click('[data-act="activities"]'); await A.click('#ctxMenu .mi:has-text("Tableau blanc")'); await B.waitForSelector('.wbcv'); const cv=await A.$('.wbcv'); const bb=await cv.boundingBox(); await A.mouse.move(bb.x+10,bb.y+10); await A.mouse.down(); await A.mouse.move(bb.x+200,bb.y+100,{steps:12}); await A.mouse.up();
  await B.waitForTimeout(500); const painted=await B.evaluate(()=>{ const c=document.querySelector('.wbcv'); const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n=0; for(let i=3;i<d.length;i+=4) if(d[i]>0) n++; return n; }); console.log('whiteboard pixels on B:',painted);
  // démineur flags
  await A.click('[data-act="games"]'); await A.click('#ctxMenu .mi:has-text("Démineur")'); await B.waitForSelector('.dialog:has-text("Démineur")'); await B.click('.dialog .btn:has-text("Accepter")');
  await A.waitForSelector('.fgrid'); await B.waitForSelector('.fgrid'); await A.click('.fc.hid >> nth=0'); await B.waitForFunction(()=>document.querySelectorAll('.fc.hid').length<256); console.log('flags OK');
  await A.screenshot({path:S+'g1.png'}); await B.screenshot({path:S+'g2.png'}); console.log('errors:',errs); await b.close();
})().catch(e=>{ console.error('FAIL',e.message); process.exit(1); });
