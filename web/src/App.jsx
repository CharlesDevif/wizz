import React, { useEffect } from 'react';
import defs from './defs.html?raw';
import { useStore, set } from './lib/store.js';
import { closeMenu, idleReset } from './lib/actions.js';
import LoginWindow from './components/LoginWindow.jsx';
import MainWindow from './components/MainWindow.jsx';
import ConversationWindow from './components/ConversationWindow.jsx';
import Dialogs from './components/Dialogs.jsx';
import { Toasts, Menu, EmoPicker, WinkPicker, Taskbar } from './components/Overlays.jsx';
import './lib/features.js';

export default function App() {
  const screen = useStore(s => s.screen); const convKeys = useStore(s => Object.keys(s.convs));
  useEffect(() => {
    const down = e => { if (!e.target.closest('#ctxMenu')) closeMenu(); if (!e.target.closest('#emoPicker') && !e.target.closest('.fbtn-emo')) set(s => s.emoPicker ? { ...s, emoPicker: null } : s); if (!e.target.closest('#winkPicker') && !e.target.closest('[data-act=wink]')) set(s => s.winkPicker ? { ...s, winkPicker: null } : s); };
    document.addEventListener('mousedown', down); ['mousemove', 'keydown', 'mousedown', 'touchstart'].forEach(ev => document.addEventListener(ev, idleReset, { passive: true }));
    return () => document.removeEventListener('mousedown', down);
  }, []);
  return <>
    <div dangerouslySetInnerHTML={{ __html: defs }} />
    <div id="desktop">
      {screen === 'login' && <LoginWindow />}
      {screen === 'main' && <MainWindow />}
      {convKeys.map(k => <ConversationWindow key={k} k={k} />)}
      <Dialogs />
    </div>
    <EmoPicker /><WinkPicker /><Menu /><Toasts /><Taskbar />
  </>;
}
