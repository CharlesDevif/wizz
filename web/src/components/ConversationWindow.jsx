import React, { useEffect, useRef, useState } from 'react';
import Window from './Window.jsx';
import Emo, { Dp } from './Emo.jsx';
import { useStore, get, set, byEmail } from '../lib/store.js';
import { stIco, stLabel, BGS, WINKS, now } from '../lib/data.js';
import { EMO_MAP, emoHtml, esc } from '../lib/emoticons.js';
import { minimize, closeConv, sendMsg, nudge, typingPing, showMenu, dialog, sysMsg, pickDp, blockContact, setBg } from '../lib/actions.js';
import { calls, inviteCall, hangup, gameMove, gameEnd, gameInvite, flagsMove, flagsEnd, flagsInvite, flagsCount, solitClick, solitEnd, solitInvite, SUITS, RED, sendFile, whiteboardOpen, whiteboardClose, wbSend, wbBus, voiceStart, voiceStop, xferAction, winner } from '../lib/features.js';

const fontStyle = f => f ? { fontFamily: `'${f.family || 'Microsoft Sans Serif'}'`, fontSize: +f.size || 12, color: f.color || '#000', fontWeight: f.bold ? 'bold' : 'normal', fontStyle: f.italic ? 'italic' : 'normal' } : {};
const ts = t => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

function VoiceMsg({ m }) { const a = useRef(null); const [playing, setPlaying] = useState(false); const [dur, setDur] = useState('voice clip');
  useEffect(() => { a.current = new Audio(m.data); a.current.onended = () => setPlaying(false); a.current.onloadedmetadata = () => { if (isFinite(a.current.duration)) setDur(Math.round(a.current.duration) + ' s'); }; }, [m.data]);
  return <div className={'msg' + (m.mine ? ' me' : '')}><div className="who"><span className="ts">[{ts(m.ts)}]</span><Emo text={m.who} /> {m.mine ? 'envoie' : 'vous envoie'} un message vocal :</div><div className="txt"><span className="vclip"><button className="btn" style={{ minWidth: 0, padding: '1px 8px' }} onClick={() => { if (playing) { a.current.pause(); a.current.currentTime = 0; setPlaying(false); } else { a.current.play(); setPlaying(true); } }}>{playing ? '■' : '▶'}</button> <span className="vbar"></span> <span className="vdur">{dur}</span></span></div></div>; }

function History({ k, conv }) {
  const ref = useRef(null); useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [conv.msgs.length]);
  const bg = conv.bg; const style = bg && bg.css !== undefined ? { background: bg.css || '', color: bg.color || '' } : {};
  const onClick = e => { const a = e.target.dataset.accept, d = e.target.dataset.decline, c = e.target.dataset.cancel; if (a) xferAction('accept', a); else if (d) xferAction('decline', d); else if (c) xferAction('cancel', c); };
  return <div className={'history' + (bg && bg.cls ? ' ' + bg.cls : '')} style={style} ref={ref} onClick={onClick}>
    {conv.msgs.map(m => {
      if (m.type === 'sys') return <div key={m.id} className={'sys ' + (m.cls || '')}><Emo text={m.text} /></div>;
      if (m.type === 'xfer') return <div key={m.id} className="sys xfer" dangerouslySetInnerHTML={{ __html: m.html }} />;
      if (m.type === 'voice') return <VoiceMsg key={m.id} m={m} />;
      if (m.type === 'ink') return <div key={m.id} className={'msg' + (m.mine ? ' me' : '')}><div className="who"><span className="ts">[{ts(m.ts)}]</span><Emo text={m.who} /> {m.name ? `envoie l'image « ${m.name} »` : 'dit (encre) '} :</div><div className="txt"><img src={m.data} alt="" style={{ maxWidth: '100%', maxHeight: 160, border: '1px solid #ddd', background: '#fff' }} /></div></div>;
      return <div key={m.id} className={'msg' + (m.mine ? ' me' : '')}><div className="who"><span className="ts">[{ts(m.ts)}]</span><Emo text={m.who} /> dit :</div><Emo as="div" className="txt" style={fontStyle(m.font)} text={m.text} custom={m.custom} /></div>;
    })}
    {conv.wink && <WinkOverlay key={conv.wink.n} id={conv.wink.id} />}
  </div>;
}
function WinkOverlay({ id }) {
  const e = s => <span dangerouslySetInnerHTML={{ __html: emoHtml(EMO_MAP.get(s)) }} />;
  if (id === 'kiss') return <div className="wink-overlay">{Array.from({ length: 14 }, (_, i) => <span key={i} className="wk-item" style={{ left: Math.random() * 90 + '%', animationDelay: i * .12 + 's' }}>{e('(K)')}</span>)}</div>;
  if (id === 'hearts') return <div className="wink-overlay">{Array.from({ length: 18 }, (_, i) => <span key={i} className="wk-item wk-fall" style={{ left: Math.random() * 92 + '%', animationDelay: i * .1 + 's' }}>{e('(L)')}</span>)}</div>;
  if (id === 'sheep') return <div className="wink-overlay"><span className="wk-run">{e('(bah)')}</span></div>;
  if (id === 'boom') return <div className="wink-overlay"><div className="wk-boom" /></div>;
  return <div className="wink-overlay">{Array.from({ length: 30 }, (_, i) => <span key={i} className="wk-conf" style={{ left: Math.random() * 100 + '%', background: ['#F03030', '#FFD12E', '#3A8AE8', '#8CC43F', '#F0507A'][i % 5], animationDelay: Math.random() * .8 + 's' }} />)}<span className="wk-item wk-big">{e('<:o)')}</span></div>;
}

function TicTacToe({ k, g }) { const w = winner(g.board); const status = w ? (w === 'draw' ? 'Match nul !' : (w === g.me ? 'Vous avez gagné ! (Y)' : 'Vous avez perdu… :(')) : (g.turn === g.me ? 'À vous de jouer (' + g.me + ')' : 'Au tour de l\'adversaire…');
  return <div className="gamebox"><div className="gamehdr">Morpion — <Emo text={status} /> <span className="link gquit" onClick={() => gameEnd(k, true)}>Quitter</span></div>
    <div className="ttt">{g.board.map((v, i) => <div key={i} className={'cell ' + (v ? '' : 'free')} data-i={i} onClick={() => { if (!w && g.turn === g.me && !v) gameMove(k, i, true); }}>{v}</div>)}</div></div>; }
function Flags({ k, g }) { const other = g.me === 'X' ? 'O' : 'X'; const won = g.scores.X >= 26 ? 'X' : g.scores.O >= 26 ? 'O' : null;
  const status = won ? (won === g.me ? 'Vous avez gagné ! (Y)' : 'Vous avez perdu… :(') : (g.turn === g.me ? 'À vous de jouer' : 'Au tour de l\'adversaire…'); const cells = [];
  for (let i = 0; i < g.w * g.h; i++) { if (!g.open.has(i)) cells.push(<div key={i} className="fc hid" data-i={i} onClick={() => { if (!won && g.turn === g.me) flagsMove(k, i, true); }} />); else if (g.mines.has(i)) cells.push(<div key={i} className={'fc flag ' + (g.owner[i] === g.me ? 'mine' : 'theirs')}>⚑</div>); else { const n = flagsCount(g, i); cells.push(<div key={i} className={'fc n' + n}>{n || ''}</div>); } }
  return <div className="gamebox"><div className="gamehdr">Démineur Flags — <Emo text={status} /> &nbsp; <span style={{ color: '#3A60E0' }}>Vous : {g.scores[g.me]}</span> &nbsp; <span style={{ color: '#D02020' }}>Adv. : {g.scores[other]}</span> <span className="link fquit" onClick={() => flagsEnd(k, true)}>Quitter</span></div><div className="fgrid">{cells}</div></div>; }
const cardTxt = c => ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }[c.v] || c.v) + c.su;
function Solitaire({ k, g }) { const other = g.me === 'X' ? 'O' : 'X'; const won = g.scores.X >= 27 ? 'X' : g.scores.O >= 27 ? 'O' : null;
  const Card = ({ c, w, i, j }) => c.up ? <div className={'card ' + (RED(c.su) ? 'red ' : '') + (g.sel && g.sel.w === w && g.sel.i === i && g.sel.j === j ? 'sel' : '')} onClick={() => !won && solitClick(k, { w, i, j })}>{cardTxt(c)}</div> : <div className="card back" onClick={() => !won && solitClick(k, { w, i, j })} />;
  return <div className="gamebox"><div className="gamehdr">Solitaire Showdown — <span style={{ color: '#3A60E0' }}>Vous : {g.scores[g.me]}</span> &nbsp; <span style={{ color: '#D02020' }}>Adv. : {g.scores[other]}</span> {won && <b>{won === g.me ? ' — Vous avez gagné !' : ' — Perdu…'}</b>}<span className="link squit" onClick={() => solitEnd(k, true)}>Quitter</span></div>
    <div className="solit"><div className="srow"><div className={'card ' + (g.stock.length ? 'back' : 'empty')} data-w="stock" onClick={() => solitClick(k, { w: 'stock' })}>{g.stock.length ? '' : '↻'}</div>{g.waste.length ? <Card c={g.waste[g.waste.length - 1]} w="waste" i={0} j={0} /> : <div className="card empty" />}<div className="spacer" />{SUITS.map(s => <div key={s} className={'card found ' + (RED(s) ? 'red' : '')} onClick={() => solitClick(k, { w: 'found', s })}>{g.found[s] ? cardTxt({ v: g.found[s], su: s }) : s}</div>)}</div>
      <div className="scols">{g.cols.map((col, i) => <div key={i} className="scol">{col.length ? col.map((c, j) => <Card key={j} c={c} w="col" i={i} j={j} />) : <div className="card empty" onClick={() => solitClick(k, { w: 'col', i, j: -1 })} />}</div>)}</div></div></div>; }
function Whiteboard({ k }) { const cv = useRef(null); const [col, setCol] = useState('#1E3F7A'); const down = useRef(false); const last = useRef(null);
  useEffect(() => { const h = e => { if (e.detail.key !== k) return; const m = e.detail.m; const x = cv.current.getContext('2d'); if (m.kind === 'seg') { x.lineCap = x.lineJoin = 'round'; x.lineWidth = 2; x.strokeStyle = m.col; x.beginPath(); x.moveTo(m.a[0], m.a[1]); x.lineTo(m.b[0], m.b[1]); x.stroke(); } if (m.kind === 'clear') x.clearRect(0, 0, 330, 130); }; wbBus.addEventListener('wb', h); return () => wbBus.removeEventListener('wb', h); }, [k]);
  const pos = e => { const r = cv.current.getBoundingClientRect(); return [Math.round(e.clientX - r.left), Math.round(e.clientY - r.top)]; };
  const seg = (a, b) => { const x = cv.current.getContext('2d'); x.lineCap = x.lineJoin = 'round'; x.lineWidth = 2; x.strokeStyle = col; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); wbSend(k, { kind: 'seg', a, b, col }); };
  return <div className="gamebox wbbox"><div className="gamehdr">Tableau blanc partagé <input type="color" className="wbc" value={col} onChange={e => setCol(e.target.value)} /> <span className="link wbclear" onClick={() => { cv.current.getContext('2d').clearRect(0, 0, 330, 130); wbSend(k, { kind: 'clear' }); }}>Effacer</span> <span className="link wbquit" onClick={() => whiteboardClose(k, true)}>Fermer</span></div>
    <canvas ref={cv} className="wbcv" width="330" height="130" style={{ background: '#fff', border: '1px solid #A9C4E4', cursor: 'crosshair', touchAction: 'none', display: 'block', margin: '3px auto 0' }}
      onPointerDown={e => { down.current = true; last.current = pos(e); cv.current.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (!down.current) return; const p = pos(e); seg(last.current, p); last.current = p; }} onPointerUp={() => down.current = false} onPointerCancel={() => down.current = false} /></div>; }
function CallBox({ k, call }) { const rv = useRef(null), lv = useRef(null); const [t, setT] = useState('00:00');
  useEffect(() => { const c = calls[k]; if (rv.current && c?.remote && rv.current.srcObject !== c.remote) rv.current.srcObject = c.remote; if (lv.current && c?.stream && lv.current.srcObject !== c.stream) lv.current.srcObject = c.stream; }, [k, call.rev]);
  useEffect(() => { const i = setInterval(() => { const s = Math.floor((Date.now() - call.t0) / 1000); setT(String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')); }, 1000); return () => clearInterval(i); }, [call.t0]);
  return <div className={'callbox' + (call.screen ? ' screen' : '')}><div className="callhdr">{call.screen ? 'Partage d\'écran' : call.video ? 'Appel vidéo' : 'Appel audio'} <span className="calltime">{t}</span></div>
    <video className="rv" ref={rv} autoPlay playsInline style={{ display: call.video ? '' : 'none' }} /><video className="lv" ref={lv} autoPlay playsInline muted style={{ display: call.video && !call.screen ? '' : 'none' }} />
    {!call.video && <div className="audioico"><svg width="48" height="48"><use href="#ico-audio" /></svg></div>}<button className="btn hang" onClick={() => hangup(k, true)}>Raccrocher</button></div>; }

export default function ConversationWindow({ k }) {
  const conv = useStore(s => s.convs[k]); const me = useStore(s => s.me); const contact = useStore(s => s.contacts.find(c => c.email === k)); const netMode = useStore(s => s.netMode);
  const [text, setText] = useState(''); const ta = useRef(null); const winRef = useRef(null); const [shakeN, setShakeN] = useState(0);
  useEffect(() => { if (conv && conv.shake && conv.shake !== shakeN) { setShakeN(conv.shake); const el = document.getElementById('conv-' + CSS.escape(k)); if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); } } }, [conv?.shake]);
  if (!conv) return null;
  const g = conv.group; const c = contact || { email: k, name: g ? g.members.filter(e => e !== me.email).map(e => g.names[e] || e).join(', ') : k, status: 'online' };
  const title = g ? `Conversation (${g.members.length} participants)` : `${c.name} - Conversation`;
  const infobar = !g && ({ away: ' ne répondra peut-être pas car son statut est Absent(e).', brb: ' ne répondra peut-être pas car son statut est De retour dans une minute.', busy: ' ne répondra peut-être pas car son statut est Occupé(e).', phone: ' ne répondra peut-être pas car son statut est Au téléphone.', lunch: ' ne répondra peut-être pas car son statut est Parti(e) manger.', offline: ' est hors ligne. Le message sera remis à sa prochaine connexion.' })[c.status];
  const send = () => { sendMsg(k, text); setText(''); };
  const insert = s => { const el = ta.current; const p = el.selectionStart; const v = text.slice(0, p) + s + text.slice(el.selectionEnd); setText(v); setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = p + s.length; }, 0); };
  const act = (a, e) => { const r = e.currentTarget.getBoundingClientRect(); e.stopPropagation();
    switch (a) {
      case 'nudge': nudge(k, true); break;
      case 'file': sendFile(k); break;
      case 'font': dialog({ title: 'Modifier ma police', kind: 'font' }); break;
      case 'ink': dialog({ title: 'Écriture manuscrite', kind: 'ink', key: k }); break;
      case 'emo': set({ emoPicker: { x: r.left, y: r.top, insert } }); break;
      case 'wink': set({ winkPicker: { x: r.left, y: r.top, key: k } }); break;
      case 'bg': case 'colors': showMenu(BGS.map(b => ({ label: b.n, dis: !!b.sep, fn: () => setBg(k, b) })), r.left, r.top - 10); break;
      case 'dp': pickDp(); break;
      case 'block': if (g) { sysMsg(k, 'Non disponible dans une conversation à plusieurs.'); break; } blockContact(k, c.status !== 'blocked'); sysMsg(k, c.status === 'blocked' ? `Vous avez débloqué ${c.name}.` : `Vous avez bloqué ${c.name}.`); break;
      case 'audio': case 'video': if (g) { sysMsg(k, 'Les appels ne sont disponibles qu\'en tête-à-tête.'); break; } inviteCall(k, a === 'video', false); break;
      case 'games': if (g) { sysMsg(k, 'Les jeux se jouent en tête-à-tête.'); break; } if (conv.game || conv.flags || conv.solit) break; showMenu([{ label: 'Morpion', fn: () => gameInvite(k) }, { label: 'Démineur Flags', fn: () => flagsInvite(k) }, { label: 'Solitaire Showdown', fn: () => solitInvite(k) }], r.left, r.bottom); break;
      case 'activities': if (g) { sysMsg(k, 'Non disponible dans une conversation à plusieurs.'); break; } showMenu([{ label: 'Tableau blanc partagé', fn: () => whiteboardOpen(k, false) }, { label: 'Partager mon écran', fn: () => inviteCall(k, true, true) }], r.left, r.bottom); break;
      case 'invite': if (netMode !== 'server') { sysMsg(k, 'Les conversations à plusieurs nécessitent le serveur (mode démo).'); break; } dialog({ title: 'Inviter quelqu\'un dans cette conversation', kind: 'groupInvite', fromKey: k, base: g ? g.members : [me.email, k] }); break;
    } };
  const tools = [['invite', 'ico-invite', 'Inviter'], ['file', 'ico-file', 'Envoyer des fichiers'], ['video', 'ico-video', 'Vidéo'], ['audio', 'ico-audio', 'Voix'], ['activities', 'ico-act', 'Activités'], ['games', 'ico-games', 'Jeux']];
  return (
    <Window id={'conv:' + k} domId={'conv-' + k} className="convWin" title={title} menus={['Fichier', 'Edition', 'Actions', 'Outils', 'Aide']} onMinimize={() => minimize('conv:' + k)} onClose={() => closeConv(k)} dataAttrs={{ 'data-cid': k }}>
      <div className="body">
        <div className="ctoolbar">
          {tools.map(([a, ico, l]) => <div key={a} className="ctool" data-act={a} onClick={e => act(a, e)}><svg className="ico"><use href={'#' + ico} /></svg>{l}</div>)}
          <div className="ctool right small" data-act="block" title="Bloquer" onClick={e => act('block', e)}><svg className="ico"><use href="#ico-block" /></svg></div>
          <div className="ctool small" data-act="colors" title="Couleurs" onClick={e => act('colors', e)}><svg className="ico"><use href="#ico-color" /></svg></div>
          <div className="cbrand"><svg width="16" height="16"><use href="#logo" /></svg><b>Wizz</b></div>
        </div>
        <div className="convmain">
          <div className="convleft">
            <div className="toline">{g ? <>À : {g.members.filter(e => e !== me.email).map((e, i) => <React.Fragment key={e}>{i > 0 && ' ; '}<b><Emo text={g.names[e] || e} /></b> &lt;{e}&gt;</React.Fragment>)}</>
              : <><svg className="to-ico" width="14" height="14" style={{ verticalAlign: -2 }}><use href={'#' + stIco(c.status)} /></svg> À : <b><Emo text={c.name} /></b> &lt;{c.email}&gt; <span style={{ color: '#777' }}>(<span className="ct-status-in-to">{stLabel(c.status)}</span>)</span></>}</div>
            {infobar && <div className="infobar"><span className="iico">i</span><span className="itxt"><Emo text={c.name} />{infobar}</span></div>}
            <History k={k} conv={conv} />
            {conv.game && <TicTacToe k={k} g={conv.game} />}{conv.flags && <Flags k={k} g={conv.flags} />}{conv.solit && <Solitaire k={k} g={conv.solit} />}{conv.wb && <Whiteboard k={k} />}
            <div className="fmtbar">
              <div className="fbtn lab" data-act="font" title="Modifier la police et la couleur du texte" onClick={e => act('font', e)}><svg><use href="#ico-font" /></svg>Police<span className="dd">▼</span></div>
              <div className="fbtn fbtn-emo" title="Sélectionner une émoticône" onClick={e => act('emo', e)} onMouseDown={e => e.stopPropagation()}><svg><use href="#ico-smile" /></svg><span className="dd">▼</span></div>
              <div className="fbtn lab" data-act="voice" title="Message vocal : maintenir F2 (ou ce bouton) pour parler" onMouseDown={e => { e.preventDefault(); voiceStart(k); }} onMouseUp={voiceStop} onMouseLeave={voiceStop}><svg><use href="#ico-voice" /></svg>Message vocal</div>
              <div className="fbtn lab" data-act="wink" title="Sélectionner un clin d'œil (Wink)" onClick={e => act('wink', e)} onMouseDown={e => e.stopPropagation()}><svg><use href="#ico-wink" /></svg>Clins d'œil<span className="dd">▼</span></div>
              <div className="fbtn" data-act="bg" title="Sélectionner un arrière-plan" onClick={e => act('bg', e)}><svg><use href="#ico-bg" /></svg><span className="dd">▼</span></div>
              <div className="fbtn" data-act="dp" title="Sélectionner une image perso" onClick={e => act('dp', e)}><svg><use href="#ico-dp" /></svg><span className="dd">▼</span></div>
              <div className="fsep" />
              <div className="fbtn" data-act="nudge" title="Envoyer un Wizz" onClick={e => act('nudge', e)}><svg><use href="#ico-nudge" /></svg></div>
              <div className="fbtn" data-act="ink" title="Écriture manuscrite" onClick={e => act('ink', e)}><svg><use href="#ico-ink" /></svg></div>
            </div>
            <div className="inputrow">
              <textarea ref={ta} spellCheck={false} value={text} style={fontStyle(me.font)} onChange={e => { setText(e.target.value); typingPing(k); }} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); send(); } if (e.key === 'F2' && !e.repeat) { e.preventDefault(); voiceStart(k); } }} onKeyUp={e => { if (e.key === 'F2') voiceStop(); }} />
              <div className="sendcol"><button className="btn send" onClick={send}>Envoyer</button><button className="btn search" onClick={() => { const q = text.trim(); if (q) window.open('https://www.bing.com/search?q=' + encodeURIComponent(q)); }}>Rechercher</button></div>
            </div>
            <div className="modetabs"><span className="mt" onClick={e => act('ink', e)}>Manuscrit</span><span className="mt on">Texte</span></div>
          </div>
          {conv.call ? <CallBox k={k} call={conv.call} /> : <div className="convright">
            <div className="dpwrap"><Dp dp={g ? null : c.dp} className="ct-dp" /><div className="dpctl"><span title="Masquer">◂</span></div></div>
            <div className="dpwrap"><Dp dp={me.dp} className="my-dp-in-conv" /><div className="dpctl"><span title="Options">▾</span></div></div>
          </div>}
        </div>
        <div className="statusbar"><svg className={'pen' + (conv.pen ? '' : ' hidden')}><use href="#ico-pen" /></svg><span className="stxt">{conv.statusLine}</span></div>
      </div>
    </Window>
  );
}
