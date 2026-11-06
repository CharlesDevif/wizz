import { useSyncExternalStore, useRef } from 'react';

const DEFAULT_FONT = { family: 'Microsoft Sans Serif', size: 12, color: '#000000', bold: false, italic: false };
const ls = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
export const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

let state = {
  screen: 'login', registerMode: false, loginErr: '', loginOk: false, connecting: null, serverUrl: ls('msn_server', ''),
  netMode: 'demo', muted: ls('msn_muted', false),
  me: { email: '', pass: '', name: 'Moi', psm: '', status: 'online', dp: null, font: ls('msn_font', DEFAULT_FONT) },
  contacts: [], groups: {}, convs: {}, windows: {}, zTop: 10,
  dialogs: [], toasts: [], menu: null, emoPicker: null, winkPicker: null,
  nicks: ls('msn_nicks', {}), cgroups: ls('msn_cgroups', {}), groupNames: ls('msn_groupnames', ['Amis', 'Famille', 'Travail']), viewByGroup: ls('msn_bygroup', false),
  custom: ls('msn_custom', {}), groupsOpen: {}, filter: '', idleBefore: null,
};
const subs = new Set();
export const get = () => state;
export function set(patch) { state = typeof patch === 'function' ? patch(state) : { ...state, ...patch }; subs.forEach(f => f()); }
const subscribe = f => { subs.add(f); return () => subs.delete(f); };
function shallowEq(a, b) { if (Object.is(a, b)) return true; if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false; const ka = Object.keys(a), kb = Object.keys(b); if (ka.length !== kb.length) return false; for (const k of ka) if (!Object.is(a[k], b[k])) return false; return true; }
/* sélecteur avec comparaison superficielle : un objet/tableau recréé à l'identique ne déclenche pas de rendu */
export function useStore(sel) { const ref = useRef(undefined); const snap = () => { const v = sel(state); if (ref.current !== undefined && shallowEq(ref.current, v)) return ref.current; ref.current = v; return v; }; return useSyncExternalStore(subscribe, snap, snap); }

/* helpers immuables sur les conversations */
export function updConv(key, fn) { set(s => { const c = s.convs[key]; if (!c) return s; return { ...s, convs: { ...s.convs, [key]: fn(c) } }; }); }
let msgId = 1;
export function pushMsg(key, m) { updConv(key, c => ({ ...c, msgs: [...c.msgs, { id: msgId++, ts: Date.now(), ...m }] })); }
export function updMsg(key, id, fn) { updConv(key, c => ({ ...c, msgs: c.msgs.map(m => m.id === id ? fn(m) : m) })); }
export function updContact(email, patch) { set(s => ({ ...s, contacts: s.contacts.map(c => c.email === email ? { ...c, ...patch } : c) })); }
export const byEmail = email => state.contacts.find(c => c.email === email);
