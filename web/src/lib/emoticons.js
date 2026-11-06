import { EMO_SVG } from './emoSvg.js';
import { get } from './store.js';

/* 76 émoticônes officielles, raccourcis exacts du client (voir docs/RESOURCES.md §5) */
export const EMOTICONS = [
 ["Sourire",[":)",":-)"],"🙂","smile"],["Grand sourire",[":D",":-D",":d"],"😀","open-mouthed-smile"],["Clin d'œil",[";)",";-)"],"😉","winking-smile"],
 ["Surpris",[":-O",":o",":O"],"😲","surprised-smile"],["Tire la langue",[":P",":-P",":p"],"😛","smile-with-tongue-out"],["Cool",["(H)","(h)"],"😎","hot-smile"],
 ["En colère",[":@",":-@"],"😡","angry-smile"],["Gêné",[":$",":-$"],"😳","embarrassed-smile"],["Confus",[":S",":-S",":s"],"😕","confused-smile"],
 ["Triste",[":(",":-("],"☹️","sad-smile"],["Pleure",[":'("],"😢","crying-face"],["Déçu",[":|",":-|"],"😐","disappointed-smile"],
 ["Diable",["(6)"],"😈","devil"],["Ange",["(A)","(a)"],"😇","angel"],["Cœur rouge",["(L)","(l)"],"❤️","red-heart"],["Cœur brisé",["(U)","(u)"],"💔","broken-heart"],
 ["Messenger",["(M)","(m)"],"👥","messenger"],["Chat",["(@)"],"😺","cat-face"],["Chien",["(&)"],"🐶","dog-face"],["Lune endormie",["(S)","(s)"],"🌜","sleeping-half-moon"],
 ["Étoile",["(*)"],"⭐","star"],["Pellicule",["(~)"],"🎞️","filmstrip"],["Note",["(8)"],"🎵","note"],["E-mail",["(E)","(e)"],"✉️","e-mail"],
 ["Rose rouge",["(F)","(f)"],"🌹","red-rose"],["Rose fanée",["(W)","(w)"],"🥀","wilted-rose"],["Horloge",["(O)","(o)"],"🕑","clock"],["Lèvres rouges",["(K)","(k)"],"👄","red-lips"],
 ["Cadeau",["(G)","(g)"],"🎁","gift-with-a-bow"],["Gâteau d'anniversaire",["(^)"],"🎂","birthday-cake"],["Appareil photo",["(P)","(p)"],"📷","camera"],["Ampoule",["(I)","(i)"],"💡","light-bulb"],
 ["Tasse de café",["(C)","(c)"],"☕","coffee-cup"],["Téléphone",["(T)","(t)"],"📞","telephone-receiver"],["Câlin gauche",["({)"],"🫂","left-hug"],["Câlin droit",["(})"],"🫂","right-hug"],
 ["Bière",["(B)","(b)"],"🍺","beer-mug"],["Cocktail",["(D)","(d)"],"🍸","martini-glass"],["Garçon",["(Z)","(z)"],"👦","boy"],["Fille",["(X)","(x)"],"👧","girl"],
 ["Pouce levé",["(Y)","(y)"],"👍","thumbs-up"],["Pouce baissé",["(N)","(n)"],"👎","thumbs-down"],["Chauve-souris",[":[",":-["],"🦇","vampire-bat"],["Chèvre",["(nnh)","(nah)"],"🐐","goat"],
 ["Soleil",["(#)"],"☀️","sun"],["Arc-en-ciel",["(R)","(r)"],"🌈","rainbow"],["Motus",[":-#"],"🤐","dont-tell-anyone-smile"],["Grimace",["8o|"],"😬","baring-teeth-smile"],
 ["Intello",["8-|"],"🤓","nerd-smile"],["Sarcastique",["^o)"],"🤨","sarcastic-smile"],["Secret",[":-*"],"🤫","secret-telling-smile"],["Malade",["+o("],"🤢","sick-smile"],
 ["Escargot",["(sn)"],"🐌","snail"],["Tortue",["(tu)"],"🐢","turtle"],["Assiette",["(pl)"],"🍽️","plate"],["Bol",["(||)"],"🥣","bowl"],
 ["Pizza",["(pi)"],"🍕","pizza"],["Ballon de foot",["(so)"],"⚽","soccer-ball"],["Voiture",["(au)"],"🚗","auto"],["Avion",["(ap)"],"✈️","airplane"],
 ["Parapluie",["(um)"],"☂️","umbrella"],["Île",["(ip)"],"🏝️","island-with-a-palm-tree"],["Ordinateur",["(co)"],"🖥️","computer"],["Téléphone portable",["(mp)"],"📱","mobile-phone"],
 ["Je reviens",["(brb)"],"🔙","be-right-back"],["Orage",["(st)"],"🌧️","storm-cloud"],["High five",["(h5)"],"🙏","high-five"],["Argent",["(mo)"],"💰","money"],
 ["Mouton noir",["(bah)"],"🐑","black-sheep"],["Je ne sais pas",[":^)"],"🤷","i-dont-know-smile"],["Réfléchit",["*-)"],"🤔","thinking-smile"],["Éclair",["(li)"],"⚡","lightning"],
 ["Fête",["<:o)","<o)"],"🥳","party-smile"],["Roule des yeux",["8-)"],"🙄","eye-rolling-smile"],["Endormi",["|-)"],"😪","sleepy-smile"],["Lapin",["('.')"],"🐰","bunny"]
];
export const EMO_MAP = new Map(); EMOTICONS.forEach(e => e[1].forEach(s => EMO_MAP.set(s, e)));
const EMO_KEYS = [...EMO_MAP.keys()].sort((a, b) => b.length - a.length);
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function emoHtml(e, k) { const svg = EMO_SVG[e[3]]; return `<span class="emo" title="${esc(e[0])}  ${esc(k || e[1][0])}">${svg || e[2]}</span>`; }
function renderStd(text) {
  let out = '', i = 0; text = String(text);
  outer: while (i < text.length) {
    for (const k of EMO_KEYS) { if (text.startsWith(k, i)) { out += emoHtml(EMO_MAP.get(k), k); i += k.length; continue outer; } }
    out += esc(text[i]); i++;
  }
  return out;
}
/* Rendu HTML avec émoticônes standard + personnalisées (les miennes, et celles jointes au message) */
export function renderEmoticons(text, custom) {
  text = String(text); const map = Object.assign({}, get().custom, custom || {});
  const keys = Object.keys(map).sort((a, b) => b.length - a.length); if (!keys.length) return renderStd(text);
  let out = '', i = 0;
  while (i < text.length) {
    const k = keys.find(k => text.startsWith(k, i));
    if (k) { out += `<span class="emo" title="${esc(map[k].name)}  ${esc(k)}"><img src="${map[k].data}" alt="" style="width:19px;height:19px;vertical-align:top"></span>`; i += k.length; continue; }
    let j = i; while (j < text.length && !keys.some(k => text.startsWith(k, j))) j++; out += renderStd(text.slice(i, j)); i = j;
  }
  return out;
}
export function usedCustom(text) { const C = get().custom; const u = {}; for (const k in C) if (text.includes(k)) u[k] = C[k]; return Object.keys(u).length ? u : null; }
