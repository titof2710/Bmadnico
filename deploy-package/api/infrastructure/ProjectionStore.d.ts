/**
 * Projection Store - Maintains read-optimized views of session state
 * Updated by applying domain events to projections (CQRS pattern)
 */
import { Db } from 'mongodb';
import { SessionProjection, DomainEvent } from '../shared/types.js';
export declare class ProjectionStore {
    private collection;
    constructor(db: Db);
    /**
     * Get session projection by session ID
     */
    getSession(sessionId: string, organizationId: string): Promise<SessionProjection | null>;
    /**
     * Get session projection by session token (for participant access)
     */
    getSessionByToken(sessionToken: string, organizationId: string): Promise<SessionProjection | null>;
    /**
     * Get all sessions for an organization
     */
    getSessions(organizationId: string, filters?: {
        status?: string;
        limit?: number;
    }): Promise<SessionProjection[]>;
    /**
     * Get all sessions across all organizations (PLATFORM ADMIN ONLY)
     */
    getAllSessionsGlobal(limit?: number): Promise<SessionProjection[]>;
    /**
     * Create initial projection from SessionCreatedEvent
     */
    createProjection(sessionId: string, event: DomainEvent): Promise<void>;
    /**
     * Update projection by applying a domain event
     */
    applyEvent(event: DomainEvent): Promise<void>;
    /**
     * Calculate projection updates based on event type
     */
    private calculateUpdates;
    /**
     * Initialize indexes
     */
    createIndexes(): Promise<void>;
}
//# sourceMappingURL=ProjectionStore.d.ts.map