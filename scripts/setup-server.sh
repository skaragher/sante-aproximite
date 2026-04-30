#!/bin/bash
# =============================================================================
# SANTE APROXIMITE — Installation initiale du serveur
# Serveur : 193.168.173.181
# OS cible : Ubuntu 20.04 / 22.04 ou Debian 11/12
# Exécuter EN ROOT : bash setup-server.sh
# =============================================================================

set -e

echo ""
echo "============================================="
echo "  Santé Aproximite — Setup serveur"
echo "  IP : 193.168.173.181"
echo "============================================="
echo ""

# ─── 1. Mise à jour système ───────────────────────────────────────────────────
echo "[1/7] Mise à jour du système..."
apt-get update -y && apt-get upgrade -y

# ─── 2. Installation Node.js 20 LTS ──────────────────────────────────────────
echo "[2/7] Installation Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
echo "  Node.js : $(node -v)"
echo "  npm     : $(npm -v)"

# ─── 3. Installation PostgreSQL ───────────────────────────────────────────────
echo "[3/7] Installation PostgreSQL..."
apt-get install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql
echo "  PostgreSQL : $(psql --version)"

# ─── 4. Création base de données ─────────────────────────────────────────────
echo "[4/7] Création base de données sante_aproxmite..."
sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'sante_user') THEN
    CREATE USER sante_user WITH PASSWORD 'SanteAprox2025!';
  END IF;
END
\$\$;

CREATE DATABASE sante_aproxmite OWNER sante_user;
GRANT ALL PRIVILEGES ON DATABASE sante_aproxmite TO sante_user;
SQL
echo "  Base de données créée."

# ─── 5. Installation PM2 (gestionnaire de processus) ─────────────────────────
echo "[5/7] Installation PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root
echo "  PM2 : $(pm2 -v)"

# ─── 6. Installation Git ──────────────────────────────────────────────────────
echo "[6/7] Installation Git..."
apt-get install -y git

# ─── 7. Ouverture du port 8081 dans le firewall ───────────────────────────────
echo "[7/7] Configuration firewall (port 8081)..."
if command -v ufw &> /dev/null; then
  ufw allow 22/tcp
  ufw allow 8081/tcp
  ufw --force enable
  echo "  UFW active. Port 8081 ouvert."
else
  echo "  UFW non trouvé — configurez le firewall manuellement."
fi

echo ""
echo "============================================="
echo "  Setup terminé !"
echo "  Prochaine étape : bash scripts/deploy-server.sh"
echo "============================================="
