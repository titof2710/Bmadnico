/**
 * Product Aggregate - Catalog Product Management
 * Manages assessment product catalog with pricing and metadata
 */
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
export declare class ProductAggregate {
    private productId;
    private organizationId;
    private version;
    private uncommittedEvents;
    private state;
    constructor(productId: string, organizationId: string);
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
    }): void;
    /**
     * Update product details
     */
    updateProduct(command: {
        name?: string;
        description?: string;
        price?: number;
        isActive?: boolean;
        metadata?: Record<string, any>;
    }): void;
    /**
     * Change product price with audit trail
     */
    changePrice(command: {
        newPrice: number;
        reason?: string;
    }): void;
    /**
     * Apply event to aggregate state
     */
    private apply;
    /**
     * Rebuild aggregate state from event history
     */
    loadFromHistory(events: ProductEvent[]): void;
    /**
     * Get uncommitted events
     */
    getUncommittedEvents(): ProductEvent[];
    /**
     * Mark events as committed
     */
    markEventsAsCommitted(): void;
    /**
     * Getters
     */
    getProductId(): string;
    getVersion(): number;
    getState(): {
        name?: string;
        description?: string;
        category?: string;
        price?: number;
        currency?: string;
        templateId?: string;
        isActive: boolean;
        metadata?: Record<string, any>;
    };
}
//# sourceMappingURL=ProductAggregate.d.ts.map