/**
 * Product Aggregate - Catalog Product Management
 * Manages assessment product catalog with pricing and metadata
 */

import { v4 as uuidv4 } from 'uuid';

export interface ProductCreatedEvent {
  eventId: string;
  eventType: 'ProductCreated';
  aggregateId: string;
  aggregateType: 'Product';
  organizationId: string;
  timestamp: Date;
  version: number;
  payload: {
    name: string;
    description: string;
    category: string;
    price: number;
    currency: string;
    templateId: string;
    isActive: boolean;
    metadata?: Record<string, any>;
  };
}

export interface ProductUpdatedEvent {
  eventId: string;
  eventType: 'ProductUpdated';
  aggregateId: string;
  aggregateType: 'Product';
  organizationId: string;
  timestamp: Date;
  version: number;
  payload: {
    name?: string;
    description?: string;
    price?: number;
    isActive?: boolean;
    metadata?: Record<string, any>;
  };
}

export interface ProductPriceChangedEvent {
  eventId: string;
  eventType: 'ProductPriceChanged';
  aggregateId: string;
  aggregateType: 'Product';
  organizationId: string;
  timestamp: Date;
  version: number;
  payload: {
    oldPrice: number;
    newPrice: number;
    reason?: string;
  };
}

export type ProductEvent = ProductCreatedEvent | ProductUpdatedEvent | ProductPriceChangedEvent;

export class ProductAggregate {
  private productId: string;
  private organizationId: string;
  private version = 0;
  private uncommittedEvents: ProductEvent[] = [];

  private state: {
    name?: string;
    description?: string;
    category?: string;
    price?: number;
    currency?: string;
    templateId?: string;
    isActive: boolean;
    metadata?: Record<string, any>;
  } = {
    isActive: true,
  };

  constructor(productId: string, organizationId: string) {
    this.productId = productId;
    this.organizationId = organizationId;
  }

  /**
   * Create a new product
   */
  createProduct(command: {
    name: string;
    description: string;
    category: string;
    price: number;
    currency: string;
    templateId: string;
    metadata?: Record<string, any>;
  }): void {
    if (this.version > 0) {
      throw new Error('Product already created');
    }

    const event: ProductCreatedEvent = {
      eventId: uuidv4(),
      eventType: 'ProductCreated',
      aggregateId: this.productId,
      aggregateType: 'Product',
      organizationId: this.organizationId,
      timestamp: new Date(),
      version: this.version + 1,
      payload: {
        name: command.name,
        description: command.description,
        category: command.category,
        price: command.price,
        currency: command.currency,
        templateId: command.templateId,
        isActive: true,
        metadata: command.metadata,
      },
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  /**
   * Update product details
   */
  updateProduct(command: {
    name?: string;
    description?: string;
    price?: number;
    isActive?: boolean;
    metadata?: Record<string, any>;
  }): void {
    if (this.version === 0) {
      throw new Error('Product does not exist');
    }

    const event: ProductUpdatedEvent = {
      eventId: uuidv4(),
      eventType: 'ProductUpdated',
      aggregateId: this.productId,
      aggregateType: 'Product',
      organizationId: this.organizationId,
      timestamp: new Date(),
      version: this.version + 1,
      payload: command,
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  /**
   * Change product price with audit trail
   */
  changePrice(command: {
    newPrice: number;
    reason?: string;
  }): void {
    if (this.version === 0) {
      throw new Error('Product does not exist');
    }

    if (!this.state.price) {
      throw new Error('Product has no current price');
    }

    const event: ProductPriceChangedEvent = {
      eventId: uuidv4(),
      eventType: 'ProductPriceChanged',
      aggregateId: this.productId,
      aggregateType: 'Product',
      organizationId: this.organizationId,
      timestamp: new Date(),
      version: this.version + 1,
      payload: {
        oldPrice: this.state.price,
        newPrice: command.newPrice,
        reason: command.reason,
      },
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  /**
   * Apply event to aggregate state
   */
  private apply(event: ProductEvent): void {
    switch (event.eventType) {
      case 'ProductCreated': {
        this.state = {
          ...event.payload,
        };
        break;
      }

      case 'ProductUpdated': {
        this.state = {
          ...this.state,
          ...event.payload,
        };
        break;
      }

      case 'ProductPriceChanged': {
        this.state.price = event.payload.newPrice;
        break;
      }
    }

    this.version = event.version;
  }

  /**
   * Rebuild aggregate state from event history
   */
  loadFromHistory(events: ProductEvent[]): void {
    events.forEach((event) => this.apply(event));
  }

  /**
   * Get uncommitted events
   */
  getUncommittedEvents(): ProductEvent[] {
    return [...this.uncommittedEvents];
  }

  /**
   * Mark events as committed
   */
  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  /**
   * Getters
   */
  getProductId(): string {
    return this.productId;
  }

  getVersion(): number {
    return this.version;
  }

  getState() {
    return { ...this.state };
  }
}
