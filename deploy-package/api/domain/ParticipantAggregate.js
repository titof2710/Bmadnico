"use strict";
/**
 * Participant Aggregate - Participant Management
 * Manages participant profiles, history, and metadata
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipantAggregate = void 0;
const uuid_1 = require("uuid");
class ParticipantAggregate {
    participantId;
    organizationId;
    version = 0;
    uncommittedEvents = [];
    state = {
        isActive: true,
        sessions: [],
    };
    constructor(participantId, organizationId) {
        this.participantId = participantId;
        this.organizationId = organizationId;
    }
    /**
     * Create a new participant
     */
    createParticipant(command) {
        if (this.version > 0) {
            throw new Error('Participant already created');
        }
        // Validate email
        if (!this.isValidEmail(command.email)) {
            throw new Error('Invalid email format');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
            eventType: 'ParticipantCreated',
            aggregateId: this.participantId,
            aggregateType: 'Participant',
            organizationId: this.organizationId,
            timestamp: new Date(),
            version: this.version + 1,
            payload: {
                email: command.email.toLowerCase(),
                firstName: command.firstName,
                lastName: command.lastName,
                companyId: command.companyId,
                metadata: command.metadata,
            },
        };
        this.apply(event);
        this.uncommittedEvents.push(event);
    }
    /**
     * Update participant profile
     */
    updateProfile(command) {
        if (this.version === 0) {
            throw new Error('Participant does not exist');
        }
        if (!this.state.isActive) {
            throw new Error('Cannot update deactivated participant');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
            eventType: 'ParticipantProfileUpdated',
            aggregateId: this.participantId,
            aggregateType: 'Participant',
            organizationId: this.organizationId,
            timestamp: new Date(),
            version: this.version + 1,
            payload: {
                updatedFields: command,
                updatedAt: new Date(),
            },
        };
        this.apply(event);
        this.uncommittedEvents.push(event);
    }
    /**
     * Assign a session to this participant
     */
    assignSession(command) {
        if (this.version === 0) {
            throw new Error('Participant does not exist');
        }
        if (!this.state.isActive) {
            throw new Error('Cannot assign session to deactivated participant');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
            eventType: 'ParticipantSessionAssigned',
            aggregateId: this.participantId,
            aggregateType: 'Participant',
            organizationId: this.organizationId,
            timestamp: new Date(),
            version: this.version + 1,
            payload: {
                sessionId: command.sessionId,
                templateId: command.templateId,
                assignedAt: new Date(),
            },
        };
        this.apply(event);
        this.uncommittedEvents.push(event);
    }
    /**
     * Deactivate participant
     */
    deactivate(reason) {
        if (this.version === 0) {
            throw new Error('Participant does not exist');
        }
        if (!this.state.isActive) {
            throw new Error('Participant already deactivated');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
            eventType: 'ParticipantDeactivated',
            aggregateId: this.participantId,
            aggregateType: 'Participant',
            organizationId: this.organizationId,
            timestamp: new Date(),
            version: this.version + 1,
            payload: {
                deactivatedAt: new Date(),
                reason,
            },
        };
        this.apply(event);
        this.uncommittedEvents.push(event);
    }
    /**
     * Apply event to aggregate state
     */
    apply(event) {
        switch (event.eventType) {
            case 'ParticipantCreated': {
                this.state.email = event.payload.email;
                this.state.firstName = event.payload.firstName;
                this.state.lastName = event.payload.lastName;
                this.state.companyId = event.payload.companyId;
                this.state.metadata = event.payload.metadata;
                this.state.isActive = true;
                break;
            }
            case 'ParticipantProfileUpdated': {
                const { updatedFields } = event.payload;
                if (updatedFields.firstName !== undefined) {
                    this.state.firstName = updatedFields.firstName;
                }
                if (updatedFields.lastName !== undefined) {
                    this.state.lastName = updatedFields.lastName;
                }
                if (updatedFields.phone !== undefined) {
                    this.state.phone = updatedFields.phone;
                }
                if (updatedFields.metadata !== undefined) {
                    this.state.metadata = {
                        ...this.state.metadata,
                        ...updatedFields.metadata,
                    };
                }
                break;
            }
            case 'ParticipantSessionAssigned': {
                this.state.sessions.push({
                    sessionId: event.payload.sessionId,
                    templateId: event.payload.templateId,
                    assignedAt: event.payload.assignedAt,
                });
                break;
            }
            case 'ParticipantDeactivated': {
                this.state.isActive = false;
                break;
            }
        }
        this.version = event.version;
    }
    /**
     * Rebuild aggregate state from event history
     */
    loadFromHistory(events) {
        events.forEach((event) => this.apply(event));
    }
    /**
     * Get uncommitted events
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
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * Getters
     */
    getParticipantId() {
        return this.participantId;
    }
    getVersion() {
        return this.version;
    }
    getState() {
        return { ...this.state };
    }
    getFullName() {
        if (this.state.firstName && this.state.lastName) {
            return `${this.state.firstName} ${this.state.lastName}`;
        }
        return this.state.firstName || this.state.lastName || this.state.email || '';
    }
    getSessionCount() {
        return this.state.sessions.length;
    }
}
exports.ParticipantAggregate = ParticipantAggregate;
//# sourceMappingURL=ParticipantAggregate.js.map