╔══════════════════════════════════════════════════════════════════╗
║   Janus Platform - Package de Déploiement Plesk                 ║
║   100% Interface Graphique - AUCUNE Commande SSH                ║
╚══════════════════════════════════════════════════════════════════╝

📦 CONTENU DE CE PACKAGE:

  api/              → Backend Node.js (déjà compilé)
  manager/          → Dashboard Manager (fichiers statiques)
  portal/           → Test Portal (fichiers statiques)

⚠️  IMPORTANT: Ne PAS uploader ce package tel quel!
    Chaque dossier va dans SON sous-domaine séparé.

═══════════════════════════════════════════════════════════════════

🚀 DÉPLOIEMENT EN 3 ÉTAPES SIMPLES:

═══════════════════════════════════════════════════════════════════

ÉTAPE 1️⃣  - CRÉER 3 SOUS-DOMAINES DANS PLESK
────────────────────────────────────────────────────────────

Plesk → Domaines → "Ajouter un sous-domaine" (3 fois)

  Sous-domaine: api      → Dossier: api
  Sous-domaine: manager  → Dossier: manager
  Sous-domaine: portal   → Dossier: portal

Pour CHAQUE sous-domaine:
  ✓ Active SSL (Let's Encrypt)
  ✓ Active redirection HTTP → HTTPS

═══════════════════════════════════════════════════════════════════

ÉTAPE 2️⃣  - UPLOAD LES FICHIERS (File Manager Plesk)
────────────────────────────────────────────────────────────

Décompresse ce ZIP quelque part, puis:

  📁 Dossier du sous-domaine "api"
     → Upload TOUT le contenu du dossier api/
        (index.js, package.json, tous les dossiers...)

  📁 Dossier du sous-domaine "manager"
     → Upload TOUT le contenu du dossier manager/
        (index.html, assets/, test-users.html)

  📁 Dossier du sous-domaine "portal"
     → Upload TOUT le contenu du dossier portal/
        (index.html, assets/)

⚠️  NE PAS uploader les dossiers api/, manager/, portal/ eux-mêmes!
    Seulement LEUR CONTENU!

═══════════════════════════════════════════════════════════════════

ÉTAPE 3️⃣  - CONFIGURATION (Via Interface Plesk)
────────────────────────────────────────────────────────────

A) Pour l'API (api.tondomaine.com):

   1. Plesk → api.tondomaine.com → Node.js
      • Active Node.js 20.x
      • Mode: Production
      • Startup file: index.js

   2. Variables d'environnement (clic "Add variable"):
      NODE_ENV = production
      PORT = 3000
      MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/janus-platform
      JWT_SECRET = (génère 32 caractères aléatoires)
      FRONTEND_MANAGER_URL = https://manager.tondomaine.com
      FRONTEND_PORTAL_URL = https://portal.tondomaine.com

   3. Nginx Settings → Additional directives:
      location / {
          proxy_pass http://127.0.0.1:3000;
          proxy_http_version 1.1;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-Proto $scheme;
      }

B) Pour Manager et Portal:

   Nginx Settings → Additional directives:
   location / {
       try_files $uri $uri/ /index.html;
   }

═══════════════════════════════════════════════════════════════════

📖 GUIDES COMPLETS DISPONIBLES:

   • DEPLOIEMENT-PLESK-SANS-SSH.md  → Guide détaillé complet
   • (Dans GitHub) GUIDE-SIMPLE-PLESK.md  → Version ultra-simple

═══════════════════════════════════════════════════════════════════

🗄️  MONGODB (OBLIGATOIRE):

   Va sur: https://www.mongodb.com/cloud/atlas
   → Crée un cluster M0 GRATUIT
   → Copie la connection string
   → Ajoute-la dans les variables Node.js (MONGODB_URI)

═══════════════════════════════════════════════════════════════════

🌱 CRÉER LES UTILISATEURS:

   1. Ouvre: https://api.tondomaine.com/seed-via-web.php
   2. Clique "Seed Users"
   3. SUPPRIME le fichier seed-via-web.php (sécurité!)

═══════════════════════════════════════════════════════════════════

✅ TEST FINAL:

   Ouvre: https://manager.tondomaine.com
   Email: admin@janus-demo.com
   Password: admin123

   🎉 Si tu vois le dashboard → C'EST BON!

═══════════════════════════════════════════════════════════════════

🆘 PROBLÈME?

   • 502 Bad Gateway → Plesk → Node.js → Restart App
   • CORS Error → Vérifie les URLs dans les variables (FRONTEND_...)
   • Page blanche → F12 → Console → Regarde les erreurs

═══════════════════════════════════════════════════════════════════
