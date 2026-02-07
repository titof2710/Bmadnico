# 🚀 Déploiement Cloud 100% GRATUIT

## Architecture: Netlify + Render + MongoDB Atlas

**Frontends** → Netlify (gratuit, illimité)
**Backend API** → Render (gratuit, 750h/mois)
**Database** → MongoDB Atlas (gratuit, 512MB)

**Temps de déploiement:** 15 minutes
**Coût:** 0€/mois

---

## 📋 Vue d'Ensemble

```
https://janus-manager.netlify.app     → Manager (Netlify)
https://janus-portal.netlify.app      → Portal (Netlify)
https://janus-api.onrender.com        → Backend API (Render)
mongodb+srv://...mongodb.net/janus    → MongoDB (Atlas)
```

---

## 🗄️ ÉTAPE 1: MongoDB Atlas (Base de Données)

### 1.1 Créer un Compte

1. Va sur: https://www.mongodb.com/cloud/atlas
2. Clique **"Try Free"**
3. Crée un compte (Google/Email)

### 1.2 Créer un Cluster GRATUIT

1. Clique **"Build a Database"**
2. Choisis **M0 FREE** (512MB - 0$/mois)
3. Provider: **AWS**
4. Région: **Paris (eu-west-3)** ou la plus proche
5. Nom: `janus-cluster`
6. Clique **"Create Deployment"**

### 1.3 Créer un Utilisateur

**Popup "Security Quickstart":**

1. Username: `janus_admin`
2. Password: Clique **"Autogenerate"** → **COPIE LE MOT DE PASSE!**
3. Clique **"Create Database User"**

### 1.4 Whitelist les IPs

1. **"Where would you like to connect from?"**
2. Choisis **"My Local Environment"**
3. Clique **"Add My Current IP Address"**
4. **PUIS** clique **"Add IP Address"** → Ajoute `0.0.0.0/0` (Allow from anywhere)
5. Clique **"Finish and Close"**

### 1.5 Récupérer la Connection String

1. Clique **"Connect"** sur ton cluster
2. **"Drivers"** → **"Node.js"**
3. Copie la connection string:
   ```
   mongodb+srv://janus_admin:<password>@janus-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

4. **Modifie-la:**
   - Remplace `<password>` par ton vrai mot de passe
   - Ajoute `/janus-platform` avant le `?`:
   ```
   mongodb+srv://janus_admin:TON_PASS@janus-cluster.xxxxx.mongodb.net/janus-platform?retryWrites=true&w=majority
   ```

5. **GARDE cette connection string!** Tu en auras besoin pour Render.

---

## 🖥️ ÉTAPE 2: Render (Backend API)

### 2.1 Créer un Compte

1. Va sur: https://render.com
2. Clique **"Get Started"**
3. Connecte-toi avec **GitHub** (recommandé)

### 2.2 Connecter le Repo GitHub

1. Clique **"New +"** → **"Web Service"**
2. Connecte ton repo GitHub: `https://github.com/titof2710/Bmadnico`
3. Clique **"Connect"** à côté de ton repo

### 2.3 Configurer le Service

**Settings:**

| Paramètre | Valeur |
|-----------|--------|
| **Name** | `janus-api` |
| **Region** | `Frankfurt (EU Central)` |
| **Branch** | `main` |
| **Root Directory** | `packages/backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/index.js` |
| **Instance Type** | `Free` (750h/mois gratuit) |

### 2.4 Variables d'Environnement

**Clique "Advanced" → "Add Environment Variable":**

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `MONGODB_URI` | `mongodb+srv://janus_admin:...` (ta connection string) |
| `JWT_SECRET` | (Génère 32 chars: https://www.random.org/strings/) |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_MANAGER_URL` | `https://janus-manager.netlify.app` (à modifier après Netlify) |
| `FRONTEND_PORTAL_URL` | `https://janus-portal.netlify.app` (à modifier après Netlify) |

### 2.5 Déployer

1. Clique **"Create Web Service"**
2. Attends 3-5 minutes (build + deploy)
3. Une fois déployé, note l'URL: `https://janus-api.onrender.com`

### 2.6 Tester l'API

Ouvre: `https://janus-api.onrender.com`

Si tu vois un JSON ou une erreur 404 → **C'est bon!** L'API tourne.

---

## 🌐 ÉTAPE 3: Netlify (Manager Frontend)

### 3.1 Créer un Compte

1. Va sur: https://www.netlify.com
2. Clique **"Sign up"**
3. Connecte-toi avec **GitHub**

### 3.2 Déployer Manager

#### Option A: Via l'Interface Netlify (Le Plus Simple)

1. Clique **"Add new site"** → **"Import an existing project"**
2. **"Deploy with GitHub"**
3. Choisis le repo: `Bmadnico`
4. **Settings:**
   - **Branch:** `main`
   - **Base directory:** `packages/manager`
   - **Build command:** `npm run build`
   - **Publish directory:** `packages/manager/dist`

5. **Environment variables** (clique "Show advanced"):
   - `VITE_API_URL` = `https://janus-api.onrender.com` (ton URL Render)

6. Clique **"Deploy site"**

7. Attends 2-3 minutes

8. Une fois déployé, note l'URL: `https://random-name-123.netlify.app`

#### Option B: Via netlify.toml (Automatique)

Crée `packages/manager/netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Puis push sur GitHub, Netlify détecte et déploie automatiquement!

### 3.3 Configurer le Domaine (Optionnel)

1. **Site settings** → **Domain management**
2. **Add custom domain** → `manager.tondomaine.com`
3. Suis les instructions pour configurer le DNS

Ou utilise le domaine Netlify gratuit: `*.netlify.app`

### 3.4 Mettre à Jour l'URL Backend

**Render → Environment Variables:**

Modifie `FRONTEND_MANAGER_URL` avec ta vraie URL Netlify:
```
https://janus-manager.netlify.app
```

Redéploie: **Manual Deploy** → **Deploy latest commit**

---

## 🎯 ÉTAPE 4: Netlify (Portal Frontend)

**Répète la même chose pour le Portal:**

1. **"Add new site"** → **"Import project"**
2. Même repo: `Bmadnico`
3. **Settings:**
   - **Base directory:** `packages/test-portal`
   - **Build command:** `npm run build`
   - **Publish directory:** `packages/test-portal/dist`
   - **Environment:** `VITE_API_URL` = `https://janus-api.onrender.com`

4. Déploie

5. Note l'URL: `https://janus-portal.netlify.app`

6. **Retourne sur Render** → Modifie `FRONTEND_PORTAL_URL`

---

## 🌱 ÉTAPE 5: Seed les Utilisateurs

### Option 1: Via Script (Recommandé)

**Sur ton PC:**

```bash
cd "c:\Users\Admin\Desktop\nico bmad\janus-platform-demo\packages\backend"

# Configure la connection MongoDB
$env:MONGODB_URI="mongodb+srv://janus_admin:PASS@cluster.mongodb.net/janus-platform"

# Seed les users
npm run seed:users
```

### Option 2: Via l'API Web

1. Upload `seed-via-web.php` sur Render (pas possible directement)
2. **OU** crée un endpoint temporaire dans le backend

Ajoute dans `packages/backend/src/index.ts`:

```typescript
// TEMPORAIRE - Endpoint pour seed (SUPPRIMER après utilisation!)
app.get('/admin/seed-users', async (req, res) => {
  // Copie le code de seed-users.ts ici
  // Retourne un JSON avec les users créés
});
```

Puis ouvre: `https://janus-api.onrender.com/admin/seed-users`

**IMPORTANT:** Supprime cet endpoint après le seed!

---

## ✅ ÉTAPE 6: Test Final

### 6.1 Tester Manager

Ouvre: `https://janus-manager.netlify.app`

**Connecte-toi:**
- Email: `admin@janus-demo.com`
- Password: `admin123`

**Si ça marche:** Tu vois le dashboard! 🎉

### 6.2 Tester Portal

Ouvre: `https://janus-portal.netlify.app`

Tu devrais voir la page (même si vide sans session)

---

## 📊 Résumé des URLs

| Service | URL | Coût |
|---------|-----|------|
| Manager | `https://janus-manager.netlify.app` | Gratuit |
| Portal | `https://janus-portal.netlify.app` | Gratuit |
| API | `https://janus-api.onrender.com` | Gratuit (750h/mois) |
| MongoDB | `mongodb+srv://...` | Gratuit (512MB) |

**Total: 0€/mois** ✨

---

## 🔄 Mises à Jour Automatiques

**Avantage de Netlify + Render:**

Chaque fois que tu push sur GitHub (branch `main`):
- Netlify rebuild automatiquement les frontends
- Render rebuild automatiquement le backend

**Tu n'as RIEN à faire!** 🚀

---

## ⚠️ Limitations du Plan Gratuit

### Render (Backend)
- **750 heures/mois** (assez pour 1 instance 24/7)
- **512MB RAM**
- L'instance **s'endort après 15min d'inactivité** (redémarre en ~30s au 1er appel)
- **Build time: 500 min/mois**

**Solution si limitation:** Upgrade à 7$/mois pour instance toujours active.

### Netlify (Frontends)
- **100GB bandwidth/mois** (largement suffisant)
- **Build time: 300 min/mois**
- Illimité pour le reste!

### MongoDB Atlas
- **512MB stockage**
- **Pas de backup automatique** (faire des exports manuels)

---

## 🆘 Troubleshooting

### Backend ne démarre pas (Render)

**Vérifie les logs:**
1. Render Dashboard → Ton service
2. **Logs** (en haut)
3. Regarde les erreurs

**Problèmes courants:**
- MongoDB connection string incorrecte
- Variable d'environnement manquante

### CORS Errors

**Vérifie les URLs:**
- `FRONTEND_MANAGER_URL` et `FRONTEND_PORTAL_URL` sur Render
- Doivent être EXACTEMENT les URLs Netlify (avec https://)

### Instance Render s'endort

**C'est normal!** Plan gratuit.

**Solutions:**
1. Accepte 30s de latence au 1er appel
2. Utilise un service de ping (https://uptimerobot.com - gratuit)
3. Upgrade à 7$/mois pour instance always-on

---

## 💡 Domaines Personnalisés

### Pour Netlify (Frontends)

1. Achète un domaine (ex: OVH, Namecheap)
2. Netlify → **Domain settings** → **Add custom domain**
3. Configure les DNS chez ton registrar:
   ```
   CNAME manager janus-manager.netlify.app
   CNAME portal  janus-portal.netlify.app
   ```
4. SSL automatique avec Let's Encrypt

### Pour Render (Backend)

1. Render → **Settings** → **Custom Domain**
2. Ajoute `api.tondomaine.com`
3. Configure DNS:
   ```
   CNAME api janus-api.onrender.com
   ```

---

## 🎉 Félicitations!

**Ton application est 100% en production sur le cloud!**

- ✅ Déploiement automatique via Git
- ✅ SSL gratuit
- ✅ Scalabilité automatique
- ✅ 0€/mois
- ✅ Aucune maintenance serveur

**C'est la méthode la plus moderne et la plus simple!** 🚀
