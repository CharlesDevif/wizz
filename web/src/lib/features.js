/* Appels WebRTC + partage d'écran, jeux (Morpion, Démineur Flags, Solitaire Showdown), fichiers, tableau blanc, voice clips */
import { get, set, updConv, pushMsg, updMsg, byEmail } from './store.js';
import { play } from './sounds.js';
import * as net from './net.js';
import { openConv, sysMsg, dialog, closeDialog, growWindow, addVoice, setStatusLine, toast, shake } from './actions.js';
import { fmtSize } from './data.js';
import { esc } from './emoticons.js';

/* ================= Appels ================= */
const RTC_CFG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
export const calls = {}; // email -> {pc, stream}
let ringTimer = null, inviteDlg = null;
export function setCall(email, call) { updConv(email, c => ({ ...c, call })); }
export function inviteCall(email, video, screen) {
  const c = byEmail(email); if (get().netMode !== 'server') { sysMsg(email, `Invitation ${screen ? 'de partage d\'écran' : video ? 'vidéo' : 'audio'} envoyée à ${c.name}…`); play('ring'); setTimeout(() => sysMsg(email, `${c.name} a refusé l'invitation. (Mode démo : les appels réels marchent avec le serveur.)`), 3000); return; }
  if (calls[email]) return hangup(email, true);
  sysMsg(email, screen ? `Vous avez invité ${c.name} à voir votre écran. En attente de réponse…` : `Vous avez invité ${c.name} à démarrer un appel ${video ? 'vidéo' : 'audio'}. En attente de réponse…`); play('ring');
  net.send({ type: 'rtc', to: email, kind: 'invite', video: !!video, screen: !!screen });
}
export async function startCall(email, video, isCaller, screen) {
  try {
    let stream; if (screen === 'view') stream = new MediaStream(); else if (screen) { stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }); stream.getVideoTracks()[0].onended = () => hangup(email, true); } else stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: video ? { width: 320, height: 240 } : false });
    const pc = new RTCPeerConnection(RTC_CFG); calls[email] = { pc, stream, remote: null };
    stream.getTracks().forEach(t => pc.addTrack(t, stream)); if (screen === 'view') pc.addTransceiver('video', { direction: 'recvonly' });
    pc.onicecandidate = e => { if (e.candidate) net.send({ type: 'rtc', to: email, kind: 'ice', cand: e.candidate }); };
    pc.ontrack = e => { calls[email].remote = e.streams[0]; setCall(email, { video, screen: !!screen, t0: get().convs[email].call?.t0 || Date.now(), rev: (get().convs[email].call?.rev || 0) + 1 }); };
    pc.onconnectionstatechange = () => { if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) hangup(email, false); };
    setCall(email, { video, screen: !!screen, t0: Date.now(), rev: 1 });
    if (isCaller) { const offer = await pc.createOffer(); await pc.setLocalDescription(offer); net.send({ type: 'rtc', to: email, kind: 'offer', sdp: offer }); }
  } catch (e) { sysMsg(email, 'Impossible de démarrer l\'appel : ' + e.message); net.send({ type: 'rtc', to: email, kind: 'hangup' }); }
}
export function hangup(email, notify) {
  const c = calls[email]; if (c) { c.pc.close(); c.stream.getTracks().forEach(t => t.stop()); delete calls[email]; }
  if (get().convs[email] && get().convs[email].call) { setCall(email, null); sysMsg(email, 'L\'appel est terminé.'); }
  if (notify) net.send({ type: 'rtc', to: email, kind: 'hangup' });
}
net.on('rtc', async m => {
  const email = m.from; const c = byEmail(email); if (!c) return; openConv(email);
  switch (m.kind) {
    case 'invite': { play('ring'); ringTimer = setInterval(() => play('ring'), 2500); const what = m.screen ? 'partager son écran avec vous' : `démarrer un appel ${m.video ? 'vidéo' : 'audio'}`;
      inviteDlg = dialog({ title: 'Wizz', kind: 'callInvite', name: c.name, what, ico: m.screen ? 'act' : m.video ? 'video' : 'audio',
        accept: () => { clearInterval(ringTimer); net.send({ type: 'rtc', to: email, kind: 'accept', video: m.video, screen: m.screen }); startCall(email, m.video, false, m.screen ? 'view' : false); },
        decline: () => { clearInterval(ringTimer); net.send({ type: 'rtc', to: email, kind: 'decline' }); } });
      sysMsg(email, `${c.name} vous invite à ${what}.`); break; }
    case 'accept': sysMsg(email, `${c.name} a accepté l'invitation. Connexion…`); startCall(email, m.video, true, m.screen ? true : false); break;
    case 'decline': sysMsg(email, `${c.name} a refusé l'invitation.`); break;
    case 'offer': { const call = calls[email]; if (!call) return; await call.pc.setRemoteDescription(m.sdp); const ans = await call.pc.createAnswer(); await call.pc.setLocalDescription(ans); net.send({ type: 'rtc', to: email, kind: 'answer', sdp: ans }); break; }
    case 'answer': { const call = calls[email]; if (call) await call.pc.setRemoteDescription(m.sdp); break; }
    case 'ice': { const call = calls[email]; if (call) try { await call.pc.addIceCandidate(m.cand); } catch (e) {} break; }
    case 'hangup': clearInterval(ringTimer); if (inviteDlg) { closeDialog(inviteDlg); inviteDlg = null; } if (calls[email]) hangup(email, false); else sysMsg(email, `${c.name} a annulé l'appel.`); break;
  }
});

/* ================= Morpion ================= */
export const winner = b => { const L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; for (const [a, b2, c] of L) if (b[a] && b[a] === b[b2] && b[a] === b[c]) return b[a]; return b.every(x => x) ? 'draw' : null; };
export function gameStart(key, me, turn) { updConv(key, c => ({ ...c, game: { board: Array(9).fill(''), me, turn } })); sysMsg(key, 'La partie de Morpion commence. ' + (turn === me ? 'Vous commencez.' : 'L\'adversaire commence.')); }
export function gameMove(key, i, mine) {
  const g = get().convs[key]?.game; if (!g || g.board[i] || winner(g.board)) return; const other = g.me === 'X' ? 'O' : 'X';
  const board = g.board.slice(); board[i] = mine ? g.me : other; const turn = mine ? other : g.me; updConv(key, c => ({ ...c, game: { ...g, board, turn } }));
  if (mine) { net.send({ type: 'game', to: key, kind: 'move', i }); play('type'); if (get().netMode === 'demo') setTimeout(() => { const gg = get().convs[key]?.game; if (!gg || winner(gg.board)) return; const free = gg.board.map((v, j) => v ? -1 : j).filter(j => j >= 0); if (free.length) gameMove(key, free[Math.floor(Math.random() * free.length)], false); }, 700); }
  const w = winner(board); if (w) { play(w === g.me ? 'wink' : 'newalert'); sysMsg(key, w === 'draw' ? 'Morpion : match nul.' : (w === g.me ? 'Morpion : vous avez gagné !' : 'Morpion : vous avez perdu.')); }
}
export function gameEnd(key, notify) { updConv(key, c => ({ ...c, game: null })); if (notify) net.send({ type: 'game', to: key, kind: 'quit' }); }
export function gameInvite(key) { if (get().netMode === 'demo') { gameStart(key, 'X', 'X'); return; } sysMsg(key, 'Invitation à jouer au Morpion envoyée. En attente de réponse…'); net.send({ type: 'game', to: key, kind: 'invite' }); }

/* ================= Démineur Flags ================= */
export function flagsBoard(w, h, n) { const s = new Set(); while (s.size < n) s.add(Math.floor(Math.random() * w * h)); return [...s]; }
export function flagsCount(g, i) { const x = i % g.w, y = Math.floor(i / g.w); let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= g.w || Y >= g.h) continue; if (g.mines.has(Y * g.w + X)) n++; } return n; }
function reveal(g, i, who) { if (g.open.has(i)) return; g.open.add(i); if (g.mines.has(i)) { g.owner[i] = who; g.scores[who]++; return; } if (flagsCount(g, i) === 0) { const x = i % g.w, y = Math.floor(i / g.w); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= g.w || Y >= g.h) continue; const j = Y * g.w + X; if (!g.mines.has(j)) reveal(g, j, who); } } }
export function flagsStart(key, mines, me, turn) { updConv(key, c => ({ ...c, flags: { w: 16, h: 16, mines: new Set(mines), open: new Set(), owner: {}, scores: { X: 0, O: 0 }, me, turn, rev: 0 } })); growWindow('conv:' + key, 760); sysMsg(key, 'Démineur Flags : trouvez les drapeaux ! Un drapeau = 1 point et vous rejouez. Premier à 26.'); }
export function flagsMove(key, i, mine) {
  const g = get().convs[key]?.flags; if (!g || g.open.has(i)) return; const who = mine ? g.me : (g.me === 'X' ? 'O' : 'X'); const wasMine = g.mines.has(i);
  const ng = { ...g, open: new Set(g.open), owner: { ...g.owner }, scores: { ...g.scores }, rev: g.rev + 1 }; reveal(ng, i, who); if (!wasMine) ng.turn = who === g.me ? (g.me === 'X' ? 'O' : 'X') : g.me;
  updConv(key, c => ({ ...c, flags: ng })); const won = ng.scores.X >= 26 ? 'X' : ng.scores.O >= 26 ? 'O' : null; if (won) play(won === g.me ? 'wink' : 'newalert');
  if (mine) { net.send({ type: 'game', to: key, kind: 'fmove', i }); play(wasMine ? 'outgoing' : 'type'); if (get().netMode === 'demo' && ng.turn !== g.me) setTimeout(() => flagsBot(key), 600); }
}
function flagsBot(key) { const g = get().convs[key]?.flags; if (!g || g.turn === g.me || g.scores.O >= 26) return; const hid = []; for (let i = 0; i < g.w * g.h; i++) if (!g.open.has(i)) hid.push(i); if (!hid.length) return; const pick = Math.random() < .35 ? (hid.find(i => g.mines.has(i)) ?? hid[0]) : hid[Math.floor(Math.random() * hid.length)]; flagsMove(key, pick, false); const g2 = get().convs[key]?.flags; if (g2 && g2.turn !== g2.me && g2.scores.O < 26) setTimeout(() => flagsBot(key), 600); }
export function flagsEnd(key, notify) { updConv(key, c => ({ ...c, flags: null })); if (notify) net.send({ type: 'game', to: key, kind: 'fquit' }); }
export function flagsInvite(key) { if (get().netMode === 'demo') { flagsStart(key, flagsBoard(16, 16, 51), 'X', 'X'); return; } sysMsg(key, 'Invitation à jouer au Démineur Flags envoyée…'); net.send({ type: 'game', to: key, kind: 'finvite' }); }

/* ================= Solitaire Showdown ================= */
export const SUITS = ['♠', '♥', '♦', '♣'], RED = s => s === '♥' || s === '♦';
function deck(seed) { let s = seed; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; const d = []; for (const su of SUITS) for (let v = 1; v <= 13; v++) d.push({ v, su }); for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; }
export function solitStart(key, seed, me) {
  const d = deck(seed); const cols = []; for (let c = 0; c < 7; c++) cols.push(d.splice(0, c + 1).map((k, i) => ({ ...k, up: i === c })));
  updConv(key, c => ({ ...c, solit: { cols, stock: d, waste: [], found: { '♠': 0, '♥': 0, '♦': 0, '♣': 0 }, scores: { X: 0, O: 0 }, me, sel: null } })); growWindow('conv:' + key, 720);
  sysMsg(key, 'Solitaire Showdown : même donne pour les deux joueurs, fondations partagées. Le premier à poser une carte marque le point. Premier à 27 !');
}
export function solitClick(key, d) {
  const g = get().convs[key]?.solit; if (!g) return; const G = { ...g, cols: g.cols.map(c => c.slice()), stock: g.stock.slice(), waste: g.waste.slice(), found: { ...g.found }, scores: { ...g.scores } };
  const commit = () => updConv(key, c => ({ ...c, solit: G }));
  if (d.w === 'stock') { if (G.stock.length) G.waste.push({ ...G.stock.pop(), up: true }); else { G.stock = G.waste.reverse().map(k => ({ ...k, up: false })); G.waste = []; } G.sel = null; return commit(); }
  const pick = () => { if (!G.sel) return null; if (G.sel.w === 'waste') return [G.waste[G.waste.length - 1]]; return G.cols[G.sel.i].slice(G.sel.j); };
  const remove = () => { if (G.sel.w === 'waste') G.waste.pop(); else { G.cols[G.sel.i].splice(G.sel.j); const col = G.cols[G.sel.i]; if (col.length) col[col.length - 1] = { ...col[col.length - 1], up: true }; } };
  if (d.w === 'found') { const run = pick(); if (run && run.length === 1) { const k = run[0]; if (k.su === d.s && k.v === G.found[d.s] + 1) { remove(); G.found[d.s] = k.v; G.scores[G.me]++; net.send({ type: 'game', to: key, kind: 'sfound', s: d.s, v: k.v }); play('outgoing'); if (get().netMode === 'demo') setTimeout(() => solitBot(key), 800); } } G.sel = null; return commit(); }
  if (d.w === 'waste') { G.sel = G.sel && G.sel.w === 'waste' ? null : { w: 'waste', i: 0, j: 0 }; return commit(); }
  if (d.w === 'col') { const i = +d.i, j = +d.j; const col = G.cols[i];
    if (G.sel && !(G.sel.w === 'col' && G.sel.i === i)) { const run = pick(); const top = col[col.length - 1]; const ok = run && (top ? (top.up && top.v === run[0].v + 1 && RED(top.su) !== RED(run[0].su)) : run[0].v === 13); if (ok) { remove(); col.push(...run); } G.sel = null; return commit(); }
    if (j >= 0 && col[j] && col[j].up) G.sel = (G.sel && G.sel.i === i && G.sel.j === j) ? null : { w: 'col', i, j }; else G.sel = null; return commit(); }
}
function solitBot(key) { const g = get().convs[key]?.solit; if (!g || g.scores.O >= 27) return; if (Math.random() < .5) { const s = SUITS[Math.floor(Math.random() * 4)]; updConv(key, c => ({ ...c, solit: { ...g, scores: { ...g.scores, O: g.scores.O + 1 }, found: { ...g.found, [s]: Math.min(13, g.found[s] + 1) } } })); } }
export function solitEnd(key, notify) { updConv(key, c => ({ ...c, solit: null })); if (notify) net.send({ type: 'game', to: key, kind: 'squit' }); }
export function solitInvite(key) { if (get().netMode === 'demo') { solitStart(key, 42, 'X'); return; } sysMsg(key, 'Invitation à jouer au Solitaire Showdown envoyée…'); net.send({ type: 'game', to: key, kind: 'sinvite' }); }

net.on('game', m => {
  const key = m.from; const c = byEmail(key); if (!c) return; openConv(key);
  switch (m.kind) {
    case 'invite': play('newalert'); dialog({ title: 'Wizz', kind: 'gameInvite', html: `<b>${esc(c.name)}</b> vous invite à jouer au Morpion.`, accept: () => { net.send({ type: 'game', to: key, kind: 'accept' }); gameStart(key, 'O', 'X'); }, decline: () => net.send({ type: 'game', to: key, kind: 'decline' }) }); break;
    case 'accept': gameStart(key, 'X', 'X'); break;
    case 'decline': sysMsg(key, `${c.name} a refusé l'invitation.`); break;
    case 'move': gameMove(key, m.i, false); break;
    case 'quit': sysMsg(key, `${c.name} a quitté la partie.`); gameEnd(key, false); break;
    case 'finvite': play('newalert'); dialog({ title: 'Wizz', kind: 'gameInvite', html: `<b>${esc(c.name)}</b> vous invite à jouer au Démineur Flags.`, accept: () => { const mines = flagsBoard(16, 16, 51); net.send({ type: 'game', to: key, kind: 'faccept', mines }); flagsStart(key, mines, 'O', 'X'); }, decline: () => net.send({ type: 'game', to: key, kind: 'decline' }) }); break;
    case 'faccept': flagsStart(key, m.mines, 'X', 'X'); break;
    case 'fmove': flagsMove(key, m.i, false); break;
    case 'fquit': sysMsg(key, `${c.name} a quitté la partie.`); flagsEnd(key, false); break;
    case 'sinvite': play('newalert'); dialog({ title: 'Wizz', kind: 'gameInvite', html: `<b>${esc(c.name)}</b> vous invite à jouer au Solitaire Showdown.`, accept: () => { const seed = Math.floor(Math.random() * 1e9); net.send({ type: 'game', to: key, kind: 'saccept', seed }); solitStart(key, seed, 'O'); }, decline: () => net.send({ type: 'game', to: key, kind: 'decline' }) }); break;
    case 'saccept': solitStart(key, m.seed, 'X'); break;
    case 'sfound': { const g = get().convs[key]?.solit; if (!g) return; const other = g.me === 'X' ? 'O' : 'X'; updConv(key, c => ({ ...c, solit: { ...g, scores: { ...g.scores, [other]: g.scores[other] + 1 }, found: { ...g.found, [m.s]: Math.max(g.found[m.s], m.v) } } })); play('type'); break; }
    case 'squit': sysMsg(key, `${c.name} a quitté la partie.`); solitEnd(key, false); break;
  }
});

/* ================= Fichiers ================= */
const xfers = {}; const CHUNK = 48 * 1024, MAXFILE = 20 * 1024 * 1024;
function xferRow(key, id, html) { const conv = get().convs[key]; if (!conv) return; const m = conv.msgs.find(m => m.xferId === id); if (m) updMsg(key, m.id, x => ({ ...x, html })); else pushMsg(key, { type: 'xfer', xferId: id, html }); }
export function sendFile(key) {
  if (key.startsWith('g:')) { sysMsg(key, 'Le transfert de fichiers se fait en tête-à-tête.'); return; }
  const inp = document.createElement('input'); inp.type = 'file';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return; const c = byEmail(key); if (f.size > MAXFILE) { sysMsg(key, `Fichier trop volumineux (max ${fmtSize(MAXFILE)}).`); return; }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6); xfers[id] = { file: f, name: f.name, size: f.size, email: key, dir: 'out' };
    xferRow(key, id, `Vous envoyez <b>${esc(f.name)}</b> (${fmtSize(f.size)}) à ${c.name}. En attente de l'acceptation… <span class="link" data-cancel="${id}">Annuler</span>`);
    if (get().netMode === 'server') net.send({ type: 'file', to: key, kind: 'offer', id, name: f.name, size: f.size });
    else setTimeout(() => { if (!xfers[id]) return; xferRow(key, id, `${c.name} a accepté <b>${f.name}</b>. Transfert en cours… (mode démo)`); setTimeout(() => xferRow(key, id, `Le transfert de « ${f.name} » est terminé.`), 2000); }, 1500);
  };
  inp.click();
}
async function xferSend(id) {
  const x = xfers[id]; if (!x) return; const total = Math.ceil(x.size / CHUNK) || 1;
  for (let i = 0; i < total; i++) { if (!xfers[id]) return; const buf = await x.file.slice(i * CHUNK, (i + 1) * CHUNK).arrayBuffer(); const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    net.send({ type: 'file', to: x.email, kind: 'chunk', id, seq: i, total, data: b64 });
    xferRow(x.email, id, `Envoi de <b>${x.name}</b>… ${Math.round((i + 1) / total * 100)} % <span class="xbar"><span style="width:${(i + 1) / total * 100}%"></span></span> <span class="link" data-cancel="${id}">Annuler</span>`);
    if (i % 8 === 7) await new Promise(r => setTimeout(r, 20)); }
  xferRow(x.email, id, `Le transfert de « ${x.name} » est terminé.`); play('vimdone'); delete xfers[id];
}
export function xferAction(kind, id) {
  const x = xfers[id]; if (!x) return;
  if (kind === 'accept') { net.send({ type: 'file', to: x.email, kind: 'accept', id }); xferRow(x.email, id, `Vous avez accepté <b>${x.name}</b>. Réception en cours…`); }
  if (kind === 'decline') { net.send({ type: 'file', to: x.email, kind: 'decline', id }); xferRow(x.email, id, `Vous avez refusé le fichier « ${x.name} ».`); delete xfers[id]; }
  if (kind === 'cancel') { net.send({ type: 'file', to: x.email, kind: 'cancel', id }); xferRow(x.email, id, `Vous avez annulé le transfert de « ${x.name} ».`); delete xfers[id]; }
}
net.on('file', m => {
  const email = m.from; const c = byEmail(email); if (!c) return; openConv(email); const id = m.id;
  switch (m.kind) {
    case 'offer': play('newalert'); xfers[id] = { name: m.name, size: m.size, email, dir: 'in', chunks: [], received: 0 };
      xferRow(email, id, `${esc(c.name)} souhaite vous envoyer <b>${esc(m.name)}</b> (${fmtSize(m.size)}). <span class="link" data-accept="${id}">Accepter</span> (Alt+T) &nbsp; <span class="link" data-accept="${id}">Enregistrer sous…</span> &nbsp; <span class="link" data-decline="${id}">Refuser</span> (Alt+D)`);
      toast(c.name, `vous envoie le fichier ${m.name}`, null, null, () => openConv(email)); break;
    case 'accept': if (xfers[id]) { xferRow(email, id, `${c.name} a accepté <b>${xfers[id].name}</b>. Transfert en cours…`); xferSend(id); } break;
    case 'decline': if (xfers[id]) { xferRow(email, id, `${c.name} a refusé le fichier « ${xfers[id].name} ».`); delete xfers[id]; } break;
    case 'cancel': if (xfers[id]) { xferRow(email, id, `${c.name} a annulé le transfert de « ${xfers[id].name} ».`); delete xfers[id]; } break;
    case 'chunk': { const x = xfers[id]; if (!x || x.dir !== 'in') return; const bin = atob(m.data); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); x.chunks[m.seq] = u8; x.received++;
      xferRow(email, id, `Réception de <b>${x.name}</b>… ${Math.round(x.received / m.total * 100)} % <span class="xbar"><span style="width:${x.received / m.total * 100}%"></span></span>`);
      if (x.received >= m.total) { const blob = new Blob(x.chunks); const url = URL.createObjectURL(blob); const isImg = /\.(png|jpe?g|gif|webp)$/i.test(x.name);
        xferRow(email, id, `Vous avez reçu <b>${x.name}</b> (${fmtSize(blob.size)}). <a href="${url}" download="${x.name}">Ouvrir / Enregistrer</a>${isImg ? `<br><img src="${url}" style="max-width:100%;max-height:160px;border:1px solid #ddd;margin-top:3px">` : ''}`); play('vimdone'); delete xfers[id]; }
      break; }
  }
});
export function sendImageInline(key) { // envoi d'image rapide via encre (petites images)
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => { const f = inp.files[0]; if (!f || f.size > 300000) { toast('Wizz', 'Image trop lourde (max 300 Ko) : utilisez Envoyer des fichiers.'); return; } const r = new FileReader(); r.onload = () => { pushMsg(key, { type: 'ink', who: get().me.name, data: r.result, mine: true, name: f.name }); net.send({ type: 'ink', to: key, data: r.result, name: f.name }); }; r.readAsDataURL(f); };
  inp.click();
}

/* ================= Tableau blanc ================= */
export const wbBus = new EventTarget();
export function whiteboardOpen(key, remote) { updConv(key, c => ({ ...c, wb: true })); growWindow('conv:' + key, 600); if (!remote) { net.send({ type: 'wb', to: key, kind: 'open' }); sysMsg(key, 'Vous avez ouvert un tableau blanc partagé.'); } }
export function whiteboardClose(key, notify) { updConv(key, c => ({ ...c, wb: false })); if (notify) net.send({ type: 'wb', to: key, kind: 'close' }); }
export function wbSend(key, m) { net.send({ type: 'wb', to: key, ...m }); }
net.on('wb', m => { const email = m.from; const c = byEmail(email); if (!c) return; openConv(email);
  if (m.kind === 'open') { sysMsg(email, `${c.name} a ouvert un tableau blanc partagé.`); whiteboardOpen(email, true); play('newalert'); return; }
  if (m.kind === 'close') { whiteboardClose(email, false); sysMsg(email, `${c.name} a fermé le tableau blanc.`); return; }
  wbBus.dispatchEvent(new CustomEvent('wb', { detail: { key: email, m } })); });

/* ================= Voice clips ================= */
let rec = null, recTimer = null, recFor = null;
export async function voiceStart(key) {
  if (rec) return; if (!navigator.mediaDevices) { sysMsg(key, 'Micro non disponible dans ce navigateur.'); return; }
  try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); rec = new MediaRecorder(stream); const chunks = []; recFor = key;
    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' }); rec = null; if (blob.size < 2000) return; const r = new FileReader(); r.onload = () => { addVoice(key, get().me.name, r.result, true); net.send({ type: 'voice', to: key, data: r.result }); play('vimdone'); }; r.readAsDataURL(blob); };
    rec.start(); setStatusLine(key, 'Enregistrement du message vocal… (15 s max, relâchez pour envoyer)', false); recTimer = setTimeout(voiceStop, 15000);
  } catch (e) { sysMsg(key, 'Impossible d\'accéder au micro : ' + e.message); }
}
export function voiceStop() { clearTimeout(recTimer); if (rec && rec.state === 'recording') { rec.stop(); setStatusLine(recFor, '', false); } }
