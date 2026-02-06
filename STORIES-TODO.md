# 📋 Stories TODO - Janus Platform Demo

**Date:** 2026-02-06
**Objectif:** Compléter l'application pour demo production-ready
**Timeline:** 4 semaines (Phase 1: 1 semaine, Phase 2: 2 semaines, Phase 3: 1 semaine)

---

## 🎯 PHASE 1 - DEMO-READY (Semaine 1)

### ✅ STORY-001: Platform Admin Dashboard UI Complet

**Priority:** 🔴 CRITIQUE (Demo Blocker)
**Estimation:** L (3-4 jours)
**Status:** ✅ COMPLETED - Backend ✅ / Frontend ✅

**Description:**
En tant que Platform Administrator (Marie), je veux un dashboard global complet me permettant de superviser tous les clients, assessments, et KPIs en temps réel.

**APIs Backend Disponibles:**
- ✅ GET /api/admin/kpis - Platform KPIs
- ✅ GET /api/admin/assessments - All assessments
- ✅ GET /api/admin/audit-logs - Audit logs
- ✅ GET /api/admin/meta-templates - Templates
- ✅ GET /api/admin/revenue-trend - Revenue trends

**Composants Vue à Créer:**

1. **PlatformAdminView.vue** (déjà existe - à améliorer)
   - Tabs navigation: Dashboard, Assessments, Audit Logs, Templates

2. **GlobalKPIsCards.vue** (nouveau)
   ```vue
   <template>
     <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
       <KPICard title="Active Assessments" :value="kpis.activeCount" icon="play" />
       <KPICard title="Pending Assessments" :value="kpis.pendingCount" icon="clock" />
       <KPICard title="Completed" :value="kpis.completedCount" icon="check" color="green" />
       <KPICard title="Total Revenue" :value="formatCurrency(kpis.totalRevenue)" icon="dollar" />
     </div>
   </template>
   ```

3. **RevenueTrendChart.vue** (nouveau)
   - Chart.js line chart
   - Affiche revenue par mois (12 mois glissants)
   - Data depuis GET /api/admin/revenue-trend

4. **AllAssessmentsTable.vue** (existe - à améliorer)
   - Ajouter filtres: Company, Consultant, Status, Date range
   - Ajouter search bar full-text
   - Action menu: View Details, Download PDF, View Events
   - Pagination 25/50/100 rows
   - Export CSV button

5. **AssessmentDetailModal.vue** (nouveau)
   - Affiche détails complets d'un assessment
   - Event history timeline
   - Participant info
   - Progress indicators
   - Actions: Suspend, Expire, Download

6. **AuditLogsTable.vue** (existe - à améliorer)
   - Filtres: Date range, User, Action type
   - Search bar
   - Pagination
   - Export CSV

7. **MetaTemplatesView.vue** (existe - à améliorer)
   - Liste des 4 templates
   - Vue détaillée: Questions count, Sub-templates, Version
   - Indication si publié et associé à produit

**Critères d'Acceptation:**
- [ ] Dashboard affiche 4 KPI cards avec valeurs temps réel
- [ ] Revenue trend chart affiche 12 mois de données
- [ ] Assessments table affiche tous les assessments avec filtres
- [ ] Search bar permet recherche full-text
- [ ] Action menu permet drill-down sur chaque assessment
- [ ] Modal détails affiche event history complète
- [ ] Export CSV génère fichier avec toutes colonnes
- [ ] Audit logs affichent tous événements avec filtres
- [ ] Meta-templates affichent composition complète
- [ ] Interface responsive mobile/tablet/desktop

**Files à Créer/Modifier:**
```
packages/manager/src/
├── components/
│   ├── GlobalKPIsCards.vue (NEW)
│   ├── KPICard.vue (NEW)
│   ├── RevenueTrendChart.vue (NEW)
│   ├── AssessmentDetailModal.vue (NEW)
│   ├── AllAssessmentsTable.vue (MODIFY)
│   ├── AuditLogsTable.vue (MODIFY)
│   └── MetaTemplatesView.vue (MODIFY)
└── views/
    └── PlatformAdminView.vue (MODIFY)
```

---

### ✅ STORY-002: License Pool Management UI pour Representatives

**Priority:** 🔴 CRITIQUE (Demo Blocker)
**Estimation:** M (2-3 jours)
**Status:** ✅ COMPLETED - Backend ✅ / Frontend ✅

**Description:**
En tant que Representative (Thomas), je veux gérer mes license pools avec visibilité temps réel sur la consommation et pouvoir recharger avant épuisement.

**APIs Backend Disponibles:**
- ✅ GET /api/license-pools - List pools
- ✅ POST /api/license-pools - Create pool
- ✅ POST /api/license-pools/:poolId/add-licenses - Add licenses
- ✅ PUT /api/license-pools/:poolId/threshold - Update threshold
- ✅ GET /api/products - List products for ordering

**Composants Vue à Créer:**

1. **LicensePoolsView.vue** (déjà existe - à améliorer)
   - Dashboard layout avec cards par pool

2. **LicensePoolCard.vue** (nouveau)
   ```vue
   <template>
     <div class="pool-card" :class="levelClass">
       <h3>{{ pool.productName }}</h3>
       <div class="stats">
         <div class="available">
           <span class="value">{{ pool.availableLicenses }}</span>
           <span class="label">Available</span>
         </div>
         <div class="total">
           <span class="value">{{ pool.totalPurchased }}</span>
           <span class="label">Total Purchased</span>
         </div>
         <div class="consumed">
           <span class="value">{{ pool.consumedLicenses }}</span>
           <span class="label">Consumed</span>
         </div>
       </div>
       <ProgressBar :percentage="availablePercentage" :color="levelColor" />
       <div class="warning" v-if="pool.isWarning">
         ⚠️ Low stock - {{ pool.availableLicenses }} licenses remaining
       </div>
       <button @click="orderLicenses" class="btn-order">Order Licenses</button>
     </div>
   </template>
   ```

3. **OrderLicensesModal.vue** (nouveau)
   - Select product dropdown
   - Quantity input (unit ou pack)
   - Prix total avec discount si pack
   - Preview avant commande
   - Submit génère Stripe checkout session
   - Affiche lien de paiement

4. **OrderHistoryTable.vue** (nouveau)
   - Liste des orders avec statuts
   - Colonnes: Date, Product, Quantity, Amount, Status, Payment Link
   - Filtres: Status, Date range
   - Action: View invoice, Resend payment link

5. **ConsumptionRateChart.vue** (nouveau)
   - Chart.js line chart
   - Affiche licenses consumed par semaine (8 semaines)
   - Projection du stock restant

6. **ThresholdConfigModal.vue** (nouveau)
   - Configurer seuil d'alerte par pool
   - Choisir: Pourcentage ou count absolu
   - Preview des notifications

**Critères d'Acceptation:**
- [ ] Dashboard affiche une card par license pool
- [ ] Chaque card affiche: Available, Total, Consumed
- [ ] Indicateur visuel couleur: Vert (>20%), Orange (5-20%), Rouge (<5%)
- [ ] Warning pill rouge apparaît si pool proche du seuil
- [ ] Bouton "Order Licenses" ouvre modal de commande
- [ ] Modal commande permet sélection product et quantité
- [ ] Aperçu prix total avec discount si pack
- [ ] Submit génère Stripe checkout session et affiche lien
- [ ] Order history affiche tous les orders avec statuts
- [ ] Chart consumption rate affiche tendance 8 semaines
- [ ] Threshold config permet ajuster seuil par pool
- [ ] Interface responsive

**Files à Créer/Modifier:**
```
packages/manager/src/
├── components/
│   ├── LicensePoolCard.vue (NEW)
│   ├── OrderLicensesModal.vue (NEW)
│   ├── OrderHistoryTable.vue (NEW)
│   ├── ConsumptionRateChart.vue (NEW)
│   └── ThresholdConfigModal.vue (NEW)
└── views/
    └── LicensePoolsView.vue (MODIFY)
```

---

### 🔶 STORY-003: JWT Authentication & RBAC Complet

**Priority:** 🟠 HIGH (Production Required)
**Estimation:** M (2-3 jours)
**Status:** Simplifié (60%)

**Description:**
En tant que système, je veux une authentification JWT complète avec RBAC pour sécuriser l'accès aux ressources par rôle.

**Roles:**
- `platform-admin` - Accès complet platform (Marie)
- `representative` - Accès company-scoped (Thomas)
- `consultant` - Accès session creation (Sophie)

**Backend à Créer:**

1. **AuthService.ts** (nouveau)
   ```typescript
   export class AuthService {
     generateToken(user: { userId: string; email: string; role: string; organizationId: string }): string
     verifyToken(token: string): TokenPayload
     refreshToken(refreshToken: string): { accessToken: string; refreshToken: string }
   }
   ```

2. **authMiddleware.ts** (nouveau)
   ```typescript
   export const authenticate = async (req, res, next) => {
     // Extract JWT from Authorization header
     // Verify token
     // Attach user to req
   }

   export const authorize = (...roles: string[]) => {
     return (req, res, next) => {
       // Check if user.role in allowed roles
     }
   }
   ```

3. **authRoutes.ts** (nouveau)
   ```typescript
   POST /api/auth/login - Login with email/password
   POST /api/auth/logout - Logout
   POST /api/auth/refresh - Refresh token
   GET /api/auth/me - Get current user
   ```

4. **UserAggregate.ts** (nouveau)
   - Events: UserCreated, PasswordChanged, RoleUpdated
   - Methods: createUser(), changePassword(), updateRole()

5. **UserProjectionStore.ts** (nouveau)
   - getUserByEmail()
   - getUserById()
   - validateCredentials()

**Frontend à Créer:**

1. **LoginView.vue** (nouveau)
   - Form email/password
   - Submit login
   - Store JWT in localStorage
   - Redirect to dashboard

2. **authStore.ts** (Pinia store) (nouveau)
   ```typescript
   export const useAuthStore = defineStore('auth', {
     state: () => ({
       user: null,
       token: null,
       isAuthenticated: false
     }),
     actions: {
       login(email, password)
       logout()
       refreshToken()
       checkAuth()
     }
   })
   ```

3. **router guards** (modifier)
   - beforeEach: Check authentication
   - Redirect to /login si non authentifié
   - Check role pour routes protégées

**Critères d'Acceptation:**
- [ ] POST /api/auth/login retourne JWT access token + refresh token
- [ ] JWT contient: userId, email, role, organizationId
- [ ] Middleware authenticate vérifie token sur toutes routes protégées
- [ ] Middleware authorize check role avant accès ressources
- [ ] Token expire après 1h, refresh token après 7 jours
- [ ] POST /api/auth/refresh génère nouveau access token
- [ ] Frontend stocke token en localStorage
- [ ] Login form redirige vers dashboard après success
- [ ] Router guard redirige vers /login si non authentifié
- [ ] Logout clear token et redirige vers /login
- [ ] API routes filtrées par organizationId du JWT
- [ ] Platform admin accès à toutes organizations
- [ ] Representative accès uniquement à sa company

**Files à Créer:**
```
packages/backend/src/
├── domain/
│   └── UserAggregate.ts (NEW)
├── infrastructure/
│   └── UserProjectionStore.ts (NEW)
├── services/
│   └── AuthService.ts (NEW)
├── middleware/
│   └── authMiddleware.ts (NEW)
└── api/
    └── authRoutes.ts (NEW)

packages/manager/src/
├── stores/
│   └── authStore.ts (NEW)
├── views/
│   └── LoginView.vue (NEW)
└── router/
    └── index.ts (MODIFY - add guards)
```

---

## 🎯 PHASE 2 - PRODUCTION-READY (Semaines 2-3)

### ✅ STORY-004: Tests Automatisés

**Priority:** 🔴 CRITIQUE (Production Blocker)
**Estimation:** L (4-5 jours)
**Status:** 0%

**Description:**
En tant que développeur, je veux des tests automatisés pour garantir la qualité et éviter les régressions.

**Target Coverage:** 70% minimum

**Tests à Créer:**

1. **Unit Tests - Domain Aggregates** (Jest)
   ```
   packages/backend/src/domain/__tests__/
   ├── SessionAggregate.test.ts
   ├── LicensePoolAggregate.test.ts
   ├── CompanyAggregate.test.ts
   ├── ProductAggregate.test.ts
   └── ParticipantAggregate.test.ts
   ```

2. **Integration Tests - APIs** (Supertest)
   ```
   packages/backend/src/api/__tests__/
   ├── sessionRoutes.test.ts
   ├── licensePoolRoutes.test.ts
   ├── adminRoutes.test.ts
   ├── participantRoutes.test.ts
   └── paymentRoutes.test.ts
   ```

3. **E2E Tests - Critical Flows** (Playwright)
   ```
   packages/e2e/
   ├── session-creation.spec.ts
   ├── participant-assessment.spec.ts
   ├── license-ordering.spec.ts
   └── admin-dashboard.spec.ts
   ```

**Critères d'Acceptation:**
- [ ] 70%+ code coverage sur domain layer
- [ ] 60%+ code coverage sur API routes
- [ ] Tous aggregates testés: creation, events, state reconstruction
- [ ] APIs testées: success cases, error cases, validation
- [ ] E2E tests couvrent: Create session → Complete assessment → Download PDF
- [ ] CI pipeline runs tests automatiquement
- [ ] Tests passent à 100% avant merge

---

### ✅ STORY-005: Error Handling & Resilience

**Priority:** 🟠 HIGH
**Estimation:** M (2 jours)
**Status:** Basique (40%)

**Description:**
En tant que système, je veux un error handling robuste avec retry logic et circuit breakers.

**À Implémenter:**

1. **Webhook Retry Logic** (Stripe webhooks)
   - Retry failed webhooks avec exponential backoff
   - Max 5 retries
   - Dead letter queue pour failed après max retries

2. **Circuit Breaker** (external services)
   - Circuit breaker pour Stripe API calls
   - Circuit breaker pour email sending
   - Fallback strategies

3. **Global Error Handler** (Express)
   - Catch all errors
   - Log avec structured logging
   - Return user-friendly messages
   - Don't expose stack traces en production

4. **Error Boundaries** (Vue frontend)
   - Catch Vue component errors
   - Display user-friendly error page
   - Report errors to logging service

**Critères d'Acceptation:**
- [ ] Failed webhooks retry automatiquement
- [ ] Circuit breaker ouvre après 5 failures
- [ ] Circuit breaker semi-open après 30s
- [ ] Global error handler catch toutes exceptions
- [ ] Errors logged avec context (user, request ID, stack)
- [ ] Frontend error boundary affiche page erreur
- [ ] User-friendly messages (pas de stack traces)

---

### ✅ STORY-006: Logging & Observability

**Priority:** 🟠 HIGH
**Estimation:** S (1 jour)
**Status:** Console logs (40%)

**Description:**
En tant que DevOps, je veux du structured logging et de l'observability pour monitorer la production.

**À Implémenter:**

1. **Structured Logging** (Winston)
   - Replace console.log par Winston
   - JSON format
   - Levels: error, warn, info, debug
   - Context: timestamp, requestId, userId, organizationId

2. **Request ID Tracking**
   - Middleware génère requestId unique
   - Attach à tous logs
   - Return dans response header

3. **Performance Metrics**
   - Log response times
   - Track slow queries (>1s)
   - Track aggregate reconstruction time

4. **Health Check Enhanced**
   - GET /health check MongoDB connection
   - Check Event Store
   - Check Projection Stores
   - Return status + latency

**Critères d'Acceptation:**
- [ ] Winston structured logging en place
- [ ] Tous logs incluent requestId
- [ ] Request/response logged avec duration
- [ ] Slow operations logged avec warning
- [ ] Health check retourne status détaillé
- [ ] Logs exportables vers service externe (future)

---

## 🎯 PHASE 3 - POLISH (Semaine 4)

### ✅ STORY-007: Manager Dashboard Amélioré

**Priority:** 🟢 MEDIUM
**Estimation:** M (2 jours)
**Status:** Basique (70%)

**Description:**
Améliorer le Manager Dashboard avec fonctionnalités avancées.

**Features à Ajouter:**
- Vue détaillée assessment avec event history
- Filtres avancés (status, date, template)
- Bulk actions (suspend, expire multiple)
- Real-time status updates (polling ou WebSocket)
- Session analytics (completion rate, avg time)

---

### ✅ STORY-008: Participant Management UI

**Priority:** 🟢 MEDIUM
**Estimation:** S (1-2 jours)
**Status:** Backend ✅ / Frontend ❌

**Description:**
Interface complète pour gérer les participants.

**Composants à Créer:**
- ParticipantsListView.vue
- ParticipantFormModal.vue (Create/Edit)
- ParticipantDetailModal.vue
- AssignSessionModal.vue

---

### ✅ STORY-009: Performance Optimization

**Priority:** 🟢 MEDIUM
**Estimation:** M (2-3 jours)
**Status:** Non optimisé (50%)

**Features:**
- Snapshotting pour aggregates lourds
- Redis caching pour projections hot
- Database indexes optimization
- Query performance review
- Frontend lazy loading

---

## 📊 Résumé Timeline

| Phase | Duration | Stories | Priority |
|-------|----------|---------|----------|
| Phase 1 - Demo-Ready | 1 semaine | STORY-001, STORY-002, (STORY-003) | 🔴 CRITIQUE |
| Phase 2 - Production | 2 semaines | STORY-004, STORY-005, STORY-006, STORY-003 | 🔴 CRITIQUE |
| Phase 3 - Polish | 1 semaine | STORY-007, STORY-008, STORY-009 | 🟢 MEDIUM |

**Total:** 4 semaines pour application 100% production-ready

---

## 🎯 Prochaine Action Immédiate

**COMMENCER PAR:** STORY-001 - Platform Admin Dashboard UI

**Pourquoi?**
- Débloque la demo pour Marie
- Backend déjà prêt à 100%
- Seulement du travail frontend Vue.js
- Impact visuel maximum pour demo

**Steps:**
1. Créer GlobalKPIsCards.vue
2. Créer RevenueTrendChart.vue
3. Améliorer AllAssessmentsTable.vue
4. Créer AssessmentDetailModal.vue
5. Intégrer dans PlatformAdminView.vue
6. Tester avec données réelles

Ready to start? 🚀
