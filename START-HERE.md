# 👋 START HERE - Janus Platform Demo

**Bienvenue ! Voici comment démarrer en 2 minutes.**

---

## 🎯 Vous êtes ici pour quoi ?

### 1️⃣ Je veux juste LANCER la demo
```bash
# Windows
setup-demo.bat
start-demo.bat

# Mac/Linux
npm run setup
npm run dev
```
➡️ Puis ouvrir http://localhost:5174

---

### 2️⃣ Je veux COMPRENDRE l'architecture
📖 Lire : [ARCHITECTURE.md](ARCHITECTURE.md)
- Diagrammes complets
- Event Sourcing expliqué
- Data flow détaillé

---

### 3️⃣ Je vais PRÉSENTER cette demo
📖 Lire : [DEMO-PRESENTATION.md](DEMO-PRESENTATION.md)
- Script de présentation 5 min
- Messages clés pour stakeholders
- Réponses aux questions anticipées

---

### 4️⃣ Je veux voir les STATS du projet
📖 Lire : [PROJECT-SUMMARY.md](PROJECT-SUMMARY.md)
- 51 fichiers créés
- ~3,500 lignes de code
- Couverture des epics MVP

---

### 5️⃣ Je veux COMPRENDRE le code
📂 Explorer :
```
packages/backend/src/
  ├── domain/SessionAggregate.ts        # ⭐ START HERE
  ├── infrastructure/EventStore.ts      # Event Sourcing
  └── api/sessionRoutes.ts              # REST API

packages/test-portal/src/
  ├── views/SessionView.vue             # ⭐ Main UI
  └── composables/useAutoSave.ts        # Auto-save logic
```

---

## 🚀 Quick Start (60 secondes)

```bash
# 1. Installer (30s)
npm run setup

# 2. Démarrer (30s)
npm run dev

# 3. Tester
# Ouvrir http://localhost:5174
# Créer une session
# Copier l'URL
# Ouvrir l'URL dans nouveau navigateur
# ✅ Magic!
```

---

## 📚 Documentation Map

```
START-HERE.md           ← Vous êtes ici
│
├── README.md           → Vue d'ensemble, features
├── QUICKSTART.md       → Installation détaillée (5 min)
├── ARCHITECTURE.md     → Deep dive technique
├── DEMO-PRESENTATION.md → Guide de présentation
└── PROJECT-SUMMARY.md  → Stats & récapitulatif
```

---

## 🎬 Demo en 3 Étapes

### Étape 1 : Manager Dashboard
1. Ouvrir http://localhost:5174
2. Créer session pour `demo@example.com`
3. Copier l'URL générée

### Étape 2 : Test Portal
1. Ouvrir l'URL copiée
2. Cliquer "Begin Assessment"
3. Répondre à 2-3 questions
4. Observer "💾 Saving..."

### Étape 3 : Cross-Device Resume
1. Copier URL de la barre d'adresse
2. Ouvrir dans **autre navigateur**
3. ✅ Vos réponses sont là !

---

## 💡 Points Clés à Retenir

### Architecture
- ✅ **Event Sourcing** complet avec MongoDB
- ✅ **CQRS** (Command Query Responsibility Segregation)
- ✅ **Multi-tenant** avec isolation stricte

### Features
- ✅ **Auto-save** toutes les 30 secondes
- ✅ **Cross-device resume** via session token
- ✅ **Real-time** status tracking

### Code Quality
- ✅ **TypeScript** strict mode
- ✅ **Clean Architecture** (domain/infra/api)
- ✅ **Production-ready** patterns

---

## 🆘 Problèmes ?

### MongoDB ne démarre pas
```bash
npm run docker:down
npm run docker:up
```

### Port déjà utilisé
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Modules manquants
```bash
rm -rf node_modules packages/*/node_modules
npm install
```

---

## 🎯 Prochaines Étapes

1. ✅ Lancer la demo (vous l'avez fait !)
2. 📖 Lire [ARCHITECTURE.md](ARCHITECTURE.md) pour comprendre
3. 🎤 Préparer présentation avec [DEMO-PRESENTATION.md](DEMO-PRESENTATION.md)
4. 💼 Impressionner les stakeholders !

---

## 📞 Contact

**Développeur** : Nickola
**Date** : Février 2026
**Objectif** : Sélection pour projet Janus Platform v4

---

**Bonne chance ! 🚀**
