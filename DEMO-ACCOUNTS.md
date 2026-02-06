# 🔐 Comptes de Démonstration Janus Platform

## 📋 Vue d'Ensemble

Le système Janus Platform implémente **3 niveaux de compte** avec contrôle d'accès basé sur les rôles (RBAC):

1. **Admin** - Administrateur Plateforme
2. **Manager** - Gestionnaire d'Organisation
3. **Participant** - Participant aux Assessments

---

## 👤 Comptes Disponibles

### 1. 🔴 ADMIN - Administrateur Plateforme

**Compte:** Pierre Administrateur
- **Email:** `admin@janus-demo.com`
- **Mot de passe:** `admin123`
- **Organisation:** Janus Platform (Root)
- **Rôle:** `admin`

**Accès:**
- ✅ Platform Admin Dashboard (`/platform-admin`)
- ✅ Global KPIs et métriques
- ✅ Gestion de toutes les organisations
- ✅ Pools de licences globaux
- ✅ Audit logs de toute la plateforme
- ✅ Gestion des méta-templates
- ✅ Tous les endpoints API

**Use Cases:**
- Vue d'ensemble de la plateforme complète
- Surveillance des revenus et métriques globales
- Gestion des entreprises clientes
- Configuration des produits et tarifs

---

### 2. 🟢 MANAGER - Gestionnaire d'Organisation

#### Manager #1: ACME Corporation

**Compte:** Sophie Gestionnaire
- **Email:** `manager@acme-corp.com`
- **Mot de passe:** `manager123`
- **Organisation:** ACME Corporation
- **ID Organisation:** `org-acme-001`
- **Rôle:** `manager`

**Accès:**
- ✅ Manager Dashboard (`/dashboard`)
- ✅ Création de sessions d'assessment
- ✅ Gestion des pools de licences de son organisation
- ✅ Vue des participants de son organisation
- ✅ Commande de licences (Stripe)
- ✅ Historique des commandes
- ❌ Pas d'accès aux données d'autres organisations
- ❌ Pas d'accès aux métriques globales

**Use Cases:**
- Créer des sessions d'assessment pour les candidats
- Gérer l'inventaire de licences
- Commander des licences supplémentaires
- Suivre les assessments en cours

#### Manager #2: TechStart SAS

**Compte:** Marc Responsable
- **Email:** `manager@techstart.fr`
- **Mot de passe:** `manager123`
- **Organisation:** TechStart SAS
- **ID Organisation:** `org-techstart-001`
- **Rôle:** `manager`

**Accès:** Identique à Manager #1, mais limité à son organisation

---

### 3. 🔵 PARTICIPANT - Participant aux Assessments

#### Participant #1: ACME Corp

**Compte:** Julie Candidate
- **Email:** `participant@acme-corp.com`
- **Mot de passe:** `participant123`
- **Organisation:** ACME Corporation
- **ID Organisation:** `org-acme-001`
- **Rôle:** `participant`

**Accès:**
- ✅ Test Portal (`/session/:token`)
- ✅ Répondre aux questionnaires assignés
- ✅ Voir ses propres résultats
- ❌ Pas d'accès au dashboard manager
- ❌ Pas d'accès aux autres participants
- ❌ Pas de création de sessions

**Use Cases:**
- Compléter un assessment assigné
- Reprendre une session sur un autre appareil
- Voir ses résultats après complétion

#### Participant #2: TechStart SAS

**Compte:** Jean Dupont
- **Email:** `jean.dupont@test.fr`
- **Mot de passe:** `participant123`
- **Organisation:** TechStart SAS
- **ID Organisation:** `org-techstart-001`
- **Rôle:** `participant`

**Accès:** Identique à Participant #1, mais dans son organisation

---

## 🔐 Architecture d'Authentification

### JWT Token Structure

```typescript
{
  sub: string;              // User ID
  organizationId: string;   // Tenant isolation key
  role: 'admin' | 'manager' | 'participant';
  email: string;
  name: string;
  iat: number;              // Issued at
  exp: number;              // Expires at (24h)
}
```

### Hiérarchie des Rôles

```
admin (3)      → Accès complet à tout
   ↓
manager (2)    → Accès à son organisation uniquement
   ↓
participant (1) → Accès minimal (ses propres assessments)
```

---

## 🚀 Comment Se Connecter

### Via API (cURL)

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@janus-demo.com",
    "password": "admin123"
  }'

# Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin-001",
    "email": "admin@janus-demo.com",
    "name": "Pierre Administrateur",
    "role": "admin",
    "organizationId": "platform-root",
    "organizationName": "Janus Platform"
  },
  "expiresIn": "24h"
}
```

### Utiliser le Token

```bash
# Appel API authentifié
curl -X GET http://localhost:3000/api/admin/kpis \
  -H "Authorization: Bearer <votre-token>"
```

### Via Frontend (Vue)

```typescript
// Login
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@janus-demo.com',
    password: 'admin123'
  })
});

const { token, user } = await response.json();

// Store token
localStorage.setItem('jwt_token', token);
localStorage.setItem('user', JSON.stringify(user));

// Use in subsequent requests
const kpisResponse = await fetch('http://localhost:3000/api/admin/kpis', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 📊 Endpoints API par Rôle

### 🔴 Admin Only

```
POST   /api/auth/login               # Login (public)
GET    /api/auth/demo-accounts       # List demo accounts (public)
POST   /api/auth/verify              # Verify token (public)
GET    /api/auth/me                  # Get current user

GET    /api/admin/kpis               # Global KPIs
GET    /api/admin/revenue-trend      # Revenue analytics
GET    /api/admin/assessments        # All assessments
GET    /api/admin/audit-logs         # Platform audit logs
GET    /api/admin/license-consumption # License usage stats

GET    /api/cron/expire-sessions     # Maintenance jobs
```

### 🟢 Manager or Admin

```
GET    /api/license-pools            # List organization pools
POST   /api/license-pools            # Create pool
PUT    /api/license-pools/:id        # Update pool
POST   /api/license-pools/:id/consume # Consume license
POST   /api/license-pools/:id/release # Release license

GET    /api/companies                # List companies
POST   /api/companies                # Create company
PUT    /api/companies/:id            # Update company

GET    /api/products                 # Product catalog
POST   /api/products                 # Create product

POST   /api/payments/create-checkout-session # Create Stripe session
GET    /api/payments/orders          # Order history
```

### 🔵 All Authenticated Users

```
GET    /api/sessions                 # List sessions (filtered by org)
POST   /api/sessions                 # Create session
GET    /api/sessions/:token          # Get session details
POST   /api/sessions/:token/start    # Start session
POST   /api/sessions/:token/responses # Submit responses
POST   /api/sessions/:token/pages/:id/complete # Complete page
GET    /api/sessions/:sessionId/results # Get results

GET    /api/participants             # Participant data
```

---

## 🧪 Scénarios de Test

### Scénario 1: Admin voit tout

1. Login avec `admin@janus-demo.com`
2. Accéder à `/platform-admin`
3. ✅ Voir les KPIs de toutes les organisations
4. ✅ Voir tous les assessments (ACME + TechStart)
5. ✅ Accéder aux pools de licences de toutes les orgs

### Scénario 2: Manager limité à son organisation

1. Login avec `manager@acme-corp.com`
2. Accéder à `/dashboard`
3. ✅ Voir seulement les sessions ACME Corp
4. ✅ Gérer les pools de licences ACME Corp
5. ❌ Tenter d'accéder à `/platform-admin` → 403 Forbidden
6. ❌ Tenter d'accéder aux données TechStart → 403 Forbidden

### Scénario 3: Participant accès minimal

1. Login avec `participant@acme-corp.com`
2. Recevoir un lien de session
3. ✅ Compléter son assessment
4. ✅ Voir ses résultats
5. ❌ Tenter d'accéder à `/dashboard` → 403 Forbidden
6. ❌ Tenter d'accéder aux API managers → 403 Forbidden

### Scénario 4: Isolation Multi-Tenant

1. Login avec `manager@acme-corp.com`
2. Créer une session pour `participant@acme-corp.com`
3. Login avec `manager@techstart.fr`
4. ❌ Ne PAS voir la session ACME Corp dans la liste
5. ✅ Isolation complète des données

---

## 🔒 Sécurité

### ⚠️ Important - Mode Démo

Ces comptes sont **uniquement pour la démonstration**. En production:

❌ **NE JAMAIS:**
- Stocker les mots de passe en clair
- Exposer la liste des comptes via API
- Utiliser des mots de passe simples
- Hardcoder les credentials

✅ **TOUJOURS:**
- Hash passwords avec bcrypt (min 12 rounds)
- Implémenter rate limiting sur /login
- Logger les tentatives de login échouées
- Implémenter 2FA pour les admins
- Utiliser HTTPS en production
- Implémenter refresh tokens
- Ajouter session management

### Production Checklist

- [ ] Remplacer les comptes démo par vrais utilisateurs
- [ ] Intégrer avec Curity OAuth2/OIDC
- [ ] Hasher tous les mots de passe (bcrypt)
- [ ] Implémenter rate limiting (express-rate-limit)
- [ ] Ajouter audit logging détaillé
- [ ] Configurer refresh tokens
- [ ] Implémenter password reset flow
- [ ] Ajouter 2FA/MFA
- [ ] Configurer session timeout
- [ ] Implémenter account lockout après N tentatives
- [ ] Ajouter CAPTCHA sur login

---

## 📞 Support

Pour ajouter de nouveaux comptes ou modifier les rôles, éditer:
- `packages/backend/src/api/authRoutes.ts` (ligne 21: `DEMO_USERS`)

Pour modifier les permissions:
- `packages/backend/src/middleware/rbac.ts`

---

**⚠️ RAPPEL: Ces comptes sont pour DÉMO uniquement. Jamais en production!**
