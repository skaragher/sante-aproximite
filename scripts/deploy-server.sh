#!/bin/bash
set -euo pipefail

APP_DIR="/var/www/sante-aproximite"
BACKEND_DIR="$APP_DIR/backend"
WEB_DIR="$APP_DIR/web-vue"

echo "==> Deploiement Sante Aproximite"
echo "Dossier cible : $APP_DIR"

mkdir -p "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "Le depot Git n'existe pas dans $APP_DIR."
  echo "Clonez d'abord le projet dans ce dossier, puis relancez ce script."
  exit 1
fi

cd "$APP_DIR"
git pull --ff-only

echo "==> Backend"
cd "$BACKEND_DIR"
npm ci

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "Fichier backend/.env cree. Pensez a verifier DATABASE_URL et les secrets JWT."
fi

pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

echo "==> Frontend web"
cd "$WEB_DIR"
npm ci
npm run build

echo "==> Termine"
echo "API PM2 : sante-aproxmite-api"
echo "Build web : $WEB_DIR/dist"
