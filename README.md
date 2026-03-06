# Sante Aproximite

Projet monorepo:
- `backend`: API Node.js + Express + PostgreSQL (auth JWT, gestion centres/services, recherche geolocalisee)
- `mobile`: application mobile Expo (React Native)
- `web-vue`: application web Vue.js (carte, navigation, plaintes, espace chef)

## 1. Fonctionnalites implementees

- Inscription / connexion utilisateur
- Roles:
  - `CHEF_ETABLISSEMENT`: peut creer un centre et declarer ses services
- `USER`: peut consulter les centres les plus proches
- Geolocalisation utilisateur via GPS de l'appareil
- Affichage des centres sur carte native (`react-native-maps`)
- Classement des centres par distance (km)
- Affichage du plateau technique et des services

## 2. Installation

### Prerequis
- Node.js 18+
- PostgreSQL local ou distant

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API: `http://localhost:5000`
Au demarrage, le backend cree automatiquement les tables PostgreSQL si elles n'existent pas.

### Mobile Expo (React Native)
```bash
cd mobile
cp .env.example .env
npm install
npm start
```

Puis:
- `a` dans le terminal Expo pour Android
- ou `npm run android`

### Web Vue.js
```bash
cd web-vue
cp .env.example .env
npm install
npm run dev
```

App web: `http://localhost:5174`

Production (meme backend que mobile):
```bash
cd web-vue
npm run build
```
La build lit `web-vue/.env.production` et pointe vers:
`http://45.147.250.126:5000/api`

## 3. Variables d'environnement

### backend/.env
- `PORT=5000`
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sante_aproxmite`
- `JWT_SECRET=change_me_strong_secret`
- `JWT_EXPIRES_IN=7d`

### mobile/.env
- `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api`

### web-vue/.env
- `VITE_API_URL=http://localhost:5000/api`

### web-vue/.env.production
- `VITE_API_URL=http://45.147.250.126:5000/api`

## 4. Endpoints backend

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Centres
- `GET /api/centers` (auth)
- `GET /api/centers/nearby?latitude=..&longitude=..&radiusKm=20` (auth)
- `POST /api/centers` (auth + role CHEF_ETABLISSEMENT)
- `POST /api/centers/import` (auth + role CHEF_ETABLISSEMENT, import en masse)
- `POST /api/centers/:id/services` (auth + role CHEF_ETABLISSEMENT)
- `POST /api/centers/:id/complaints` (auth, plainte usager)
- `GET /api/centers/:id/complaints` (auth + role CHEF_ETABLISSEMENT, uniquement ses centres)

### Plaintes
- `POST /api/complaints` (auth, centre optionnel)
  - body:
    - `subject` (obligatoire)
    - `message` (obligatoire)
    - `centerId` (optionnel)

Exemple body pour `POST /api/centers/import`:
```json
{
  "centers": [
    {
      "name": "Hopital Regional A",
      "address": "Avenue 1",
      "technicalPlatform": "Urgences, Laboratoire, Imagerie",
      "latitude": 6.5244,
      "longitude": 3.3792,
      "services": [
        { "name": "Urgences" },
        { "name": "Laboratoire", "description": "Analyses medicales" }
      ]
    },
    {
      "name": "Centre Medical B",
      "address": "Boulevard 2",
      "technicalPlatform": "Consultation generale",
      "latitude": 6.452,
      "longitude": 3.395,
      "services": "Consultation, Vaccination"
    }
  ]
}
```

## 5. Flux metier attendu

1. Un chef s'inscrit avec role `CHEF_ETABLISSEMENT`.
2. Il cree un centre de sante (nom, adresse, plateau technique, coordonnees GPS).
3. Il ajoute les services du centre.
4. Un utilisateur standard se connecte.
5. Il ouvre le menu "centres les plus proches".
6. L'application detecte sa position et affiche les centres les plus proches, tries par distance.

## 6. Version native avec Expo

### Lancement Android
```bash
cd mobile
npm install
npm run android
```

### Lancement iOS (macOS)
```bash
cd mobile
npm install
npm run ios
```

Notes:
- Sur Android, acceptez la permission de localisation au premier lancement.
- Si vous testez sur un telephone physique, remplacez `EXPO_PUBLIC_API_URL` par l'IP locale de votre machine (ex: `http://192.168.1.20:5000/api`).
