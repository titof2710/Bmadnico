/**
 * Event Store - Persists domain events to MongoDB
 * Implements event sourcing pattern with append-only log
 */

import { Collection, Db } from 'mongodb';
import { DomainEvent, EventStoreDocument } from '../shared/types.js';

export class EventStore {
  private collection: Collection<EventStoreDocument>;

  constructor(db: Db) {
    this.collection = db.collection<EventStoreDocument>('events');
  }

  /**
   * Append a new event to the event store
   * Events are immutable and append-only
   */
  async append(event: DomainEvent): Promise<void> {
    const document: EventStoreDocument = {
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      organizationId: event.organizationId,
      payload: event.payload as Record<string, unknown>,
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
  async getEvents(
    aggregateId: string,
    organizationId: string
  ): Promise<DomainEvent[]> {
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
  async getEventsAfterVersion(
    aggregateId: string,
    organizationId: string,
    afterVersion: number
  ): Promise<DomainEvent[]> {
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
  async getEventsByOrganization(
    organizationId: string,
    limit = 100
  ): Promise<DomainEvent[]> {
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
  async getAllEventsGlobal(limit = 1000): Promise<DomainEvent[]> {
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
  private toDomainEvent(doc: EventStoreDocument): DomainEvent {
    return {
      eventId: doc.eventId,
      eventType: doc.eventType,
      aggregateId: doc.aggregateId,
      aggregateType: doc.aggregateType as 'Session',
      organizationId: doc.organizationId,
      payload: doc.payload,
      metadata: doc.metadata,
      timestamp: doc.timestamp,
      version: doc.version,
    } as DomainEvent;
  }

  /**
   * Initialize indexes for optimal query performance
   */
  async createIndexes(): Promise<void> {
    await this.collection.createIndex(
      { aggregateId: 1, organizationId: 1, version: 1 },
      { unique: true }
    );
    await this.collection.createIndex({ organizationId: 1, timestamp: -1 });
    await this.collection.createIndex({ eventType: 1, timestamp: -1 });
  }
}
