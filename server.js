// Serveur temps réel de la recréation Messenger.
// Node 18+ : `node server.js` puis ouvrir http://localhost:8080
// Comptes, contacts, présence, messages (y compris hors ligne), wizz, "est en train d'écrire".
// Persistance : data.json (simple, suffisant pour un buzz ; passer à SQLite si ça explose).

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const DATA_DIR = process.env.DATA_DIR || __dirname;
try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
const DATA = path.join(DATA_DIR, 'data.json');
const ROOT = fs.existsSync(path.join(__dirname, 'dist', 'index.html')) ? path.join(__dirname, 'dist') : __dirname; // build React (web/) si présent

/* ---------- persistance ---------- */
let db = { users: {}, offline: {} }; // users[email] = {email, pass(hash), salt, name, psm, dp, contacts:[email], pending:[email(inviteurs)], blocked:[email]}
try { db = JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch (e) {}
let saveTimer = null;
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(() => fs.writeFile(DATA, JSON.stringify(db), () => {}), 300); }
const hash = (p, s) => crypto.scryptSync(p, s, 32).toString('hex');

/* ---------- HTTP statique ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.normalize(path.join(ROOT, p));
  if (!f.startsWith(ROOT) || f === DATA || f.includes('node_modules') || f.endsWith('server.js') || f.endsWith('data.json')) { res.writeHead(404); return res.end(); }
  fs.readFile(f, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(buf);
  });
});

/* ---------- WebSocket ---------- */
const wss = new WebSocketServer({ server, maxPayload: 2 * 1024 * 1024 });
const online = new Map(); // email -> {ws, status}
const send = (ws, type, data) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type, ...data })); };
const sendTo = (email, type, data) => { const s = online.get(email); if (s) send(s.ws, type, data); };
const publicUser = (u, status) => ({ email: u.email, name: u.name, psm: u.psm || '', dp: u.dp || null, status: status || 'offline' });
const statusOf = email => { const s = online.get(email); return s ? (s.status === 'hidden' ? 'offline' : s.status) : 'offline'; };

function broadcastPresence(email) {
  const u = db.users[email]; if (!u) return;
  const pu = publicUser(u, statusOf(email));
  for (const c of u.contacts) if (db.users[c] && db.users[c].contacts.includes(email) && !u.blocked.includes(c)) sendTo(c, 'presence', { user: pu });
}
function contactList(u) {
  return u.contacts.map(e => db.users[e]).filter(Boolean).map(c => publicUser(c, c.contacts.includes(u.email) && !c.blocked.includes(u.email) ? statusOf(c.email) : 'offline'));
}

const regByIp = new Map(); // ip -> [timestamps] : max 5 inscriptions / heure / IP
function regAllowed(ip) { const now = Date.now(); const arr = (regByIp.get(ip) || []).filter(t => now - t < 3600e3); regByIp.set(ip, arr); if (arr.length >= 5) return false; arr.push(now); return true; }
wss.on('connection', (ws, req) => {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
  let me = null;
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    const t = m.type;

    if (t === 'register') {
      const email = String(m.email || '').trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return send(ws, 'error', { msg: 'Adresse de messagerie invalide.' });
      if (db.users[email]) return send(ws, 'error', { msg: 'Cette adresse est déjà utilisée.' });
      if (!m.pass || m.pass.length < 4) return send(ws, 'error', { msg: 'Mot de passe trop court (4 caractères minimum).' });
      if (!regAllowed(ip)) return send(ws, 'error', { msg: 'Trop d\'inscriptions depuis cette connexion. Réessayez dans une heure.' });
      const salt = crypto.randomBytes(8).toString('hex');
      db.users[email] = { email, salt, pass: hash(m.pass, salt), name: (m.name || email.split('@')[0]).slice(0, 129), psm: '', dp: null, contacts: [], pending: [], blocked: [] };
      save(); send(ws, 'registered', { email });
      return;
    }
    if (t === 'login') {
      const email = String(m.email || '').trim().toLowerCase(); const u = db.users[email];
      if (!u || u.pass !== hash(String(m.pass || ''), u.salt)) return send(ws, 'error', { msg: 'Adresse de messagerie ou mot de passe incorrect.' });
      if (online.has(email)) { send(online.get(email).ws, 'kicked', {}); online.get(email).ws.close(); }
      me = u; online.set(email, { ws, status: m.status || 'online' });
      send(ws, 'welcome', { me: publicUser(u, m.status || 'online'), contacts: contactList(u), pending: u.pending.map(e => db.users[e] ? publicUser(db.users[e]) : null).filter(Boolean), offline: db.offline[email] || [] });
      delete db.offline[email]; save();
      broadcastPresence(email);
      return;
    }
    if (!me) return send(ws, 'error', { msg: 'Non connecté.' });

    switch (t) {
      case 'status': online.get(me.email).status = m.status; broadcastPresence(me.email); break;
      case 'profile': if (typeof m.name === 'string') me.name = m.name.slice(0, 129); if (typeof m.psm === 'string') me.psm = m.psm.slice(0, 129); if (m.dp !== undefined && (m.dp === null || (typeof m.dp === 'string' && m.dp.length < 200000))) me.dp = m.dp; save(); broadcastPresence(me.email); break;
      case 'add': {
        const e = String(m.email || '').trim().toLowerCase(); const u = db.users[e];
        if (!u) return send(ws, 'error', { msg: `Aucun utilisateur avec l'adresse ${e}.` });
        if (e === me.email) return send(ws, 'error', { msg: 'Vous ne pouvez pas vous ajouter vous-même.' });
        if (!me.contacts.includes(e)) me.contacts.push(e);
        if (!u.contacts.includes(me.email) && !u.pending.includes(me.email)) { u.pending.push(me.email); sendTo(e, 'invite', { user: publicUser(me, statusOf(me.email)) }); }
        save(); send(ws, 'contacts', { contacts: contactList(me) }); break;
      }
      case 'accept': {
        const e = m.email; const i = me.pending.indexOf(e); if (i < 0) break; me.pending.splice(i, 1);
        if (!me.contacts.includes(e)) me.contacts.push(e); save();
        send(ws, 'contacts', { contacts: contactList(me) }); broadcastPresence(me.email); broadcastPresence(e);
        if (db.users[e]) sendTo(e, 'contacts', { contacts: contactList(db.users[e]) }); break;
      }
      case 'decline': { const i = me.pending.indexOf(m.email); if (i >= 0) me.pending.splice(i, 1); save(); break; }
      case 'remove': { me.contacts = me.contacts.filter(x => x !== m.email); save(); send(ws, 'contacts', { contacts: contactList(me) }); if (db.users[m.email]) sendTo(m.email, 'presence', { user: publicUser(me, 'offline') }); break; }
      case 'block': { if (!me.blocked.includes(m.email)) me.blocked.push(m.email); save(); sendTo(m.email, 'presence', { user: publicUser(me, 'offline') }); break; }
      case 'unblock': { me.blocked = me.blocked.filter(x => x !== m.email); save(); broadcastPresence(me.email); break; }
      case 'msg': case 'nudge': case 'typing': case 'voice': case 'ink': case 'wink': case 'rtc': case 'game': case 'group': case 'file': case 'wb': {
        const to = m.to; const u = db.users[to]; if (!u) break; if (!me.contacts.includes(to) && !m.group) break;
        if (u.blocked.includes(me.email)) break;
        const payload = { from: me.email, ...m }; delete payload.type; delete payload.to;
        if (t === 'typing' || t === 'rtc' || t === 'game' || t === 'group' || t === 'file' || t === 'wb') { sendTo(to, t, payload); break; }
        if (online.has(to)) sendTo(to, t, payload);
        else if (t === 'msg') { (db.offline[to] = db.offline[to] || []).push({ ...payload, ts: Date.now() }); save(); send(ws, 'offline-stored', { to }); }
        break;
      }
    }
  });
  ws.on('close', () => { if (me && online.get(me.email)?.ws === ws) { online.delete(me.email); broadcastPresence(me.email); } });
});

server.listen(PORT, () => console.log(`Messenger server → http://localhost:${PORT}`));
