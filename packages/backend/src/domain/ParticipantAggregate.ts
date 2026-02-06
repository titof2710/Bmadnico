/**
 * Participant Aggregate - Participant Management
 * Manages participant profiles, history, and metadata
 */

import { v4 as uuidv4 } from 'uuid';

export interface ParticipantCreatedEvent {
  eventId: string;
  eventType: 'ParticipantCreated';
  aggregateId: string;
  aggregateType: 'Participant';
  organizationId: string;
  timestamp: Date;
  version: number;
  payload: {
    email: string;
    firstName?: string;
    lastName?: string;
    companyId?: string;
    metadata?: Record<string, any>;
  };
}

export interface ParticipantProfileUpdatedEvent {
  eventId: string;
  eventType: 'ParticipantProfileUpdated';
  aggregateId: string;
  aggregateType: 'Participant';
  organizationId: string;
  timestamp: Date;
  version: number;
  payload: {
    updatedFields: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      metadata?: Record<string, any>;
    };
    updatedAt: Date;
  };
}

export interface ParticipantSessionAssignedEvent {
  eventId: string;
  eventType: 'ParticipantSessionAssigned';
  aggregateId: string;
  aggregateType: 'Participant';
  organizationId: string;
  timestamp: Date;
  version: number;
  payload: {
    sessionId: string;
    templateId: string;
    assignedAt: Date;
  };
}

export interface ParticipantDeactivatedEvent {
  eventId: string;
  eventType: 'ParticipantDeactivated';
  aggregateId: string;
  aggregateType: 'Participant';
  organizationId: string;
  timestamp: Date;
  version: number;
  payload: {
    deactivatedAt: Date;
    reason?: string;
  };
}

export type ParticipantEvent =
  | ParticipantCreatedEvent
  | ParticipantProfileUpdatedEvent
  | ParticipantSessionAssignedEvent
  | ParticipantDeactivatedEvent;

export class ParticipantAggregate {
  private participantId: string;
  private organizationId: string;
  private version = 0;
  private uncommittedEvents: ParticipantEvent[] = [];

  private state: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    companyId?: string;
    isActive: boolean;
    sessions: Array<{
      sessionId: string;
      templateId: string;
      assignedAt: Date;
    }>;
    metadata?: Record<string, any>;
  } = {
    isActive: true,
    sessions: [],
  };

  constructor(participantId: string, organizationId: string) {
    this.participantId = participantId;
    this.organizationId = organizationId;
  }

  /**
   * Create a new participant
   */
  createParticipant(command: {
    email: string;
    firstName?: string;
    lastName?: string;
    companyId?: string;
    metadata?: Record<string, any>;
  }): void {
    if (this.version > 0) {
      throw new Error('Participant already created');
    }

    // Validate email
    if (!this.isValidEmail(command.email)) {
      throw new Error('Invalid email format');
    }

    const event: ParticipantCreatedEvent = {
      eventId: uuidv4(),
      eventType: 'ParticipantCreated',
      aggregateId: this.participantId,
      aggregateType: 'Participant',
      organizationId: this.organizationId,
      timestamp: new Date(),
      version: this.version + 1,
      payload: {
        email: command.email.toLowerCase(),
        firstName: command.firstName,
        lastName: command.lastName,
        companyId: command.companyId,
        metadata: command.metadata,
      },
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  /**
   * Update participant profile
   */
  updateProfile(command: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    metadata?: Record<string, any>;
  }): void {
    if (this.version === 0) {
      throw new Error('Participant does not exist');
    }

    if (!this.state.isActive) {
      throw new Error('Cannot update deactivated participant');
    }

    const event: ParticipantProfileUpdatedEvent = {
      eventId: uuidv4(),
      eventType: 'ParticipantProfileUpdated',
      aggregateId: this.participantId,
      aggregateType: 'Participant',
      organizationId: this.organizationId,
      timestamp: new Date(),
      version: this.version + 1,
      payload: {
        updatedFields: command,
        updatedAt: new Date(),
      },
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  /**
   * Assign a session to this participant
   */
  assignSession(command: {
    sessionId: string;
    templateId: string;
  }): void {
    if (this.version === 0) {
      throw new Error('Participant does not exist');
    }

    if (!this.state.isActive) {
      throw new Error('Cannot assign session to deactivated participant');
    }

    const event: ParticipantSessionAssignedEvent = {
      eventId: uuidv4(),
      eventType: 'ParticipantSessionAssigned',
      aggregateId: this.participantId,
      aggregateType: 'Participant',
      organizationId: this.organizationId,
      timestamp: new Date(),
      version: this.version + 1,
      payload: {
        sessionId: command.sessionId,
        templateId: command.templateId,
        assignedAt: new Date(),
      },
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  /**
   * Deactivate participant
   */
  deactivate(reason?: string): void {
    if (this.version === 0) {
      throw new Error('Participant does not exist');
    }

    if (!this.state.isActive) {
      throw new Error('Participant already deactivated');
    }

    const event: ParticipantDeactivatedEvent = {
      eventId: uuidv4(),
      eventType: 'ParticipantDeactivated',
      aggregateId: this.participantId,
      aggregateType: 'Participant',
      organizationId: this.organizationId,
      timestamp: new Date(),
      version: this.version + 1,
      payload: {
        deactivatedAt: new Date(),
        reason,
      },
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  /**
   * Apply event to aggregate state
   */
  private apply(event: ParticipantEvent): void {
    switch (event.eventType) {
      case 'ParticipantCreated': {
        this.state.email = event.payload.email;
        this.state.firstName = event.payload.firstName;
        this.state.lastName = event.payload.lastName;
        this.state.companyId = event.payload.companyId;
        this.state.metadata = event.payload.metadata;
        this.state.isActive = true;
        break;
      }

      case 'ParticipantProfileUpdated': {
        const { updatedFields } = event.payload;
        if (updatedFields.firstName !== undefined) {
          this.state.firstName = updatedFields.firstName;
        }
        if (updatedFields.lastName !== undefined) {
          this.state.lastName = updatedFields.lastName;
        }
        if (updatedFields.phone !== undefined) {
          this.state.phone = updatedFields.phone;
        }
        if (updatedFields.metadata !== undefined) {
          this.state.metadata = {
            ...this.state.metadata,
            ...updatedFields.metadata,
          };
        }
        break;
      }

      case 'ParticipantSessionAssigned': {
        this.state.sessions.push({
          sessionId: event.payload.sessionId,
          templateId: event.payload.templateId,
          assignedAt: event.payload.assignedAt,
        });
        break;
      }

      case 'ParticipantDeactivated': {
        this.state.isActive = false;
        break;
      }
    }

    this.version = event.version;
  }

  /**
   * Rebuild aggregate state from event history
   */
  loadFromHistory(events: ParticipantEvent[]): void {
    events.forEach((event) => this.apply(event));
  }

  /**
   * Get uncommitted events
   */
  getUncommittedEvents(): ParticipantEvent[] {
    return [...this.uncommittedEvents];
  }

  /**
   * Mark events as committed
   */
  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Getters
   */
  getParticipantId(): string {
    return this.participantId;
  }

  getVersion(): number {
    return this.version;
  }

  getState() {
    return { ...this.state };
  }

  getFullName(): string {
    if (this.state.firstName && this.state.lastName) {
      return `${this.state.firstName} ${this.state.lastName}`;
    }
    return this.state.firstName || this.state.lastName || this.state.email || '';
  }

  getSessionCount(): number {
    return this.state.sessions.length;
  }
}
