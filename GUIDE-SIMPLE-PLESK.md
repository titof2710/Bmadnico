# 🚀 Guide Ultra-Simple Plesk (Sans SSH)

## ⚡ Déploiement en 20 Minutes - 100% Interface Graphique

---

## 🎯 Étape 1: Créer les 3 Sous-domaines dans Plesk

### Dans Plesk → "Domaines" → "Ajouter un sous-domaine"

**Crée ces 3 sous-domaines:**

| Sous-domaine | Nom du dossier |
|--------------|----------------|
| `api` | `api` |
| `manager` | `manager` |
| `portal` | `portal` |

**Pour CHAQUE sous-domaine:**
1. Coche "Sécuriser avec Let's Encrypt (SSL)"
2. Coche "Redirection permanente HTTP → HTTPS"
3. Clique "OK"

**Résultat:** Tu as maintenant 3 URLs:
- `https://api.tondomaine.com`
- `https://manager.tondomaine.com`
- `https://portal.tondomaine.com`

---

## 📦 Étape 2: Préparer les Fichiers sur TON PC

### 2.1 Créer le ZIP

**Dans l'explorateur Windows:**

1. Va dans: `C:\Users\Admin\Desktop\nico bmad\janus-platform-demo\deploy-package`
2. Sélectionne TOUT le contenu (dossiers api, manager, portal + fichiers)
3. Clic droit → "Envoyer vers" → "Dossier compressé"
4. Nomme-le: `janus-plesk.zip`

---

## 📤 Étape 3: Upload dans Plesk File Manager

### 3.1 Upload le ZIP

1. **Plesk** → **Fichiers** (File Manager)
2. Va dans le dossier **racine** (httpdocs ou www)
3. Clique **"Upload"** (bouton en haut)
4. Sélectionne `janus-plesk.zip`
5. Attends que l'upload se termine

### 3.2 Décompresser le ZIP

1. **Clic droit** sur `janus-plesk.zip`
2. **"Extract"** (Extraire)
3. Destination: Le dossier actuel
4. Clique **"OK"**

**Résultat:** Tu as maintenant 3 dossiers:
```
httpdocs/
├── api/
├── manager/
└── portal/
```

### 3.3 Copier les Fichiers dans les Bons Endroits

**Pour chaque sous-domaine, copie le contenu:**

#### Pour API (api.tondomaine.com):
1. Ouvre le dossier du sous-domaine `api` dans File Manager
2. Upload TOUT le contenu de `httpdocs/api/*` dedans
   - index.js
   - api/ (dossier)
   - domain/ (dossier)
   - infrastructure/ (dossier)
   - etc.

#### Pour Manager (manager.tondomaine.com):
1. Ouvre le dossier du sous-domaine `manager`
2. Upload TOUT le contenu de `httpdocs/manager/*` dedans
   - index.html
   - assets/ (dossier)
   - test-users.html

#### Pour Portal (portal.tondomaine.com):
1. Ouvre le dossier du sous-domaine `portal`
2. Upload TOUT le contenu de `httpdocs/portal/*` dedans
   - index.html
   - assets/ (dossier)

### 3.4 Nettoyer

**Supprime** dans httpdocs/:
- Le dossier `api/`, `manager/`, `portal/` (vides maintenant)
- Le fichier `janus-plesk.zip`
- Les fichiers README.txt, DEPLOIEMENT-PLESK-SANS-SSH.md

---

## 🔧 Étape 4: Configurer Node.js pour l'API

### 4.1 Activer Node.js

**Plesk → Domaines → api.tondomaine.com → Node.js**

1. Coche **"Activer Node.js"**
2. **Version:** 20.x (ou la plus récente)
3. **Mode:** Production
4. **Document root:** `/httpdocs` (ou le chemin du dossier api)
5. **Application startup file:** `index.js`
6. **Ne clique PAS encore sur "Enable"!** (on va d'abord configurer les variables)

### 4.2 Ajouter les Variables d'Environnement

**Dans la même page, section "Environment variables":**

Clique **"Add variable"** pour chaque ligne:

| Nom | Valeur |
|-----|--------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `MONGODB_URI` | (voir Étape 5 MongoDB) |
| `JWT_SECRET` | (Clique [ici](https://www.random.org/strings/?num=1&len=32&digits=on&upperalpha=on&loweralpha=on&unique=on&format=plain&rnd=new) pour générer) |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_MANAGER_URL` | `https://manager.tondomaine.com` |
| `FRONTEND_PORTAL_URL` | `https://portal.tondomaine.com` |

**Maintenant clique "Enable Node.js"** → L'API va s'installer et démarrer!

---

## 🗄️ Étape 5: MongoDB Cloud (Gratuit)

### 5.1 Créer un Compte MongoDB Atlas

1. Va sur: https://www.mongodb.com/cloud/atlas
2. Clique **"Try Free"** → Crée un compte (Google ou Email)
3. Crée une **Organization** (nom: Janus Platform)
4. Crée un **Project** (nom: Janus Production)

### 5.2 Créer un Cluster GRATUIT

1. Clique **"Build a Database"**
2. Choisis **M0 FREE** (0$/mois)
3. Provider: **AWS** ou **Google Cloud**
4. Région: **Paris** ou la plus proche de toi
5. Nom du cluster: `janus-cluster`
6. Clique **"Create Deployment"**

### 5.3 Créer un Utilisateur DB

**Popup "Security Quickstart":**

1. **Username:** `janus_admin`
2. **Password:** Clique "Autogenerate Secure Password" → **COPIE LE MOT DE PASSE!**
3. Clique **"Create Database User"**

### 5.4 Whitelist les IPs

1. **Network Access** → "Add IP Address"
2. Choisis **"Allow Access from Anywhere"** (0.0.0.0/0)
3. Clique **"Confirm"**

### 5.5 Récupérer la Connection String

1. Clique **"Connect"** sur ton cluster
2. Choisis **"Drivers"**
3. **Copie** la connection string (ressemble à):
   ```
   mongodb+srv://janus_admin:<password>@janus-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. **Remplace `<password>`** par le vrai mot de passe que tu as copié
5. **Ajoute le nom de la DB** avant le `?`:
   ```
   mongodb+srv://janus_admin:TON_PASS@janus-cluster.xxxxx.mongodb.net/janus-platform?retryWrites=true&w=majority
   ```

### 5.6 Ajouter dans Plesk

**Plesk → api.tondomaine.com → Node.js → Environment Variables:**

1. Trouve la variable `MONGODB_URI`
2. Clique "Edit"
3. Colle ta connection string complète
4. Clique **"Restart App"** (en haut)

---

## 🌐 Étape 6: Configuration Nginx

### 6.1 Pour l'API (Reverse Proxy)

**Plesk → api.tondomaine.com → Apache & nginx Settings**

1. Clique sur l'onglet **"Additional nginx directives"**
2. Colle ce code:

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

### 6.2 Pour Manager et Portal (Vue Router)

**Pour manager.tondomaine.com ET portal.tondomaine.com:**

Répète la même chose dans **Apache & nginx Settings**:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Clique **"OK"**

---

## 🌱 Étape 7: Créer les Utilisateurs

### 7.1 Via le Script PHP

**Ouvre dans ton navigateur:**
```
https://api.tondomaine.com/seed-via-web.php
```

1. Le champ **MongoDB URI** est pré-rempli (depuis les variables d'environnement)
2. Clique **"Seed Users"**
3. Tu devrais voir: ✅ Successfully created 3 users!

### 7.2 IMPORTANT: Supprimer le Script

**Dans Plesk File Manager:**
1. Va dans le dossier `api.tondomaine.com`
2. **Supprime** le fichier `seed-via-web.php`
3. (Sécurité: ne JAMAIS laisser ce fichier en production!)

---

## ✅ Étape 8: TEST!

### 8.1 Tester l'API

Ouvre:
```
https://api.tondomaine.com
```

**Si ça fonctionne:** Tu devrais voir une erreur 404 ou un JSON (c'est normal!)

**Si erreur 502/503:** Vérifie Plesk → Node.js → Logs

### 8.2 Tester Manager

Ouvre:
```
https://manager.tondomaine.com
```

**Connecte-toi:**
- Email: `admin@janus-demo.com`
- Password: `admin123`

**SI ça marche:** Tu vois le dashboard! 🎉

**SI page blanche:**
- F12 → Console → Regarde les erreurs
- Vérifie que les URLs dans les variables Node.js sont correctes

### 8.3 Tester Portal

Ouvre:
```
https://portal.tondomaine.com
```

Tu devrais voir une page (même si vide sans token de session, c'est normal)

---

## 🎉 C'EST FINI!

**Ton application Janus Platform est EN LIGNE!**

🔗 **URLs Production:**
- Manager: https://manager.tondomaine.com
- Portal: https://portal.tondomaine.com
- API: https://api.tondomaine.com

👤 **Connexion:**
- Email: `admin@janus-demo.com`
- Password: `admin123`

---

## 🆘 Problèmes Courants

### "502 Bad Gateway" sur l'API

**Cause:** Node.js ne tourne pas

**Solution:**
1. Plesk → api.tondomaine.com → Node.js
2. Clique "Restart App"
3. Vérifie les logs en bas de la page

### "CORS Error" dans la console

**Cause:** URLs mal configurées

**Solution:**
1. Plesk → Node.js → Variables d'environnement
2. Vérifie que `FRONTEND_MANAGER_URL` et `FRONTEND_PORTAL_URL` sont EXACTEMENT comme dans le navigateur (https://)
3. Restart App

### "Cannot connect to MongoDB"

**Cause:** Connection string incorrecte

**Solution:**
1. Vérifie le mot de passe dans la connection string
2. Vérifie que l'IP est whitelistée dans Atlas (0.0.0.0/0)
3. Restart App

### Page blanche sur Manager/Portal

**Cause:** Fichiers mal uploadés

**Solution:**
1. Vérifie que `index.html` existe dans le dossier
2. Vérifie que le dossier `assets/` existe
3. F12 → Network → Regarde les erreurs 404

---

## 📞 Besoin d'Aide?

Capture d'écran de:
1. Les logs Plesk (Node.js → Logs)
2. La console navigateur (F12)
3. Les erreurs que tu vois

Et contacte le support! 💪
