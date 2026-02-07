# ========================================
# Janus Platform - Package de Déploiement Plesk
# Crée un ZIP prêt à upload sans SSH
# ========================================

Write-Host ""
Write-Host "🚀 Création du package de déploiement Plesk..." -ForegroundColor Green
Write-Host ""

# Variables
$projectRoot = Get-Location
$deployFolder = Join-Path $projectRoot "deploy-package"
$zipFile = Join-Path $projectRoot "janus-prod-plesk.zip"

# Nettoyer l'ancien package
if (Test-Path $deployFolder) {
    Write-Host "🧹 Nettoyage de l'ancien package..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $deployFolder
}

if (Test-Path $zipFile) {
    Remove-Item -Force $zipFile
}

# Créer la structure
Write-Host "📁 Création de la structure de dossiers..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "$deployFolder\api" | Out-Null
New-Item -ItemType Directory -Force -Path "$deployFolder\manager" | Out-Null
New-Item -ItemType Directory -Force -Path "$deployFolder\portal" | Out-Null

# Vérifier que les builds existent
Write-Host "✅ Vérification des builds..." -ForegroundColor Cyan

$backendDist = Join-Path $projectRoot "packages\backend\dist"
$managerDist = Join-Path $projectRoot "packages\manager\dist"
$portalDist = Join-Path $projectRoot "packages\test-portal\dist"

if (-not (Test-Path $backendDist)) {
    Write-Host "❌ ERREUR: Backend non buildé! Exécute d'abord: npm run build" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $managerDist)) {
    Write-Host "❌ ERREUR: Manager non buildé! Exécute d'abord: npm run build" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $portalDist)) {
    Write-Host "❌ ERREUR: Portal non buildé! Exécute d'abord: npm run build" -ForegroundColor Red
    exit 1
}

# Copier les fichiers de l'API
Write-Host "📦 Copie des fichiers de l'API..." -ForegroundColor Cyan
Copy-Item -Recurse "$backendDist\*" "$deployFolder\api\" -Force
Copy-Item "packages\backend\package.json" "$deployFolder\api\" -Force

# Copier .env.production comme .env.example
if (Test-Path "packages\backend\.env.production") {
    Copy-Item "packages\backend\.env.production" "$deployFolder\api\.env.example" -Force
} else {
    Write-Host "⚠️  Attention: .env.production non trouvé, création d'un template..." -ForegroundColor Yellow
    @"
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/janus-platform
JWT_SECRET=CHANGE_ME_32_CHARS_MINIMUM_RANDOM
JWT_EXPIRES_IN=7d
FRONTEND_MANAGER_URL=https://manager.janus.tondomaine.com
FRONTEND_PORTAL_URL=https://portal.janus.tondomaine.com
STRIPE_SECRET_KEY=sk_live_xxx
SMTP_HOST=smtp.tonserveur.com
SMTP_PORT=587
SMTP_USER=noreply@tondomaine.com
SMTP_PASS=your_password
SMTP_FROM=Janus <noreply@tondomaine.com>
"@ | Out-File -FilePath "$deployFolder\api\.env.example" -Encoding UTF8
}

# Copier les fichiers du Manager
Write-Host "📦 Copie des fichiers du Manager..." -ForegroundColor Cyan
Copy-Item -Recurse "$managerDist\*" "$deployFolder\manager\" -Force

# Copier les fichiers du Portal
Write-Host "📦 Copie des fichiers du Portal..." -ForegroundColor Cyan
Copy-Item -Recurse "$portalDist\*" "$deployFolder\portal\" -Force

# Copier le script de seed PHP
Write-Host "📦 Copie du script de seed..." -ForegroundColor Cyan
Copy-Item "seed-via-web.php" "$deployFolder\api\" -Force

# Créer un fichier README pour le package
Write-Host "📝 Création du README..." -ForegroundColor Cyan
@"
# Janus Platform - Package de Déploiement Plesk

## 📦 Contenu du Package

- **api/** - Backend Node.js API (déjà compilé)
- **manager/** - Dashboard Manager (fichiers statiques)
- **portal/** - Test Portal (fichiers statiques)

## 🚀 Instructions de Déploiement

### Voir le guide complet: DEPLOIEMENT-PLESK-SANS-SSH.md

### Quick Steps:

1. **Créer 3 sous-domaines dans Plesk:**
   - api.janus.tondomaine.com → janus-api
   - manager.janus.tondomaine.com → janus-manager
   - portal.janus.tondomaine.com → janus-portal

2. **Activer SSL Let's Encrypt** pour chaque sous-domaine

3. **Activer Node.js** pour api.janus.tondomaine.com:
   - Version: Node.js 20.x
   - Mode: Production
   - Document root: /httpdocs
   - Startup file: index.js

4. **Upload les fichiers via File Manager:**
   - Contenu de api/ → dans janus-api/
   - Contenu de manager/ → dans janus-manager/
   - Contenu de portal/ → dans janus-portal/

5. **Configurer .env dans Plesk Node.js Variables:**
   - Copie les valeurs depuis api/.env.example
   - Remplis avec tes vraies valeurs

6. **Installer les dépendances:**
   - Dans Plesk → Node.js → "Installer les dépendances"

7. **Configurer Nginx Reverse Proxy** (voir guide complet)

8. **Seed les utilisateurs:**
   - Ouvre https://api.janus.tondomaine.com/seed-via-web.php
   - Clique "Seed Users"
   - Supprime le fichier seed-via-web.php

9. **Connexion:**
   - https://manager.janus.tondomaine.com
   - Email: admin@janus-demo.com
   - Password: admin123

## ✅ C'est tout!

Pas besoin de SSH, tout se fait via l'interface Plesk!
"@ | Out-File -FilePath "$deployFolder\README.txt" -Encoding UTF8

# Copier le guide de déploiement complet
if (Test-Path "DEPLOIEMENT-PLESK-SANS-SSH.md") {
    Copy-Item "DEPLOIEMENT-PLESK-SANS-SSH.md" "$deployFolder\" -Force
}

# Créer l'archive ZIP
Write-Host "🗜️  Compression en ZIP..." -ForegroundColor Cyan
Compress-Archive -Path "$deployFolder\*" -DestinationPath $zipFile -Force

# Statistiques
$zipSize = (Get-Item $zipFile).Length / 1MB
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ Package créé avec succès!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Fichier: janus-prod-plesk.zip" -ForegroundColor Cyan
Write-Host "📏 Taille: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan
Write-Host "📂 Dossier temporaire: deploy-package/" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Upload janus-prod-plesk.zip dans Plesk File Manager" -ForegroundColor White
Write-Host "   2. Décompresse le ZIP" -ForegroundColor White
Write-Host "   3. Suis le guide: DEPLOIEMENT-PLESK-SANS-SSH.md" -ForegroundColor White
Write-Host ""
Write-Host "📖 Guide complet: DEPLOIEMENT-PLESK-SANS-SSH.md" -ForegroundColor Cyan
Write-Host ""

# Ouvrir le dossier dans l'explorateur
Write-Host "📁 Ouverture du dossier..." -ForegroundColor Cyan
Invoke-Item $projectRoot

Write-Host "✅ Terminé!" -ForegroundColor Green
Write-Host ""
