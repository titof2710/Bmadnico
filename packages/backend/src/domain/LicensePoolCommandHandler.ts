/**
 * License Pool Command Handler
 * Handles commands and persists events to Event Store
 */

import { LicensePoolAggregate } from './LicensePoolAggregate.js';
import { EventStore } from '../infrastructure/EventStore.js';
import { DomainEvent } from '../shared/types.js';

export class LicensePoolCommandHandler {
  constructor(private eventStore: EventStore) {}

  /**
   * Load aggregate from event history
   */
  private async loadAggregate(
    poolId: string,
    organizationId: string
  ): Promise<LicensePoolAggregate> {
    const events = await this.eventStore.getEvents(poolId, organizationId);
    const aggregate = new LicensePoolAggregate();

    if (events.length > 0) {
      aggregate.loadFromHistory(events);
    }

    return aggregate;
  }

  /**
   * Persist uncommitted events to event store
   */
  private async persistEvents(aggregate: LicensePoolAggregate): Promise<void> {
    const events = aggregate.getUncommittedEvents();

    for (const event of events) {
      await this.eventStore.append(event);
    }

    aggregate.clearUncommittedEvents();
  }

  /**
   * Create a new license pool
   */
  async createPool(command: {
    poolId: string;
    organizationId: string;
    productId: string;
    productName: string;
    initialLicenses: number;
    warningThreshold?: number;
  }): Promise<void> {
    const aggregate = new LicensePoolAggregate();
    aggregate.createPool(command);
    await this.persistEvents(aggregate);
  }

  /**
   * Add licenses to pool
   */
  async addLicenses(command: {
    poolId: string;
    organizationId: string;
    quantity: number;
    orderId: string;
  }): Promise<void> {
    const aggregate = await this.loadAggregate(command.poolId, command.organizationId);
    aggregate.addLicenses(command.quantity, command.orderId);
    await this.persistEvents(aggregate);
  }

  /**
   * Consume a license
   */
  async consumeLicense(command: {
    poolId: string;
    organizationId: string;
    sessionId: string;
  }): Promise<void> {
    const aggregate = await this.loadAggregate(command.poolId, command.organizationId);
    aggregate.consumeLicense(command.sessionId);
    await this.persistEvents(aggregate);
  }

  /**
   * Release a license
   */
  async releaseLicense(command: {
    poolId: string;
    organizationId: string;
    sessionId: string;
    reason: string;
  }): Promise<void> {
    const aggregate = await this.loadAggregate(command.poolId, command.organizationId);
    aggregate.releaseLicense(command.sessionId, command.reason);
    await this.persistEvents(aggregate);
  }

  /**
   * Update warning threshold
   */
  async updateWarningThreshold(command: {
    poolId: string;
    organizationId: string;
    threshold: number;
  }): Promise<void> {
    const aggregate = await this.loadAggregate(command.poolId, command.organizationId);
    aggregate.updateWarningThreshold(command.threshold);
    await this.persistEvents(aggregate);
  }
}
