export const STATUSES = [
  { id: 'online', label: 'En ligne', ico: 'st-online' }, { id: 'busy', label: 'Occupé(e)', ico: 'st-busy' }, { id: 'brb', label: 'De retour dans une minute', ico: 'st-away' },
  { id: 'away', label: 'Absent(e)', ico: 'st-away' }, { id: 'phone', label: 'Au téléphone', ico: 'st-busy' }, { id: 'lunch', label: 'Parti(e) manger', ico: 'st-away' }, { id: 'hidden', label: 'Hors ligne', ico: 'st-offline' },
];
export const stById = id => STATUSES.find(s => s.id === id) || STATUSES[0];
export const stIco = s => ({ online: 'st-online', busy: 'st-busy', phone: 'st-busy', away: 'st-away', brb: 'st-away', lunch: 'st-away', offline: 'st-offline', blocked: 'st-blocked', hidden: 'st-offline' })[s] || 'st-offline';
export const stLabel = s => ({ online: 'En ligne', busy: 'Occupé(e)', phone: 'Au téléphone', away: 'Absent(e)', brb: 'De retour dans une minute', lunch: 'Parti(e) manger', offline: 'Hors ligne', blocked: 'Bloqué(e)', hidden: 'Hors ligne' })[s] || '';
export const isOff = c => c.status === 'offline' || c.status === 'blocked';
export const DEMO_CONTACTS = [
  { email: 'julie@hotmail.fr', name: 'Julie ♥ (K) je t\'aime mon chéri (L)', psm: '♫ Tragédie – Hey Oh', status: 'online', bot: 'julie' },
  { email: 'nico@hotmail.fr', name: '[K-Maro] -=Nico=- en mode révisions :S', psm: 'bac dans 3 jours au secours', status: 'busy', bot: 'nico' },
  { email: 'maman@wanadoo.fr', name: 'Maman', psm: '', status: 'online', bot: 'maman' },
  { email: 'melissa@hotmail.fr', name: '•°o.O MeLiSsA O.o°• ~ (*) ~', psm: 'qui veut aller au ciné samedi ?', status: 'away', bot: 'melissa' },
  { email: 'thomas@hotmail.fr', name: 'Thomas (6)', psm: '', status: 'offline', bot: 'thomas' },
  { email: 'kevin@hotmail.fr', name: 'Kévin du lycée', psm: '', status: 'offline' },
  { email: 'michel@free.fr', name: 'Tonton Michel', psm: '', status: 'offline' },
  { email: 'sasuke@hotmail.fr', name: 'xX_DaRk_SaSuKe_Xx', psm: 'rejoignez ma guilde sur dofus', status: 'offline', bot: 'sasuke' },
];
export const BOTS = {
  julie: { lines: ['tu fais quoi ce soir ?', 'jtm (K)', 'mdr', 't trop chou (L)(L)(L)', 'attends ma mère m\'appelle brb', 'jsuis revenue (brb)', 'on se voit demain ? :$'] },
  nico: { lines: ['jpeux pas parler je révise :S', 't\'as la correction du dm de maths ?', 'OMG (6)', 'lol', 'bon jvais me coucher |-)', '(y)'] },
  maman: { lines: ['Coucou mon chéri c\'est maman. Tu rentres à quelle heure ?', 'N\'oublie pas de sortir les poubelles', 'Comment on met une émoticône ?', 'Bisous (L)', 'Qui est Julie ?'] },
  melissa: { lines: ['salut !! (*)', 'ciné samedi ???', 'ptdr', 't\'as vu la nouvelle de star ac', '(H)', 'je dois y aller ++'] },
  thomas: { lines: ['yo', 't\'as fini le level 12 ?', '(6)(6)(6)', 'ptdr nul', 'msn bug chez toi aussi ?', 'a+'] },
  sasuke: { lines: ['yo frère', 'viens sur dofus', 'jai eu un dofus pourpre (Y)', 't\'as msn plus ?', 'xD'] },
};
export const BGS = [
  { n: 'Aucun', css: '' }, { n: 'Ciel', css: 'linear-gradient(180deg,#CFE6FF,#fff)' },
  { n: 'Bulles', css: 'radial-gradient(circle at 20% 30%,#D6EBFF 0 8%,transparent 9%),radial-gradient(circle at 70% 60%,#E0F0FF 0 12%,transparent 13%),radial-gradient(circle at 40% 85%,#D6EBFF 0 6%,transparent 7%),#fff' },
  { n: 'Cœurs', css: 'radial-gradient(circle at 15% 20%,#FFD6E0 0 5%,transparent 6%),radial-gradient(circle at 80% 70%,#FFD6E0 0 7%,transparent 8%),#FFF5F8' },
  { n: 'Nuit', css: 'linear-gradient(180deg,#0A1E5A,#3A6EA5)', color: '#fff' }, { n: 'Zèbre', css: 'repeating-linear-gradient(135deg,#fff 0 10px,#F0F0F0 10px 20px)' },
  { n: '— Dynamiques —', sep: true }, { n: 'Bulles animées', cls: 'dyn-bubbles' }, { n: 'Neige', cls: 'dyn-snow' }, { n: 'Cœurs flottants', cls: 'dyn-hearts' },
];
export const WINKS = {
  kiss: { name: 'Bisou', emo: '(K)' }, hearts: { name: 'Pluie de cœurs', emo: '(L)' }, sheep: { name: 'Mouton fou', emo: '(bah)' }, boom: { name: 'Explosion', emo: '(li)' }, party: { name: 'Fiesta', emo: '<:o)' },
};
export const now = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
export const fmtSize = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' Mo' : n > 1024 ? Math.round(n / 1024) + ' Ko' : n + ' o';
