# 🧪 Tests d'Authentification et RBAC

## Tests des Endpoints d'Authentification

### 1. Liste des comptes de démo

```bash
curl -X GET http://localhost:3000/api/auth/demo-accounts
```

**Résultat attendu:** Liste de 5 comptes (1 admin, 2 managers, 2 participants)

---

### 2. Login Admin

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@janus-demo.com",
    "password": "admin123"
  }'
```

**Résultat attendu:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
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

---

### 3. Login Manager

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@acme-corp.com",
    "password": "manager123"
  }'
```

**Résultat attendu:** Token avec `role: "manager"` et `organizationId: "org-acme-001"`

---

### 4. Login Participant

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "participant@acme-corp.com",
    "password": "participant123"
  }'
```

**Résultat attendu:** Token avec `role: "participant"`

---

### 5. Login avec mauvais credentials

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@janus-demo.com",
    "password": "wrongpassword"
  }'
```

**Résultat attendu:** HTTP 401
```json
{
  "error": "InvalidCredentials",
  "message": "Email ou mot de passe incorrect"
}
```

---

## Tests RBAC (Contrôle d'Accès)

### Variables d'environnement
```bash
# Obtenir un token admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@janus-demo.com","password":"admin123"}' \
  | grep -o '"token":"[^"]*' | sed 's/"token":"//')

# Obtenir un token manager
MANAGER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@acme-corp.com","password":"manager123"}' \
  | grep -o '"token":"[^"]*' | sed 's/"token":"//')

# Obtenir un token participant
PARTICIPANT_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"participant@acme-corp.com","password":"participant123"}' \
  | grep -o '"token":"[^"]*' | sed 's/"token":"//')
```

---

### Test 1: Admin accède aux KPIs (✅ Autorisé)

```bash
curl -X GET http://localhost:3000/api/admin/kpis \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Résultat attendu:** HTTP 200 avec données KPI

---

### Test 2: Manager tente d'accéder aux KPIs (❌ Refusé)

```bash
curl -X GET http://localhost:3000/api/admin/kpis \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

**Résultat attendu:** HTTP 403
```json
{
  "error": "Forbidden",
  "message": "Access denied. Required role: admin. Your role: manager"
}
```

---

### Test 3: Participant tente d'accéder aux KPIs (❌ Refusé)

```bash
curl -X GET http://localhost:3000/api/admin/kpis \
  -H "Authorization: Bearer $PARTICIPANT_TOKEN"
```

**Résultat attendu:** HTTP 403

---

### Test 4: Manager accède aux pools de licences (✅ Autorisé)

```bash
curl -X GET http://localhost:3000/api/license-pools \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

**Résultat attendu:** HTTP 200 avec liste des pools

---

### Test 5: Participant tente d'accéder aux pools (❌ Refusé)

```bash
curl -X GET http://localhost:3000/api/license-pools \
  -H "Authorization: Bearer $PARTICIPANT_TOKEN"
```

**Résultat attendu:** HTTP 403

---

### Test 6: Admin accède aux pools de licences (✅ Autorisé)

```bash
curl -X GET http://localhost:3000/api/license-pools \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Résultat attendu:** HTTP 200 (admin a tous les accès)

---

### Test 7: Sans token (❌ Non authentifié)

```bash
curl -X GET http://localhost:3000/api/admin/kpis
```

**Résultat attendu:** HTTP 200 (mode démo actif)
**Note:** En mode démo, tous les endpoints injectent automatiquement un utilisateur admin. En production, cela devrait retourner HTTP 401.

---

### Test 8: Token invalide

```bash
curl -X GET http://localhost:3000/api/admin/kpis \
  -H "Authorization: Bearer invalid-token-123"
```

**Résultat attendu:** HTTP 401
```json
{
  "error": "InvalidToken",
  "message": "Invalid authentication token"
}
```

---

### Test 9: Vérifier un token valide

```bash
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$ADMIN_TOKEN\"}"
```

**Résultat attendu:**
```json
{
  "valid": true,
  "user": {
    "id": "admin-001",
    "email": "admin@janus-demo.com",
    "name": "Pierre Administrateur",
    "role": "admin",
    "organizationId": "platform-root"
  }
}
```

---

### Test 10: Obtenir les infos de l'utilisateur courant

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Résultat attendu:**
```json
{
  "success": true,
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

## Tests d'Isolation Multi-Tenant

### Test 1: Manager ne voit que ses données

```bash
# Login manager ACME
ACME_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@acme-corp.com","password":"manager123"}' \
  | grep -o '"token":"[^"]*' | sed 's/"token":"//')

# Login manager TechStart
TECH_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@techstart.fr","password":"manager123"}' \
  | grep -o '"token":"[^"]*' | sed 's/"token":"//')

# Manager ACME voit ses sessions
curl -X GET http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $ACME_TOKEN"

# Manager TechStart voit ses sessions (différentes)
curl -X GET http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $TECH_TOKEN"
```

**Résultat attendu:** Chaque manager ne voit que les sessions de son organisation

---

## 📊 Matrice de Permissions

| Endpoint | Admin | Manager | Participant |
|----------|-------|---------|-------------|
| POST /api/auth/login | ✅ Public | ✅ Public | ✅ Public |
| GET /api/auth/demo-accounts | ✅ Public | ✅ Public | ✅ Public |
| GET /api/admin/kpis | ✅ | ❌ | ❌ |
| GET /api/admin/revenue-trend | ✅ | ❌ | ❌ |
| GET /api/admin/assessments | ✅ | ❌ | ❌ |
| GET /api/admin/audit-logs | ✅ | ❌ | ❌ |
| GET /api/license-pools | ✅ | ✅ | ❌ |
| POST /api/license-pools | ✅ | ✅ | ❌ |
| GET /api/companies | ✅ | ✅ | ❌ |
| POST /api/companies | ✅ | ✅ | ❌ |
| GET /api/products | ✅ | ✅ | ❌ |
| POST /api/payments/* | ✅ | ✅ | ❌ |
| GET /api/sessions | ✅ | ✅ | ✅ |
| POST /api/sessions | ✅ | ✅ | ❌ |
| GET /api/sessions/:token | ✅ | ✅ | ✅ |
| POST /api/sessions/:token/start | ✅ | ✅ | ✅ |
| POST /api/sessions/:token/responses | ✅ | ✅ | ✅ |
| GET /api/cron/* | ✅ | ❌ | ❌ |

---

## 🔧 Scripts de Test Automatisés

### test-all-roles.sh

```bash
#!/bin/bash

echo "🧪 Testing Janus Platform RBAC..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test login for each role
echo -e "\n1. Testing Admin Login..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@janus-demo.com","password":"admin123"}')

if [[ $ADMIN_RESPONSE == *"success"* ]]; then
  echo -e "${GREEN}✓ Admin login successful${NC}"
  ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
else
  echo -e "${RED}✗ Admin login failed${NC}"
fi

echo -e "\n2. Testing Manager Login..."
MANAGER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@acme-corp.com","password":"manager123"}')

if [[ $MANAGER_RESPONSE == *"success"* ]]; then
  echo -e "${GREEN}✓ Manager login successful${NC}"
  MANAGER_TOKEN=$(echo $MANAGER_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
else
  echo -e "${RED}✗ Manager login failed${NC}"
fi

echo -e "\n3. Testing Participant Login..."
PARTICIPANT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"participant@acme-corp.com","password":"participant123"}')

if [[ $PARTICIPANT_RESPONSE == *"success"* ]]; then
  echo -e "${GREEN}✓ Participant login successful${NC}"
  PARTICIPANT_TOKEN=$(echo $PARTICIPANT_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
else
  echo -e "${RED}✗ Participant login failed${NC}"
fi

echo -e "\n4. Testing RBAC - Admin accessing KPIs..."
ADMIN_KPI=$(curl -s -o /dev/null -w "%{http_code}" -X GET http://localhost:3000/api/admin/kpis \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if [[ $ADMIN_KPI == "200" ]]; then
  echo -e "${GREEN}✓ Admin can access KPIs (200)${NC}"
else
  echo -e "${RED}✗ Admin KPI access failed ($ADMIN_KPI)${NC}"
fi

echo -e "\n5. Testing RBAC - Manager accessing license pools..."
MANAGER_POOLS=$(curl -s -o /dev/null -w "%{http_code}" -X GET http://localhost:3000/api/license-pools \
  -H "Authorization: Bearer $MANAGER_TOKEN")

if [[ $MANAGER_POOLS == "200" ]]; then
  echo -e "${GREEN}✓ Manager can access license pools (200)${NC}"
else
  echo -e "${RED}✗ Manager license pools access failed ($MANAGER_POOLS)${NC}"
fi

echo -e "\n6. Testing RBAC - Participant blocked from admin..."
PARTICIPANT_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" -X GET http://localhost:3000/api/admin/kpis \
  -H "Authorization: Bearer $PARTICIPANT_TOKEN")

if [[ $PARTICIPANT_ADMIN == "403" ]]; then
  echo -e "${GREEN}✓ Participant correctly blocked from admin (403)${NC}"
else
  echo -e "${RED}✗ Participant should be blocked but got ($PARTICIPANT_ADMIN)${NC}"
fi

echo -e "\n✅ RBAC tests completed!"
```

### Exécuter les tests

```bash
chmod +x test-all-roles.sh
./test-all-roles.sh
```

---

## 🎯 Résumé

✅ **Implémenté:**
- 3 rôles: admin, manager, participant
- JWT authentication avec tokens expirables (24h)
- RBAC avec middleware de contrôle d'accès
- 5 comptes de démonstration
- Isolation multi-tenant par organizationId
- Endpoints de login, verify, et me
- Protection des routes sensibles

⚠️ **Mode Démo Actif:**
- Le middleware `demoAuth` injecte automatiquement un admin
- Pour utiliser l'auth réelle, remplacer `demoAuth` par `authenticate` dans `index.ts`

🔜 **Production Ready:**
- Remplacer par Curity OAuth2/OIDC
- Hasher les mots de passe (bcrypt)
- Implémenter rate limiting
- Ajouter refresh tokens
- Logger les tentatives de connexion
- Implémenter 2FA pour admins

---

**Documentation complète:** Voir [DEMO-ACCOUNTS.md](./DEMO-ACCOUNTS.md)
