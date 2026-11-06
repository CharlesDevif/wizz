# Wizz — la messagerie instantanée de 2005, recréée

Recréation nostalgique de l'expérience MSN Messenger 7.5 : fenêtre de connexion, liste de contacts, fenêtres de conversation, les 76 émoticônes, le Wizz, les sons, les Winks, les jeux… avec un **vrai serveur temps réel** et une **application desktop**. Interface **React** (Vite), serveur **Node** (WebSocket), desktop **Tauri**.

## Lancer

```bash
npm install && cd web && npm install && cd ..
npm run build          # compile l'interface React dans dist/
npm start              # http://localhost:8080
```

Deux navigateurs (ou deux fenêtres privées), deux comptes, ajoutez-vous, wizzez-vous. En développement : `npm run dev` (Vite, rechargement à chaud) avec `npm start` à côté.

## Structure

| Dossier / fichier | Rôle |
|---|---|
| `web/` | Interface React : `src/components` (fenêtres, dialogues, conversation, jeux), `src/lib` (store, réseau, actions, fonctionnalités, émoticônes, sons), `src/styles.css` (bureau XP, calé sur les captures 7.5) |
| `server.js` | Serveur Node : HTTP statique (`dist/`) + WebSocket : comptes, contacts, présence, messages hors ligne, relais wizz / winks / voix / encre / fichiers / appels / jeux / groupes |
| `src-tauri/` | Application desktop (Tauri 2) : fenêtre native, icône de notification (fermer = cacher), notifications système |
| `tests/` | Suite bout-en-bout Playwright (`npm test`) |
| `legacy/` | Première version en JavaScript vanilla (référence, non maintenue) |
| `docs/RESOURCES.md` | Dossier de recherche : historique, fonctionnalités, sons, émoticônes, couleurs mesurées, sources, cadre juridique |
| `docs/DEPLOY.md`, `render.yaml`, `fly.toml`, `Dockerfile` | Déploiement |

## Fonctionnalités

**Compte & contacts** : inscription / connexion, statut à la connexion, image perso (GIF animé conservé), pseudo et message perso avec émoticônes, 7 statuts + Inactif automatique (5 min), invitations de contact à accepter, groupes En ligne / Hors ligne ou par groupe (Amis / Famille / Travail), surnoms, blocage, recherche, MSN Today, bannière pub, alertes « X vient de se connecter », messages hors ligne remis à la reconnexion, déconnexion si connecté ailleurs.

**Conversation** : barre d'outils 7.5 (Inviter, Envoyer des fichiers, Vidéo, Voix, Activités, Jeux, Bloquer, Couleurs), « *Pseudo* dit : », horodatage, « est en train d'écrire… », barre d'info jaune selon le statut, police / taille / couleur / gras / italique transmis, **76 émoticônes** dessinées (raccourcis exacts) + **émoticônes perso** transmises, **Wizz** (tremblement, son, anti-spam 10 s), **Winks** (5), **messages vocaux** (F2, 15 s), **encre manuscrite**, **transfert de fichiers** (Accepter / Enregistrer sous / Refuser, 20 Mo), **appels audio / vidéo** et **partage d'écran** (WebRTC), **conversations à plusieurs**, **Morpion**, **Démineur Flags**, **Solitaire Showdown**, **tableau blanc partagé**, arrière-plans fixes et **Dynamic Backgrounds**, onglets Manuscrit / Texte, fenêtres redimensionnables.

**Sons** : 9 sons synthétisés (WebAudio) calqués sur les fichiers d'origine de la 7.5.

## Application desktop (Tauri)

```bash
npm run build
cd src-tauri && cargo build --release
```

Les installeurs Windows (.exe / .msi), macOS (.dmg) et Linux (.deb / .AppImage) sont produits par `.github/workflows/desktop.yml` à chaque tag `v*`. Au premier lancement, saisir l'adresse du serveur (ex. `wss://wizz.monsite.fr`) ; vide = mode démo.

## Tests

```bash
npm i -D playwright && npx playwright install chromium
npm run build && npm test
```

Trois scénarios en parallèle, chacun avec son serveur : deux comptes (invitation, messages, wizz, wink, statut, hors ligne), trois comptes (groupe, Morpion, appel audio réel, partage d'écran), fichiers / tableau blanc / Démineur / surnom / groupe.

## Note juridique

Le nom MSN, le logo et les fichiers d'origine (sons, images d'émoticônes, winks) appartiennent à Microsoft. Wizz n'en embarque aucun : nom et logo propres, sons synthétisés, émoticônes et winks redessinés. Voir `docs/RESOURCES.md` §7.
