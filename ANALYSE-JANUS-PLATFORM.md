# Analyse du Projet Janus Assessment Platform

**Date d'analyse :** 2026-02-06
**Source :** https://github.com/titof2710/Bmadnico

---

## 1. Vue d'ensemble du projet

**Janus Assessment Platform** est une plateforme SaaS B2B2C multi-tenant de livraison d'évaluations de personnalité en marque blanche (white-label). C'est la **version 4** du projet, après **3 tentatives de développement échouées**.

### Proposition de valeur
La plateforme agrège **plusieurs méthodologies d'évaluation** (VAKOG, rythmes fonctionnels, analyse transactionnelle, Process Com) pour créer des profils de personnalité multi-dimensionnels uniques — contrairement aux concurrents mono-méthodologie (Performanse, AssessFirst, Central Test).

### Deadline
**Fin mars 2026** — démo de production (deadline ferme).

---

## 2. Architecture à 3 composants

| Composant | Rôle | Statut |
|-----------|------|--------|
| **Component 1 - Manager** | Back-office : gestion clients, licences, orchestration sessions, moteur de calcul | À développer |
| **Component 2 - Test Portal** | Portail end-user : passation des évaluations (500+ questions), continuité cross-device | À développer |
| **Component 3 - Renderer** | Génération de rapports PDF en marque blanche | **Stable en production depuis 4+ ans** |

### Stack technique
- **Backend :** Node.js 20.x LTS + TypeScript 5.x (strict) + Express
- **Frontend :** Vue 3 + TypeScript 5.x + Vite + PrimeVue 4.x + Tailwind CSS 3.x
- **Base de données :** MongoDB 8.x + Mongoose 8.x (ReplicaSet requis en production)
- **Observabilité :** OpenTelemetry SDK + Honeycomb
- **CI/CD :** GitHub Actions + Docker 24.x+
- **Auth :** Curity IDM + Token Handler Pattern avec BFF
- **Paiements :** Stripe
- **Files d'attente :** AWS SQS (circuit breaker)

---

## 3. Les 4 personas utilisateurs

### Marie Dupont — Administratrice plateforme
- Gestion globale de la plateforme
- Création de meta-templates d'évaluation et de produits
- Monitoring via dashboard global avec KPIs en temps réel
- **Objectif :** Zéro intervention manuelle, 100% précision des calculs

### Thomas Bernard — Représentant entreprise cliente
- Gestion des pools de licences et des commandes
- Administration des consultants de son entreprise
- Dashboard limité au périmètre de son entreprise
- **Objectif :** Zéro rupture de stock surprise, visibilité proactive

### Sophie Laurent — Consultante
- Création de sessions d'évaluation
- Suivi du workflow complet (invitation → completion → rapport)
- Téléchargement des livrables en marque blanche
- **Objectif :** Élimination de l'effet tunnel, automatisation complète

### David/Émilie — Utilisateurs finaux
- Passation d'évaluations via lien sécurisé
- Expérience cross-device avec sauvegarde automatique
- Reprise exacte à la dernière question sur tout appareil
- **Objectif :** Expérience fluide pour 500+ questions

---

## 4. Exigences clés

### Exigences fonctionnelles : 108 FR réparties en 10 catégories
1. Gestion des templates et produits d'évaluation (FR1-FR7)
2. Administration entreprises et utilisateurs (FR8-FR14)
3. Gestion pools de licences et commandes (FR15-FR25)
4. Orchestration des sessions d'évaluation (FR26-FR35)
5. Passation et complétion des tests (FR36-FR48)
6. Calcul et génération de livrables (FR49-FR60)
7. Dashboards et monitoring (FR61-FR74)
8. Notifications et communication (FR75-FR82)
9. Configuration marque blanche (FR83-FR93)
10. Conformité et gestion des données (FR94-FR108)

### Exigences non-fonctionnelles : 60 NFR
- **Performance :** Dashboard < 2s, API < 200ms (P95), auto-save < 2s
- **Sécurité :** Token Handler Pattern, isolation multi-tenant via JWT claims, TLS 1.2+
- **Disponibilité :** 99.9% uptime (max 43 min/mois d'indisponibilité)
- **Scalabilité :** 500 utilisateurs simultanés, 100 entreprises clientes, 10x growth
- **Conformité :** RGPD, données minimales, droit à l'effacement, hébergement EU

---

## 5. Patterns architecturaux critiques

### Event Sourcing & Event-Driven Architecture
- Persistance complète des événements pour replay
- Saga pattern pour l'orchestration des sessions
- Traçabilité bout-en-bout avec transaction IDs

### Isolation multi-tenant (CRITIQUE)
- **Toujours** filtrer par `tenantId` dans chaque accès aux données
- Index composites MongoDB : `{ tenantId: 1, fieldName: 1 }`
- JWT claims incluent : `user_id`, `role`, `company_id`, `permissions`
- RBAC à 4 niveaux : Administrator > Representative > Consultant > End User

### Vertical Slice Architecture
- Chaque domaine métier dans sa propre slice
- Pas d'imports cross-slice
- Communication inter-slices par événements
- 17 vertical slices identifiées

### Circuit Breaker Pattern
- REST (primaire) → AWS SQS (fallback) pour la communication inter-composants
- Propagation du contexte OpenTelemetry via les attributs SQS

### Token Handler Pattern
- BFF séparé par SPA (Manager et Test Portal)
- JWT jamais stocké côté navigateur (ni localStorage ni sessionStorage)
- Cookies HttpOnly sécurisés

---

## 6. Scope MVP vs Post-MVP

### MVP (Mars 2026) — Ce qui EST inclus
- ✅ Dashboards adaptés par rôle (Marie, Thomas, Sophie)
- ✅ 4 meta-templates pré-chargés via data loader
- ✅ Création de produits et configuration tarifaire
- ✅ Intégration Stripe (carte, virement bancaire)
- ✅ Gestion des pools de licences (2 pools, 2 produits)
- ✅ Sessions d'évaluation individuelles
- ✅ Passation cross-device avec auto-save
- ✅ Calcul automatique des indicateurs
- ✅ Rendu de livrables PDF en marque blanche
- ✅ Notifications email
- ✅ Support français/anglais

### MVP — Ce qui est EXCLU (mais architecturé)
- ❌ Designer de meta-templates (UI)
- ❌ Sessions d'évaluation d'équipe (UI uniquement, backend prêt)
- ❌ Notifications SMS / Slack (adapter pattern prêt)
- ❌ Marque blanche avancée (domaines custom, etc.)
- ❌ Pools de licences au-delà de 2

---

## 7. État d'avancement du projet (BMM Workflow)

| Phase | Étape | Statut |
|-------|-------|--------|
| Phase 1 - Analyse | Product Brief | ✅ Complété (16/01/2026) |
| Phase 2 - Planning | PRD | ✅ Complété (27/01/2026) |
| Phase 2 - Planning | UX Design | ✅ Complété (26/01/2026) |
| Phase 3 - Solutioning | Architecture | ✅ Complété (27/01/2026) |
| Phase 3 - Solutioning | Epics & Stories | 🔲 Requis (non complété) |
| Phase 3 - Solutioning | Test Design | 🔲 Optionnel |
| Phase 3 - Solutioning | Implementation Readiness | 🔲 Requis (rapport existe mais gate check non passée) |
| Phase 4 - Implementation | Sprint Planning | 🔲 Requis (pas encore commencé) |

### Validations effectuées
- **PRD Validation** (17/01/2026) : Score 5/5, PASS — 168 exigences validées
- **Implementation Readiness** (01/02/2026) : ✅ READY FOR IMPLEMENTATION — 0 issues bloquantes

---

## 8. Risques identifiés

| # | Risque | Mitigation |
|---|--------|------------|
| 1 | Incohérence d'état plateforme | Event sourcing + replay + Saga pattern |
| 2 | Erreurs de calcul d'indicateurs | Tests automatisés + double vérification + validation Marie |
| 3 | Rupture de stock licences | Alertes proactives configurables + auto-resume |
| 4 | Échec cross-device | Auto-save < 2s + persistence état session |
| 5 | Violation RGPD | Collecte minimale + droit suppression + hébergement EU |
| 6 | Fuite de données multi-tenant | JWT claims filtering + RBAC + audit logging |

---

## 9. Points forts du projet

1. **Documentation exceptionnelle** — PRD de 108 FR, 60 NFR, 5 user journeys détaillées, architecture complète
2. **Apprentissage des échecs** — v4 intègre explicitement les leçons des 3 tentatives précédentes
3. **Architecture résiliente** — Event sourcing, circuit breaker, observabilité OpenTelemetry dès le départ
4. **Composant 3 stable** — Le renderer est en production depuis 4+ ans, réduisant le risque
5. **Méthodologie BMM** — Suivi structuré avec phases claires et gates de validation

## 10. Points de vigilance

1. **Deadline serrée** — Fin mars 2026 pour une plateforme complexe
2. **Complexité technique** — Event sourcing + multi-tenant + circuit breaker + observabilité = courbe d'apprentissage
3. **Dépendances externes** — Curity IDM, Stripe, AWS SQS, Honeycomb
4. **Epics & Stories non finalisés** — Étape critique manquante avant le sprint planning
5. **Tests de calcul** — 100% accuracy est un objectif ambitieux nécessitant des datasets de validation robustes

---

## 11. Recommandations

1. **Priorité immédiate :** Finaliser les Epics & Stories (Phase 3) pour débloquer le sprint planning
2. **Démarrer par le socle technique :** Vertical slices foundation, auth (Curity + BFF), MongoDB setup avec ReplicaSet
3. **Valider le circuit breaker tôt :** L'intégration REST + SQS avec le Renderer est critique
4. **Construire les tests de calcul en premier :** Datasets de validation pour garantir le 100% accuracy
5. **Prototyper le cross-device :** Auto-save + resume est un différenciateur clé à valider rapidement
