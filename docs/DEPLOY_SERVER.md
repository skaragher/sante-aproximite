# Deploiement serveur et build mobile

## Cible

- Serveur: `193.168.173.181`
- Dossier applicatif: `/var/www/sante-aproximite`
- Backend Node/Express via `pm2`
- Port backend: `8081`
- API publique: `http://193.168.173.181:8081/api`

## 1. Preparation du serveur

Sur le serveur, en root:

```bash
cd /var/www
mkdir -p /var/www/sante-aproximite
cd /var/www/sante-aproximite
# cloner ici le depot Git
```

Puis:

```bash
cd /var/www/sante-aproximite
bash scripts/setup-server.sh
```

## 2. Configuration backend

Creer ou verifier `/var/www/sante-aproximite/backend/.env`:

```env
HOST=0.0.0.0
PORT=8081
DATABASE_URL=postgresql://sante_user:change_me_db_password@localhost:5432/sante_aproxmite
JWT_SECRET=change_me_strong_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=change_me_strong_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d
```

## 3. Demarrage avec PM2

```bash
cd /var/www/sante-aproximite
bash scripts/deploy-server.sh
pm2 status
pm2 logs sante-aproxmite-api
```

Le process PM2 utilise:
- fichier: `/var/www/sante-aproximite/backend/ecosystem.config.cjs`
- nom PM2: `sante-aproxmite-api`

## 4. Configuration du web

Dans `/var/www/sante-aproximite/web-vue/.env`:

```env
VITE_API_URL=http://193.168.173.181:8081/api
```

Puis build:

```bash
cd /var/www/sante-aproximite/web-vue
npm ci
npm run build
```

## 5. Application mobile

Le mobile est maintenant prepare pour attaquer la meme API publique:

```env
EXPO_PUBLIC_API_URL=http://193.168.173.181:8081/api
EXPO_PUBLIC_API_URL_PROD=http://193.168.173.181:8081/api
```

Pour une build Android locale:

```bash
cd mobile
copy .env.example .env
npm ci
npx expo export --platform android
```

Pour une build Android via EAS:

```bash
cd mobile
copy .env.example .env
npm ci
npx eas build --platform android --profile production
```

## 6. Verification rapide

Tester l'API:

```bash
curl http://193.168.173.181:8081/api/health
```

Si la route `/api/health` n'existe pas encore, tester une route connue comme:

```bash
curl -X POST http://193.168.173.181:8081/api/auth/login
```
