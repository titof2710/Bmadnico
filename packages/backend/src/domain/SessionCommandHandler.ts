/**
 * Session Command Handler - Orchestrates command execution with event sourcing
 * Handles: Load aggregate → Execute command → Persist events → Update projections
 */

import { v4 as uuidv4 } from 'uuid';
import { SessionAggregate } from './SessionAggregate.js';
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

export class SessionCommandHandler {
  constructor(
    private eventStore: EventStore,
    private projectionStore: ProjectionStore
  ) {}

  /**
   * Create a new assessment session
   */
  async createSession(command: CreateSessionCommand): Promise<{
    sessionId: string;
    sessionToken: string;
  }> {
    const sessionId = uuidv4();
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + command.expiresInHours);

    // Create aggregate and execute command
    const aggregate = new SessionAggregate(sessionId, command.organizationId);
    aggregate.createSession(
      command.participantEmail,
      command.templateId,
      sessionToken,
      expiresAt,
      command.createdBy
    );

    // Persist events
    const events = aggregate.getUncommittedEvents();
    for (const event of events) {
      await this.eventStore.append(event);
    }

    // Create projection
    await this.projectionStore.createProjection(sessionId, events[0]);

    aggregate.markEventsAsCommitted();

    return { sessionId, sessionToken };
  }

  /**
   * Start an assessment session (participant begins)
   */
  async startSession(command: StartSessionCommand): Promise<void> {
    // Load aggregate from events
    const session = await this.projectionStore.getSessionByToken(
      command.sessionToken,
      command.organizationId
    );

    if (!session) {
      throw new Error('Session not found');
    }

    const aggregate = await this.loadAggregate(
      session.sessionId,
      command.organizationId
    );

    // Execute command
    aggregate.startSession(command.participantInfo);

    // Persist and apply
    await this.persistAndApplyEvents(aggregate);
  }

  /**
   * Record a participant response
   */
  async recordResponse(command: RecordResponseCommand): Promise<string> {
    const session = await this.projectionStore.getSessionByToken(
      command.sessionToken,
      command.organizationId
    );

    if (!session) {
      throw new Error('Session not found');
    }

    const aggregate = await this.loadAggregate(
      session.sessionId,
      command.organizationId
    );

    // Execute command
    aggregate.recordResponse(
      command.questionId,
      command.pageId,
      command.responseValue
    );

    // Persist and apply
    await this.persistAndApplyEvents(aggregate);

    const events = aggregate.getUncommittedEvents();
    return events[0]?.eventId || '';
  }

  /**
   * Complete a page
   */
  async completePage(command: CompletePageCommand): Promise<void> {
    const session = await this.projectionStore.getSessionByToken(
      command.sessionToken,
      command.organizationId
    );

    if (!session) {
      throw new Error('Session not found');
    }

    const aggregate = await this.loadAggregate(
      session.sessionId,
      command.organizationId
    );

    aggregate.completePage(command.pageId);

    // Check if this was the last page - if so, complete the session
    // We need to check the current page AFTER completePage incremented it
    // Get template to check total pages
    const { mockTemplateService } = await import('../api/mockTemplateService.js');
    const template = await mockTemplateService.getTemplate(
      session.templateId,
      command.organizationId
    );

    if (template && aggregate.getCurrentPage() > template.pages.length) {
      // All pages completed - mark session as complete
      aggregate.completeSession(template.pages.length);
    }

    await this.persistAndApplyEvents(aggregate);
  }

  /**
   * Load aggregate from event history
   */
  private async loadAggregate(
    sessionId: string,
    organizationId: string
  ): Promise<SessionAggregate> {
    const events = await this.eventStore.getEvents(sessionId, organizationId);

    const aggregate = new SessionAggregate(sessionId, organizationId);
    aggregate.loadFromHistory(events);

    return aggregate;
  }

  /**
   * Persist uncommitted events and update projections
   */
  private async persistAndApplyEvents(
    aggregate: SessionAggregate
  ): Promise<void> {
    const events = aggregate.getUncommittedEvents();

    for (const event of events) {
      // Persist to event store
      await this.eventStore.append(event);

      // Update projection
      await this.projectionStore.applyEvent(event);
    }

    aggregate.markEventsAsCommitted();
  }

  /**
   * Expire a session (manual or automatic)
   */
  async expireSession(command: ExpireSessionCommand): Promise<void> {
    const aggregate = await this.loadAggregate(
      command.sessionId,
      command.organizationId
    );

    aggregate.expireSession(command.reason);

    await this.persistAndApplyEvents(aggregate);
  }

  /**
   * Suspend a session (e.g., license depleted)
   */
  async suspendSession(command: SuspendSessionCommand): Promise<void> {
    const aggregate = await this.loadAggregate(
      command.sessionId,
      command.organizationId
    );

    aggregate.suspendSession(command.reason);

    await this.persistAndApplyEvents(aggregate);
  }

  /**
   * Generate unique session token
   */
  private generateSessionToken(): string {
    return `sess_${uuidv4().replace(/-/g, '')}`;
  }
}
