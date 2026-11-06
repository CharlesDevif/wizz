import React, { useState } from 'react';
import Window from './Window.jsx';
import { Dp } from './Emo.jsx';
import { useStore, set, lsSet } from '../lib/store.js';
import { STATUSES } from '../lib/data.js';
import { doLogin, cancelLogin, setRegisterMode, toast } from '../lib/actions.js';

export default function LoginWindow() {
  const { registerMode, loginErr, loginOk, connecting, serverUrl } = useStore(s => ({ registerMode: s.registerMode, loginErr: s.loginErr, loginOk: s.loginOk, connecting: s.connecting, serverUrl: s.serverUrl }));
  const [email, setEmail] = useState(''); const [pwd, setPwd] = useState(''); const [name, setName] = useState(''); const [st, setSt] = useState(0); const [srv, setSrv] = useState(serverUrl);
  const showServer = location.protocol !== 'http:' && location.protocol !== 'https:';
  return (
    <Window id="login" domId="loginWin" title="Wizz" menus={['Fichier', 'Outils', 'Aide']} onMinimize={() => {}} onClose={() => toast('Wizz', 'Et non, on reste en 2005 ;)')}>
      <div className="body">
        {!connecting ? (
          <div id="loginForm">
            <div className="login-strip"><svg width="18" height="18"><use href="#logo" /></svg><b>Wizz</b><span>Messenger</span></div>
            <div className="login-dp"><Dp dp={null} /></div>
            <form className="form" onSubmit={e => { e.preventDefault(); doLogin(email.trim().toLowerCase(), pwd, st, name.trim()); }}>
              <label htmlFor="email">Adresse de messagerie :</label>
              <input type="text" id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="exemple@hotmail.fr" spellCheck={false} />
              <label htmlFor="pwd">Mot de passe :</label>
              <input type="password" id="pwd" value={pwd} onChange={e => setPwd(e.target.value)} />
              {registerMode && <div id="regFields"><label htmlFor="regName">Pseudo :</label><input type="text" id="regName" value={name} onChange={e => setName(e.target.value)} placeholder="Ton pseudo de l'époque (L)" /></div>}
              {showServer && <div id="serverRow"><label htmlFor="serverUrl">Serveur :</label><input type="text" id="serverUrl" value={srv} onChange={e => setSrv(e.target.value)} onBlur={() => { lsSet('msn_server', srv.trim()); set({ serverUrl: srv.trim() }); }} placeholder="ex: wss://wizz.monsite.fr (vide = mode démo)" /></div>}
              <div id="loginErr" style={{ color: loginOk ? '#2A7E2A' : '#C00', minHeight: 14, fontSize: 10 }}>{loginErr}</div>
              <div className="row"><span>Statut :</span><select id="loginStatus" className="plain" value={st} onChange={e => setSt(+e.target.value)}>{STATUSES.map((s, i) => <option key={s.id} value={i}>{s.label}</option>)}</select></div>
              <label><input type="checkbox" defaultChecked />Mémoriser mon adresse <span className="link" style={{ marginLeft: 4 }}>(Oublier)</span></label>
              <label><input type="checkbox" defaultChecked />Mémoriser mon mot de passe</label>
              <label><input type="checkbox" />Ouvrir une session automatiquement</label>
              <div style={{ textAlign: 'center', marginTop: 10 }}><button type="submit" className="btn big" id="btnLogin">{registerMode ? 'Créer le compte' : 'Se connecter'}</button></div>
              <div className="login-links"><span className="link">Mot de passe oublié ?</span><span className="link">État du service</span><span className="link right" id="regLink" onClick={() => setRegisterMode(!registerMode)}>{registerMode ? 'J\'ai déjà un compte' : 'Obtenir un nouveau compte'}</span></div>
            </form>
          </div>
        ) : (
          <div id="connecting" style={{ display: 'block' }}>
            <svg className="spin" viewBox="0 0 64 64"><use href="#logo" /></svg>
            <div id="connText">{connecting}</div>
            <div id="loginErr" style={{ minHeight: 14, fontSize: 10, color: '#C00' }}></div>
            <div style={{ marginTop: 14 }}><button className="btn" onClick={cancelLogin}>Annuler</button></div>
          </div>
        )}
        <div className="login-foot"><svg width="12" height="12"><use href="#logo" /></svg> Réseau Wizz</div>
      </div>
    </Window>
  );
}
