@echo off
REM ========================================
REM Janus Platform - Package de Deploiement Plesk
REM Cree un ZIP pret a upload sans SSH
REM ========================================

echo.
echo ========================================
echo   Janus Platform - Package Deploiement
echo ========================================
echo.

REM Nettoyer l'ancien package
echo Nettoyage de l'ancien package...
if exist deploy-package rmdir /s /q deploy-package
if exist janus-prod-plesk.zip del /q janus-prod-plesk.zip

REM Creer la structure
echo Creation de la structure de dossiers...
mkdir deploy-package
mkdir deploy-package\api
mkdir deploy-package\manager
mkdir deploy-package\portal

REM Verification des builds
echo Verification des builds...
if not exist "packages\backend\dist" (
    echo ERREUR: Backend non builde! Execute d'abord: npm run build
    pause
    exit /b 1
)

if not exist "packages\manager\dist" (
    echo ERREUR: Manager non builde! Execute d'abord: npm run build
    pause
    exit /b 1
)

if not exist "packages\test-portal\dist" (
    echo ERREUR: Portal non builde! Execute d'abord: npm run build
    pause
    exit /b 1
)

REM Copier les fichiers
echo Copie des fichiers de l'API...
xcopy /e /i /y packages\backend\dist\* deploy-package\api\
copy /y packages\backend\package.json deploy-package\api\

echo Copie de .env.example...
if exist packages\backend\.env.production (
    copy /y packages\backend\.env.production deploy-package\api\.env.example
) else (
    echo NODE_ENV=production > deploy-package\api\.env.example
    echo PORT=3000 >> deploy-package\api\.env.example
    echo MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/janus-platform >> deploy-package\api\.env.example
    echo JWT_SECRET=CHANGE_ME_32_CHARS_MINIMUM >> deploy-package\api\.env.example
    echo JWT_EXPIRES_IN=7d >> deploy-package\api\.env.example
)

echo Copie des fichiers du Manager...
xcopy /e /i /y packages\manager\dist\* deploy-package\manager\

echo Copie des fichiers du Portal...
xcopy /e /i /y packages\test-portal\dist\* deploy-package\portal\

echo Copie du script de seed...
copy /y seed-via-web.php deploy-package\api\

echo Copie de la documentation...
copy /y DEPLOIEMENT-PLESK-SANS-SSH.md deploy-package\

REM Creer le README
echo Creation du README...
(
echo # Janus Platform - Package de Deploiement Plesk
echo.
echo Contenu:
echo - api/ : Backend Node.js API
echo - manager/ : Dashboard Manager
echo - portal/ : Test Portal
echo.
echo Guide complet: DEPLOIEMENT-PLESK-SANS-SSH.md
echo.
echo Quick Start:
echo 1. Upload ce package dans Plesk
echo 2. Cree 3 sous-domaines
echo 3. Active Node.js pour l'API
echo 4. Upload les fichiers dans les bons dossiers
echo 5. Configure les variables d'environnement
echo 6. Seed les utilisateurs via seed-via-web.php
echo.
echo Login: admin@janus-demo.com / admin123
) > deploy-package\README.txt

echo.
echo ========================================
echo   Package cree avec succes!
echo ========================================
echo.
echo Fichier: janus-prod-plesk.zip sera cree manuellement
echo Dossier: deploy-package\
echo.
echo ETAPE SUIVANTE:
echo 1. Compresse le dossier "deploy-package" en ZIP
echo 2. Renomme-le en "janus-prod-plesk.zip"
echo 3. Upload dans Plesk File Manager
echo.
echo Ouverture du dossier...
start deploy-package

echo.
echo Guide complet: DEPLOIEMENT-PLESK-SANS-SSH.md
echo.
pause
