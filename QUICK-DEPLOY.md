# ⚡ Quick Deploy - Résumé Ultra-Rapide

## 🎯 Pour Déployer en 10 Minutes

### 1️⃣ Sur TON PC (Windows)

```bash
cd "c:\Users\Admin\Desktop\nico bmad\janus-platform-demo"

# Editer les URLs de production
# Dans packages/manager/.env.production et packages/test-portal/.env.production
# Remplace "tondomaine.com" par ton vrai domaine

# Build
npm run build

# Créer un ZIP (manuellement via Explorer ou PowerShell):
# Sélectionne tous les fichiers SAUF node_modules
# Clic droit → Envoyer vers → Dossier compressé
# Nom: janus-prod.zip
```

### 2️⃣ Dans PLESK

#### A) Créer 3 Sous-domaines

| Nom | Document Root |
|-----|---------------|
| `api.janus.tondomaine.com` | `/janus-api` |
| `manager.janus.tondomaine.com` | `/janus-manager` |
| `portal.janus.tondomaine.com` | `/janus-portal` |

**Pour chacun:** Active SSL Let's Encrypt

#### B) Activer Node.js pour l'API

- Domaine: `api.janus.tondomaine.com`
- Va dans **Node.js**
- Sélectionne **Node.js 20.x**
- Application Mode: **Production**
- Document Root: `/janus-api`

### 3️⃣ Upload via File Manager Plesk

1. Upload `janus-prod.zip` dans `/var/www/vhosts/tondomaine.com/`
2. Décompresse le ZIP
3. Organise les fichiers:

```bash
# Via Terminal SSH ou File Manager:
cp -r packages/backend/dist/* janus-api/
cp -r packages/backend/package.json janus-api/
cp -r packages/manager/dist/* janus-manager/
cp -r packages/test-portal/dist/* janus-portal/
```

### 4️⃣ Configuration Backend (SSH)

```bash
cd /var/www/vhosts/tondomaine.com/janus-api

# Créer .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/janus
JWT_SECRET=CHANGE_CE_SECRET_32_CHARS_MIN
JWT_EXPIRES_IN=7d
FRONTEND_MANAGER_URL=https://manager.janus.tondomaine.com
FRONTEND_PORTAL_URL=https://portal.janus.tondomaine.com
EOF

# Installer dépendances
npm install --production

# Installer PM2
npm install -g pm2

# Démarrer
pm2 start dist/index.js --name janus-api
pm2 startup
pm2 save
```

### 5️⃣ Configurer Reverse Proxy

**Dans Plesk → api.janus.tondomaine.com → Apache & nginx Settings**

Section **"Additional nginx directives":**

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Dans manager.janus.tondomaine.com et portal.janus.tondomaine.com:**

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 6️⃣ Seed les Données

```bash
cd /var/www/vhosts/tondomaine.com/janus-api
npm run seed:users
```

### 7️⃣ Test

Ouvre `https://manager.janus.tondomaine.com`

Connecte-toi:
- Email: `admin@janus-demo.com`
- Password: `admin123`

---

## 🔥 Checklist Rapide

- [ ] 3 sous-domaines créés dans Plesk
- [ ] SSL activé (Let's Encrypt)
- [ ] Node.js 20.x activé pour API
- [ ] Fichiers uploadés et organisés
- [ ] `.env` créé avec bonnes valeurs
- [ ] `npm install --production` exécuté
- [ ] PM2 installé et API démarrée
- [ ] Nginx reverse proxy configuré
- [ ] Utilisateurs seedés
- [ ] Test de connexion OK

---

## 💡 MongoDB: 2 Options

### Option 1: MongoDB Atlas (Cloud - Gratuit - RECOMMANDÉ)

1. Va sur https://www.mongodb.com/cloud/atlas
2. Crée un compte et un cluster M0 (gratuit)
3. Crée un user DB
4. Whitelist IP: `0.0.0.0/0` (ou IP de ton serveur)
5. Copie la connection string
6. Colle dans `.env` → `MONGODB_URI`

### Option 2: MongoDB Local

```bash
# Sur le serveur Plesk
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Connection string dans .env:
MONGODB_URI=mongodb://localhost:27017/janus-platform
```

---

## 🆘 En Cas de Problème

### API ne démarre pas
```bash
pm2 logs janus-api
```

### CORS Errors
Vérifie que `FRONTEND_MANAGER_URL` et `FRONTEND_PORTAL_URL` dans `.env` sont EXACTEMENT les mêmes URLs que dans le navigateur (avec https://)

### Page blanche Frontend
1. F12 → Console → Regarde les erreurs
2. Vérifie que `VITE_API_URL` était correct au moment du build
3. Si erreur, rebuild avec la bonne URL et re-upload

---

**📖 Guide Complet:** Voir [DEPLOIEMENT-PLESK.md](./DEPLOIEMENT-PLESK.md)
