/**
 * Participant Projection Store
 * Maintains read-optimized views of participant data
 */
import { Db } from 'mongodb';
import { ParticipantEvent } from '../domain/ParticipantAggregate.js';
export interface ParticipantProjection {
    participantId: string;
    organizationId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    companyId?: string;
    isActive: boolean;
    sessionCount: number;
    sessions: Array<{
        sessionId: string;
        templateId: string;
        assignedAt: Date;
    }>;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    lastActivityAt?: Date;
    version: number;
}
export declare class ParticipantProjectionStore {
    private collection;
    constructor(db: Db);
    /**
     * Create indexes
     */
    createIndexes(): Promise<void>;
    /**
     * Get participant by ID
     */
    getParticipant(participantId: string, organizationId: string): Promise<ParticipantProjection | null>;
    /**
     * Get participant by email
     */
    getParticipantByEmail(email: string, organizationId: string): Promise<ParticipantProjection | null>;
    /**
     * Get all participants for an organization
     */
    getParticipants(organizationId: string, options?: {
        companyId?: string;
        isActive?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<ParticipantProjection[]>;
    /**
     * Get participants by company
     */
    getParticipantsByCompany(organizationId: string, companyId: string): Promise<ParticipantProjection[]>;
    /**
     * Count participants
     */
    countParticipants(organizationId: string, options?: {
        companyId?: string;
        isActive?: boolean;
    }): Promise<number>;
    /**
     * Create initial projection from ParticipantCreated event
     */
    createProjection(participantId: string, event: ParticipantEvent): Promise<void>;
    /**
     * Apply event to update projection
     */
    applyEvent(event: ParticipantEvent): Promise<void>;
    /**
     * Calculate projection updates based on event
     */
    private calculateUpdates;
    /**
     * Search participants by name or email
     */
    searchParticipants(organizationId: string, searchTerm: string, limit?: number): Promise<ParticipantProjection[]>;
}
//# sourceMappingURL=ParticipantProjectionStore.d.ts.map