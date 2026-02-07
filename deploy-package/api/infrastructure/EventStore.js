"use strict";
/**
 * Event Store - Persists domain events to MongoDB
 * Implements event sourcing pattern with append-only log
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStore = void 0;
class EventStore {
    collection;
    constructor(db) {
        this.collection = db.collection('events');
    }
    /**
     * Append a new event to the event store
     * Events are immutable and append-only
     */
    async append(event) {
        const document = {
            eventId: event.eventId,
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
            organizationId: event.organizationId,
            payload: event.payload,
            metadata: event.metadata,
            timestamp: event.timestamp,
            version: event.version,
        };
        await this.collection.insertOne(document);
    }
    /**
     * Get all events for a specific aggregate (e.g., a session)
     * Used to rebuild aggregate state from event history
     */
    async getEvents(aggregateId, organizationId) {
        const documents = await this.collection
            .find({
            aggregateId,
            organizationId,
        })
            .sort({ version: 1 })
            .toArray();
        return documents.map((doc) => this.toDomainEvent(doc));
    }
    /**
     * Get events after a specific version
     * Used for incremental projection updates
     */
    async getEventsAfterVersion(aggregateId, organizationId, afterVersion) {
        const documents = await this.collection
            .find({
            aggregateId,
            organizationId,
            version: { $gt: afterVersion },
        })
            .sort({ version: 1 })
            .toArray();
        return documents.map((doc) => this.toDomainEvent(doc));
    }
    /**
     * Get all events for an organization (admin/analytics)
     */
    async getEventsByOrganization(organizationId, limit = 100) {
        const documents = await this.collection
            .find({ organizationId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
        return documents.map((doc) => this.toDomainEvent(doc));
    }
    /**
     * Get all events across all organizations (PLATFORM ADMIN ONLY)
     */
    async getAllEventsGlobal(limit = 1000) {
        const documents = await this.collection
            .find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
        return documents.map((doc) => this.toDomainEvent(doc));
    }
    /**
     * Convert database document to domain event
     */
    toDomainEvent(doc) {
        return {
            eventId: doc.eventId,
            eventType: doc.eventType,
            aggregateId: doc.aggregateId,
            aggregateType: doc.aggregateType,
            organizationId: doc.organizationId,
            payload: doc.payload,
            metadata: doc.metadata,
            timestamp: doc.timestamp,
            version: doc.version,
        };
    }
    /**
     * Initialize indexes for optimal query performance
     */
    async createIndexes() {
        await this.collection.createIndex({ aggregateId: 1, organizationId: 1, version: 1 }, { unique: true });
        await this.collection.createIndex({ organizationId: 1, timestamp: -1 });
        await this.collection.createIndex({ eventType: 1, timestamp: -1 });
    }
}
exports.EventStore = EventStore;
//# sourceMappingURL=EventStore.js.map