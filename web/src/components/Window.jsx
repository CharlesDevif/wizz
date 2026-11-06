import React, { useRef } from 'react';
import { useStore } from '../lib/store.js';
import { bringFront, moveWindow } from '../lib/actions.js';

/* Fenêtre XP générique : barre de titre déplaçable, boutons, menus */
export default function Window({ id, title, icon = 'logo', menus = [], onMinimize, onClose, className = '', style = {}, children, titleExtra, domId, dataAttrs = {} }) {
  const w = useStore(s => s.windows[id]); const top = useStore(s => Object.values(s.windows).filter(x => !x.hidden).sort((a, b) => b.z - a.z)[0]?.id);
  const drag = useRef(null);
  if (!w) return null;
  const onDown = e => { if (e.target.closest('.tbtn') || e.button !== 0) return; drag.current = { sx: e.clientX, sy: e.clientY, ox: w.x, oy: w.y }; bringFront(id); e.preventDefault();
    const mv = ev => { if (!drag.current) return; moveWindow(id, Math.max(-500, drag.current.ox + ev.clientX - drag.current.sx), Math.max(0, drag.current.oy + ev.clientY - drag.current.sy)); };
    const up = () => { drag.current = null; window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up); };
  return (
    <div id={domId} className={`win ${className} ${top !== id ? 'inactive' : ''} ${w.hidden ? 'hidden' : ''}`} style={{ left: w.x, top: w.y, zIndex: w.z, width: w.w, height: w.h, ...style }} onMouseDown={() => bringFront(id)} {...dataAttrs}>
      <div className="title" onMouseDown={onDown}>
        <svg className="t-ico"><use href={'#' + icon} /></svg><span className="t-text">{title}</span>{titleExtra}
        <span className="tbtn" onClick={onMinimize}>_</span><span className="tbtn">□</span><span className="tbtn close" onClick={onClose}>✕</span>
      </div>
      {menus.length > 0 && <div className="menubar">{menus.map(m => <span key={m}>{m}</span>)}</div>}
      {children}
    </div>
  );
}
