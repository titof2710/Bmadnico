# 🚀 Guide de Déploiement Plesk - Janus Platform

## 📋 Architecture de Déploiement

```
Domaine Principal: janus.tondomaine.com
├── Backend API:      api.janus.tondomaine.com  (Port 3000)
├── Manager App:      manager.janus.tondomaine.com  (Build statique)
└── Test Portal:      portal.janus.tondomaine.com   (Build statique)
```

---

## 🔧 Étape 1: Préparation sur ton PC Local

### 1.1 Build de Production

```bash
cd "c:\Users\Admin\Desktop\nico bmad\janus-platform-demo"

# Build tout
npm run build

# Vérifier que les dossiers sont créés:
# - packages/backend/dist/
# - packages/manager/dist/
# - packages/test-portal/dist/
```

### 1.2 Compresser pour Upload

```bash
# Créer une archive ZIP du projet (sans node_modules)
# Dans PowerShell:
Compress-Archive -Path "c:\Users\Admin\Desktop\nico bmad\janus-platform-demo\*" -DestinationPath "c:\Users\Admin\Desktop\janus-platform-prod.zip" -Force

# OU manuellement:
# - Copie le dossier janus-platform-demo
# - Supprime tous les node_modules
# - ZIP le tout
```

---

## 🖥️ Étape 2: Configuration sur le Serveur Plesk

### 2.1 Créer les Domaines/Sous-domaines dans Plesk

1. **Connecte-toi à Plesk**
2. **Va dans "Domaines" → "Ajouter un domaine"**
3. **Crée 3 sous-domaines:**

| Sous-domaine | Type | Document Root |
|--------------|------|---------------|
| `api.janus.tondomaine.com` | Sous-domaine | `/var/www/vhosts/tondomaine.com/janus-api` |
| `manager.janus.tondomaine.com` | Sous-domaine | `/var/www/vhosts/tondomaine.com/janus-manager` |
| `portal.janus.tondomaine.com` | Sous-domaine | `/var/www/vhosts/tondomaine.com/janus-portal` |

### 2.2 Activer SSL (Certificats Let's Encrypt)

Pour chaque sous-domaine:
1. Va dans **"SSL/TLS Certificates"**
2. Clique **"Install a free basic certificate provided by Let's Encrypt"**
3. Coche **"Include a 'www' subdomain"** si besoin
4. Clique **"Get it free"**
5. Active **"Permanent SEO-safe 301 redirect from HTTP to HTTPS"**

---

## 📦 Étape 3: Upload et Installation

### 3.1 Se Connecter en SSH

```bash
ssh ton-user@ton-serveur.com
```

### 3.2 Créer la Structure de Répertoires

```bash
cd /var/www/vhosts/tondomaine.com

# Créer les dossiers
mkdir -p janus-api janus-manager janus-portal

# Donner les bonnes permissions
chown -R ton-user:psacln janus-*
```

### 3.3 Upload le Code

**Option A: Via SCP (depuis ton PC)**
```bash
scp janus-platform-prod.zip ton-user@ton-serveur.com:/var/www/vhosts/tondomaine.com/
```

**Option B: Via File Manager de Plesk**
- Utilise le gestionnaire de fichiers Plesk
- Upload `janus-platform-prod.zip`
- Décompresse-le

### 3.4 Extraire et Organiser

```bash
cd /var/www/vhosts/tondomaine.com

# Décompresser
unzip janus-platform-prod.zip -d janus-temp

# Organiser les fichiers
cp -r janus-temp/packages/backend/* janus-api/
cp -r janus-temp/packages/manager/dist/* janus-manager/
cp -r janus-temp/packages/test-portal/dist/* janus-portal/

# Copier aussi le package.json root et les configs
cp janus-temp/package.json janus-api/
cp janus-temp/package-lock.json janus-api/

# Nettoyer
rm -rf janus-temp janus-platform-prod.zip
```

---

## 🔧 Étape 4: Configuration Backend (API)

### 4.1 Installer Node.js (si pas déjà fait)

Dans Plesk → **"Node.js"** → Activer Node.js 20.x pour `api.janus.tondomaine.com`

### 4.2 Installer les Dépendances

```bash
cd /var/www/vhosts/tondomaine.com/janus-api

# Installer les dépendances de production uniquement
npm install --production
```

### 4.3 Configurer l'Environnement

```bash
cd /var/www/vhosts/tondomaine.com/janus-api

# Créer le fichier .env
nano .env
```

Copie ce contenu (ADAPTE LES VALEURS!):

```env
# Production Environment
NODE_ENV=production
PORT=3000

# MongoDB (Option 1: Local)
MONGODB_URI=mongodb://janus_user:TON_MOT_DE_PASSE@localhost:27017/janus-platform?authSource=admin

# MongoDB (Option 2: Atlas - Recommandé)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/janus-platform?retryWrites=true&w=majority

# JWT Secret (GENERE UN SECRET FORT!)
JWT_SECRET=CHANGE_MOI_SECRET_SUPER_SECURISE_MIN_32_CARACTERES_ALEATOIRES
JWT_EXPIRES_IN=7d

# Frontend URLs
FRONTEND_MANAGER_URL=https://manager.janus.tondomaine.com
FRONTEND_PORTAL_URL=https://portal.janus.tondomaine.com

# Stripe Production
STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_PRODUCTION
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_SECRET

# Email SMTP
SMTP_HOST=smtp.tonserveur.com
SMTP_PORT=587
SMTP_USER=noreply@tondomaine.com
SMTP_PASS=ton_mot_de_passe_email
SMTP_FROM=Janus Platform <noreply@tondomaine.com>
```

Sauvegarde avec `Ctrl+O`, puis `Ctrl+X`

### 4.4 Configurer MongoDB

**Option A: MongoDB Atlas (Recommandé - Cloud)**
1. Va sur https://www.mongodb.com/cloud/atlas
2. Crée un cluster gratuit
3. Crée un utilisateur DB
4. Whitelist l'IP de ton serveur
5. Copie la connection string dans `.env`

**Option B: MongoDB Local sur le serveur**
```bash
# Installer MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Créer un utilisateur
mongosh
> use admin
> db.createUser({
  user: "janus_user",
  pwd: "TON_MOT_DE_PASSE_FORT",
  roles: [{role: "readWrite", db: "janus-platform"}]
})
> exit
```

---

## 🚀 Étape 5: Démarrer le Backend avec PM2

### 5.1 Installer PM2 (Process Manager)

```bash
npm install -g pm2
```

### 5.2 Créer le fichier ecosystem

```bash
cd /var/www/vhosts/tondomaine.com/janus-api
nano ecosystem.config.js
```

Contenu:
```javascript
module.exports = {
  apps: [{
    name: 'janus-api',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
```

### 5.3 Démarrer l'API

```bash
cd /var/www/vhosts/tondomaine.com/janus-api

# Créer le dossier logs
mkdir -p logs

# Démarrer avec PM2
pm2 start ecosystem.config.js

# Vérifier que ça tourne
pm2 status
pm2 logs janus-api

# Auto-démarrage au reboot du serveur
pm2 startup
pm2 save
```

---

## 🌐 Étape 6: Configurer Nginx/Apache (Reverse Proxy)

### 6.1 Pour le Backend (api.janus.tondomaine.com)

Dans Plesk → Domaines → `api.janus.tondomaine.com` → **"Apache & nginx Settings"**

**Section "Additional nginx directives":**

```nginx
location / {
    proxy_pass http://localhost:3000;
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

Clique **"OK"** → Nginx se recharge automatiquement.

### 6.2 Pour Manager et Portal (Fichiers Statiques)

Pas besoin de config spéciale! Les fichiers dans `/dist/` sont servis directement.

Mais pour le routing Vue.js, ajoute dans **"Apache & nginx Settings"** pour `manager.janus.tondomaine.com` et `portal.janus.tondomaine.com`:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## 🗄️ Étape 7: Seed des Données

```bash
cd /var/www/vhosts/tondomaine.com/janus-api

# Seeder les utilisateurs
npm run seed:users

# Seeder les sessions de démo (optionnel)
npm run seed
```

---

## ✅ Étape 8: Tester le Déploiement

### 8.1 Tester l'API

```bash
curl https://api.janus.tondomaine.com/health
# Devrait retourner: {"status":"ok"}
```

### 8.2 Tester le Manager

Ouvre dans le navigateur: `https://manager.janus.tondomaine.com`

- Devrait afficher la page de login
- Console: pas d'erreurs
- Network: pas d'erreurs CORS

### 8.3 Se Connecter

Utilise les credentials de seed:
- Email: `admin@janus-demo.com`
- Password: `admin123`

---

## 🔒 Étape 9: Sécurité Post-Déploiement

### 9.1 Changer les Secrets

```bash
# Générer un JWT Secret fort
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Mettre à jour dans .env
nano /var/www/vhosts/tondomaine.com/janus-api/.env

# Redémarrer
pm2 restart janus-api
```

### 9.2 Firewall

```bash
# Autoriser seulement les ports nécessaires
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 9.3 Monitoring

```bash
# Installer PM2 monitoring (optionnel)
pm2 install pm2-logrotate

# Logs
pm2 logs janus-api --lines 100
```

---

## 🔄 Mise à Jour du Code (Déploiements Futurs)

```bash
# Sur ton PC local
git pull
npm run build
scp -r packages/backend/dist/* ton-user@serveur:/var/www/vhosts/tondomaine.com/janus-api/dist/
scp -r packages/manager/dist/* ton-user@serveur:/var/www/vhosts/tondomaine.com/janus-manager/
scp -r packages/test-portal/dist/* ton-user@serveur:/var/www/vhosts/tondomaine.com/janus-portal/

# Sur le serveur
pm2 restart janus-api
```

---

## 🆘 Troubleshooting

### Erreur: "Cannot connect to MongoDB"
```bash
# Vérifier MongoDB
sudo systemctl status mongod
# OU si Atlas, vérifier IP whitelist
```

### Erreur: "CORS Policy"
```bash
# Vérifier .env FRONTEND_MANAGER_URL et FRONTEND_PORTAL_URL
# Vérifier que les URLs sont exactes (https://)
```

### API ne démarre pas
```bash
pm2 logs janus-api --lines 50
# Regarder les erreurs
```

### Frontend: Page blanche
```bash
# Vérifier console navigateur (F12)
# Vérifier que VITE_API_URL est correct dans le build
```

---

## 📞 Support

En cas de problème, partage:
1. Les logs PM2: `pm2 logs janus-api --lines 100`
2. Les erreurs navigateur (Console F12)
3. La config Nginx/Apache

---

**🎉 Félicitations! Janus Platform est maintenant en production!**
