/**
 * Company Aggregate - Manages client companies (multi-tenant)
 * Implements Event Sourcing pattern
 */

import { v4 as uuidv4 } from 'uuid';
import { DomainEvent } from '../shared/types.js';

interface CompanyUser {
  userId: string;
  email: string;
  fullName: string;
  role: 'representative' | 'consultant';
  addedAt: Date;
}

interface CompanyState {
  companyId: string;
  companyName: string;
  contactEmail: string;
  brandingConfig: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  users: CompanyUser[];
  isActive: boolean;
  createdAt: Date;
  version: number;
}

export class CompanyAggregate {
  private state: CompanyState;
  private uncommittedEvents: DomainEvent[] = [];

  constructor() {
    this.state = {
      companyId: '',
      companyName: '',
      contactEmail: '',
      brandingConfig: {},
      users: [],
      isActive: true,
      createdAt: new Date(),
      version: 0,
    };
  }

  /**
   * Create a new company
   */
  createCompany(command: {
    companyId: string;
    companyName: string;
    contactEmail: string;
    representativeEmail: string;
    representativeName: string;
  }): void {
    if (this.state.companyId) {
      throw new Error('Company already exists');
    }

    const event: DomainEvent = {
      eventId: uuidv4(),
      eventType: 'CompanyCreated',
      aggregateId: command.companyId,
      aggregateType: 'Company',
      organizationId: command.companyId, // Company is its own organization
      timestamp: new Date(),
      version: 1,
      payload: {
        companyName: command.companyName,
        contactEmail: command.contactEmail,
        representativeEmail: command.representativeEmail,
        representativeName: command.representativeName,
      },
      metadata: {},
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  /**
   * Add a user to the company
   */
  addUser(command: {
    userId: string;
    email: string;
    fullName: string;
    role: 'representative' | 'consultant';
  }): void {
    if (!this.state.companyId) {
      throw new Error('Company does not exist');
    }

    // Check if user already exists
    if (this.state.users.some(u => u.email === command.email)) {
      throw new Error('User with this email already exists');
    }

    const event: DomainEvent = {
      eventId: uuidv4(),
      eventType: 'UserAdded',
      aggregateId: this.state.companyId,
      aggregateType: 'Company',
      organizationId: this.state.companyId,
      timestamp: new Date(),
      version: this.state.version + 1,
      payload: {
        userId: command.userId,
        email: command.email,
        fullName: command.fullName,
        role: command.role,
      },
      metadata: {},
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  /**
   * Update user role
   */
  updateUserRole(userId: string, newRole: 'representative' | 'consultant'): void {
    if (!this.state.companyId) {
      throw new Error('Company does not exist');
    }

    const user = this.state.users.find(u => u.userId === userId);
    if (!user) {
      throw new Error('User not found');
    }

    const event: DomainEvent = {
      eventId: uuidv4(),
      eventType: 'UserRoleUpdated',
      aggregateId: this.state.companyId,
      aggregateType: 'Company',
      organizationId: this.state.companyId,
      timestamp: new Date(),
      version: this.state.version + 1,
      payload: {
        userId,
        oldRole: user.role,
        newRole,
      },
      metadata: {},
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  /**
   * Update branding configuration
   */
  updateBranding(config: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }): void {
    if (!this.state.companyId) {
      throw new Error('Company does not exist');
    }

    const event: DomainEvent = {
      eventId: uuidv4(),
      eventType: 'BrandingUpdated',
      aggregateId: this.state.companyId,
      aggregateType: 'Company',
      organizationId: this.state.companyId,
      timestamp: new Date(),
      version: this.state.version + 1,
      payload: {
        previousConfig: { ...this.state.brandingConfig },
        newConfig: config,
      },
      metadata: {},
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  /**
   * Deactivate company
   */
  deactivateCompany(reason: string): void {
    if (!this.state.companyId) {
      throw new Error('Company does not exist');
    }

    if (!this.state.isActive) {
      throw new Error('Company is already deactivated');
    }

    const event: DomainEvent = {
      eventId: uuidv4(),
      eventType: 'CompanyDeactivated',
      aggregateId: this.state.companyId,
      aggregateType: 'Company',
      organizationId: this.state.companyId,
      timestamp: new Date(),
      version: this.state.version + 1,
      payload: {
        reason,
      },
      metadata: {},
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  /**
   * Apply an event to update state
   */
  private apply(event: DomainEvent): void {
    switch (event.eventType) {
      case 'CompanyCreated': {
        const payload = event.payload as {
          companyName: string;
          contactEmail: string;
          representativeEmail: string;
          representativeName: string;
        };
        this.state.companyId = event.aggregateId;
        this.state.companyName = payload.companyName;
        this.state.contactEmail = payload.contactEmail;
        this.state.users = [
          {
            userId: uuidv4(),
            email: payload.representativeEmail,
            fullName: payload.representativeName,
            role: 'representative',
            addedAt: event.timestamp,
          },
        ];
        this.state.isActive = true;
        this.state.createdAt = event.timestamp;
        this.state.version = event.version;
        break;
      }

      case 'UserAdded': {
        const payload = event.payload as {
          userId: string;
          email: string;
          fullName: string;
          role: 'representative' | 'consultant';
        };
        this.state.users.push({
          userId: payload.userId,
          email: payload.email,
          fullName: payload.fullName,
          role: payload.role,
          addedAt: event.timestamp,
        });
        this.state.version = event.version;
        break;
      }

      case 'UserRoleUpdated': {
        const payload = event.payload as {
          userId: string;
          newRole: 'representative' | 'consultant';
        };
        const user = this.state.users.find(u => u.userId === payload.userId);
        if (user) {
          user.role = payload.newRole;
        }
        this.state.version = event.version;
        break;
      }

      case 'BrandingUpdated': {
        const payload = event.payload as {
          newConfig: {
            logoUrl?: string;
            primaryColor?: string;
            secondaryColor?: string;
          };
        };
        this.state.brandingConfig = { ...payload.newConfig };
        this.state.version = event.version;
        break;
      }

      case 'CompanyDeactivated': {
        this.state.isActive = false;
        this.state.version = event.version;
        break;
      }

      default:
        throw new Error(`Unknown event type: ${event.eventType}`);
    }
  }

  /**
   * Rebuild state from event history
   */
  loadFromHistory(events: DomainEvent[]): void {
    events.forEach((event) => this.apply(event));
  }

  /**
   * Get uncommitted events
   */
  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  /**
   * Clear uncommitted events
   */
  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  /**
   * Get current state
   */
  getState(): CompanyState {
    return { ...this.state, users: [...this.state.users] };
  }
}
