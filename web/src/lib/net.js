/* Couche réseau : WebSocket vers server.js. Mode démo si aucun serveur. */
import { get, set } from './store.js';
const net = { ws: null, ready: false, queue: [] };
const handlers = {}; // type -> fn(m)
export function on(type, fn) { handlers[type] = fn; }
export const IS_TAURI = !!window.__TAURI__;
export function serverUrl() {
  const S = (get().serverUrl || '').trim();
  if (S) { const u = S.replace(/^https?:\/\//, m => m === 'https://' ? 'wss://' : 'ws://'); return /^wss?:\/\//.test(u) ? u : 'wss://' + u; }
  return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host;
}
export function initialMode() {
  const S = (get().serverUrl || '').trim();
  if (S) return 'server';
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return 'demo';
  if (/claude\.ai$/.test(location.hostname)) return 'demo';
  return 'server';
}
export function send(o) { if (get().netMode !== 'server') return false; const s = JSON.stringify(o); if (net.ws && net.ws.readyState === 1) net.ws.send(s); else net.queue.push(s); return true; }
export function connect(cb) {
  if (get().netMode !== 'server') return cb && cb();
  let ws; try { ws = net.ws = new WebSocket(serverUrl()); } catch (e) { set({ netMode: 'demo' }); return cb && cb(); }
  let done = false; const finish = mode => { if (done) return; done = true; if (mode) set({ netMode: mode }); cb && cb(); };
  const guard = setTimeout(() => { if (!net.ready) { try { ws.close(); } catch (e) {} finish('demo'); } }, 3000);
  ws.onopen = () => { clearTimeout(guard); net.ready = true; net.queue.forEach(s => ws.send(s)); net.queue = []; finish(null); };
  ws.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } const h = handlers[m.type]; if (h) h(m); };
  ws.onerror = () => { if (!net.ready) { clearTimeout(guard); finish('demo'); } };
  ws.onclose = () => { net.ready = false; if (get().screen === 'main' && get().netMode === 'server') { handlers.__lost && handlers.__lost(); setTimeout(() => connect(() => { const me = get().me; send({ type: 'login', email: me.email, pass: me.pass, status: me.status }); }), 2000); } };
}
export default net;
