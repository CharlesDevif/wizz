# Déployer en public

Le serveur est un seul process Node (HTTP statique + WebSocket sur le même port). Il lui faut : Node 18+, un port, et un disque pour `data.json`. Le HTTPS est indispensable (micro, caméra et notifications n'existent qu'en contexte sécurisé).

Le serveur écrit `data.json` dans `DATA_DIR` (par défaut le dossier du projet). Les trois options ci-dessous sont préconfigurées : `render.yaml`, `fly.toml`, `Dockerfile`.

## Option A : Render (le plus simple, gratuit pour commencer)

1. Pousser le dossier sur GitHub.
2. Render → New → **Web Service** → connecter le dépôt.
3. Render lit `render.yaml` (Blueprint) : Node 22, `npm ci`, `node server.js`, disque de 1 Go monté sur `data/`, HTTPS fourni. Rien d'autre à configurer.

Attention : l'offre gratuite endort le service après 15 min d'inactivité (premier chargement lent). Passer en payant dès que ça buzze.

## Option B : Fly.io

```bash
fly launch --no-deploy
fly volumes create data --size 1
fly deploy
```

`fly.toml` est fourni (région Paris `cdg`, volume monté sur `/data`, machine toujours allumée).

## Option C : VPS (OVH, Hetzner, Scaleway) avec Docker + Caddy

```bash
docker build -t wizz .
docker run -d --name wizz --restart unless-stopped -p 127.0.0.1:8080:8080 -v wizz-data:/data wizz
```

Caddyfile (HTTPS automatique) :

```
wizz.monsite.fr {
    reverse_proxy 127.0.0.1:8080
}
```

## Appels audio/vidéo derrière NAT strict

Le STUN public de Google suffit pour la majorité des connexions. Pour les réseaux d'entreprise / 4G stricts, ajouter un serveur TURN (coturn, ou un service comme Metered) dans `RTC_CFG` de `features.js`.

## Avant le buzz

- Remplacer `data.json` par SQLite (`better-sqlite3`) si > quelques milliers de comptes.
- Limiter les inscriptions par IP (rate-limit) et la taille des images perso.
- Mettre un nom de domaine et un titre définitifs (chercher `Wizz` dans `index.html`, `app.js`, `src-tauri/tauri.conf.json`).
- Pour l'app desktop, les utilisateurs saisissent l'URL du serveur dans le champ « Serveur » de l'écran de connexion (`wss://wizz.monsite.fr`). On peut la pré-remplir en changeant la valeur par défaut de `SERVER_URL` dans `app.js`.
