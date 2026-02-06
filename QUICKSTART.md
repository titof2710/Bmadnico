# 🚀 Janus Platform Demo - Quick Start Guide

**Pour développeur : Guide de démarrage en 5 minutes**

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :
- ✅ **Node.js 20.x LTS** installé
- ✅ **Docker Desktop** installé et lancé
- ✅ **NPM 10.x** (inclus avec Node.js)

Vérifier vos versions :
```bash
node --version   # devrait afficher v20.x.x
npm --version    # devrait afficher 10.x.x
docker --version # devrait afficher Docker version 24.x.x ou plus
```

## 🎯 Installation Rapide (1 minute)

```bash
# 1. Aller dans le dossier du projet
cd janus-platform-demo

# 2. Installer toutes les dépendances
npm run setup

# ⏳ Attendez 30-60 secondes que MongoDB démarre...
```

## ▶️ Démarrer la Demo (1 commande)

```bash
# Démarrer tous les services (Backend + Test Portal + Manager)
npm run dev
```

**Attendez que vous voyez :**
```
╔════════════════════════════════════════════════════════════╗
║   🚀 Janus Assessment Platform - Demo Backend            ║
║   Server:    http://localhost:3000                        ║
╚════════════════════════════════════════════════════════════╝

VITE v5.0.11  ready in 1234 ms
➜  Local:   http://localhost:5173/  (Test Portal)
➜  Local:   http://localhost:5174/  (Manager)
```

## 🎬 Tester la Demo (3 minutes)

### Étape 1 : Créer une session (Manager Dashboard)

1. Ouvrir **http://localhost:5174** dans votre navigateur
2. Dans la section "Create New Session" :
   - Email : `demo@example.com`
   - Template : `Leadership Assessment`
3. Cliquer sur **"Create Session"**
4. ✅ Copier l'URL de la session générée

### Étape 2 : Passer l'assessment (Test Portal)

1. Ouvrir l'URL copiée dans un **nouvel onglet** (ou nouveau navigateur)
2. Cliquer sur **"Begin Assessment"**
3. Répondre aux questions de la page 1
4. Observer l'**auto-save** (toutes les 30 secondes)
5. Cliquer sur **"Next Page"**
6. Continuer jusqu'à la fin

### Étape 3 : Tester Cross-Device Resume

1. **Pendant** l'assessment, copier l'URL de la barre d'adresse
2. Ouvrir cette URL dans un **autre navigateur** ou **mode incognito**
3. ✅ Constater que vos réponses sont là (auto-save fonctionnel !)

### Étape 4 : Voir l'Event Sourcing en action

```bash
# Dans un nouveau terminal, accéder à MongoDB
docker exec -it janus-mongodb mongosh -u admin -p devpassword

# Utiliser la base de données
use janus

# Voir les événements persistés
db.events.find().pretty()

# Voir les projections (read model)
db.session_projections.find().pretty()
```

Vous devriez voir tous les événements :
- `SessionCreated`
- `SessionStarted`
- `ResponseRecorded` (un pour chaque réponse)
- `PageCompleted`
- etc.

## 🏗️ Architecture Démontrée

### Backend (Port 3000)
- ✅ **Event Sourcing complet** - Tous les événements dans MongoDB
- ✅ **CQRS Pattern** - Séparation commandes/queries
- ✅ **Multi-tenant** - Isolation par `organizationId`
- ✅ **Projections** - Read models optimisées

**Fichiers clés :**
- [packages/backend/src/domain/SessionAggregate.ts](packages/backend/src/domain/SessionAggregate.ts) - Logique domaine
- [packages/backend/src/infrastructure/EventStore.ts](packages/backend/src/infrastructure/EventStore.ts) - Persistence événements
- [packages/backend/src/infrastructure/ProjectionStore.ts](packages/backend/src/infrastructure/ProjectionStore.ts) - Read models

### Test Portal (Port 5173)
- ✅ **Auto-save** - Debounce 30s avec queue
- ✅ **Cross-device resume** - Session token based
- ✅ **Responsive design** - Fonctionne mobile/desktop

**Fichiers clés :**
- [packages/test-portal/src/views/SessionView.vue](packages/test-portal/src/views/SessionView.vue) - Interface participant
- [packages/test-portal/src/composables/useAutoSave.ts](packages/test-portal/src/composables/useAutoSave.ts) - Auto-save logic

### Manager Dashboard (Port 5174)
- ✅ **Session orchestration** - Création et monitoring
- ✅ **Live tracking** - Liste sessions en temps réel

**Fichiers clés :**
- [packages/manager/src/views/DashboardView.vue](packages/manager/src/views/DashboardView.vue) - Interface manager

## 📊 Démonstration des Compétences

Cette demo showcase les compétences suivantes :

### 🎯 Architecture & Design Patterns
- ✅ **Event Sourcing & CQRS** - Pattern avancé avec event store + projections
- ✅ **Domain-Driven Design** - Aggregates, Commands, Events
- ✅ **Vertical Slice Architecture** - Organisation par feature
- ✅ **Idempotency** - Events peuvent être rejoués sans effets secondaires

### 💾 Backend Engineering
- ✅ **Node.js + TypeScript** - Typage fort, async/await
- ✅ **MongoDB ReplicaSet** - Support event sourcing avec transactions
- ✅ **Express REST API** - Endpoints bien structurés
- ✅ **Clean Architecture** - Séparation domain/infrastructure/api

### 🎨 Frontend Engineering
- ✅ **Vue 3 Composition API** - Réutilisation de logique avec composables
- ✅ **Tailwind CSS** - Styling moderne et responsive
- ✅ **Vite** - Build tool rapide
- ✅ **TypeScript** - Type safety côté frontend

### 🔧 DevOps & Infrastructure
- ✅ **Docker Compose** - MongoDB + Redis orchestration
- ✅ **Monorepo** - NPM workspaces
- ✅ **Environment variables** - Configuration externalisée

## 🎤 Points à Mentionner en Démo

Lorsque vous présentez cette demo, mettez en avant :

1. **"J'ai implémenté Event Sourcing complet"**
   - Montrer les événements dans MongoDB
   - Expliquer comment l'état est reconstruit depuis les events

2. **"Auto-save avec reprise cross-device"**
   - Démarrer sur Chrome, continuer sur Firefox
   - Montrer que les réponses sont synchronisées

3. **"Architecture multi-tenant avec isolation"**
   - Chaque requête filtre par `organizationId`
   - Impossible d'accéder aux données d'une autre organisation

4. **"Monorepo moderne avec 3 packages"**
   - Backend, Test Portal, Manager
   - Partage de types TypeScript entre packages

5. **"Stack technique moderne (2026)"**
   - Node.js 20 LTS
   - Vue 3 Composition API
   - MongoDB 8.0
   - TypeScript 5.x

## 🔍 Vérifier que Tout Fonctionne

### Health Check
```bash
# Backend
curl http://localhost:3000/health

# Devrait retourner:
# {"status":"healthy","timestamp":"..."}
```

### Tester l'API directement
```bash
# Créer une session
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"participantEmail":"test@example.com","templateId":"template-001"}'

# Devrait retourner un sessionToken
```

## 🛑 Arrêter la Demo

```bash
# Ctrl+C dans le terminal où tourne npm run dev

# Arrêter Docker
npm run docker:down
```

## 🐛 Troubleshooting

### "MongoDB connection failed"
```bash
# Vérifier que Docker tourne
docker ps

# Redémarrer MongoDB
npm run docker:down
npm run docker:up
```

### "Port 3000 already in use"
```bash
# Tuer le processus sur le port
# Windows :
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux :
lsof -ti:3000 | xargs kill -9
```

### "Cannot find module"
```bash
# Réinstaller les dépendances
rm -rf node_modules packages/*/node_modules
npm install
```

## 📞 Contact

**Développeur** : Nickola
**Date** : Février 2026
**Objectif** : Demo pour sélection projet Janus v4

---

**🎯 Temps total d'installation à démo : ~5 minutes**

Bonne chance avec votre présentation ! 🚀
