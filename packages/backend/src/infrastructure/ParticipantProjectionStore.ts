/**
 * Participant Projection Store
 * Maintains read-optimized views of participant data
 */

import { Collection, Db } from 'mongodb';
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

interface ParticipantProjectionDocument extends ParticipantProjection {
  _id?: any;
}

export class ParticipantProjectionStore {
  private collection: Collection<ParticipantProjectionDocument>;

  constructor(db: Db) {
    this.collection = db.collection<ParticipantProjectionDocument>('participant_projections');
  }

  /**
   * Create indexes
   */
  async createIndexes(): Promise<void> {
    await this.collection.createIndex({ participantId: 1, organizationId: 1 }, { unique: true });
    await this.collection.createIndex({ organizationId: 1, email: 1 }, { unique: true });
    await this.collection.createIndex({ organizationId: 1, companyId: 1 });
    await this.collection.createIndex({ organizationId: 1, isActive: 1 });
  }

  /**
   * Get participant by ID
   */
  async getParticipant(
    participantId: string,
    organizationId: string
  ): Promise<ParticipantProjection | null> {
    const doc = await this.collection.findOne({
      participantId,
      organizationId,
    });

    if (!doc) return null;

    const { _id, ...projection } = doc;
    return projection;
  }

  /**
   * Get participant by email
   */
  async getParticipantByEmail(
    email: string,
    organizationId: string
  ): Promise<ParticipantProjection | null> {
    const doc = await this.collection.findOne({
      email: email.toLowerCase(),
      organizationId,
    });

    if (!doc) return null;

    const { _id, ...projection } = doc;
    return projection;
  }

  /**
   * Get all participants for an organization
   */
  async getParticipants(
    organizationId: string,
    options?: {
      companyId?: string;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<ParticipantProjection[]> {
    const filter: any = { organizationId };

    if (options?.companyId) {
      filter.companyId = options.companyId;
    }

    if (options?.isActive !== undefined) {
      filter.isActive = options.isActive;
    }

    let query = this.collection.find(filter).sort({ createdAt: -1 });

    if (options?.offset) {
      query = query.skip(options.offset);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const docs = await query.toArray();
    return docs.map(({ _id, ...projection }) => projection);
  }

  /**
   * Get participants by company
   */
  async getParticipantsByCompany(
    organizationId: string,
    companyId: string
  ): Promise<ParticipantProjection[]> {
    const docs = await this.collection
      .find({ organizationId, companyId, isActive: true })
      .sort({ lastName: 1, firstName: 1 })
      .toArray();

    return docs.map(({ _id, ...projection }) => projection);
  }

  /**
   * Count participants
   */
  async countParticipants(
    organizationId: string,
    options?: {
      companyId?: string;
      isActive?: boolean;
    }
  ): Promise<number> {
    const filter: any = { organizationId };

    if (options?.companyId) {
      filter.companyId = options.companyId;
    }

    if (options?.isActive !== undefined) {
      filter.isActive = options.isActive;
    }

    return await this.collection.countDocuments(filter);
  }

  /**
   * Create initial projection from ParticipantCreated event
   */
  async createProjection(participantId: string, event: ParticipantEvent): Promise<void> {
    if (event.eventType !== 'ParticipantCreated') {
      throw new Error('Can only create projection from ParticipantCreated event');
    }

    const payload = event.payload as any;

    const projection: ParticipantProjectionDocument = {
      participantId,
      organizationId: event.organizationId,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      companyId: payload.companyId,
      isActive: true,
      sessionCount: 0,
      sessions: [],
      metadata: payload.metadata,
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
      version: event.version,
    };

    await this.collection.insertOne(projection);
  }

  /**
   * Apply event to update projection
   */
  async applyEvent(event: ParticipantEvent): Promise<void> {
    const participant = await this.getParticipant(event.aggregateId, event.organizationId);

    if (!participant) {
      throw new Error(`Projection not found for participant ${event.aggregateId}`);
    }

    const updates = this.calculateUpdates(participant, event);

    await this.collection.updateOne(
      {
        participantId: event.aggregateId,
        organizationId: event.organizationId,
      },
      {
        $set: {
          ...updates,
          version: event.version,
          updatedAt: event.timestamp,
          lastActivityAt: event.timestamp,
        },
      }
    );
  }

  /**
   * Calculate projection updates based on event
   */
  private calculateUpdates(
    participant: ParticipantProjection,
    event: ParticipantEvent
  ): Partial<ParticipantProjection> {
    const updates: any = {};

    switch (event.eventType) {
      case 'ParticipantProfileUpdated': {
        const payload = event.payload as any;
        if (payload.firstName !== undefined) updates.firstName = payload.firstName;
        if (payload.lastName !== undefined) updates.lastName = payload.lastName;
        if (payload.phone !== undefined) updates.phone = payload.phone;
        if (payload.metadata !== undefined) {
          updates.metadata = {
            ...participant.metadata,
            ...payload.metadata,
          };
        }
        break;
      }

      case 'ParticipantSessionAssigned': {
        const payload = event.payload as any;
        updates.sessions = [
          ...participant.sessions,
          {
            sessionId: payload.sessionId,
            templateId: payload.templateId,
            assignedAt: payload.assignedAt,
          },
        ];
        updates.sessionCount = participant.sessionCount + 1;
        break;
      }

      case 'ParticipantDeactivated': {
        updates.isActive = false;
        break;
      }
    }

    return updates;
  }

  /**
   * Search participants by name or email
   */
  async searchParticipants(
    organizationId: string,
    searchTerm: string,
    limit: number = 20
  ): Promise<ParticipantProjection[]> {
    const searchRegex = new RegExp(searchTerm, 'i');

    const docs = await this.collection
      .find({
        organizationId,
        $or: [
          { email: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex },
        ],
      })
      .limit(limit)
      .toArray();

    return docs.map(({ _id, ...projection }) => projection);
  }
}
