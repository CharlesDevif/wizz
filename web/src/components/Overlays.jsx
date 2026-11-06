import React, { useEffect, useState } from 'react';
import Emo from './Emo.jsx';
import { useStore, set } from '../lib/store.js';
import { EMOTICONS, EMO_MAP, emoHtml } from '../lib/emoticons.js';
import { WINKS, STATUSES, stById } from '../lib/data.js';
import { closeMenu, removeToast, bringFront, dialog, sendWink } from '../lib/actions.js';
import { toggleMute } from '../lib/sounds.js';

export function Toasts() { const toasts = useStore(s => s.toasts);
  return <div id="toasts">{toasts.map(t => <div key={t.id} className="toast" onClick={() => { removeToast(t.id); t.onclick && t.onclick(); }}><svg className="sico"><use href={'#' + (t.ico || 'logo')} /></svg><div className="tt"><Emo as="b" text={t.title} /><Emo text={t.text} /></div><span className="x" onClick={e => { e.stopPropagation(); removeToast(t.id); }}>✕</span></div>)}</div>; }

export function Menu() { const menu = useStore(s => s.menu); if (!menu) return null;
  const W = 220, H = menu.items.length * 22 + 8;
  return <div className="menu" id="ctxMenu" style={{ left: Math.min(menu.x, innerWidth - W - 4), top: Math.min(menu.y, innerHeight - H - 34), zIndex: 9999 }} onMouseDown={e => e.stopPropagation()}>
    {menu.items.map((it, i) => it.sep ? <div key={i} className="sep" /> : <div key={i} className={'mi' + (it.dis ? ' dis' : '')} onClick={() => { if (it.dis) return; closeMenu(); it.fn && it.fn(); }}>{it.ico && <svg className="sico"><use href={'#' + it.ico} /></svg>}{it.bold ? <b>{it.label}</b> : it.label}</div>)}
  </div>; }

export function EmoPicker() { const p = useStore(s => s.emoPicker); if (!p) return null;
  const left = Math.min(p.x, innerWidth - 292), top = Math.max(0, p.y - 232);
  return <div id="emoPicker" style={{ display: 'block', left, top, zIndex: 9999 }} onMouseDown={e => e.stopPropagation()}>
    <div className="grid" id="emoGrid">{EMOTICONS.map(e => <div key={e[3]} className="e" title={`${e[0]}  ${e[1][0]}`} dangerouslySetInnerHTML={{ __html: emoHtml(e) }} onClick={() => { p.insert(e[1][0] + ' '); set({ emoPicker: null }); }} />)}</div>
    <div className="foot"><span className="link" onClick={() => { set({ emoPicker: null }); dialog({ title: 'Mes émoticônes', kind: 'custom' }); }}>Mes émoticônes…</span><span>Survolez pour voir le raccourci</span></div>
  </div>; }

export function WinkPicker() { const p = useStore(s => s.winkPicker); if (!p) return null;
  return <div id="winkPicker" className="menu" style={{ left: p.x, top: p.y - 130, zIndex: 9999 }} onMouseDown={e => e.stopPropagation()}>
    <div style={{ padding: '3px 6px', color: '#1E3F7A', fontWeight: 'bold' }}>Winks</div>
    {Object.entries(WINKS).map(([id, w]) => <div key={id} className="mi" onClick={() => { set({ winkPicker: null }); sendWink(p.key, id, w.name); }}><span className="sico" style={{ left: 6 }} dangerouslySetInnerHTML={{ __html: emoHtml(EMO_MAP.get(w.emo)) }} />{w.name}</div>)}
  </div>; }

export function Taskbar() {
  const { windows, me, muted } = useStore(s => ({ windows: s.windows, me: s.me, muted: s.muted })); const convs = useStore(s => s.convs);
  const [clock, setClock] = useState(''); useEffect(() => { const t = () => setClock(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })); t(); const i = setInterval(t, 10000); return () => clearInterval(i); }, []);
  const top = Object.values(windows).filter(w => !w.hidden).sort((a, b) => b.z - a.z)[0]?.id;
  const items = Object.values(windows).filter(w => w.type === 'main' || w.type === 'conv').sort((a, b) => a.id.localeCompare(b.id));
  const label = w => w.type === 'main' ? 'Wizz' : (() => { const k = w.id.slice(5); const c = convs[k]; return c?.group ? `Conversation (${c.group.members.length} participants)` : (c?.title || k); })();
  return <>
    <div id="mute" onClick={toggleMute}>{muted ? '🔇 sons coupés' : '🔊 sons activés'}</div>
    <div id="taskbar"><div id="start">démarrer</div>
      <div id="tasks">{items.map(w => <div key={w.id} className={'task' + (top === w.id ? ' active' : '')} onClick={() => bringFront(w.id)}><svg width="14" height="14"><use href="#logo" /></svg><span>{label(w)}</span></div>)}</div>
      <div id="tray"><svg className="tray-msn" id="trayIco"><use href={'#' + stById(me.status).ico} /></svg><span id="clock">{clock}</span></div></div>
  </>; }
