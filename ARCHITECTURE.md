# 🏗️ Architecture Janus Platform Demo

## 📐 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                      JANUS PLATFORM DEMO                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  Test Portal     │         │  Manager         │
│  (Port 5173)     │         │  Dashboard       │
│                  │         │  (Port 5174)     │
│  Vue 3 + Vite    │         │  Vue 3 + Vite    │
│  Tailwind CSS    │         │  Tailwind CSS    │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         │         REST API           │
         └────────────┬───────────────┘
                      │
         ┌────────────▼────────────┐
         │   Backend API           │
         │   (Port 3000)           │
         │                         │
         │   Node.js + Express     │
         │   TypeScript 5.x        │
         └────────────┬────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
    ┌────────┐  ┌─────────┐  ┌────────┐
    │MongoDB │  │  Event  │  │ Redis  │
    │8.0 RS  │  │  Store  │  │  7.x   │
    └────────┘  └─────────┘  └────────┘
```

## 🎯 Event Sourcing Architecture

### Command Flow (Write Path)

```
Participant Action
      │
      ▼
┌──────────────────┐
│  Test Portal     │  1. User interacts (answers question)
│  (Frontend)      │
└────────┬─────────┘
         │ HTTP POST
         ▼
┌──────────────────┐
│  Session API     │  2. Receives command
│  (API Layer)     │
└────────┬─────────┘
         │ Call handler
         ▼
┌──────────────────┐
│ Command Handler  │  3. Load aggregate from events
│ (Domain Layer)   │  4. Execute command
└────────┬─────────┘  5. Generate events
         │
         ├─────────────────┐
         ▼                 ▼
┌──────────────┐   ┌──────────────┐
│  Event Store │   │  Projection  │
│  (MongoDB)   │   │  Store       │
│              │   │  (MongoDB)   │
│  Append-only │   │  Read Model  │
│  Immutable   │   │  Optimized   │
└──────────────┘   └──────────────┘
```

### Query Flow (Read Path)

```
Frontend Request
      │
      ▼
┌──────────────────┐
│  Session API     │  1. GET /api/sessions/:token
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Projection Store │  2. Direct query (CQRS)
│  (Read Model)    │  3. No event reconstruction
└────────┬─────────┘
         │
         ▼
     Response
```

## 📦 Package Structure

```
janus-platform-demo/
│
├── packages/
│   │
│   ├── backend/                    # Node.js Backend
│   │   ├── src/
│   │   │   ├── domain/            # Domain Logic (DDD)
│   │   │   │   ├── SessionAggregate.ts      # Aggregate Root
│   │   │   │   └── SessionCommandHandler.ts # Commands
│   │   │   │
│   │   │   ├── infrastructure/    # Technical Concerns
│   │   │   │   ├── EventStore.ts           # Event persistence
│   │   │   │   ├── ProjectionStore.ts      # Read models
│   │   │   │   └── database.ts             # DB connection
│   │   │   │
│   │   │   ├── api/              # HTTP API
│   │   │   │   ├── sessionRoutes.ts        # REST endpoints
│   │   │   │   └── mockTemplateService.ts  # Templates
│   │   │   │
│   │   │   ├── shared/           # Shared Types
│   │   │   │   └── types.ts               # Domain types
│   │   │   │
│   │   │   └── index.ts          # App entry point
│   │   │
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env
│   │
│   ├── test-portal/               # Participant Interface
│   │   ├── src/
│   │   │   ├── views/
│   │   │   │   └── SessionView.vue         # Main assessment UI
│   │   │   │
│   │   │   ├── composables/
│   │   │   │   └── useAutoSave.ts          # Auto-save logic
│   │   │   │
│   │   │   ├── services/
│   │   │   │   └── api.ts                  # Backend API client
│   │   │   │
│   │   │   ├── App.vue
│   │   │   ├── router.ts
│   │   │   ├── main.ts
│   │   │   └── style.css
│   │   │
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   │
│   └── manager/                   # Manager Dashboard
│       ├── src/
│       │   ├── views/
│       │   │   └── DashboardView.vue       # Session management
│       │   │
│       │   ├── services/
│       │   │   └── api.ts                  # Backend API client
│       │   │
│       │   ├── App.vue
│       │   ├── router.ts
│       │   ├── main.ts
│       │   └── style.css
│       │
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       └── tailwind.config.js
│
├── docker-compose.yml             # MongoDB + Redis
├── package.json                   # Monorepo root
├── README.md
├── QUICKSTART.md
├── DEMO-PRESENTATION.md
└── ARCHITECTURE.md (ce fichier)
```

## 🔄 Event Sourcing Deep Dive

### Event Types

```typescript
// Domain Events
type DomainEventType =
  | 'SessionCreated'      // Session initialisée
  | 'SessionStarted'      // Participant commence
  | 'ResponseRecorded'    // Réponse enregistrée
  | 'PageCompleted'       // Page complétée
  | 'SessionCompleted'    // Assessment terminé
```

### Event Store Schema

```javascript
// MongoDB Collection: events
{
  _id: ObjectId("..."),
  eventId: "uuid-v4",              // Unique event ID
  eventType: "ResponseRecorded",   // Event type
  aggregateId: "session-uuid",     // Session ID
  aggregateType: "Session",        // Aggregate type
  organizationId: "org-uuid",      // Multi-tenant isolation
  version: 5,                      // Optimistic concurrency
  timestamp: ISODate("..."),       // Event time
  payload: {                       // Event-specific data
    questionId: "q1",
    pageId: "page-1",
    responseValue: "option-2",
    recordedAt: ISODate("...")
  },
  metadata: {}                     // Optional metadata
}
```

### Projection Store Schema

```javascript
// MongoDB Collection: session_projections
{
  _id: ObjectId("..."),
  sessionId: "session-uuid",
  organizationId: "org-uuid",
  sessionToken: "sess_abc123...",
  participantEmail: "user@example.com",
  templateId: "template-001",
  status: "active",                // pending|active|completed
  currentPage: 2,
  totalPages: 3,
  responses: {                     // Denormalized responses
    "q1": "option-2",
    "q2": 8,
    "q3": ["opt1", "opt3"]
  },
  startedAt: ISODate("..."),
  completedAt: null,
  expiresAt: ISODate("..."),
  lastActivityAt: ISODate("..."),
  version: 5,                      // Matches last event version
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

## 🔐 Multi-Tenant Isolation

### Strategy: JWT Claims-Based

```typescript
// JWT Payload (Demo - simplifié)
interface JWTClaims {
  sub: string;              // User ID ou Session Token
  organizationId: string;   // ⚠️ CRITICAL: Tenant isolation
  role: 'admin' | 'manager' | 'participant';
  email?: string;
  iat: number;
  exp: number;
}
```

### Database Queries (Isolation Enforcement)

```typescript
// ✅ CORRECT: Always filter by organizationId
await collection.find({
  aggregateId: sessionId,
  organizationId: organizationId  // From JWT
});

// ❌ INCORRECT: Missing tenant isolation
await collection.find({
  aggregateId: sessionId
  // DANGER: Can access other orgs' data!
});
```

### Indexes for Performance + Isolation

```typescript
// Event Store indexes
db.events.createIndex(
  { aggregateId: 1, organizationId: 1, version: 1 },
  { unique: true }  // Enforces version uniqueness per org
);

// Projection Store indexes
db.session_projections.createIndex(
  { sessionToken: 1, organizationId: 1 },
  { unique: true }  // Prevents token reuse across orgs
);
```

## 🚀 Auto-Save Mechanism

### Frontend (useAutoSave.ts)

```
User Input
    │
    ▼
┌──────────────────┐
│ v-model binding  │  1. Vue reactivity detects change
│ @input="handler" │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ queueResponse()  │  2. Add to save queue
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ scheduleSave()   │  3. Debounce 30 seconds
└────────┬─────────┘
         │ (wait 30s)
         ▼
┌──────────────────┐
│ flushQueue()     │  4. Batch POST to backend
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Backend API      │  5. Generate ResponseRecorded events
└──────────────────┘
```

### Implementation

```typescript
// Debounced save (30s after last input)
let saveTimer: ReturnType<typeof setTimeout> | null = null;

const scheduleSave = () => {
  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    flushQueue();  // Save all pending responses
  }, 30000);      // 30 seconds
};

// Force save before page navigation
const saveImmediately = async () => {
  if (saveTimer) clearTimeout(saveTimer);
  await flushQueue();
};
```

## 📊 Data Flow Example

### Scenario: Participant Answers Question

```
[1] User selects "Option 2" for Question 1
    │
    ▼
[2] Vue Component updates v-model
    responses[q1] = 'option-2'
    │
    ▼
[3] @change handler calls queueResponse()
    saveQueue.set('q1', 'option-2')
    │
    ▼
[4] scheduleSave() sets 30s timer
    │
    │ ... 30 seconds pass ...
    │
    ▼
[5] flushQueue() fires
    POST /api/sessions/:token/responses
    {
      questionId: 'q1',
      pageId: 'page-1',
      responseValue: 'option-2'
    }
    │
    ▼
[6] Backend: SessionCommandHandler.recordResponse()
    │
    ├─> Load SessionAggregate from events
    │
    ├─> Execute command: aggregate.recordResponse(...)
    │
    ├─> Generate event: ResponseRecordedEvent
    │       {
    │         eventType: 'ResponseRecorded',
    │         aggregateId: 'session-uuid',
    │         version: 6,
    │         payload: { questionId: 'q1', ... }
    │       }
    │
    ▼
[7] Persist to Event Store
    db.events.insertOne(event)
    │
    ▼
[8] Update Projection
    db.session_projections.updateOne(
      { sessionId: '...' },
      { $set: { 'responses.q1': 'option-2', version: 6 } }
    )
    │
    ▼
[9] Return success to frontend
    {
      success: true,
      eventId: 'evt-uuid',
      timestamp: '2026-02-06T...'
    }
    │
    ▼
[10] Frontend shows "✓ Saved at 14:32"
```

## 🔄 Cross-Device Resume

### How It Works

```
[Device 1: Desktop Chrome]
  1. User starts session
  2. Answers questions 1-5
  3. Auto-save persists responses
  4. User copies URL: /session/sess_abc123...

[Device 2: Mobile Firefox]
  1. User pastes URL
  2. GET /api/sessions/sess_abc123
  3. Backend loads projection (read model)
  4. Projection contains responses 1-5
  5. UI renders with pre-filled answers

✅ No cookies needed
✅ No session affinity required
✅ Works across any device/browser
```

### Why Event Sourcing Enables This

```
Traditional Approach (State-Based):
  ❌ Session state in memory → Lost on server restart
  ❌ Cookie-based → Doesn't work cross-device
  ❌ Database row → Must manually sync

Event Sourcing Approach:
  ✅ All events persisted → Can rebuild state anytime
  ✅ Token-based → Works everywhere
  ✅ Projection updated in real-time → Always current
```

## 🎨 UI/UX Flow

### Test Portal States

```
┌─────────────┐
│   Pending   │  Status: pending
│             │  Display: Welcome screen + "Begin Assessment"
│   Start     │
└──────┬──────┘
       │ POST /start
       ▼
┌─────────────┐
│   Active    │  Status: active
│             │  Display: Questions + Progress bar + Auto-save
│   Questions │
└──────┬──────┘
       │ POST /pages/:id/complete (repeat for each page)
       ▼
┌─────────────┐
│  Completed  │  Status: completed
│             │  Display: "✅ Assessment Complete!"
│    Done     │
└─────────────┘
```

### Manager Dashboard Flow

```
┌─────────────────────┐
│  Create Session     │
│                     │
│  Email: [______]    │
│  Template: [____▼]  │
│  [ Create Session ] │
└──────────┬──────────┘
           │ POST /api/sessions
           ▼
┌─────────────────────┐
│  Session Created    │
│                     │
│  ✅ Success!        │
│  URL: [_________]   │
│  [Copy] [Share]     │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Sessions List      │
│                     │
│  📊 Recent Sessions │
│  • user@example.com │
│    Status: active   │
│    Progress: 2/3    │
└─────────────────────┘
```

## 🧪 Testing Scenarios

### 1. Basic Flow
1. Create session (Manager)
2. Start assessment (Test Portal)
3. Answer all questions
4. Complete assessment
5. ✅ Status = completed

### 2. Auto-Save
1. Start assessment
2. Answer question 1
3. Wait 30 seconds
4. ✅ See "💾 Saving..." → "✓ Saved at HH:MM"
5. Check MongoDB: `db.events.find({ eventType: 'ResponseRecorded' })`

### 3. Cross-Device
1. Start on Chrome
2. Answer 2 questions
3. Copy URL
4. Open in Firefox
5. ✅ Answers are there

### 4. Event Sourcing
1. Complete assessment
2. MongoDB: `db.events.find({ aggregateId: 'session-id' })`
3. ✅ See all events in order
4. MongoDB: `db.session_projections.findOne({ sessionId: 'session-id' })`
5. ✅ Projection matches final state

## 🔧 Configuration

### Environment Variables

```bash
# Backend (.env)
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://admin:devpassword@localhost:27017/janus?replicaSet=rs0&authSource=admin
MONGODB_DB_NAME=janus
REDIS_URL=redis://localhost:6379
JWT_SECRET=demo-secret-change-in-production
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

### Docker Compose

```yaml
services:
  mongodb:
    image: mongo:8.0
    ports: ["27017:27017"]
    command: mongod --replSet rs0  # Event Sourcing requires ReplicaSet

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

## 📈 Scalability Considerations

### Current Architecture (Demo)
- Single backend instance
- Single MongoDB instance (ReplicaSet)
- Single Redis instance

### Production Architecture (Future)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Backend 1  │     │  Backend 2  │     │  Backend N  │
│  (Node.js)  │     │  (Node.js)  │     │  (Node.js)  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                   ┌───────▼────────┐
                   │  Load Balancer │
                   └───────┬────────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  MongoDB    │────▶│  MongoDB    │────▶│  MongoDB    │
│  Primary    │     │  Secondary  │     │  Secondary  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │  Redis Cluster│
                   └───────────────┘
```

### Horizontal Scaling Strategy
- ✅ Stateless backend (scales horizontally)
- ✅ MongoDB sharding by `organizationId`
- ✅ Redis for distributed sessions/cache
- ✅ Event Store can be partitioned

## 🎯 Key Technical Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| **Event Sourcing** | Audit trail, analytics, replay | Complexity |
| **CQRS** | Optimized reads, separation of concerns | More code |
| **MongoDB** | Event Store + ReplicaSet, PRD requirement | NoSQL learning curve |
| **TypeScript** | Type safety, better DX | Build step |
| **Monorepo** | Shared types, unified versioning | Tooling complexity |
| **Vue 3** | Modern, Composition API, good DX | Smaller ecosystem than React |
| **Tailwind CSS** | Rapid development, consistency | Larger HTML |

---

**🏗️ Architecture conçue pour être extensible, maintenable, et production-ready !**
