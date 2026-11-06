/* Actions principales : fenêtres, dialogues, connexion, contacts, conversations, messages, wizz, winks */
import { get, set, updConv, pushMsg, updContact, byEmail, lsSet } from './store.js';
import { STATUSES, stById, stIco, stLabel, isOff, DEMO_CONTACTS, BOTS, now } from './data.js';
import { play, ac } from './sounds.js';
import * as net from './net.js';
import { usedCustom } from './emoticons.js';

/* ---------- fenêtres ---------- */
export function bringFront(id) { set(s => { const w = s.windows[id]; if (!w) return s; const z = s.zTop + 1; return { ...s, zTop: z, windows: { ...s.windows, [id]: { ...w, z, hidden: false } } }; }); }
export function openWindow(id, type, pos) { set(s => { if (s.windows[id]) return s; const z = s.zTop + 1; return { ...s, zTop: z, windows: { ...s.windows, [id]: { id, type, z, hidden: false, ...pos } } }; }); }
export function closeWindow(id) { set(s => { const w = { ...s.windows }; delete w[id]; return { ...s, windows: w }; }); }
export function minimize(id) { set(s => ({ ...s, windows: { ...s.windows, [id]: { ...s.windows[id], hidden: true } } })); }
export function moveWindow(id, x, y) { set(s => ({ ...s, windows: { ...s.windows, [id]: { ...s.windows[id], x, y } } })); }
export function growWindow(id, h) { set(s => { const w = s.windows[id]; if (!w || (w.h || 440) >= h) return s; const H = Math.min(h, innerHeight - 60); return { ...s, windows: { ...s.windows, [id]: { ...w, h: H, y: Math.min(w.y, Math.max(0, innerHeight - 40 - H)) } } }; }); }
export const topWindowId = () => Object.values(get().windows).filter(w => !w.hidden).sort((a, b) => b.z - a.z)[0]?.id;

/* ---------- dialogues, toasts, menus ---------- */
let did = 1;
export function dialog(d) { const id = 'd' + did++; set(s => ({ ...s, dialogs: [...s.dialogs, { id, ...d }] })); return id; }
export function closeDialog(id) { set(s => ({ ...s, dialogs: s.dialogs.filter(d => d.id !== id) })); }
export function ask(title, label, value, cb) { dialog({ title, kind: 'ask', label, value, cb }); }
export function confirmDlg(title, html, cb) { dialog({ title, kind: 'confirm', html, cb }); }
let tid = 1;
export function toast(title, text, ico, sound, onclick) {
  const id = tid++; set(s => ({ ...s, toasts: [...s.toasts, { id, title, text, ico, onclick }] })); if (sound) play(sound);
  if (net.IS_TAURI && document.hidden) { try { window.__TAURI__.notification.sendNotification({ title: String(title), body: String(text) }); } catch (e) {} }
  setTimeout(() => set(s => ({ ...s, toasts: s.toasts.filter(t => t.id !== id) })), 6000);
}
export function removeToast(id) { set(s => ({ ...s, toasts: s.toasts.filter(t => t.id !== id) })); }
export function showMenu(items, x, y) { set({ menu: { items, x, y } }); }
export function closeMenu() { if (get().menu) set({ menu: null }); }

/* ---------- connexion ---------- */
export function setRegisterMode(on) { set({ registerMode: on, loginErr: '' }); }
export function loginError(msg, ok) { set({ loginErr: msg, loginOk: !!ok, connecting: null }); }
export function cancelLogin() { set({ connecting: null }); }
export function doLogin(email, pass, statusIdx, regName) {
  ac(); set({ loginErr: '', loginOk: false, netMode: net.initialMode() });
  const status = STATUSES[statusIdx].id;
  if (get().netMode === 'server') {
    if (get().registerMode) { set({ connecting: 'Création du compte…' }); net.connect(() => { if (get().netMode === 'server') net.send({ type: 'register', email, pass, name: regName || email.split('@')[0] }); else loginError('Aucun serveur joignable : impossible de créer un compte (mode démo).'); }); return; }
    set(s => ({ ...s, me: { ...s.me, email, pass, status }, connecting: 'Connexion en cours…' }));
    stepText(); net.connect(() => { if (get().netMode === 'server') net.send({ type: 'login', email, pass, status }); else demoLogin(email, status); });
  } else demoLogin(email, status);
}
function stepText() { const steps = ['Vérification du mot de passe…', 'Chargement de la liste de contacts…']; steps.forEach((t, i) => setTimeout(() => { if (get().connecting) set({ connecting: t }); }, 700 * (i + 1))); }
function demoLogin(email, status) {
  email = email || 'toi@hotmail.fr';
  set(s => ({ ...s, me: { ...s.me, email, name: email.split('@')[0], status }, contacts: DEMO_CONTACTS.map(c => ({ ...c })), connecting: 'Connexion en cours…' })); stepText();
  setTimeout(() => { finishLogin(); setTimeout(() => setContactStatus('thomas@hotmail.fr', 'online'), 4000); setTimeout(() => setContactStatus('sasuke@hotmail.fr', 'online'), 11000); setTimeout(() => botSays('julie@hotmail.fr', 'coucou (L) t\'es là ?'), 7000); }, 2100);
}
export function finishLogin() {
  set({ screen: 'main', connecting: null }); openWindow('main', 'main', { x: Math.max(0, innerWidth - 320), y: 24 }); bringFront('main'); play('online');
  if (get().netMode === 'demo') toast('Wizz', 'Mode démo : contacts simulés. Lancez server.js pour le vrai temps réel.');
  let off = false; try { off = localStorage.getItem('msn_today_off') === '1'; } catch (e) {}
  if (!off) showToday();
  idleReset();
}
export function showToday() { dialog({ title: 'MSN Today', kind: 'today' }); }
export function signOut() { location.reload(); }

/* ---------- moi ---------- */
export function pushProfile() { const me = get().me; net.send({ type: 'profile', name: me.name, psm: me.psm, dp: me.dp }); }
export function setMe(patch) { set(s => ({ ...s, me: { ...s.me, ...patch } })); pushProfile(); }
export function setStatus(id) { set(s => ({ ...s, me: { ...s.me, status: id }, idleBefore: null })); net.send({ type: 'status', status: id }); }
export function setFont(font) { set(s => ({ ...s, me: { ...s.me, font } })); lsSet('msn_font', font); }
export function pickDp() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    if (f.type === 'image/gif' && f.size < 140000) { const r = new FileReader(); r.onload = () => setMe({ dp: r.result }); r.readAsDataURL(f); return; }
    if (f.type === 'image/gif') toast('Wizz', 'GIF trop lourd pour rester animé (max 140 Ko) : il sera figé.');
    const img = new Image(); const url = URL.createObjectURL(f);
    img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'); const s = Math.min(img.width, img.height); x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 96, 96); URL.revokeObjectURL(url); setMe({ dp: c.toDataURL('image/jpeg', .85) }); };
    img.src = url;
  };
  inp.click();
}
/* Inactif automatique après 5 min */
let idleTimer = null;
export function idleReset() {
  clearTimeout(idleTimer); const s = get();
  if (s.idleBefore) { set(x => ({ ...x, me: { ...x.me, status: x.idleBefore }, idleBefore: null })); net.send({ type: 'status', status: s.idleBefore }); }
  idleTimer = setTimeout(() => { if (get().me.status === 'online') { set(x => ({ ...x, me: { ...x.me, status: 'away' }, idleBefore: 'online' })); net.send({ type: 'status', status: 'away' }); } }, 5 * 60 * 1000);
}

/* ---------- contacts ---------- */
export const displayName = c => get().nicks[c.email] || c.name;
export function addContact(email) {
  if (get().netMode === 'server') net.send({ type: 'add', email }); else set(s => ({ ...s, contacts: [...s.contacts, { email, name: email, psm: '', status: 'offline' }] }));
  toast('Wizz', `Une invitation a été envoyée à ${email}.`);
}
export function removeContact(email) { set(s => ({ ...s, contacts: s.contacts.filter(c => c.email !== email) })); net.send({ type: 'remove', email }); }
export function blockContact(email, block) { updContact(email, { status: block ? 'blocked' : 'offline' }); net.send({ type: block ? 'block' : 'unblock', email }); }
export function setNick(email, n) { set(s => { const nicks = { ...s.nicks }; if (n && n.trim()) nicks[email] = n.trim(); else delete nicks[email]; lsSet('msn_nicks', nicks); return { ...s, nicks }; }); }
export function setGroup(email, g) { set(s => { const cgroups = { ...s.cgroups }; const groupNames = [...s.groupNames]; const gn = (g || '').trim(); if (gn) { if (!groupNames.includes(gn)) groupNames.push(gn); cgroups[email] = gn; } else delete cgroups[email]; lsSet('msn_cgroups', cgroups); lsSet('msn_groupnames', groupNames); lsSet('msn_bygroup', true); return { ...s, cgroups, groupNames, viewByGroup: true }; }); }
export function toggleViewByGroup() { set(s => { lsSet('msn_bygroup', !s.viewByGroup); return { ...s, viewByGroup: !s.viewByGroup }; }); }
export function toggleGroupOpen(label) { set(s => ({ ...s, groupsOpen: { ...s.groupsOpen, [label]: s.groupsOpen[label] === false } })); }
export function setContactStatus(email, status) { // mode démo
  const c = byEmail(email); if (!c) return; const was = c.status; updContact(email, { status });
  if (was === 'offline' && status !== 'offline') { toast(c.name, 'vient de se connecter', stIco(status), 'online'); if (get().convs[email]) sysMsg(email, `${c.name} vient de se connecter.`); }
}

/* ---------- conversations ---------- */
export const convKey = email => email;
export function openConv(key, opts = {}) {
  const s = get(); const c = byEmail(key) || opts.fake; if (!c) return null;
  if (s.convs[key]) { bringFront('conv:' + key); return s.convs[key]; }
  const n = Object.keys(s.convs).length;
  set(x => ({ ...x, convs: { ...x.convs, [key]: { key, msgs: [], lastNudge: 0, typing: '', statusLine: '', bg: null, group: opts.group || null, lastTypingSent: 0 } } }));
  openWindow('conv:' + key, 'conv', { x: 80 + n * 28, y: 60 + n * 28, w: 520, h: 440 }); bringFront('conv:' + key);
  if (!opts.group && c.status === 'offline') sysMsg(key, `${c.name} est hors ligne. Les messages que vous envoyez seront remis à sa prochaine connexion.`);
  return get().convs[key];
}
export function closeConv(key) { closeWindow('conv:' + key); set(s => { const convs = { ...s.convs }; delete convs[key]; return { ...s, convs }; }); }
export function sysMsg(key, text, cls) { if (!get().convs[key]) return; pushMsg(key, { type: 'sys', text, cls }); }
export function addMsg(key, who, text, mine, font, custom) { pushMsg(key, { type: 'msg', who, text, mine, font, custom }); }
export function setStatusLine(key, text, pen) { updConv(key, c => ({ ...c, statusLine: text, pen: !!pen })); }
let typingTimers = {};
export function showTyping(key, name) { setStatusLine(key, `${name} est en train d'écrire un message…`, true); clearTimeout(typingTimers[key]); typingTimers[key] = setTimeout(() => setStatusLine(key, '', false), 6000); }
export function shake(key) { updConv(key, c => ({ ...c, shake: (c.shake || 0) + 1 })); }
export function typingPing(key) { const c = get().convs[key]; if (!c || key.startsWith('g:')) return; const t = Date.now(); if (t - c.lastTypingSent > 4000) { updConv(key, x => ({ ...x, lastTypingSent: t })); net.send({ type: 'typing', to: key }); } }

export function sendMsg(key, text) {
  const t = text.replace(/\s+$/, ''); if (!t) return; const s = get(); const me = s.me; const custom = usedCustom(t);
  const conv = s.convs[key];
  if (conv && conv.group) { addMsg(key, me.name, t, true, me.font, custom); play('outgoing'); const g = conv.group; g.members.filter(e => e !== me.email).forEach(e => net.send({ type: 'msg', to: e, text: t, font: me.font, custom, group: { id: g.id, members: g.members, names: g.names } })); return; }
  addMsg(key, me.name, t, true, me.font, custom); play('outgoing');
  const c = byEmail(key);
  if (s.netMode === 'server') { net.send({ type: 'msg', to: key, text: t, font: me.font, custom }); return; }
  if (c.status === 'offline') { sysMsg(key, 'Message hors ligne enregistré. Il sera remis dès la connexion du contact.'); return; }
  if (c.bot) botReply(key, t);
}
export function receive(email, m, wasOffline) {
  const c = byEmail(email) || { name: email }; openConv(email); clearTimeout(typingTimers[email]);
  if (wasOffline) sysMsg(email, `Message reçu pendant votre absence (${new Date(m.ts).toLocaleString('fr-FR')}) :`);
  addMsg(email, c.name, m.text, false, m.font, m.custom); setStatusLine(email, `Dernier message reçu le ${new Date().toLocaleDateString('fr-FR')} à ${now()}.`, false);
  const me = get().me; if (me.status === 'busy' || me.status === 'phone') return;
  play('newalert'); if (topWindowId() !== 'conv:' + email) toast(c.name, m.text, null, null, () => openConv(email));
}
export function nudge(key, fromMe) {
  openConv(key); const conv = get().convs[key]; const c = byEmail(key); const t = Date.now();
  if (fromMe) { if (t - conv.lastNudge < 10000) { sysMsg(key, 'Vous ne pouvez pas envoyer un Wizz aussi souvent. Veuillez patienter quelques secondes.'); return; } updConv(key, x => ({ ...x, lastNudge: t }));
    if (conv.group) { const g = conv.group; g.members.filter(e => e !== get().me.email).forEach(e => net.send({ type: 'msg', to: e, nudge: true, group: { id: g.id, members: g.members, names: g.names } })); } else net.send({ type: 'nudge', to: key }); }
  sysMsg(key, fromMe ? 'Vous venez d\'envoyer un Wizz !' : `${c.name} vient de vous envoyer un Wizz !`, 'nudge'); shake(key); play('nudge');
  if (fromMe && get().netMode === 'demo' && c.bot && c.status !== 'offline') setTimeout(() => { const r = ['arrête de me wizzer !!', 'WIZZ TOI MEME :@', 'jsuis là jsuis là', '(6)']; botSays(key, r[Math.floor(Math.random() * r.length)]); }, 1500);
}
export function sendWink(key, id, name) { sysMsg(key, `Vous avez envoyé le Wink « ${name} ».`); playWink(key, id); net.send({ type: 'wink', to: key, id }); }
export function playWink(key, id) { updConv(key, c => ({ ...c, wink: { id, n: (c.wink?.n || 0) + 1 } })); play('wink'); if (id === 'boom') shake(key); setTimeout(() => updConv(key, c => ({ ...c, wink: null })), 3200); }
export function setBg(key, b) { updConv(key, c => ({ ...c, bg: b })); }
export function addVoice(key, who, data, mine) { pushMsg(key, { type: 'voice', who, data, mine }); }
export function addInk(key, who, data, mine, name) { pushMsg(key, { type: 'ink', who, data, mine, name }); }

/* ---------- bots démo ---------- */
export function botSays(email, text) { const c = byEmail(email); if (!c || c.status === 'offline' || c.status === 'blocked') return; openConv(email); showTyping(email, c.name); play('type'); setTimeout(() => receive(email, { text }), 900 + Math.min(2500, text.length * 60)); }
export function botReply(email, userText) {
  const c = byEmail(email); const b = BOTS[c.bot]; if (!b) return; let r = b.lines[Math.floor(Math.random() * b.lines.length)];
  if (/wizz|nudge/i.test(userText)) { setTimeout(() => nudge(email, false), 1200); return; }
  if (/\(L\)|\(K\)|jtm|je t'aime/i.test(userText)) r = c.bot === 'maman' ? 'Moi aussi mon chéri (L)' : '(L)(L)(L) moi aussi';
  if (/\?$/.test(userText) && Math.random() < .4) r = ['oui', 'non', 'jsp', 'mdr non', 'ptetre'][Math.floor(Math.random() * 5)];
  setTimeout(() => botSays(email, r), 600 + Math.random() * 1500);
}

/* ---------- messages réseau de base ---------- */
net.on('error', m => { if (get().screen === 'login') loginError(m.msg); else toast('Wizz', m.msg); });
net.on('registered', () => { set({ registerMode: false }); loginError('Compte créé ! Vous pouvez vous connecter.', true); });
net.on('welcome', m => {
  set(s => ({ ...s, me: { ...s.me, name: m.me.name, psm: m.me.psm, dp: m.me.dp }, contacts: m.contacts })); finishLogin();
  (m.pending || []).forEach(u => inviteDialog(u));
  (m.offline || []).forEach(o => { if (!byEmail(o.from)) set(s => ({ ...s, contacts: [...s.contacts, { email: o.from, name: o.from, status: 'offline' }] })); receive(o.from, o, true); });
});
net.on('kicked', () => { dialog({ title: 'Wizz', kind: 'info', html: 'Vous avez été déconnecté car vous vous êtes connecté depuis un autre emplacement.', onClose: () => location.reload() }); });
net.on('contacts', m => set({ contacts: m.contacts }));
net.on('presence', m => {
  let c = byEmail(m.user.email); if (!c) set(s => ({ ...s, contacts: [...s.contacts, { ...m.user }] })); const was = c ? c.status : 'offline'; updContact(m.user.email, m.user); c = byEmail(m.user.email);
  if (was === 'offline' && c.status !== 'offline') { toast(c.name, 'vient de se connecter', stIco(c.status), 'online'); if (get().convs[c.email]) sysMsg(c.email, `${c.name} vient de se connecter.`); }
  if (was !== 'offline' && c.status === 'offline' && get().convs[c.email]) sysMsg(c.email, `${c.name} vient de se déconnecter.`);
});
net.on('invite', m => inviteDialog(m.user));
net.on('msg', m => { if (m.group) return groupReceive(m); receive(m.from, m); });
net.on('nudge', m => { if (m.group) return groupReceive({ ...m, nudge: true }); nudge(m.from, false); });
net.on('typing', m => { const c = byEmail(m.from); if (c && get().convs[m.from]) showTyping(m.from, c.name); });
net.on('voice', m => { const c = byEmail(m.from); if (!c) return; openConv(m.from); addVoice(m.from, c.name, m.data, false); play('newalert'); });
net.on('ink', m => { const c = byEmail(m.from); if (!c) return; openConv(m.from); addInk(m.from, c.name, m.data, false, m.name); play('newalert'); });
net.on('wink', m => { const c = byEmail(m.from); if (!c) return; openConv(m.from); sysMsg(m.from, `${c.name} vous a envoyé un Wink.`); playWink(m.from, m.id); });
net.on('offline-stored', m => { if (get().convs[m.to]) sysMsg(m.to, 'Message hors ligne enregistré. Il sera remis dès la connexion du contact.'); });
net.on('__lost', () => toast('Wizz', 'Connexion au serveur perdue. Reconnexion…'));
export function inviteDialog(u) { play('newalert'); dialog({ title: 'Wizz', kind: 'invite', user: u }); }

/* ---------- conversations à plusieurs ---------- */
export function openGroupConv(g) {
  const key = 'g:' + g.id; const me = get().me; const others = g.members.filter(e => e !== me.email);
  if (get().convs[key]) { set(s => ({ ...s, convs: { ...s.convs, [key]: { ...s.convs[key], group: g } }, groups: { ...s.groups, [g.id]: g } })); bringFront('conv:' + key); return; }
  set(s => ({ ...s, groups: { ...s.groups, [g.id]: g } }));
  openConv(key, { group: g, fake: { email: key, name: others.map(e => g.names[e] || e).join(', '), status: 'online' } });
  sysMsg(key, `Conversation à plusieurs : ${g.members.map(e => g.names[e] || e).join(', ')}.`);
}
export function groupReceive(m) {
  const gi = m.group; const prev = get().groups[gi.id]; const g = { id: gi.id, members: gi.members, names: { ...(prev?.names || {}), ...(gi.names || {}) } };
  openGroupConv(g); const key = 'g:' + g.id; const name = g.names[m.from] || (byEmail(m.from) || {}).name || m.from;
  if (m.nudge) { sysMsg(key, `${name} vient de vous envoyer un Wizz !`, 'nudge'); shake(key); play('nudge'); return; }
  addMsg(key, name, m.text, false, m.font, m.custom); setStatusLine(key, `Dernier message reçu le ${new Date().toLocaleDateString('fr-FR')} à ${now()}.`, false);
  const me = get().me; if (me.status !== 'busy' && me.status !== 'phone') { play('newalert'); if (topWindowId() !== 'conv:' + key) toast(name, m.text, null, null, () => openGroupConv(g)); }
}
export function inviteToGroup(fromKey, selected) {
  const s = get(); const me = s.me; const conv = s.convs[fromKey];
  const base = conv.group ? conv.group.members.slice() : [me.email, fromKey];
  const id = conv.group ? conv.group.id : (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
  const names = { ...(conv.group?.names || {}), [me.email]: me.name }; s.contacts.forEach(c => { if (base.includes(c.email) || selected.includes(c.email)) names[c.email] = c.name; });
  const members = base.slice(); selected.forEach(e => { if (!members.includes(e)) members.push(e); });
  const g = { id, members, names };
  members.filter(e => e !== me.email).forEach(e => net.send({ type: 'group', to: e, group: true, action: 'members', id, members, names }));
  openGroupConv(g); sysMsg('g:' + id, `Vous avez invité ${selected.map(e => names[e]).join(', ')}.`);
  if (!conv.group) sysMsg(fromKey, 'Une conversation à plusieurs a été ouverte dans une nouvelle fenêtre.');
}
net.on('group', m => { if (m.action !== 'members') return; const prev = get().groups[m.id]; const g = { id: m.id, members: m.members, names: { ...(prev?.names || {}), ...(m.names || {}) } }; openGroupConv(g); sysMsg('g:' + m.id, `${g.names[m.from] || m.from} a mis à jour les participants : ${g.members.map(e => g.names[e] || e).join(', ')}.`); });
