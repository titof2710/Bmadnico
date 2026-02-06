# 🔐 Guide de Connexion - Janus Platform Demo

## 🚀 Comment se connecter

### URL de connexion
**Page de login:** http://localhost:5178/login

### 🎯 Interface de Login

La page de login affiche **5 cartes cliquables** pour les comptes de démonstration:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              🚀 Janus Platform                             │
│      Sélectionnez un compte pour la démonstration          │
│                                                             │
├─────────────────┬─────────────────┬─────────────────────────┤
│                 │                 │                         │
│   👑            │   💼            │   💼                    │
│   Admin         │   Manager       │   Manager               │
│   Pierre Admin  │   Sophie Gest.  │   Marc Resp.           │
│   Janus Platf.  │   ACME Corp     │   TechStart SAS        │
│                 │                 │                         │
│ [CLIQUER ICI]  │ [CLIQUER ICI]   │ [CLIQUER ICI]          │
└─────────────────┴─────────────────┴─────────────────────────┘

┌─────────────────┬─────────────────────────────────────────┐
│                 │                                         │
│   👤            │   👤                                    │
│   Participant   │   Participant                           │
│   Julie Cand.   │   Jean Dupont                          │
│   ACME Corp     │   TechStart SAS                        │
│                 │                                         │
│ [CLIQUER ICI]  │ [CLIQUER ICI]                           │
└─────────────────┴─────────────────────────────────────────┘
```

## 📋 Comptes Disponibles

### 🔴 1. ADMIN - Accès Total

**Nom:** Pierre Administrateur
**Organisation:** Janus Platform
**Email:** admin@janus-demo.com
**Redirection:** `/admin` (Platform Admin Dashboard)

**Accès:**
- ✅ Platform Admin Dashboard
- ✅ Global KPIs
- ✅ License Pools
- ✅ Toutes les organisations
- ✅ Tous les endpoints

---

### 🟢 2. MANAGER - ACME Corporation

**Nom:** Sophie Gestionnaire
**Organisation:** ACME Corporation
**Email:** manager@acme-corp.com
**Redirection:** `/license-pools`

**Accès:**
- ✅ License Pools Management
- ✅ Ses sessions uniquement
- ✅ Ses licences uniquement
- ❌ Platform Admin (bloqué)

---

### 🟢 3. MANAGER - TechStart SAS

**Nom:** Marc Responsable
**Organisation:** TechStart SAS
**Email:** manager@techstart.fr
**Redirection:** `/license-pools`

**Accès:**
- ✅ License Pools Management
- ✅ Ses sessions uniquement
- ✅ Ses licences uniquement
- ❌ Platform Admin (bloqué)

---

### 🔵 4. PARTICIPANT - ACME Corp

**Nom:** Julie Candidate
**Organisation:** ACME Corporation
**Email:** participant@acme-corp.com
**Redirection:** `/` (Dashboard)

**Accès:**
- ✅ Ses assessments uniquement
- ❌ License Pools (bloqué)
- ❌ Platform Admin (bloqué)

---

### 🔵 5. PARTICIPANT - TechStart SAS

**Nom:** Jean Dupont
**Organisation:** TechStart SAS
**Email:** jean.dupont@test.fr
**Redirection:** `/` (Dashboard)

**Accès:**
- ✅ Ses assessments uniquement
- ❌ License Pools (bloqué)
- ❌ Platform Admin (bloqué)

---

## 🎮 Comment Utiliser

### Étape 1: Accéder à la page de login
```
http://localhost:5178/login
```

### Étape 2: Cliquer sur une carte
- Cliquez directement sur la carte du compte que vous voulez utiliser
- La connexion se fait automatiquement
- Vous êtes redirigé selon votre rôle

### Étape 3: Navigation
- Admin → `/admin` (Platform Admin)
- Manager → `/license-pools` (License Pools)
- Participant → `/` (Dashboard)

### Étape 4: Déconnexion
- Cliquez sur le bouton **🚪 Déconnexion** en haut à droite
- Vous revenez sur la page de login

---

## 🔒 Protection des Routes

### Routes protégées par authentification:
```javascript
'/' - Dashboard (requires auth)
'/admin' - Platform Admin (requires auth + role: admin)
'/license-pools' - License Pools (requires auth + roles: [admin, manager])
'/results/:id' - Results (requires auth)
```

### Comportements:
- **Sans token:** Redirection automatique vers `/login`
- **Avec token mais rôle insuffisant:** Message d'erreur + redirection vers `/`
- **Déjà connecté sur `/login`:** Redirection vers `/`

---

## 🧪 Tester les Permissions

### Test 1: Admin voit tout
1. Se connecter avec **admin@janus-demo.com**
2. ✅ Accès à `/admin` (Platform Admin)
3. ✅ Accès à `/license-pools`
4. ✅ Voir tous les KPIs globaux

### Test 2: Manager limité
1. Se connecter avec **manager@acme-corp.com**
2. ✅ Accès à `/license-pools`
3. ❌ Tenter d'accéder à `/admin` → Bloqué avec message

### Test 3: Participant restreint
1. Se connecter avec **participant@acme-corp.com**
2. ✅ Accès à `/` (Dashboard)
3. ❌ Tenter d'accéder à `/admin` → Bloqué
4. ❌ Tenter d'accéder à `/license-pools` → Bloqué

### Test 4: Isolation Multi-Tenant
1. Se connecter avec **manager@acme-corp.com**
2. Noter l'org: `org-acme-001`
3. Se déconnecter
4. Se connecter avec **manager@techstart.fr**
5. Noter l'org: `org-techstart-001`
6. ✅ Les deux managers ne voient que leurs données

---

## 💾 Stockage Local

Après connexion, le système stocke:

```javascript
// Dans localStorage:
{
  "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin-001",
    "email": "admin@janus-demo.com",
    "name": "Pierre Administrateur",
    "role": "admin",
    "organizationId": "platform-root",
    "organizationName": "Janus Platform"
  }
}
```

---

## 🔧 Technique

### Architecture de Login

```
┌─────────────┐
│ LoginView   │ 1. Fetch demo accounts
│   .vue      │    GET /api/auth/demo-accounts
└──────┬──────┘
       │
       │ 2. User clicks account card
       │
       ▼
┌─────────────┐
│ POST        │ 3. Login with email/password
│ /api/auth/  │    { email, password }
│ login       │
└──────┬──────┘
       │
       │ 4. Receive { token, user }
       │
       ▼
┌─────────────┐
│ localStorage│ 5. Store token + user
│   .setItem  │
└──────┬──────┘
       │
       │ 6. Redirect by role
       │
       ▼
┌─────────────┐
│ Protected   │ 7. Routes check token
│   Routes    │    + role permissions
└─────────────┘
```

### Router Guard

```typescript
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('jwt_token');
  const user = JSON.parse(localStorage.getItem('user'));

  // Check auth
  if (to.meta.requiresAuth && !token) {
    return next('/login');
  }

  // Check role
  if (to.meta.role && user.role !== to.meta.role) {
    alert('Accès refusé');
    return next('/');
  }

  next();
});
```

---

## 🎨 Design de la Page de Login

### Caractéristiques:
- ✅ Gradient violet/rose (brand colors)
- ✅ Cartes avec hover effects
- ✅ Icônes de rôles (👑 💼 👤)
- ✅ Animation au survol (slide-up)
- ✅ Responsive (mobile/tablet/desktop)
- ✅ Loading spinner pendant connexion
- ✅ Gestion d'erreurs

### Animations:
- **Hover:** Carte s'élève avec ombre
- **Hover:** Barre colorée apparaît en haut
- **Hover:** Texte "Cliquer pour se connecter" apparaît en bas
- **Click:** Loading spinner + "Connexion en cours..."

---

## 📱 Responsive

### Desktop (>768px)
```
┌───────────┬───────────┬───────────┐
│  Card 1   │  Card 2   │  Card 3   │
└───────────┴───────────┴───────────┘
┌───────────┬───────────┐
│  Card 4   │  Card 5   │
└───────────┴───────────┘
```

### Mobile (<768px)
```
┌───────────┐
│  Card 1   │
├───────────┤
│  Card 2   │
├───────────┤
│  Card 3   │
├───────────┤
│  Card 4   │
├───────────┤
│  Card 5   │
└───────────┘
```

---

## 🎯 Next Steps

### Pour utiliser la démo:
1. Ouvrir http://localhost:5178/login
2. Cliquer sur une carte
3. Explorer l'interface selon le rôle
4. Se déconnecter
5. Tester un autre compte

### Pour développement:
```bash
# Backend
cd packages/backend
npm run dev

# Frontend
cd packages/manager
npm run dev
```

---

**🎉 La connexion est maintenant complètement intégrée dans l'application!**

Tous les utilisateurs peuvent se connecter facilement en cliquant sur leur carte de compte.
