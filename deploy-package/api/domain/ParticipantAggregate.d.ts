/**
 * Participant Aggregate - Participant Management
 * Manages participant profiles, history, and metadata
 */
export interface ParticipantCreatedEvent {
    eventId: string;
    eventType: 'ParticipantCreated';
    aggregateId: string;
    aggregateType: 'Participant';
    organizationId: string;
    timestamp: Date;
    version: number;
    payload: {
        email: string;
        firstName?: string;
        lastName?: string;
        companyId?: string;
        metadata?: Record<string, any>;
    };
}
export interface ParticipantProfileUpdatedEvent {
    eventId: string;
    eventType: 'ParticipantProfileUpdated';
    aggregateId: string;
    aggregateType: 'Participant';
    organizationId: string;
    timestamp: Date;
    version: number;
    payload: {
        updatedFields: {
            firstName?: string;
            lastName?: string;
            phone?: string;
            metadata?: Record<string, any>;
        };
        updatedAt: Date;
    };
}
export interface ParticipantSessionAssignedEvent {
    eventId: string;
    eventType: 'ParticipantSessionAssigned';
    aggregateId: string;
    aggregateType: 'Participant';
    organizationId: string;
    timestamp: Date;
    version: number;
    payload: {
        sessionId: string;
        templateId: string;
        assignedAt: Date;
    };
}
export interface ParticipantDeactivatedEvent {
    eventId: string;
    eventType: 'ParticipantDeactivated';
    aggregateId: string;
    aggregateType: 'Participant';
    organizationId: string;
    timestamp: Date;
    version: number;
    payload: {
        deactivatedAt: Date;
        reason?: string;
    };
}
export type ParticipantEvent = ParticipantCreatedEvent | ParticipantProfileUpdatedEvent | ParticipantSessionAssignedEvent | ParticipantDeactivatedEvent;
export declare class ParticipantAggregate {
    private participantId;
    private organizationId;
    private version;
    private uncommittedEvents;
    private state;
    constructor(participantId: string, organizationId: string);
    /**
     * Create a new participant
     */
    createParticipant(command: {
        email: string;
        firstName?: string;
        lastName?: string;
        companyId?: string;
        metadata?: Record<string, any>;
    }): void;
    /**
     * Update participant profile
     */
    updateProfile(command: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        metadata?: Record<string, any>;
    }): void;
    /**
     * Assign a session to this participant
     */
    assignSession(command: {
        sessionId: string;
        templateId: string;
    }): void;
    /**
     * Deactivate participant
     */
    deactivate(reason?: string): void;
    /**
     * Apply event to aggregate state
     */
    private apply;
    /**
     * Rebuild aggregate state from event history
     */
    loadFromHistory(events: ParticipantEvent[]): void;
    /**
     * Get uncommitted events
     */
    getUncommittedEvents(): ParticipantEvent[];
    /**
     * Mark events as committed
     */
    markEventsAsCommitted(): void;
    /**
     * Validate email format
     */
    private isValidEmail;
    /**
     * Getters
     */
    getParticipantId(): string;
    getVersion(): number;
    getState(): {
        email?: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        companyId?: string;
        isActive: boolean;
        sessions: Array<{
            sessionId: string;
            templateId: string;
            assignedAt: Date;
        }>;
        metadata?: Record<string, any>;
    };
    getFullName(): string;
    getSessionCount(): number;
}
//# sourceMappingURL=ParticipantAggregate.d.ts.map