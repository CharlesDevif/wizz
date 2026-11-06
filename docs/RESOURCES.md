# MSN Messenger : dossier de ressources pour la recréation

Objectif : recréer MSN Messenger (cible principale : **MSN Messenger 7.5**, août 2005, l'apogée nostalgique, avec quelques éléments de Windows Live Messenger 8.x) en application web, à l'identique en ressenti. Ce document rassemble tout ce qui a été retrouvé, avec les sources, pour ne rien laisser au hasard.

Légende : ✅ vérifié à la source · ⚠️ source secondaire / à recouper · 🧠 de mémoire, à vérifier par capture d'écran

---

## 1. Ce qui existe déjà (état des lieux)

| Projet | Nature | Statut |
|---|---|---|
| **Escargot** (escargot.chat) | Serveur de remplacement : fait fonctionner les *vrais* anciens clients MSN/WLM patchés. Code public (GitLab, Python). | Actif. Pas une recréation web. |
| **OMessenger** | Autre serveur de remplacement du même type. | ⚠️ |
| **aMSN** | Clone desktop open source (Tcl/Tk), imitait le look WLM. | Abandonné. |
| **emesene** | Clone desktop Python. | Abandonné. |
| **FleaIM** | Clone web MSN-like (LGPL), 2008. | Mort. |
| **j0nat/windows-live-messenger** | Recréation desktop WPF (C#), avec wizz. | Dernier commit oct. 2023. |
| **xp20011002-cmd/MSN-Messenger-7.5---Android-Edition-** | Recréation Android de la 7.5, connexion Escargot expérimentale. | Actif ? |
| **Messenger Classic** (app.messengerclassic.com) | Site avec page de référence émoticônes, convertit les codes dans son chat. | ⚠️ à inspecter |
| **bernzrdo/msn-emoticons** (GitHub) | Les 76 émoticônes originales extraites du client (PNG/APNG/GIF). Pas de licence : ce sont les images de Microsoft. | Référence visuelle. |

**Conclusion** : il n'existe **aucune recréation web fidèle, dans le navigateur, sans installation, qui marche** et qui soit connue. La place est libre.

---

## 2. Historique des versions (Wikipédia, vérifié ✅)

| Version | Date | Nouveautés clés |
|---|---|---|
| 1.0 | 22 juil. 1999 | Messagerie texte, liste de contacts. |
| 2.0 | 16 nov. 1999 | Bannière pub tournante, apparence personnalisable. |
| 3.0 | 29 mai 2000 | Transfert de fichiers, audio PC-PC. |
| 4.6 | 23 oct. 2001 | Refonte UI, **groupes de contacts**, renommé « MSN Messenger ». |
| 5.0 | 24 oct. 2002 | Installable à côté de Windows Messenger sur XP. |
| 6.0 | 17 juil. 2003 | **Grande refonte** : émoticônes personnalisées, image perso (display picture), arrière-plans. |
| 6.1 | — | Cadre de fenêtre masquable, couleur de thème par utilisateur. |
| 6.2 | 22 avr. 2004 | Groupe « Mobile », « Fun & Games ». |
| **7.0** | 7 avr. 2005 | **Winks**, images perso animées, **Wizz (nudge)**, encre numérique / écriture manuscrite, intégration Xbox Live, **message perso**. |
| **7.5** | 23 août 2005 | **Dynamic Backgrounds**, protocole `msnim:`, **Voice Clips** (maintenir F2, 15 s max), bouton vidéo. |
| WLM 8.0 | 19 juin 2006 | Renommé Windows Live Messenger. Messages hors ligne, thèmes/couleurs, surnoms de contacts, horodatage, **dossiers partagés**. |
| WLM 8.1 | 29 janv. 2007 | Identité itinérante, interop Yahoo!. |
| WLM 8.5 | 6 nov. 2007 | Émoticône lapin ('.'), peu de changements. |
| WLM 2009 (14.0) | 7 janv. 2009 | Scènes, Groupes, partage photos, favoris. |
| WLM 2011 (15.0) | 30 sept. 2010 | Conversations à onglets, Facebook chat, abandon XP. |
| Fin | 8 → 30 avr. 2013 | Fusion dans Skype (Chine : 31 oct. 2014). |

---

## 3. Fonctionnalités à recréer (checklist)

### Fenêtre de connexion 🧠
- Logo MSN (bonhomme vert/bleu « papillon ») en haut, champs **Adresse de messagerie** / **Mot de passe**.
- Cases : « Mémoriser mon adresse », « Mémoriser mon mot de passe », « Ouvrir une session automatiquement ».
- Menu déroulant du **statut au démarrage** (« Se connecter en tant que : En ligne ▾ »).
- Bouton **Se connecter**. Liens : « Obtenir un nouveau compte », « Mot de passe oublié ? ».
- Animation de connexion : les deux bonshommes qui tournent autour de la boule.

### Fenêtre principale (liste de contacts) 🧠 + ⚠️ (mess.be)
- En-tête : **image perso** (display picture) à gauche, **pseudo** cliquable avec flèche ▾ (menu statut), **message perso** en dessous en italique gris (« Tapez un message personnel »), lecteur « Ce que j'écoute » (Windows Media : ♫ *Artiste – Titre*).
- Barre : icônes e-mail (Hotmail, « 3 nouveaux messages »), + « Ajouter un contact » (en 7.5, déplacé en haut), recherche.
- Groupes repliables : **En ligne (3)**, **Hors ligne (12)**. Groupes perso (Amis, Famille, Boulot…). Tri par statut ou par groupe.
- Ligne de contact : icône statut + pseudo + message perso (gris, après un tiret) + ♫ si musique.
- Clic droit contact : Envoyer un message instantané, Envoyer un e-mail, Envoyer un fichier, Bloquer, Supprimer, Renommer (surnom, WLM 8).
- Bas de fenêtre : **MSN Today / Nouveautés** et **bannière publicitaire** (≈ 234×60) : élément iconique.
- Menus : Fichier, Contacts, Actions, Outils, Aide.

### Statuts ✅ (doc Microsoft + Messenger Plus!)
Ordre du menu MSN 7.x : **En ligne**, **Occupé(e)**, **De retour dans une minute**, **Absent(e)**, **Au téléphone**, **Parti(e) manger**, **Hors ligne (Apparaître hors ligne)**.
- Icônes : bonhomme **vert** = en ligne ; **rouge** (panneau « sens interdit ») = occupé / au téléphone ; **orange/jaune avec horloge** = absent / de retour / parti manger / inactif ; **gris** = hors ligne. Petite caméra = webcam disponible ; petit téléphone = mobile.
- **Inactif** : automatique après N minutes sans souris/clavier (défaut 5 min), affiché « (Inactif) » après le pseudo.
- Occupé : les alertes de nouveaux messages ne s'affichent pas. Au téléphone : pas de son.
- WLM 8 : « Au téléphone » devient « En communication ».

### Fenêtre de conversation 🧠 + ⚠️
- Titre : « *Pseudo* – Conversation ».
- Barre d'outils (ordre 7.5) : **Inviter**, **Envoyer des fichiers**, **Vidéo** (nouveau en 7.5), **Audio** (Voix), **Activités**, **Jeux**, ↔ **Bloquer**, **Couleurs** / Arrière-plans.
- Zone de messages : fond blanc avec léger dégradé (7.5), **Dynamic Background** animé optionnel. Format d'un message : `Pseudo dit :` sur une ligne, texte en dessous (indenté). Horodatage optionnel (`[14:32]`).
- Droite : deux **images perso** (celle du contact en haut, la nôtre en bas), cadre arrondi bleu brillant. Flèche pour masquer le panneau.
- Barre de mise en forme au-dessus de la saisie : **Police** (A), **Émoticônes** 😊, **Voice Clip** 🎤 (7.5), **Winks**, **Arrière-plans**, **Clins/Images perso**, **Wizz** (nudge), **Encre** (dessin/écriture manuscrite 7.0).
- Zone de saisie multiligne + bouton **Envoyer** (Entrée envoie, Ctrl+Entrée saut de ligne) + bouton **Rechercher** (MSN Search).
- Barre d'état bas : « *Pseudo* est en train d'écrire un message… » / « Dernier message reçu le 05/11/2026 à 14:32 ».
- **Wizz** : fenêtre qui tremble ~1 s + son `nudge.wav` + texte « Vous venez d'envoyer un Wizz ! » / « *Pseudo* vient de vous envoyer un Wizz ! ». Limite anti-spam : un wizz toutes les ~10 s (sinon « Vous ne pouvez pas envoyer un wizz aussi souvent »).
- **Winks** : animation Flash plein-fenêtre avec son (15 par défaut en 7.0, ex. « Pet Pig », « Chicken Dance »… ⚠️ noms à confirmer).
- **Émoticônes perso** : image ≤ 19×19 liée à un raccourci texte. **Clins d'œil**, **Voice clips** (F2), **transfert de fichiers** avec barre « Transfert de *fichier.jpg* (2 Mo)… Accepter / Enregistrer sous / Refuser ».
- Messages d'état système en gris : « *Pseudo* vient de se connecter », « a quitté la conversation », « Votre message n'a pas pu être remis ».
- **Message hors ligne** (WLM 8) : « Ce contact est hors ligne, le message sera remis à sa prochaine connexion ».
- Jeux/Activités : Démineur Flags, Solitaire Showdown, Tic-Tac-Toe, Tableau blanc, Partage d'application. (Non prioritaire.)

### Alertes (toasts) 🧠
- Petite fenêtre qui **glisse depuis le coin bas-droit** au-dessus de la zone de notification : « *Pseudo* vient de se connecter » (son `online.wav`), « *Pseudo* dit : *début du message…* » (son `newalert.wav`), « Vous avez reçu 1 nouveau message électronique » (`newemail.wav`).
- Icône MSN dans la zone de notification (systray), change de couleur selon le statut.

---

## 4. Sons ✅ (archive.org, collection *msnmessengersounds*, extraits des installeurs)

Fichiers exacts de **MSN Messenger 7.5** (datés 28/07/2005, dossier d'installation) :

| Fichier | Durée | Format d'origine | Déclencheur |
|---|---|---|---|
| `newalert.wav` | 0,67 s | 22 050 Hz mono | **Nouveau message** reçu (le « do-dink » légendaire). Deux notes montantes brèves, ~220→440 Hz puis harmonique ~1180 Hz. |
| `online.wav` | 1,40 s | 22 050 Hz mono | **Un contact se connecte**. Note tenue ~300 Hz avec résonance, qui s'éteint. |
| `nudge.wav` | 0,89 s | 48 000 Hz stéréo | **Wizz**. Son grave « bzzrrr » ~200–260 Hz avec vibration + composante ~780 Hz. Le plus fort de tous. |
| `newemail.wav` | 1,65 s | 22 050 Hz mono | **Nouvel e-mail Hotmail**. Trois notes montantes ~300→400→780 Hz. |
| `ring.wav` | 0,88 s | 22 050 Hz mono | **Appel entrant** (sonnerie, boucle). Tonalité ~1180 Hz. |
| `phone.wav` | 14,1 s | 22 050 Hz mono | **Appel sortant / sonnerie téléphone** (longue, boucle). |
| `vimdone.wav` | 0,53 s | 44 100 Hz stéréo | **Voice clip** terminé (fin d'enregistrement). Note ~520 Hz + octave 1040 Hz. |

Présent en 6.5 / 7.0 mais plus en 7.5 : `type.wav` (son de **frappe** quand le contact écrit, désactivé par défaut). WLM 8.0+ ajoute `outgoing.wav` (message envoyé) et repasse tout en `.wma`.

**Statut juridique** : ces fichiers appartiennent à Microsoft. Le projet utilise des **recréations synthétisées** (WebAudio) calquées sur les fréquences/durées ci-dessus. Les originaux ont servi uniquement de référence d'analyse.

Autres archives : archive.org `type_20191103` (son message), myinstants.com (soundboard « MSN Nudge », « MSN Online », etc.).

---

## 5. Émoticônes ✅ (76 officielles + 5 inutilisées, extraites du client via Escargot, repo bernzrdo/msn-emoticons)

Taille d'origine : **19×19 px**. 15 sont animées. Raccourcis **insensibles à la casse** pour les lettres entre parenthèses (`(l)` = `(L)`). Variantes avec nez acceptées par le client : `:-)` `:-D` `;-)` `:-P` `:-(` `:-@` `:-$` `:-S` `:-|`.

| # | Nom (FR) | Nom officiel (EN) | Raccourci | Animé | Emoji proche |
|---|---|---|---|---|---|
| 1 | Sourire | Smile | `:)` `:-)` | | 🙂 |
| 2 | Grand sourire | Open-mouthed smile | `:D` `:-D` `:d` | | 😀 |
| 3 | Clin d'œil | Winking smile | `;)` `;-)` | ✓ | 😉 |
| 4 | Surpris | Surprised smile | `:-O` `:o` | | 😲 |
| 5 | Tire la langue | Smile with tongue out | `:P` `:-P` `:p` | | 😛 |
| 6 | Cool (lunettes) | Hot smile | `(H)` | | 😎 |
| 7 | En colère | Angry smile | `:@` `:-@` | | 😡 |
| 8 | Gêné | Embarrassed smile | `:$` `:-$` | | 😳 |
| 9 | Confus | Confused smile | `:S` `:-S` `:s` | | 😕 |
| 10 | Triste | Sad smile | `:(` `:-(` | | ☹️ |
| 11 | Pleure | Crying face | `:'(` | ✓ | 😢 |
| 12 | Déçu | Disappointed smile | `:\|` `:-\|` | | 😐 |
| 13 | Diable | Devil | `(6)` | | 😈 |
| 14 | Ange | Angel | `(A)` | | 😇 |
| 15 | Cœur rouge | Red heart | `(L)` | | ❤️ |
| 16 | Cœur brisé | Broken heart | `(U)` | | 💔 |
| 17 | Logo Messenger | Messenger | `(M)` | | 👥 |
| 18 | Chat | Cat face | `(@)` | | 😺 |
| 19 | Chien | Dog face | `(&)` | | 🐶 |
| 20 | Lune endormie | Sleeping half-moon | `(S)` | | 🌜 |
| 21 | Étoile | Star | `(*)` | | ⭐ |
| 22 | Pellicule | Filmstrip | `(~)` | | 🎞️ |
| 23 | Note de musique | Note | `(8)` | | 🎵 |
| 24 | E-mail | E-mail | `(E)` | | ✉️ |
| 25 | Rose rouge | Red rose | `(F)` | | 🌹 |
| 26 | Rose fanée | Wilted rose | `(W)` | | 🥀 |
| 27 | Horloge | Clock | `(O)` | | 🕑 |
| 28 | Lèvres rouges | Red lips | `(K)` | | 👄 |
| 29 | Cadeau | Gift with a bow | `(G)` | | 🎁 |
| 30 | Gâteau d'anniversaire | Birthday cake | `(^)` | ✓ | 🎂 |
| 31 | Appareil photo | Camera | `(P)` | | 📷 |
| 32 | Ampoule | Light bulb | `(I)` | | 💡 |
| 33 | Tasse de café | Coffee cup | `(C)` | | ☕ |
| 34 | Téléphone | Telephone receiver | `(T)` | | 📞 |
| 35 | Câlin gauche | Left hug | `({)` | | 🫂 |
| 36 | Câlin droit | Right hug | `(})` | | 🫂 |
| 37 | Bière | Beer mug | `(B)` | | 🍺 |
| 38 | Cocktail | Martini glass | `(D)` | | 🍸 |
| 39 | Garçon | Boy | `(Z)` | | 👦 |
| 40 | Fille | Girl | `(X)` | | 👧 |
| 41 | Pouce levé | Thumbs up | `(Y)` | | 👍 |
| 42 | Pouce baissé | Thumbs down | `(N)` | | 👎 |
| 43 | Chauve-souris | Vampire bat | `:[` `:-[` | ✓ | 🦇 |
| 44 | Chèvre | Goat | `(nnh)` `(nah)` | | 🐐 |
| 45 | Soleil | Sun | `(#)` | | ☀️ |
| 46 | Arc-en-ciel | Rainbow | `(R)` | | 🌈 |
| 47 | Motus | Don't tell anyone smile | `:-#` | | 🤐 |
| 48 | Grimace (dents) | Baring teeth smile | `8o\|` | | 😬 |
| 49 | Intello | Nerd smile | `8-\|` | | 🤓 |
| 50 | Sarcastique | Sarcastic smile | `^o)` | | 🤨 |
| 51 | Chuchote un secret | Secret telling smile | `:-*` | | 🤫 |
| 52 | Malade | Sick smile | `+o(` | | 🤢 |
| 53 | Escargot | Snail | `(sn)` | | 🐌 |
| 54 | Tortue | Turtle | `(tu)` | | 🐢 |
| 55 | Assiette | Plate | `(pl)` | | 🍽️ |
| 56 | Bol | Bowl | `(\|\|)` | | 🥣 |
| 57 | Pizza | Pizza | `(pi)` | | 🍕 |
| 58 | Ballon de foot | Soccer ball | `(so)` | | ⚽ |
| 59 | Voiture | Auto | `(au)` | | 🚗 |
| 60 | Avion | Airplane | `(ap)` | | ✈️ |
| 61 | Parapluie | Umbrella | `(um)` | | ☂️ |
| 62 | Île avec palmier | Island with a palm tree | `(ip)` | | 🏝️ |
| 63 | Ordinateur | Computer | `(co)` | | 🖥️ |
| 64 | Téléphone portable | Mobile phone | `(mp)` | | 📱 |
| 65 | Je reviens (BRB) | Be right back | `(brb)` | | 🔙 |
| 66 | Nuage d'orage | Storm cloud | `(st)` | | 🌧️ |
| 67 | High five | High five! | `(h5)` | | 🙏 |
| 68 | Argent | Money | `(mo)` | | 💰 |
| 69 | Mouton noir | Black sheep | `(bah)` | | 🐑 |
| 70 | Je ne sais pas | I don't know smile | `:^)` | ✓ | 🤷 |
| 71 | Réfléchit | Thinking smile | `*-)` | ✓ | 🤔 |
| 72 | Éclair | Lightning | `(li)` | ✓ | ⚡ |
| 73 | Fête | Party smile | `<:o)` `<o)` | ✓ | 🥳 |
| 74 | Roule des yeux | Eye-rolling smile | `8-)` | ✓ | 🙄 |
| 75 | Endormi | Sleepy smile | `\|-)` | ✓ | 😪 |
| 76 | Lapin (WLM 8.5) | Bunny | `('.')` | | 🐰 |

Inutilisées (présentes dans les ressources du client mais jamais dans le sélecteur) : Casque audio, Doigts croisés `(yn)`, Cigarette, Xbox `(xx)`, Menottes.

⚠️ Listes fans (pc.net, usefulshortcuts) ajoutant `*p*` Paix, `*s*` École, `*|` Coup de poing, `*\` Punk, `(ff)/(fm)` Flirt, `(xo)` Bisou, `(jk)`, `(lol)`, `(rotfl)`, `(boo)` Fantôme, `(j)` Ninja, `(wm)`, `(wo)` Travail, `(pu)`, `(z)`, `:]` Amoureux, `:}` Princesse, `;-\` : ce sont des émoticônes **WLM 2009/2011 ou de packs tiers**, pas 7.5. À proposer en option « mode 2009 ».

**Sélecteur d'émoticônes** 🧠 : grille popup de 19×19 avec survol bleu, nom + raccourci en infobulle, onglet « Mes émoticônes » pour les perso.

---

## 6. Design visuel (références) 🧠

- **Thème** : Windows XP *Luna* (barre de titre bleu dégradé `#0A246A → #3A6EA5` style XP, boutons ronds min/max/fermer rouge `#C75050`). Fenêtre MSN elle-même : dégradé **bleu ciel → blanc** (`#D6E6F7`, `#A9CDF5`, `#5A8FD6`), en-tête avec bandeau bleu, bordure arrondie en haut. Vert logo `#7BC043` / bleu logo `#2F7BD8`.
- **Police** : **Tahoma 8pt (11px)** partout, `MS Sans Serif` pour les anciens dialogues. Messages : police au choix (défaut *Microsoft Sans Serif* 10 ou *Tahoma*), couleur, gras/italique par utilisateur.
- **Image perso** : 96×96 dans la conversation, 48×48 (puis 32) dans la liste de contacts, cadre bleu arrondi avec reflet.
- **Logo** : bonhomme-papillon vert et bleu. ⚠️ Marque Microsoft : à **réinterpréter** (silhouette proche, couleurs proches, pas identique).
- Capture récupérée : **MSN Messenger 4.6** (Wikipédia, `File:MSN_Messenger_4.6.png`) : confirme la structure en-tête (image + « My Status: *Pseudo* (Online) »), ligne « No new e-mail messages », groupes « Online (1) / Not Online (1) », panneau « I want to… » (Add a Contact, Send an Instant Message, Send a File or Photo, Make a Phone Call, Go to Chat Rooms, More) et la bannière « msn Messenger » en bas. En 7.x ce panneau devient les icônes de la barre et la bannière devient la pub.
- **Captures 7.x récupérées** (lo4d.com, dans `docs/reference/`) : connexion, conversation FR (7.0, « Inviter / Envoyer des fichiers / Vidéo / Voix / Activités / Jeux », « Message vocal », « Clins d'œil », « Dernier message reçu à 13:54 le 19/04/2007 »), liste de contacts + conversation 7.5 (onglets à gauche, groupes « Familie (0/4) », barre d'info jaune, onglets « Handwrite | Type », boutons « Send / Search »). L'interface a été recalée dessus.
- Captures de référence à collecter : Wikipédia (article MSN Messenger / Windows Live Messenger), mess.be (archives, souvent indisponible), Softpedia « MSN Messenger 7.5 » (3 captures), GuidebookGallery, WinWorldPC, BetaWiki. Le dépôt Android ci-dessus contient des mockups.

---

### Couleurs mesurées sur la capture 7.5 ✅ (`docs/reference/75-contactlist-conversation.png`)

| Élément | Valeur mesurée | Appliqué |
|---|---|---|
| Barre de titre active (haut → bas) | #68A8E6 → #589AE9 → #367CCF → #325FBA → #2D55B1 → #0D288B | `--xp-title-grad` |
| Barre de titre inactive | #DAE3F4 | `.win.inactive .title` |
| Bordure de fenêtre | #5D92B6 | `.win`, `.body` |
| Barre de menus | #E9E6EC | `.menubar` |
| Barre d'outils conversation (haut → bas) | #F6FBFE → #E9F1F9 → #D3DEF0 → #B7C8E9 | `.ctoolbar` |
| Panneau de conversation | #CDE2EE / #E0F1F5 / #F2F6F6 | `.convmain` |
| Ligne « À : » | #EEF2FD, bordure #BCC4DA | `.toline` |
| Barre d'info jaune | #F3F9B5 | `.infobar` |
| Barre de mise en forme | #F1F8FF → #EDF0FC, bordure #A8B2C3 | `.fmtbar` |
| Barre d'état | #F7FBFE | `.statusbar` |
| En-tête liste de contacts | #F6F7F9 | `.hdr` |
| Colonne d'onglets | #EBF5F8 / #EDEFFC | `.tabs` |
| Zone « Rechercher sur le Web » | #DBEFFA | `.search` |

## 7. Cadre juridique (résumé, pas un conseil d'avocat)

- **Marque** « MSN », « Messenger », logo papillon/bonhomme : Microsoft. Un nom différent est **obligatoire** pour publier (idées : *Wizz*, *Pseudo*, *MessengerClassic* est déjà pris…).
- **Droits d'auteur** : images d'émoticônes, winks, sons `.wav`, icônes : Microsoft. → recréations maison dans le projet.
- **Interface / fonctionnement** : la *disposition*, les *comportements*, les raccourcis texte, les noms de statuts ne sont pas protégeables en pratique. C'est là que la fidélité est libre.
- Pour le buzz : la formule « inspiré de », sans logo ni nom Microsoft, est ce qui permet au projet de survivre à un DMCA au moment où il explose.

---

## 8. Sources

- Wikipédia : https://en.wikipedia.org/wiki/MSN_Messenger
- Sons (archive.org) : https://archive.org/details/msnmessengersounds
- Émoticônes extraites : https://github.com/bernzrdo/msn-emoticons
- Liste GitHub Unicode : https://github.com/Crissov/unicode-proposals/issues/256
- pc.net : https://pc.net/emoticons/shortcuts/live
- Messenger Classic : https://app.messengerclassic.com/emoticons
- Statuts (doc Microsoft) : https://learn.microsoft.com/en-us/previous-versions/windows/desktop/winmessenger/im-mistatus ; https://etc.usf.edu/techease/win/chat-conferencing/how-do-i-change-my-online-status-with-windows-messenger
- Messenger Plus! scripting (statuts) : https://archives.somnolescent.net/web/plus/Ref-Messenger-MyStatus.htm
- Escargot : https://escargot.chat/ ; https://computernewb.com/wiki/MSN_Messenger
- mess.be 7.5 beta : http://www.mess.be/msnmessenger75.htm (503 au moment de la recherche)
- Nudges/winks : https://richah.uk/insights/when-msn-messenger-let-you-annoy-people-with-custom-emoticons-and-nudges
- Winks : https://en.wikipedia.org/wiki/Wink_(animated_file)
- Historique 7.5 : https://kurtsh.com/2005/08/29/info-msn-messenger-7-5-whats-new-list ; https://www.neowin.net/news/msn-messenger-750324-released/
- Recréation Android : https://github.com/xp20011002-cmd/MSN-Messenger-7.5---Android-Edition-
- Recréation WPF : https://github.com/j0nat/windows-live-messenger
