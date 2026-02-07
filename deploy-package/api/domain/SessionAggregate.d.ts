/**
 * Session Aggregate - Domain logic for assessment sessions
 * Implements event sourcing pattern with state reconstruction from events
 */
import { DomainEvent } from '../shared/types.js';
export declare class SessionAggregate {
    private sessionId;
    private organizationId;
    private status;
    private version;
    private uncommittedEvents;
    private sessionToken?;
    private participantEmail?;
    private templateId?;
    private responses;
    private currentPage;
    private totalPages;
    private startedAt?;
    private completedAt?;
    private expiresAt?;
    constructor(sessionId: string, organizationId: string);
    createSession(participantEmail: string, templateId: string, sessionToken: string, expiresAt: Date, createdBy: string): void;
    startSession(participantInfo?: {
        device: string;
        userAgent: string;
    }): void;
    recordResponse(questionId: string, pageId: string, responseValue: unknown): void;
    completePage(pageId: string): void;
    completeSession(totalPages: number): void;
    expireSession(reason: string): void;
    suspendSession(reason: string): void;
    /**
     * Apply event to aggregate state
     */
    private applyEvent;
    /**
     * Rebuild aggregate state from event history
     */
    loadFromHistory(events: DomainEvent[]): void;
    /**
     * Get uncommitted events (to be persisted)
     */
    getUncommittedEvents(): DomainEvent[];
    /**
     * Mark events as committed
     */
    markEventsAsCommitted(): void;
    getSessionId(): string;
    getStatus(): string;
    getVersion(): number;
    getResponses(): Record<string, unknown>;
    getCurrentPage(): number;
}
//# sourceMappingURL=SessionAggregate.d.ts.map