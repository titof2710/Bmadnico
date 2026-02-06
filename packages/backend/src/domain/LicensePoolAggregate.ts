/**
 * License Pool Aggregate - Manages license inventory for products
 * Implements Event Sourcing pattern
 */

import { v4 as uuidv4 } from 'uuid';
import { DomainEvent } from '../shared/types.js';

interface LicensePoolState {
  poolId: string;
  organizationId: string;
  productId: string;
  productName: string;
  availableLicenses: number;
  totalPurchased: number;
  consumedLicenses: number;
  warningThreshold: number; // Absolute count or percentage
  createdAt: Date;
  version: number;
}

export class LicensePoolAggregate {
  private state: LicensePoolState;
  private uncommittedEvents: DomainEvent[] = [];

  constructor() {
    this.state = {
      poolId: '',
      organizationId: '',
      productId: '',
      productName: '',
      availableLicenses: 0,
      totalPurchased: 0,
      consumedLicenses: 0,
      warningThreshold: 5, // Default: warn when 5 licenses remaining
      createdAt: new Date(),
      version: 0,
    };
  }

  /**
   * Create a new license pool
   */
  createPool(command: {
    poolId: string;
    organizationId: string;
    productId: string;
    productName: string;
    initialLicenses: number;
    warningThreshold?: number;
  }): void {
    if (this.state.poolId) {
      throw new Error('License pool already exists');
    }

    const event: DomainEvent = {
      eventId: uuidv4(),
      eventType: 'LicensePoolCreated',
      aggregateId: command.poolId,
      aggregateType: 'LicensePool',
      organizationId: command.organizationId,
      timestamp: new Date(),
      version: 1,
      payload: {
        productId: command.productId,
        productName: command.productName,
        initialLicenses: command.initialLicenses,
        warningThreshold: command.warningThreshold || 5,
      },
      metadata: {},
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  /**
   * Add licenses to pool (from purchase)
   */
  addLicenses(quantity: number, orderId: string): void {
    if (!this.state.poolId) {
      throw new Error('License pool does not exist');
    }

    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    const event: DomainEvent = {
      eventId: uuidv4(),
      eventType: 'LicensesAdded',
      aggregateId: this.state.poolId,
      aggregateType: 'LicensePool',
      organizationId: this.state.organizationId,
      timestamp: new Date(),
      version: this.state.version + 1,
      payload: {
        quantity,
        orderId,
        previousTotal: this.state.totalPurchased,
        newTotal: this.state.totalPurchased + quantity,
      },
      metadata: {},
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  /**
   * Consume a license (assign to session)
   */
  consumeLicense(sessionId: string): void {
    if (!this.state.poolId) {
      throw new Error('License pool does not exist');
    }

    if (this.state.availableLicenses <= 0) {
      throw new Error('No licenses available');
    }

    const event: DomainEvent = {
      eventId: uuidv4(),
      eventType: 'LicenseConsumed',
      aggregateId: this.state.poolId,
      aggregateType: 'LicensePool',
      organizationId: this.state.organizationId,
      timestamp: new Date(),
      version: this.state.version + 1,
      payload: {
        sessionId,
        previousAvailable: this.state.availableLicenses,
        newAvailable: this.state.availableLicenses - 1,
      },
      metadata: {},
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  /**
   * Release a license (if session cancelled)
   */
  releaseLicense(sessionId: string, reason: string): void {
    if (!this.state.poolId) {
      throw new Error('License pool does not exist');
    }

    const event: DomainEvent = {
      eventId: uuidv4(),
      eventType: 'LicenseReleased',
      aggregateId: this.state.poolId,
      aggregateType: 'LicensePool',
      organizationId: this.state.organizationId,
      timestamp: new Date(),
      version: this.state.version + 1,
      payload: {
        sessionId,
        reason,
        previousAvailable: this.state.availableLicenses,
        newAvailable: this.state.availableLicenses + 1,
      },
      metadata: {},
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  /**
   * Update warning threshold
   */
  updateWarningThreshold(threshold: number): void {
    if (!this.state.poolId) {
      throw new Error('License pool does not exist');
    }

    const event: DomainEvent = {
      eventId: uuidv4(),
      eventType: 'WarningThresholdUpdated',
      aggregateId: this.state.poolId,
      aggregateType: 'LicensePool',
      organizationId: this.state.organizationId,
      timestamp: new Date(),
      version: this.state.version + 1,
      payload: {
        previousThreshold: this.state.warningThreshold,
        newThreshold: threshold,
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
      case 'LicensePoolCreated': {
        const payload = event.payload as {
          productId: string;
          productName: string;
          initialLicenses: number;
          warningThreshold: number;
        };
        this.state.poolId = event.aggregateId;
        this.state.organizationId = event.organizationId;
        this.state.productId = payload.productId;
        this.state.productName = payload.productName;
        this.state.availableLicenses = payload.initialLicenses;
        this.state.totalPurchased = payload.initialLicenses;
        this.state.consumedLicenses = 0;
        this.state.warningThreshold = payload.warningThreshold;
        this.state.createdAt = event.timestamp;
        this.state.version = event.version;
        break;
      }

      case 'LicensesAdded': {
        const payload = event.payload as {
          quantity: number;
          orderId: string;
          newTotal: number;
        };
        this.state.availableLicenses += payload.quantity;
        this.state.totalPurchased = payload.newTotal;
        this.state.version = event.version;
        break;
      }

      case 'LicenseConsumed': {
        const payload = event.payload as {
          sessionId: string;
          newAvailable: number;
        };
        this.state.availableLicenses = payload.newAvailable;
        this.state.consumedLicenses += 1;
        this.state.version = event.version;
        break;
      }

      case 'LicenseReleased': {
        const payload = event.payload as {
          sessionId: string;
          newAvailable: number;
        };
        this.state.availableLicenses = payload.newAvailable;
        this.state.consumedLicenses -= 1;
        this.state.version = event.version;
        break;
      }

      case 'WarningThresholdUpdated': {
        const payload = event.payload as {
          newThreshold: number;
        };
        this.state.warningThreshold = payload.newThreshold;
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
   * Clear uncommitted events (after persisting)
   */
  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  /**
   * Get current state (for queries)
   */
  getState(): LicensePoolState {
    return { ...this.state };
  }

  /**
   * Check if pool is below warning threshold
   */
  isBelowThreshold(): boolean {
    return this.state.availableLicenses <= this.state.warningThreshold;
  }

  /**
   * Check if pool is depleted
   */
  isDepleted(): boolean {
    return this.state.availableLicenses === 0;
  }
}
