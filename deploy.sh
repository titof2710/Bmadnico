#!/bin/bash

###############################################################################
# Script de Déploiement Automatique - Janus Platform
# Usage: ./deploy.sh [serveur] [user]
# Exemple: ./deploy.sh mon-serveur.com admin
###############################################################################

set -e  # Arrêter en cas d'erreur

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
SERVER=${1:-"ton-serveur.com"}
USER=${2:-"ton-user"}
REMOTE_PATH="/var/www/vhosts/tondomaine.com"

echo -e "${GREEN}🚀 Déploiement Janus Platform${NC}"
echo -e "${YELLOW}Serveur: $SERVER${NC}"
echo -e "${YELLOW}User: $USER${NC}"
echo ""

# Étape 1: Build Local
echo -e "${GREEN}📦 Step 1/6: Build des packages...${NC}"
npm run build

if [ ! -d "packages/backend/dist" ]; then
    echo -e "${RED}❌ Erreur: Backend build failed${NC}"
    exit 1
fi

if [ ! -d "packages/manager/dist" ]; then
    echo -e "${RED}❌ Erreur: Manager build failed${NC}"
    exit 1
fi

if [ ! -d "packages/test-portal/dist" ]; then
    echo -e "${RED}❌ Erreur: Portal build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build terminé${NC}"
echo ""

# Étape 2: Créer l'archive
echo -e "${GREEN}📦 Step 2/6: Création de l'archive...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE="janus-deploy-$TIMESTAMP.tar.gz"

tar -czf $ARCHIVE \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='.env' \
    packages/backend/dist \
    packages/backend/package.json \
    packages/backend/.env.production \
    packages/manager/dist \
    packages/test-portal/dist \
    package.json \
    package-lock.json

echo -e "${GREEN}✅ Archive créée: $ARCHIVE${NC}"
echo ""

# Étape 3: Upload vers le serveur
echo -e "${GREEN}📤 Step 3/6: Upload vers le serveur...${NC}"
scp $ARCHIVE $USER@$SERVER:/tmp/

echo -e "${GREEN}✅ Upload terminé${NC}"
echo ""

# Étape 4: Déploiement distant
echo -e "${GREEN}🔧 Step 4/6: Déploiement sur le serveur...${NC}"

ssh $USER@$SERVER << 'ENDSSH'
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REMOTE_PATH="/var/www/vhosts/tondomaine.com"
ARCHIVE=$(ls -t /tmp/janus-deploy-*.tar.gz | head -1)

echo "📦 Extraction de l'archive..."
cd /tmp
tar -xzf $ARCHIVE

echo "🔄 Backup de l'ancienne version..."
if [ -d "$REMOTE_PATH/janus-api/dist" ]; then
    mkdir -p $REMOTE_PATH/backups
    tar -czf $REMOTE_PATH/backups/backup-$TIMESTAMP.tar.gz \
        $REMOTE_PATH/janus-api/dist \
        $REMOTE_PATH/janus-manager \
        $REMOTE_PATH/janus-portal
    echo "✅ Backup créé: $REMOTE_PATH/backups/backup-$TIMESTAMP.tar.gz"
fi

echo "📋 Copie des nouveaux fichiers..."

# Backend
cp -r /tmp/packages/backend/dist/* $REMOTE_PATH/janus-api/dist/
cp /tmp/packages/backend/package.json $REMOTE_PATH/janus-api/
cp /tmp/packages/backend/.env.production $REMOTE_PATH/janus-api/.env.production.new

# Manager
rm -rf $REMOTE_PATH/janus-manager/*
cp -r /tmp/packages/manager/dist/* $REMOTE_PATH/janus-manager/

# Portal
rm -rf $REMOTE_PATH/janus-portal/*
cp -r /tmp/packages/test-portal/dist/* $REMOTE_PATH/janus-portal/

echo "📦 Installation des dépendances..."
cd $REMOTE_PATH/janus-api
npm install --production

echo "🔄 Redémarrage de l'API..."
pm2 restart janus-api

echo "🧹 Nettoyage..."
rm -rf /tmp/packages
rm -f /tmp/janus-deploy-*.tar.gz

echo "✅ Déploiement terminé!"

ENDSSH

echo -e "${GREEN}✅ Déploiement distant terminé${NC}"
echo ""

# Étape 5: Vérification
echo -e "${GREEN}🧪 Step 5/6: Vérification du déploiement...${NC}"
sleep 3

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://api.$SERVER/health || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ API est accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}⚠️  API retourne HTTP $HTTP_CODE${NC}"
fi

# Étape 6: Nettoyage local
echo -e "${GREEN}🧹 Step 6/6: Nettoyage local...${NC}"
rm -f $ARCHIVE
echo -e "${GREEN}✅ Archive locale supprimée${NC}"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Déploiement terminé avec succès!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "📍 URLs de Production:"
echo -e "   Manager: ${YELLOW}https://manager.$SERVER${NC}"
echo -e "   Portal:  ${YELLOW}https://portal.$SERVER${NC}"
echo -e "   API:     ${YELLOW}https://api.$SERVER${NC}"
echo ""
echo -e "📊 Vérifier les logs:"
echo -e "   ${YELLOW}ssh $USER@$SERVER 'pm2 logs janus-api --lines 50'${NC}"
echo ""
