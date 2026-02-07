╔══════════════════════════════════════════════════════════╗
║   Janus Platform - Package de Déploiement Plesk         ║
║   100% Interface Graphique - AUCUNE Commande SSH        ║
╚══════════════════════════════════════════════════════════╝

📦 CONTENU DU PACKAGE:

  api/              → Backend Node.js API (déjà compilé)
  manager/          → Dashboard Manager (fichiers statiques HTML/CSS/JS)
  portal/           → Test Portal (fichiers statiques HTML/CSS/JS)
  seed-via-web.php  → Script pour créer les utilisateurs via navigateur

📖 DOCUMENTATION COMPLÈTE:

  DEPLOIEMENT-PLESK-SANS-SSH.md (dans ce dossier)

🚀 QUICK START (15 Minutes):

1️⃣  CRÉER LES SOUS-DOMAINES dans Plesk:
   → api.janus.tondomaine.com
   → manager.janus.tondomaine.com
   → portal.janus.tondomaine.com

2️⃣  ACTIVER SSL (Let's Encrypt) pour chaque sous-domaine

3️⃣  ACTIVER NODE.JS pour api.janus.tondomaine.com:
   - Version: 20.x
   - Mode: Production
   - Startup file: index.js

4️⃣  UPLOAD LES FICHIERS via Plesk File Manager:
   - Contenu de api/ → dans le dossier janus-api/
   - Contenu de manager/ → dans le dossier janus-manager/
   - Contenu de portal/ → dans le dossier janus-portal/

5️⃣  CONFIGURER LES VARIABLES D'ENVIRONNEMENT:
   - Plesk → api.janus.tondomaine.com → Node.js
   - Ajoute les variables depuis api/.env.example
   - Remplace les valeurs par tes vraies infos

6️⃣  INSTALLER LES DÉPENDANCES:
   - Plesk → Node.js → "Installer les dépendances"
   - Attend la fin de l'installation

7️⃣  CONFIGURER NGINX REVERSE PROXY:
   - Voir le guide DEPLOIEMENT-PLESK-SANS-SSH.md section 4

8️⃣  MONGODB (Cloud Atlas - Gratuit):
   - Crée un compte sur https://www.mongodb.com/cloud/atlas
   - Crée un cluster M0 (gratuit)
   - Copie la connection string
   - Ajoute-la dans les variables Node.js

9️⃣  SEED LES UTILISATEURS:
   - Ouvre: https://api.janus.tondomaine.com/seed-via-web.php
   - Clique "Seed Users"
   - SUPPRIME le fichier seed-via-web.php après

🔟  CONNEXION:
   - URL: https://manager.janus.tondomaine.com
   - Email: admin@janus-demo.com
   - Password: admin123

✅ C'EST TOUT! Aucune commande SSH nécessaire!

═══════════════════════════════════════════════════════════

📞 SUPPORT:

  Si problème, vérifie:
  - Plesk → Node.js → Logs (pour erreurs API)
  - Navigateur F12 → Console (pour erreurs frontend)
  - Guide complet: DEPLOIEMENT-PLESK-SANS-SSH.md

═══════════════════════════════════════════════════════════

🎉 Ton application Janus Platform sera en production!
