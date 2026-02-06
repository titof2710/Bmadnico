/**
 * Company Command Handler
 * Handles commands and persists events to Event Store
 */

import { CompanyAggregate } from './CompanyAggregate.js';
import { EventStore } from '../infrastructure/EventStore.js';

export class CompanyCommandHandler {
  constructor(private eventStore: EventStore) {}

  /**
   * Load aggregate from event history
   */
  private async loadAggregate(companyId: string): Promise<CompanyAggregate> {
    const events = await this.eventStore.getEvents(companyId, companyId);
    const aggregate = new CompanyAggregate();

    if (events.length > 0) {
      aggregate.loadFromHistory(events);
    }

    return aggregate;
  }

  /**
   * Persist uncommitted events
   */
  private async persistEvents(aggregate: CompanyAggregate): Promise<void> {
    const events = aggregate.getUncommittedEvents();

    for (const event of events) {
      await this.eventStore.append(event);
    }

    aggregate.clearUncommittedEvents();
  }

  /**
   * Create a new company
   */
  async createCompany(command: {
    companyId: string;
    companyName: string;
    contactEmail: string;
    representativeEmail: string;
    representativeName: string;
  }): Promise<void> {
    const aggregate = new CompanyAggregate();
    aggregate.createCompany(command);
    await this.persistEvents(aggregate);
  }

  /**
   * Add user to company
   */
  async addUser(command: {
    companyId: string;
    userId: string;
    email: string;
    fullName: string;
    role: 'representative' | 'consultant';
  }): Promise<void> {
    const aggregate = await this.loadAggregate(command.companyId);
    aggregate.addUser({
      userId: command.userId,
      email: command.email,
      fullName: command.fullName,
      role: command.role,
    });
    await this.persistEvents(aggregate);
  }

  /**
   * Update user role
   */
  async updateUserRole(command: {
    companyId: string;
    userId: string;
    newRole: 'representative' | 'consultant';
  }): Promise<void> {
    const aggregate = await this.loadAggregate(command.companyId);
    aggregate.updateUserRole(command.userId, command.newRole);
    await this.persistEvents(aggregate);
  }

  /**
   * Update branding
   */
  async updateBranding(command: {
    companyId: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }): Promise<void> {
    const aggregate = await this.loadAggregate(command.companyId);
    aggregate.updateBranding({
      logoUrl: command.logoUrl,
      primaryColor: command.primaryColor,
      secondaryColor: command.secondaryColor,
    });
    await this.persistEvents(aggregate);
  }

  /**
   * Deactivate company
   */
  async deactivateCompany(command: {
    companyId: string;
    reason: string;
  }): Promise<void> {
    const aggregate = await this.loadAggregate(command.companyId);
    aggregate.deactivateCompany(command.reason);
    await this.persistEvents(aggregate);
  }
}
