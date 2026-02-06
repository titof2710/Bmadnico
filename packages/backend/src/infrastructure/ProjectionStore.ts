/**
 * Projection Store - Maintains read-optimized views of session state
 * Updated by applying domain events to projections (CQRS pattern)
 */

import { Collection, Db } from 'mongodb';
import {
  SessionProjection,
  ProjectionDocument,
  DomainEvent,
} from '../shared/types.js';

export class ProjectionStore {
  private collection: Collection<ProjectionDocument>;

  constructor(db: Db) {
    this.collection = db.collection<ProjectionDocument>('session_projections');
  }

  /**
   * Get session projection by session ID
   */
  async getSession(
    sessionId: string,
    organizationId: string
  ): Promise<SessionProjection | null> {
    const doc = await this.collection.findOne({
      sessionId,
      organizationId,
    });

    if (!doc) return null;

    const { _id, ...projection } = doc;
    return projection;
  }

  /**
   * Get session projection by session token (for participant access)
   */
  async getSessionByToken(
    sessionToken: string,
    organizationId: string
  ): Promise<SessionProjection | null> {
    const doc = await this.collection.findOne({
      sessionToken,
      organizationId,
    });

    if (!doc) return null;

    const { _id, ...projection } = doc;
    return projection;
  }

  /**
   * Get all sessions for an organization
   */
  async getSessions(
    organizationId: string,
    filters?: {
      status?: string;
      limit?: number;
    }
  ): Promise<SessionProjection[]> {
    const query: Record<string, unknown> = { organizationId };
    if (filters?.status) {
      query.status = filters.status;
    }

    const docs = await this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(filters?.limit || 100)
      .toArray();

    return docs.map(({ _id, ...projection }) => projection);
  }

  /**
   * Get all sessions across all organizations (PLATFORM ADMIN ONLY)
   */
  async getAllSessionsGlobal(limit: number = 1000): Promise<SessionProjection[]> {
    const docs = await this.collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return docs.map(({ _id, ...projection }) => projection);
  }

  /**
   * Create initial projection from SessionCreatedEvent
   */
  async createProjection(sessionId: string, event: DomainEvent): Promise<void> {
    if (event.eventType !== 'SessionCreated') {
      throw new Error('Can only create projection from SessionCreatedEvent');
    }

    const payload = event.payload as {
      sessionToken: string;
      participantEmail: string;
      templateId: string;
      expiresAt: Date;
    };

    const projection: ProjectionDocument = {
      sessionId,
      organizationId: event.organizationId,
      sessionToken: payload.sessionToken,
      participantEmail: payload.participantEmail,
      templateId: payload.templateId,
      status: 'pending',
      currentPage: 0,
      totalPages: 0,
      responses: {},
      expiresAt: payload.expiresAt,
      lastActivityAt: event.timestamp,
      version: event.version,
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
    };

    await this.collection.insertOne(projection);
  }

  /**
   * Update projection by applying a domain event
   */
  async applyEvent(event: DomainEvent): Promise<void> {
    const session = await this.getSession(
      event.aggregateId,
      event.organizationId
    );

    if (!session) {
      throw new Error(
        `Projection not found for session ${event.aggregateId}`
      );
    }

    const updates = this.calculateUpdates(session, event);

    await this.collection.updateOne(
      {
        sessionId: event.aggregateId,
        organizationId: event.organizationId,
      },
      {
        $set: {
          ...updates,
          version: event.version,
          lastActivityAt: event.timestamp,
          updatedAt: event.timestamp,
        },
      }
    );
  }

  /**
   * Calculate projection updates based on event type
   */
  private calculateUpdates(
    session: SessionProjection,
    event: DomainEvent
  ): Partial<SessionProjection> {
    switch (event.eventType) {
      case 'SessionStarted':
        return {
          status: 'active',
          startedAt: event.timestamp,
          currentPage: 1,
        };

      case 'ResponseRecorded': {
        const payload = event.payload as {
          questionId: string;
          responseValue: unknown;
        };
        return {
          responses: {
            ...session.responses,
            [payload.questionId]: payload.responseValue,
          },
        };
      }

      case 'PageCompleted': {
        const payload = event.payload as { pageId: string };
        return {
          currentPage: session.currentPage + 1,
        };
      }

      case 'SessionCompleted': {
        const payload = event.payload as {
          totalPages: number;
          totalResponses: number;
        };
        return {
          status: 'completed',
          completedAt: event.timestamp,
          totalPages: payload.totalPages,
          currentPage: payload.totalPages, // Corriger le currentPage pour l'affichage
        };
      }

      case 'SessionExpired': {
        return {
          status: 'expired',
        };
      }

      case 'SessionSuspended': {
        return {
          status: 'suspended',
        };
      }

      default:
        return {};
    }
  }

  /**
   * Initialize indexes
   */
  async createIndexes(): Promise<void> {
    await this.collection.createIndex(
      { sessionId: 1, organizationId: 1 },
      { unique: true }
    );
    await this.collection.createIndex(
      { sessionToken: 1, organizationId: 1 },
      { unique: true }
    );
    await this.collection.createIndex({ organizationId: 1, status: 1 });
    await this.collection.createIndex({ organizationId: 1, createdAt: -1 });
  }
}
