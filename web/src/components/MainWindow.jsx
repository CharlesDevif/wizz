import React, { useState } from 'react';
import Window from './Window.jsx';
import Emo, { Dp } from './Emo.jsx';
import { useStore, set } from '../lib/store.js';
import { STATUSES, stById, stIco, stLabel, isOff } from '../lib/data.js';
import { minimize, signOut, setStatus, setMe, pickDp, showMenu, ask, confirmDlg, openConv, nudge, addContact, removeContact, blockContact, setNick, setGroup, toggleViewByGroup, toggleGroupOpen, dialog, toast, showToday, displayName } from '../lib/actions.js';
import { sendFile } from '../lib/features.js';
import { esc } from '../lib/emoticons.js';

function Header() {
  const me = useStore(s => s.me); const [edit, setEdit] = useState(null);
  const st = stById(me.status); const idle = useStore(s => s.idleBefore);
  const statusMenu = e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect();
    showMenu([...STATUSES.map(s => ({ label: s.label, ico: s.ico, bold: s.id === me.status, fn: () => setStatus(s.id) })), { sep: true },
      { label: 'Modifier le pseudo…', fn: () => ask('Modifier mon pseudo', 'Nouveau pseudo (les émoticônes marchent, ex: (L) ou (*)) :', me.name, n => { if (n && n.trim()) setMe({ name: n.trim().slice(0, 129) }); }) },
      { label: 'Modifier mon image perso…', fn: pickDp }, { sep: true }, { label: 'Se déconnecter', fn: signOut }], r.left, r.bottom); };
  return (
    <div className="hdr">
      <div id="myDp" onClick={pickDp} title="Cliquer pour changer l'image perso"><Dp dp={me.dp} /></div>
      <div className="me">
        <div className="name" id="myName" onClick={statusMenu}><Emo text={me.name} /> <span id="myStatusTxt">({idle ? 'Inactif' : st.label})</span> <span className="caret">▼</span></div>
        {edit === null ? <div className="psm" id="myPsm" title="Tapez un message personnel" onClick={() => setEdit(me.psm)}>{me.psm ? <Emo text={me.psm} /> : '<Tapez un message personnel>'}</div>
          : <div className="psm"><input type="text" autoFocus maxLength={129} value={edit} onChange={e => setEdit(e.target.value)} onBlur={() => { setMe({ psm: edit.trim() }); setEdit(null); }} onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEdit(null); }} /></div>}
        <div className="music" id="myMusic">♫ Aucun morceau en cours de lecture</div>
      </div>
    </div>
  );
}

function ContactRow({ c, sel, onSel }) {
  const nicks = useStore(s => s.nicks); const name = nicks[c.email] || c.name;
  const ctx = e => { e.preventDefault(); showMenu([
    { label: 'Envoyer un message instantané', fn: () => openConv(c.email) },
    { label: 'Envoyer un fichier…', fn: () => { openConv(c.email); sendFile(c.email); } },
    { label: 'Envoyer un Wizz', fn: () => { openConv(c.email); nudge(c.email, true); } }, { sep: true },
    { label: 'Renommer (surnom)…', fn: () => ask('Renommer le contact', `Surnom pour ${c.name} (vide = pseudo d'origine) :`, nicks[c.email] || '', n => setNick(c.email, n)) },
    { label: 'Déplacer vers le groupe…', fn: () => ask('Déplacer vers un groupe', 'Groupe (' + useStoreSnapshotGroups() + ') ou nouveau nom :', '', g => setGroup(c.email, g)) }, { sep: true },
    c.status === 'blocked' ? { label: 'Débloquer', fn: () => blockContact(c.email, false) } : { label: 'Bloquer', fn: () => blockContact(c.email, true) },
    { label: 'Supprimer le contact', fn: () => confirmDlg('Supprimer le contact', `Supprimer <b>${esc(c.name)}</b> de votre liste de contacts ?`, () => removeContact(c.email)) },
  ], e.clientX, e.clientY); };
  return (
    <div className={'ct' + (isOff(c) ? ' off' : '') + (sel ? ' sel' : '')} title={`${c.name}\n${c.email}\n${stLabel(c.status)}${c.psm ? '\n' + c.psm : ''}`} onDoubleClick={() => openConv(c.email)} onClick={onSel} onContextMenu={ctx}>
      <svg className="sico"><use href={'#' + stIco(c.status)} /></svg>
      <span className="ct-name"><Emo text={name} />{c.status !== 'online' && <span style={{ color: '#777' }}> ({stLabel(c.status)})</span>}</span>
      {c.psm && <span className="ct-psm">- <Emo text={c.psm} /></span>}
    </div>
  );
}
function useStoreSnapshotGroups() { return (window.__wizzGroups || []).join(', '); }

function ContactList() {
  const { contacts, filter, viewByGroup, cgroups, groupNames, groupsOpen, nicks } = useStore(s => ({ contacts: s.contacts, filter: s.filter, viewByGroup: s.viewByGroup, cgroups: s.cgroups, groupNames: s.groupNames, groupsOpen: s.groupsOpen, nicks: s.nicks }));
  window.__wizzGroups = groupNames; const [sel, setSel] = useState(null);
  const q = filter.toLowerCase(); const dn = c => nicks[c.email] || c.name;
  const list = contacts.filter(c => !q || dn(c).toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (c.psm || '').toLowerCase().includes(q) || c.email.includes(q));
  const sortSt = (a, b) => (isOff(a) - isOff(b)) || dn(a).localeCompare(dn(b));
  const groups = viewByGroup ? [...groupNames, 'Autres contacts'].map(n => [n, list.filter(c => (cgroups[c.email] || 'Autres contacts') === n).sort(sortSt)]).filter(([n, arr]) => arr.length || n !== 'Autres contacts')
    : [['En ligne', list.filter(c => !isOff(c))], ['Hors ligne', list.filter(isOff)]];
  return (
    <>
      <div id="sortbar"><span className="link" id="sortToggle" onClick={toggleViewByGroup}>{viewByGroup ? 'Trier par statut' : 'Trier par groupe'}</span></div>
      <div id="contacts">
        {groups.map(([label, arr]) => (
          <React.Fragment key={label}>
            <div className={'grp' + (groupsOpen[label] === false ? ' closed' : '')} onClick={() => toggleGroupOpen(label)}><span className="tri"></span>{label} ({arr.filter(c => !isOff(c)).length}/{arr.length})</div>
            <div className="grpbody">{arr.map(c => <ContactRow key={c.email} c={c} sel={sel === c.email} onSel={() => setSel(c.email)} />)}</div>
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

export default function MainWindow() {
  const filter = useStore(s => s.filter);
  const addPrompt = () => dialog({ title: 'Ajouter un contact', kind: 'addContact' });
  return (
    <Window id="main" domId="mainWin" title="Wizz" menus={['Fichier', 'Contacts', 'Actions', 'Outils', 'Aide']} onMinimize={() => minimize('main')} onClose={signOut} style={{ display: 'flex' }}>
      <div className="body msnbg">
        <Header />
        <div className="toolrow"><svg className="ico"><use href="#ico-mail" /></svg><span className="mail" onClick={() => toast('E-mail', 'Vous avez 3 nouveaux messages électroniques', null, 'newemail')}>E-mail (3)</span><span style={{ color: '#777' }}>|</span><svg className="ico" width="14" height="14"><use href="#logo" /></svg><span className="link" style={{ fontSize: 10 }} onClick={showToday}>MSN Today</span></div>
        <div className="mainsplit">
          <div className="tabs">
            {[['st-online', 'Contacts', true], ['ico-mail', 'E-mail'], ['ico-dp', 'Mon espace perso'], ['ico-file', 'Dossiers partagés'], ['ico-bg', 'Rechercher'], ['ico-video', 'Vidéo'], ['ico-games', 'Jeux'], ['ico-smile', 'Émoticônes']].map(([ico, t, on]) =>
              <div key={ico} className={'tab' + (on ? ' on' : '')} title={t} onClick={() => !on && toast('Wizz', t + ' : prochaine version.')}><svg><use href={'#' + ico} /></svg></div>)}
          </div>
          <div className="listcol">
            <ContactList />
            <div className="addrow"><span className="link" onClick={addPrompt}><b style={{ color: '#2A7E2A' }}>+</b> Ajouter un contact</span></div>
            <div className="search"><input type="text" id="filter" value={filter} onChange={e => set({ filter: e.target.value })} placeholder="Rechercher sur le Web ou dans les contacts…" /><button className="btn" style={{ minWidth: 0, padding: '2px 8px' }} onClick={() => { const q = filter.trim(); if (q) window.open('https://www.bing.com/search?q=' + encodeURIComponent(q)); }}>Rechercher</button></div>
            <div className="ad"><span className="adbadge">publicité</span><svg width="44" height="44"><use href="#logo" /></svg><div><b>Sonneries Hi-Fi !</b><br />Téléchargez des sonneries polyphoniques pour votre mobile.</div></div>
          </div>
        </div>
      </div>
    </Window>
  );
}
