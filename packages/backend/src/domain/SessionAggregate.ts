/**
 * Session Aggregate - Domain logic for assessment sessions
 * Implements event sourcing pattern with state reconstruction from events
 */

import { v4 as uuidv4 } from 'uuid';
import {
  DomainEvent,
  SessionCreatedEvent,
  SessionStartedEvent,
  ResponseRecordedEvent,
  PageCompletedEvent,
  SessionCompletedEvent,
  SessionExpiredEvent,
  SessionSuspendedEvent,
} from '../shared/types.js';

export class SessionAggregate {
  private sessionId: string;
  private organizationId: string;
  private status: 'pending' | 'active' | 'completed' | 'expired' | 'suspended' = 'pending';
  private version = 0;
  private uncommittedEvents: DomainEvent[] = [];

  // Session data
  private sessionToken?: string;
  private participantEmail?: string;
  private templateId?: string;
  private responses: Record<string, unknown> = {};
  private currentPage = 0;
  private totalPages = 0;
  private startedAt?: Date;
  private completedAt?: Date;
  private expiresAt?: Date;

  constructor(sessionId: string, organizationId: string) {
    this.sessionId = sessionId;
    this.organizationId = organizationId;
  }

  // ============================================================================
  // Commands (Write Operations)
  // ============================================================================

  createSession(
    participantEmail: string,
    templateId: string,
    sessionToken: string,
    expiresAt: Date,
    createdBy: string
  ): void {
    if (this.version > 0) {
      throw new Error('Session already created');
    }

    const event: SessionCreatedEvent = {
      eventId: uuidv4(),
      eventType: 'SessionCreated',
      aggregateId: this.sessionId,
      aggregateType: 'Session',
      organizationId: this.organizationId,
      timestamp: new Date(),
      version: this.version + 1,
      payload: {
        sessionToken,
        participantEmail,
        templateId,
        expiresAt,
        createdBy,
      },
    };

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  startSession(participantInfo?: { device: string; userAgent: string }): void {
    if (this.status !== 'pending') {
      throw new Error(`Cannot start session in ${this.status} status`);
    }

    if (this.expiresAt && new Date() > this.expiresAt) {
      throw new Error('Session has expired');
    }

    const event: SessionStartedEvent = {
      eventId: uuidv4(),
      eventType: 'SessionStarted',
      aggregateId: this.sessionId,
      aggregateType: 'Session',
      organizationId: this.organizationId,
      timestamp: new Date(),
      version: this.version + 1,
      payload: {
        startedAt: new Date(),
        participantInfo,
      },
    };

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  recordResponse(
    questionId: string,
    pageId: string,
    responseValue: unknown
  ): void {
    if (this.status !== 'active') {
      throw new Error(`Cannot record response in ${this.status} status`);
    }

    const event: ResponseRecordedEvent = {
      eventId: uuidv4(),
      eventType: 'ResponseRecorded',
      aggregateId: this.sessionId,
      aggregateType: 'Session',
      organizationId: this.organizationId,
      timestamp: new Date(),
      version: this.version + 1,
      payload: {
        questionId,
        pageId,
        responseValue,
        recordedAt: new Date(),
      },
    };

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  completePage(pageId: string): void {
    if (this.status !== 'active') {
      throw new Error(`Cannot complete page in ${this.status} status`);
    }

    const event: PageCompletedEvent = {
      eventId: uuidv4(),
      eventType: 'PageCompleted',
      aggregateId: this.sessionId,
      aggregateType: 'Session',
      organizationId: this.organizationId,
      timestamp: new Date(),
      version: this.version + 1,
      payload: {
        pageId,
        completedAt: new Date(),
      },
    };

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  completeSession(totalPages: number): void {
    if (this.status !== 'active') {
      throw new Error(`Cannot complete session in ${this.status} status`);
    }

    const event: SessionCompletedEvent = {
      eventId: uuidv4(),
      eventType: 'SessionCompleted',
      aggregateId: this.sessionId,
      aggregateType: 'Session',
      organizationId: this.organizationId,
      timestamp: new Date(),
      version: this.version + 1,
      payload: {
        completedAt: new Date(),
        totalPages,
        totalResponses: Object.keys(this.responses).length,
      },
    };

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  expireSession(reason: string): void {
    if (this.status === 'completed' || this.status === 'expired') {
      throw new Error(`Cannot expire session in ${this.status} status`);
    }

    const event: SessionExpiredEvent = {
      eventId: uuidv4(),
      eventType: 'SessionExpired',
      aggregateId: this.sessionId,
      aggregateType: 'Session',
      organizationId: this.organizationId,
      timestamp: new Date(),
      version: this.version + 1,
      payload: {
        expiredAt: new Date(),
        reason,
      },
    };

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  suspendSession(reason: string): void {
    if (this.status === 'completed' || this.status === 'expired' || this.status === 'suspended') {
      throw new Error(`Cannot suspend session in ${this.status} status`);
    }

    const event: SessionSuspendedEvent = {
      eventId: uuidv4(),
      eventType: 'SessionSuspended',
      aggregateId: this.sessionId,
      aggregateType: 'Session',
      organizationId: this.organizationId,
      timestamp: new Date(),
      version: this.version + 1,
      payload: {
        suspendedAt: new Date(),
        reason,
      },
    };

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  // ============================================================================
  // Event Sourcing Infrastructure
  // ============================================================================

  /**
   * Apply event to aggregate state
   */
  private applyEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case 'SessionCreated': {
        const payload = event.payload as SessionCreatedEvent['payload'];
        this.sessionToken = payload.sessionToken;
        this.participantEmail = payload.participantEmail;
        this.templateId = payload.templateId;
        this.expiresAt = payload.expiresAt;
        this.status = 'pending';
        break;
      }

      case 'SessionStarted': {
        this.status = 'active';
        this.startedAt = new Date();
        this.currentPage = 1;
        break;
      }

      case 'ResponseRecorded': {
        const payload = event.payload as ResponseRecordedEvent['payload'];
        this.responses[payload.questionId] = payload.responseValue;
        break;
      }

      case 'PageCompleted': {
        this.currentPage += 1;
        break;
      }

      case 'SessionCompleted': {
        const payload = event.payload as SessionCompletedEvent['payload'];
        this.status = 'completed';
        this.completedAt = new Date();
        this.totalPages = payload.totalPages;
        break;
      }

      case 'SessionExpired': {
        this.status = 'expired';
        break;
      }

      case 'SessionSuspended': {
        this.status = 'suspended';
        break;
      }
    }

    this.version = event.version;
  }

  /**
   * Rebuild aggregate state from event history
   */
  loadFromHistory(events: DomainEvent[]): void {
    events.forEach((event) => this.applyEvent(event));
  }

  /**
   * Get uncommitted events (to be persisted)
   */
  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  /**
   * Mark events as committed
   */
  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  // ============================================================================
  // Getters
  // ============================================================================

  getSessionId(): string {
    return this.sessionId;
  }

  getStatus(): string {
    return this.status;
  }

  getVersion(): number {
    return this.version;
  }

  getResponses(): Record<string, unknown> {
    return { ...this.responses };
  }

  getCurrentPage(): number {
    return this.currentPage;
  }
}
