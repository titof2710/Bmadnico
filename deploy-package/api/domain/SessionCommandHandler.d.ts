/**
 * Session Command Handler - Orchestrates command execution with event sourcing
 * Handles: Load aggregate → Execute command → Persist events → Update projections
 */
import { EventStore } from '../infrastructure/EventStore.js';
import { ProjectionStore } from '../infrastructure/ProjectionStore.js';
export interface CreateSessionCommand {
    organizationId: string;
    participantEmail: string;
    templateId: string;
    expiresInHours: number;
    createdBy: string;
}
export interface StartSessionCommand {
    sessionToken: string;
    organizationId: string;
    participantInfo?: {
        device: string;
        userAgent: string;
    };
}
export interface RecordResponseCommand {
    sessionToken: string;
    organizationId: string;
    questionId: string;
    pageId: string;
    responseValue: unknown;
}
export interface CompletePageCommand {
    sessionToken: string;
    organizationId: string;
    pageId: string;
}
export interface ExpireSessionCommand {
    sessionId: string;
    organizationId: string;
    reason: string;
}
export interface SuspendSessionCommand {
    sessionId: string;
    organizationId: string;
    reason: string;
}
export declare class SessionCommandHandler {
    private eventStore;
    private projectionStore;
    constructor(eventStore: EventStore, projectionStore: ProjectionStore);
    /**
     * Create a new assessment session
     */
    createSession(command: CreateSessionCommand): Promise<{
        sessionId: string;
        sessionToken: string;
    }>;
    /**
     * Start an assessment session (participant begins)
     */
    startSession(command: StartSessionCommand): Promise<void>;
    /**
     * Record a participant response
     */
    recordResponse(command: RecordResponseCommand): Promise<string>;
    /**
     * Complete a page
     */
    completePage(command: CompletePageCommand): Promise<void>;
    /**
     * Load aggregate from event history
     */
    private loadAggregate;
    /**
     * Persist uncommitted events and update projections
     */
    private persistAndApplyEvents;
    /**
     * Expire a session (manual or automatic)
     */
    expireSession(command: ExpireSessionCommand): Promise<void>;
    /**
     * Suspend a session (e.g., license depleted)
     */
    suspendSession(command: SuspendSessionCommand): Promise<void>;
    /**
     * Generate unique session token
     */
    private generateSessionToken;
}
//# sourceMappingURL=SessionCommandHandler.d.ts.map