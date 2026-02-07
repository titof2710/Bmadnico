/**
 * Event Store - Persists domain events to MongoDB
 * Implements event sourcing pattern with append-only log
 */
import { Db } from 'mongodb';
import { DomainEvent } from '../shared/types.js';
export declare class EventStore {
    private collection;
    constructor(db: Db);
    /**
     * Append a new event to the event store
     * Events are immutable and append-only
     */
    append(event: DomainEvent): Promise<void>;
    /**
     * Get all events for a specific aggregate (e.g., a session)
     * Used to rebuild aggregate state from event history
     */
    getEvents(aggregateId: string, organizationId: string): Promise<DomainEvent[]>;
    /**
     * Get events after a specific version
     * Used for incremental projection updates
     */
    getEventsAfterVersion(aggregateId: string, organizationId: string, afterVersion: number): Promise<DomainEvent[]>;
    /**
     * Get all events for an organization (admin/analytics)
     */
    getEventsByOrganization(organizationId: string, limit?: number): Promise<DomainEvent[]>;
    /**
     * Get all events across all organizations (PLATFORM ADMIN ONLY)
     */
    getAllEventsGlobal(limit?: number): Promise<DomainEvent[]>;
    /**
     * Convert database document to domain event
     */
    private toDomainEvent;
    /**
     * Initialize indexes for optimal query performance
     */
    createIndexes(): Promise<void>;
}
//# sourceMappingURL=EventStore.d.ts.map