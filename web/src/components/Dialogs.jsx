import React, { useEffect, useRef, useState } from 'react';
import Window from './Window.jsx';
import Emo from './Emo.jsx';
import { useStore, get, set, lsSet, byEmail } from '../lib/store.js';
import { closeDialog, openWindow, closeWindow, addContact, setFont, toast, inviteToGroup, addInk } from '../lib/actions.js';
import { stIco, isOff } from '../lib/data.js';
import { renderEmoticons, emoHtml, EMO_MAP } from '../lib/emoticons.js';
import * as net from '../lib/net.js';
import { play } from '../lib/sounds.js';

function Dlg({ d, width = 340, children, buttons }) {
  useEffect(() => { openWindow('dlg:' + d.id, 'dialog', { x: Math.max(0, innerWidth / 2 - width / 2), y: 200, w: width }); return () => closeWindow('dlg:' + d.id); }, [d.id]);
  const close = () => { closeDialog(d.id); d.onClose && d.onClose(); };
  return (
    <Window id={'dlg:' + d.id} className="dialog" title={d.title} onMinimize={() => {}} onClose={close} dataAttrs={{ 'data-kind': d.kind }}>
      <div className="body" style={{ padding: '14px 12px 10px', gap: 12 }}>
        <div className="dlg-body">{children}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>{buttons.map(b => <button key={b.label} className="btn" onClick={() => { if (b.fn && b.fn() === false) return; closeDialog(d.id); }}>{b.label}</button>)}</div>
      </div>
    </Window>
  );
}

function AskDialog({ d }) { const [v, setV] = useState(d.value || ''); const ok = () => d.cb(v);
  return <Dlg d={d} buttons={[{ label: 'OK', fn: ok }, { label: 'Annuler' }]}><div>{d.label}</div><input type="text" id="askInp" autoFocus style={{ width: '100%', marginTop: 6 }} value={v} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { ok(); closeDialog(d.id); } }} /></Dlg>; }
function ConfirmDialog({ d }) { return <Dlg d={d} buttons={[{ label: 'Oui', fn: () => d.cb(true) }, { label: 'Non' }]}><div dangerouslySetInnerHTML={{ __html: d.html }} /></Dlg>; }
function InfoDialog({ d }) { return <Dlg d={d} buttons={[{ label: 'OK' }]}><div dangerouslySetInnerHTML={{ __html: d.html }} /></Dlg>; }
function AddContactDialog({ d }) { const [v, setV] = useState('');
  return <Dlg d={d} buttons={[{ label: 'Suivant >', fn: () => { const a = v.trim().toLowerCase(); if (!a) return false; addContact(a); } }, { label: 'Annuler' }]}>
    <div>Tapez l'adresse de messagerie complète de votre contact :</div><input type="text" id="addEmail" autoFocus style={{ width: '100%', marginTop: 6 }} value={v} onChange={e => setV(e.target.value)} placeholder="exemple@hotmail.fr" />
    <div style={{ color: '#555', marginTop: 8, fontSize: 10 }}>Votre contact recevra une invitation et devra l'accepter pour que vous le voyiez en ligne.</div></Dlg>; }
function InviteDialog({ d }) { const u = d.user;
  return <Dlg d={d} buttons={[{ label: 'Autoriser et ajouter', fn: () => net.send({ type: 'accept', email: u.email }) }, { label: 'Refuser', fn: () => net.send({ type: 'decline', email: u.email }) }]}>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><svg width="32" height="32"><use href="#st-online" /></svg><div><b><Emo text={u.name} /></b> ({u.email}) vous a ajouté(e) à sa liste de contacts.<br /><br />Souhaitez-vous :</div></div></Dlg>; }
function CallInviteDialog({ d }) {
  return <Dlg d={d} buttons={[{ label: 'Accepter', fn: d.accept }, { label: 'Refuser', fn: d.decline }]}>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><svg width="32" height="32"><use href={'#ico-' + d.ico} /></svg><div><b><Emo text={d.name} /></b> vous invite à {d.what}.<br /><br />Voulez-vous accepter ?</div></div></Dlg>; }
function GameInviteDialog({ d }) { return <Dlg d={d} buttons={[{ label: 'Accepter', fn: d.accept }, { label: 'Refuser', fn: d.decline }]}><div dangerouslySetInnerHTML={{ __html: d.html }} /></Dlg>; }
function TodayDialog({ d }) { const [off, setOff] = useState(false);
  return <Dlg d={d} width={420} buttons={[{ label: 'Fermer', fn: () => { if (off) try { localStorage.setItem('msn_today_off', '1'); } catch (e) {} } }]}>
    <div style={{ display: 'flex', gap: 10 }}><svg width="56" height="56"><use href="#logo" /></svg><div><b style={{ fontSize: 13, color: '#1E3F7A' }}>Bienvenue sur Wizz !</b><br /><br />
      <b>Astuces de l'époque</b><br />• Tapez <b>(L)</b> pour un cœur, <b>(K)</b> pour un bisou, <b>(6)</b> pour le diable.<br />• Maintenez <b>F2</b> pour envoyer un message vocal.<br />• Le bouton ⚡ envoie un <b>Wizz</b> (une fois toutes les 10 s, sinon c'est du spam).<br />• Clic droit sur un contact pour lui donner un surnom.<br /><br />
      <label><input type="checkbox" id="todayOff" checked={off} onChange={e => setOff(e.target.checked)} />Ne plus afficher MSN Today à la connexion</label></div></div></Dlg>; }
function GroupInviteDialog({ d }) {
  const contacts = useStore(s => s.contacts); const [sel, setSel] = useState([]);
  const cands = contacts.filter(c => !isOff(c) && !d.base.includes(c.email));
  return <Dlg d={d} buttons={[{ label: 'OK', fn: () => { if (!sel.length) return false; inviteToGroup(d.fromKey, sel); } }, { label: 'Annuler' }]}>
    <div>Sélectionnez les contacts à inviter :</div>
    <div style={{ maxHeight: 160, overflow: 'auto', border: '1px solid #A9C4E4', background: '#fff', padding: 4, marginTop: 6 }}>
      {cands.length ? cands.map(c => <label key={c.email} style={{ display: 'block', padding: 2 }}><input type="checkbox" value={c.email} checked={sel.includes(c.email)} onChange={e => setSel(e.target.checked ? [...sel, c.email] : sel.filter(x => x !== c.email))} /><svg width="14" height="14" style={{ verticalAlign: -2 }}><use href={'#' + stIco(c.status)} /></svg> <Emo text={c.name} /></label>) : <i style={{ color: '#777' }}>Aucun autre contact en ligne.</i>}
    </div></Dlg>; }
const fontStyle = f => ({ fontFamily: `'${f.family}'`, fontSize: f.size, color: f.color, fontWeight: f.bold ? 'bold' : 'normal', fontStyle: f.italic ? 'italic' : 'normal' });
function FontDialog({ d }) {
  const cur = useStore(s => s.me.font); const [f, setF] = useState(cur); const fam = ['Microsoft Sans Serif', 'Tahoma', 'Verdana', 'Arial', 'Comic Sans MS', 'Times New Roman', 'Courier New', 'Trebuchet MS', 'Georgia', 'Impact'];
  return <Dlg d={d} buttons={[{ label: 'OK', fn: () => setFont(f) }, { label: 'Annuler' }]}>
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 10px', alignItems: 'center' }}>
      <span>Police :</span><select id="fFam" value={f.family} onChange={e => setF({ ...f, family: e.target.value })}>{fam.map(x => <option key={x}>{x}</option>)}</select>
      <span>Taille :</span><select id="fSize" value={f.size} onChange={e => setF({ ...f, size: +e.target.value })}>{[8, 9, 10, 11, 12, 14, 16, 18, 20, 24].map(x => <option key={x} value={x}>{x}</option>)}</select>
      <span>Couleur :</span><input type="color" id="fCol" value={f.color} onChange={e => setF({ ...f, color: e.target.value })} />
      <span>Style :</span><span><label><input type="checkbox" id="fB" checked={f.bold} onChange={e => setF({ ...f, bold: e.target.checked })} />Gras</label> &nbsp; <label><input type="checkbox" id="fI" checked={f.italic} onChange={e => setF({ ...f, italic: e.target.checked })} />Italique</label></span></div>
    <div id="fPrev" style={{ marginTop: 10, border: '1px solid #7F9DB9', background: '#fff', padding: 6, minHeight: 30, ...fontStyle(f) }}>Aperçu : Salut, ça va ? <Emo text="(L)" /></div></Dlg>; }
function InkDialog({ d }) {
  const cv = useRef(null); const [col, setCol] = useState('#000000'); const [wd, setWd] = useState(2); const down = useRef(false);
  const pos = e => { const r = cv.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  return <Dlg d={d} width={330} buttons={[{ label: 'Envoyer', fn: () => { const data = cv.current.toDataURL('image/png'); addInk(d.key, get().me.name, data, true); net.send({ type: 'ink', to: d.key, data }); play('outgoing'); } }, { label: 'Annuler' }]}>
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}><span>Couleur :</span><input type="color" id="inkColor" value={col} onChange={e => setCol(e.target.value)} /><span>Épaisseur :</span><input type="range" id="inkW" min="1" max="8" value={wd} onChange={e => setWd(+e.target.value)} style={{ width: 80 }} /><button className="btn" id="inkClear" style={{ minWidth: 0 }} onClick={() => cv.current.getContext('2d').clearRect(0, 0, 300, 120)}>Effacer</button></div>
    <canvas ref={cv} id="inkCv" width="300" height="120" style={{ background: '#fff', border: '1px solid #7F9DB9', cursor: 'crosshair', touchAction: 'none' }}
      onPointerDown={e => { down.current = true; const x = cv.current.getContext('2d'); x.lineCap = x.lineJoin = 'round'; x.strokeStyle = col; x.lineWidth = wd; x.beginPath(); x.moveTo(...pos(e)); cv.current.setPointerCapture(e.pointerId); }}
      onPointerMove={e => { if (!down.current) return; const x = cv.current.getContext('2d'); x.lineTo(...pos(e)); x.stroke(); }} onPointerUp={() => down.current = false} onPointerCancel={() => down.current = false} /></Dlg>; }
function CustomDialog({ d }) {
  const custom = useStore(s => s.custom); const [key, setKey] = useState(''); const [name, setName] = useState(''); const file = useRef(null);
  const save = c => { set({ custom: c }); lsSet('msn_custom', c); };
  return <Dlg d={d} buttons={[{ label: 'Ajouter', fn: () => { const f = file.current.files[0], k = key.trim(); if (!f || k.length < 2) { toast('Wizz', 'Choisissez une image et un raccourci d\'au moins 2 caractères.'); return false; }
      const img = new Image(); const url = URL.createObjectURL(f); img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 19; c.getContext('2d').drawImage(img, 0, 0, 19, 19); save({ ...get().custom, [k]: { name: name.trim() || k, data: c.toDataURL('image/png') } }); URL.revokeObjectURL(url); toast('Wizz', `Émoticône ${k} ajoutée.`); }; img.src = url; } }, { label: 'Fermer' }]}>
    <div style={{ maxHeight: 140, overflow: 'auto', border: '1px solid #A9C4E4', background: '#fff', padding: 4, marginBottom: 8 }}>
      {Object.keys(custom).length ? Object.entries(custom).map(([k, v]) => <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}><img src={v.data} style={{ width: 19, height: 19 }} alt="" /> <b>{k}</b> <span style={{ color: '#555' }}>{v.name}</span> <span className="link" style={{ marginLeft: 'auto' }} onClick={() => { const c = { ...custom }; delete c[k]; save(c); }}>Supprimer</span></div>) : <i style={{ color: '#777' }}>Aucune émoticône personnalisée.</i>}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '5px 8px', alignItems: 'center' }}><span>Image :</span><input type="file" ref={file} accept="image/*" /><span>Raccourci :</span><input type="text" value={key} onChange={e => setKey(e.target.value)} placeholder="ex: (moi) ou *lol*" maxLength={12} /><span>Nom :</span><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nom de l'émoticône" /></div>
    <div style={{ color: '#555', fontSize: 10, marginTop: 6 }}>L'image est réduite à 19×19 comme à l'époque. Le raccourci est converti dans vos messages et transmis à vos contacts.</div></Dlg>; }

const KINDS = { ask: AskDialog, confirm: ConfirmDialog, info: InfoDialog, addContact: AddContactDialog, invite: InviteDialog, callInvite: CallInviteDialog, gameInvite: GameInviteDialog, today: TodayDialog, groupInvite: GroupInviteDialog, font: FontDialog, ink: InkDialog, custom: CustomDialog };
export default function Dialogs() { const dialogs = useStore(s => s.dialogs); return <>{dialogs.map(d => { const C = KINDS[d.kind]; return C ? <C key={d.id} d={d} /> : null; })}</>; }
