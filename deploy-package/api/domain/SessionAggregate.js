"use strict";
/**
 * Session Aggregate - Domain logic for assessment sessions
 * Implements event sourcing pattern with state reconstruction from events
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionAggregate = void 0;
const uuid_1 = require("uuid");
class SessionAggregate {
    sessionId;
    organizationId;
    status = 'pending';
    version = 0;
    uncommittedEvents = [];
    // Session data
    sessionToken;
    participantEmail;
    templateId;
    responses = {};
    currentPage = 0;
    totalPages = 0;
    startedAt;
    completedAt;
    expiresAt;
    constructor(sessionId, organizationId) {
        this.sessionId = sessionId;
        this.organizationId = organizationId;
    }
    // ============================================================================
    // Commands (Write Operations)
    // ============================================================================
    createSession(participantEmail, templateId, sessionToken, expiresAt, createdBy) {
        if (this.version > 0) {
            throw new Error('Session already created');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
            eventType: 'SessionCreated',
            aggregateId: this.sessionId,
            aggregateType: 'Session',
            organizationId: this.organizationId,
            timestamp: new Date(),
            version: this.version + 1,
            payload: {
                sessionToken,
                participantEmail,
                templateId,
                expiresAt,
                createdBy,
            },
        };
        this.applyEvent(event);
        this.uncommittedEvents.push(event);
    }
    startSession(participantInfo) {
        if (this.status !== 'pending') {
            throw new Error(`Cannot start session in ${this.status} status`);
        }
        if (this.expiresAt && new Date() > this.expiresAt) {
            throw new Error('Session has expired');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
            eventType: 'SessionStarted',
            aggregateId: this.sessionId,
            aggregateType: 'Session',
            organizationId: this.organizationId,
            timestamp: new Date(),
            version: this.version + 1,
            payload: {
                startedAt: new Date(),
                participantInfo,
            },
        };
        this.applyEvent(event);
        this.uncommittedEvents.push(event);
    }
    recordResponse(questionId, pageId, responseValue) {
        if (this.status !== 'active') {
            throw new Error(`Cannot record response in ${this.status} status`);
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
            eventType: 'ResponseRecorded',
            aggregateId: this.sessionId,
            aggregateType: 'Session',
            organizationId: this.organizationId,
            timestamp: new Date(),
            version: this.version + 1,
            payload: {
                questionId,
                pageId,
                responseValue,
                recordedAt: new Date(),
            },
        };
        this.applyEvent(event);
        this.uncommittedEvents.push(event);
    }
    completePage(pageId) {
        if (this.status !== 'active') {
            throw new Error(`Cannot complete page in ${this.status} status`);
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
            eventType: 'PageCompleted',
            aggregateId: this.sessionId,
            aggregateType: 'Session',
            organizationId: this.organizationId,
            timestamp: new Date(),
            version: this.version + 1,
            payload: {
                pageId,
                completedAt: new Date(),
            },
        };
        this.applyEvent(event);
        this.uncommittedEvents.push(event);
    }
    completeSession(totalPages) {
        if (this.status !== 'active') {
            throw new Error(`Cannot complete session in ${this.status} status`);
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
            eventType: 'SessionCompleted',
            aggregateId: this.sessionId,
            aggregateType: 'Session',
            organizationId: this.organizationId,
            timestamp: new Date(),
            version: this.version + 1,
            payload: {
                completedAt: new Date(),
                totalPages,
                totalResponses: Object.keys(this.responses).length,
            },
        };
        this.applyEvent(event);
        this.uncommittedEvents.push(event);
    }
    expireSession(reason) {
        if (this.status === 'completed' || this.status === 'expired') {
            throw new Error(`Cannot expire session in ${this.status} status`);
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
            eventType: 'SessionExpired',
            aggregateId: this.sessionId,
            aggregateType: 'Session',
            organizationId: this.organizationId,
            timestamp: new Date(),
            version: this.version + 1,
            payload: {
                expiredAt: new Date(),
                reason,
            },
        };
        this.applyEvent(event);
        this.uncommittedEvents.push(event);
    }
    suspendSession(reason) {
        if (this.status === 'completed' || this.status === 'expired' || this.status === 'suspended') {
            throw new Error(`Cannot suspend session in ${this.status} status`);
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
            eventType: 'SessionSuspended',
            aggregateId: this.sessionId,
            aggregateType: 'Session',
            organizationId: this.organizationId,
            timestamp: new Date(),
            version: this.version + 1,
            payload: {
                suspendedAt: new Date(),
                reason,
            },
        };
        this.applyEvent(event);
        this.uncommittedEvents.push(event);
    }
    // ============================================================================
    // Event Sourcing Infrastructure
    // ============================================================================
    /**
     * Apply event to aggregate state
     */
    applyEvent(event) {
        switch (event.eventType) {
            case 'SessionCreated': {
                const payload = event.payload;
                this.sessionToken = payload.sessionToken;
                this.participantEmail = payload.participantEmail;
                this.templateId = payload.templateId;
                this.expiresAt = payload.expiresAt;
                this.status = 'pending';
                break;
            }
            case 'SessionStarted': {
                this.status = 'active';
                this.startedAt = new Date();
                this.currentPage = 1;
                break;
            }
            case 'ResponseRecorded': {
                const payload = event.payload;
                this.responses[payload.questionId] = payload.responseValue;
                break;
            }
            case 'PageCompleted': {
                this.currentPage += 1;
                break;
            }
            case 'SessionCompleted': {
                const payload = event.payload;
                this.status = 'completed';
                this.completedAt = new Date();
                this.totalPages = payload.totalPages;
                break;
            }
            case 'SessionExpired': {
                this.status = 'expired';
                break;
            }
            case 'SessionSuspended': {
                this.status = 'suspended';
                break;
            }
        }
        this.version = event.version;
    }
    /**
     * Rebuild aggregate state from event history
     */
    loadFromHistory(events) {
        events.forEach((event) => this.applyEvent(event));
    }
    /**
     * Get uncommitted events (to be persisted)
     */
    getUncommittedEvents() {
        return [...this.uncommittedEvents];
    }
    /**
     * Mark events as committed
     */
    markEventsAsCommitted() {
        this.uncommittedEvents = [];
    }
    // ============================================================================
    // Getters
    // ============================================================================
    getSessionId() {
        return this.sessionId;
    }
    getStatus() {
        return this.status;
    }
    getVersion() {
        return this.version;
    }
    getResponses() {
        return { ...this.responses };
    }
    getCurrentPage() {
        return this.currentPage;
    }
}
exports.SessionAggregate = SessionAggregate;
//# sourceMappingURL=SessionAggregate.js.map