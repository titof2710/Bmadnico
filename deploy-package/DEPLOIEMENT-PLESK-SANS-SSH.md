# 🚀 Déploiement Plesk SANS SSH - 100% Interface Graphique

## 🎯 Déploiement en 15 Minutes via Plesk Interface

**Aucune commande SSH requise! Tout se fait via l'interface Plesk.**

---

## 📦 Étape 1: Préparation du Package (Sur ton PC)

### 1.1 Extraire les fichiers de production

Exécute ce script sur ton PC Windows:

```powershell
# Ouvre PowerShell dans le dossier du projet
cd "C:\Users\Admin\Desktop\nico bmad\janus-platform-demo"

# Créer le dossier de déploiement
New-Item -ItemType Directory -Force -Path "deploy-package"
New-Item -ItemType Directory -Force -Path "deploy-package\api"
New-Item -ItemType Directory -Force -Path "deploy-package\manager"
New-Item -ItemType Directory -Force -Path "deploy-package\portal"

# Copier les fichiers de production
Copy-Item -Recurse "packages\backend\dist\*" "deploy-package\api\"
Copy-Item "packages\backend\package.json" "deploy-package\api\"
Copy-Item "packages\backend\.env.production" "deploy-package\api\.env.example"
Copy-Item -Recurse "packages\manager\dist\*" "deploy-package\manager\"
Copy-Item -Recurse "packages\test-portal\dist\*" "deploy-package\portal\"

# Copier les scripts d'installation
Copy-Item "plesk-install.php" "deploy-package\"

Write-Host "✅ Package créé dans deploy-package/"
```

### 1.2 Modifier les URLs de production

**Édite `deploy-package/api/.env.example`:**

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://TON_USER:TON_PASS@cluster.mongodb.net/janus
JWT_SECRET=GENERE_UN_SECRET_ALEATOIRE_32_CHARS
JWT_EXPIRES_IN=7d
FRONTEND_MANAGER_URL=https://manager.janus.tondomaine.com
FRONTEND_PORTAL_URL=https://portal.janus.tondomaine.com
STRIPE_SECRET_KEY=sk_live_xxx
SMTP_HOST=smtp.tonserveur.com
SMTP_PORT=587
SMTP_USER=noreply@tondomaine.com
SMTP_PASS=ton_password
SMTP_FROM=Janus <noreply@tondomaine.com>
```

### 1.3 Créer l'archive ZIP

**Dans l'explorateur Windows:**
1. Ouvre le dossier `deploy-package`
2. Sélectionne TOUT le contenu (api, manager, portal, plesk-install.php)
3. Clic droit → Envoyer vers → Dossier compressé
4. Nomme le fichier: `janus-prod-plesk.zip`

---

## 🌐 Étape 2: Configuration Plesk (Interface Web)

### 2.1 Créer les Sous-domaines

**Dans Plesk → Domaines:**

1. **Clique "Ajouter un sous-domaine"** (3 fois)

| Sous-domaine | Document Root |
|--------------|---------------|
| `api` | `janus-api` |
| `manager` | `janus-manager` |
| `portal` | `janus-portal` |

2. **Pour chaque sous-domaine:**
   - Coche "Utiliser le chiffrement SSL/TLS"
   - Sélectionne "Let's Encrypt" → Installer
   - Active "Redirection permanente de HTTP vers HTTPS"

### 2.2 Activer Node.js pour l'API

**Plesk → Domaines → api.janus.tondomaine.com:**

1. Va dans **"Node.js"** (dans le menu de gauche)
2. Coche **"Activer Node.js"**
3. Version: **20.x** (ou la plus récente)
4. Mode: **Production**
5. Document root: `/httpdocs`
6. Application startup file: `index.js`
7. **IMPORTANT:** Note le chemin complet (ex: `/var/www/vhosts/tondomaine.com/janus-api`)

### 2.3 Configurer Variables d'Environnement

**Toujours dans Node.js settings de l'API:**

Ajoute ces variables d'environnement (bouton "Ajouter une variable"):

| Nom | Valeur |
|-----|--------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/janus` |
| `JWT_SECRET` | `ton_secret_32_caracteres_aleatoires` |
| `FRONTEND_MANAGER_URL` | `https://manager.janus.tondomaine.com` |
| `FRONTEND_PORTAL_URL` | `https://portal.janus.tondomaine.com` |

Clique **"Activer Node.js"** → L'application démarre automatiquement

---

## 📤 Étape 3: Upload des Fichiers (File Manager)

### 3.1 Accéder au File Manager

**Plesk → Fichiers:**

1. Va dans `/httpdocs` (ou le dossier racine de ton domaine)
2. Tu devrais voir les dossiers: `janus-api`, `janus-manager`, `janus-portal`

### 3.2 Upload du ZIP

**Pour chaque dossier:**

#### Pour `janus-api`:
1. Entre dans le dossier `janus-api`
2. Clique **"Upload"** (bouton en haut)
3. Upload le contenu du dossier `deploy-package/api/*`
4. Les fichiers apparaissent automatiquement

#### Pour `janus-manager`:
1. Entre dans `janus-manager`
2. Upload le contenu de `deploy-package/manager/*`

#### Pour `janus-portal`:
1. Entre dans `janus-portal`
2. Upload le contenu de `deploy-package/portal/*`

### 3.3 Installer les Dépendances (via Plesk)

**Plesk → api.janus.tondomaine.com → Node.js:**

1. Dans la section **"NPM"**
2. Clique **"Installer les dépendances"**
3. Plesk exécute automatiquement `npm install --production`
4. Attends que l'installation se termine (barre de progression)

---

## 🔧 Étape 4: Configuration Nginx (Reverse Proxy)

### 4.1 Pour l'API (api.janus.tondomaine.com)

**Plesk → Domaines → api.janus.tondomaine.com → Apache & nginx:**

1. Clique sur l'onglet **"Paramètres nginx supplémentaires"**
2. Dans la zone de texte, colle:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

3. Clique **"OK"**

### 4.2 Pour Manager et Portal (Routing Vue.js)

**Pour manager.janus.tondomaine.com ET portal.janus.tondomaine.com:**

1. Même chose → **Apache & nginx**
2. Paramètres nginx supplémentaires:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

3. Clique **"OK"**

---

## ✅ Étape 5: Vérification

### 5.1 Tester l'API

Ouvre dans le navigateur:
```
https://api.janus.tondomaine.com
```

Tu devrais voir une réponse (même si erreur MongoDB, c'est normal pour l'instant).

### 5.2 Tester Manager

```
https://manager.janus.tondomaine.com
```

→ Page de login doit s'afficher

### 5.3 Tester Portal

```
https://portal.janus.tondomaine.com
```

→ Page doit s'afficher (même si vide sans token)

---

## 🗄️ Étape 6: MongoDB Cloud (Atlas - Gratuit)

**Tu DOIS avoir MongoDB. Option gratuite Cloud Atlas:**

1. Va sur https://www.mongodb.com/cloud/atlas
2. **Crée un compte** (gratuit)
3. **Crée un cluster** → Choisis M0 (FREE)
4. **Crée un utilisateur DB:**
   - Username: `janus_admin`
   - Password: (génère un mot de passe fort, GARDE-LE!)
5. **Network Access:**
   - Clique "Add IP Address"
   - Choisis "Allow Access from Anywhere" (0.0.0.0/0)
   - Clique "Confirm"
6. **Connection String:**
   - Clique "Connect" → "Connect your application"
   - Copie la connection string (ressemble à ça):
     ```
     mongodb+srv://janus_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Remplace `<password>` par ton vrai mot de passe
   - Change le nom de la DB: `/janus-platform?retryWrites=true&w=majority`

7. **Dans Plesk → Node.js → Variables d'environnement:**
   - Modifie `MONGODB_URI` avec ta vraie connection string
   - Clique "Redémarrer l'application"

---

## 🌱 Étape 7: Seed des Données (via Script PHP)

**Plesk → File Manager → janus-api:**

1. Upload le fichier `seed-via-web.php`
2. Ouvre dans le navigateur:
   ```
   https://api.janus.tondomaine.com/seed-via-web.php
   ```
3. Clique sur "Seed Users"
4. Les utilisateurs sont créés!
5. **SUPPRIME le fichier** `seed-via-web.php` (sécurité!)

---

## 🎉 Étape 8: Connexion

**Va sur:**
```
https://manager.janus.tondomaine.com
```

**Connecte-toi avec:**
- Email: `admin@janus-demo.com`
- Password: `admin123`

**Ça marche!** 🚀

---

## 🔄 Mises à Jour Futures

**Pour mettre à jour le code:**

1. Sur ton PC: `npm run build`
2. Dans Plesk File Manager:
   - Supprime les fichiers dans `janus-api`, `janus-manager`, `janus-portal`
   - Upload les nouveaux fichiers
3. Plesk → Node.js → "Redémarrer l'application"

**C'est tout!**

---

## 🆘 Troubleshooting (Sans SSH!)

### L'API ne démarre pas

**Plesk → Node.js → Logs:**
- Clique sur "View Logs"
- Regarde les erreurs
- Problème fréquent: MongoDB connection string incorrect

### CORS Errors dans la console navigateur

**Vérifie:**
- Les URLs dans Variables d'environnement Node.js
- Elles doivent être EXACTEMENT comme dans le navigateur (https://)

### Page blanche

**F12 → Console:**
- Si erreur API: vérifie que l'API tourne (Plesk → Node.js → Status: Running)
- Si erreur 404: vérifie la config nginx (paramètres supplémentaires)

---

## 📞 Support Plesk

Si un problème technique avec Plesk:
- Ouvre un ticket via Plesk Support
- Ou contacte ton hébergeur

**Ton application est maintenant en production! 🎊**
