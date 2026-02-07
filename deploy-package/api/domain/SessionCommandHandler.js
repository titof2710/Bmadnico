"use strict";
/**
 * Session Command Handler - Orchestrates command execution with event sourcing
 * Handles: Load aggregate → Execute command → Persist events → Update projections
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionCommandHandler = void 0;
const uuid_1 = require("uuid");
const SessionAggregate_js_1 = require("./SessionAggregate.js");
class SessionCommandHandler {
    eventStore;
    projectionStore;
    constructor(eventStore, projectionStore) {
        this.eventStore = eventStore;
        this.projectionStore = projectionStore;
    }
    /**
     * Create a new assessment session
     */
    async createSession(command) {
        const sessionId = (0, uuid_1.v4)();
        const sessionToken = this.generateSessionToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + command.expiresInHours);
        // Create aggregate and execute command
        const aggregate = new SessionAggregate_js_1.SessionAggregate(sessionId, command.organizationId);
        aggregate.createSession(command.participantEmail, command.templateId, sessionToken, expiresAt, command.createdBy);
        // Persist events
        const events = aggregate.getUncommittedEvents();
        for (const event of events) {
            await this.eventStore.append(event);
        }
        // Create projection
        await this.projectionStore.createProjection(sessionId, events[0]);
        aggregate.markEventsAsCommitted();
        return { sessionId, sessionToken };
    }
    /**
     * Start an assessment session (participant begins)
     */
    async startSession(command) {
        // Load aggregate from events
        const session = await this.projectionStore.getSessionByToken(command.sessionToken, command.organizationId);
        if (!session) {
            throw new Error('Session not found');
        }
        const aggregate = await this.loadAggregate(session.sessionId, command.organizationId);
        // Execute command
        aggregate.startSession(command.participantInfo);
        // Persist and apply
        await this.persistAndApplyEvents(aggregate);
    }
    /**
     * Record a participant response
     */
    async recordResponse(command) {
        const session = await this.projectionStore.getSessionByToken(command.sessionToken, command.organizationId);
        if (!session) {
            throw new Error('Session not found');
        }
        const aggregate = await this.loadAggregate(session.sessionId, command.organizationId);
        // Execute command
        aggregate.recordResponse(command.questionId, command.pageId, command.responseValue);
        // Persist and apply
        await this.persistAndApplyEvents(aggregate);
        const events = aggregate.getUncommittedEvents();
        return events[0]?.eventId || '';
    }
    /**
     * Complete a page
     */
    async completePage(command) {
        const session = await this.projectionStore.getSessionByToken(command.sessionToken, command.organizationId);
        if (!session) {
            throw new Error('Session not found');
        }
        const aggregate = await this.loadAggregate(session.sessionId, command.organizationId);
        aggregate.completePage(command.pageId);
        // Check if this was the last page - if so, complete the session
        // We need to check the current page AFTER completePage incremented it
        // Get template to check total pages
        const { mockTemplateService } = await import('../api/mockTemplateService.js');
        const template = await mockTemplateService.getTemplate(session.templateId, command.organizationId);
        if (template && aggregate.getCurrentPage() > template.pages.length) {
            // All pages completed - mark session as complete
            aggregate.completeSession(template.pages.length);
        }
        await this.persistAndApplyEvents(aggregate);
    }
    /**
     * Load aggregate from event history
     */
    async loadAggregate(sessionId, organizationId) {
        const events = await this.eventStore.getEvents(sessionId, organizationId);
        const aggregate = new SessionAggregate_js_1.SessionAggregate(sessionId, organizationId);
        aggregate.loadFromHistory(events);
        return aggregate;
    }
    /**
     * Persist uncommitted events and update projections
     */
    async persistAndApplyEvents(aggregate) {
        const events = aggregate.getUncommittedEvents();
        for (const event of events) {
            // Persist to event store
            await this.eventStore.append(event);
            // Update projection
            await this.projectionStore.applyEvent(event);
        }
        aggregate.markEventsAsCommitted();
    }
    /**
     * Expire a session (manual or automatic)
     */
    async expireSession(command) {
        const aggregate = await this.loadAggregate(command.sessionId, command.organizationId);
        aggregate.expireSession(command.reason);
        await this.persistAndApplyEvents(aggregate);
    }
    /**
     * Suspend a session (e.g., license depleted)
     */
    async suspendSession(command) {
        const aggregate = await this.loadAggregate(command.sessionId, command.organizationId);
        aggregate.suspendSession(command.reason);
        await this.persistAndApplyEvents(aggregate);
    }
    /**
     * Generate unique session token
     */
    generateSessionToken() {
        return `sess_${(0, uuid_1.v4)().replace(/-/g, '')}`;
    }
}
exports.SessionCommandHandler = SessionCommandHandler;
//# sourceMappingURL=SessionCommandHandler.js.map