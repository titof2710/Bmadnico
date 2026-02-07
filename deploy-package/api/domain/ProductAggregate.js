"use strict";
/**
 * Product Aggregate - Catalog Product Management
 * Manages assessment product catalog with pricing and metadata
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductAggregate = void 0;
const uuid_1 = require("uuid");
class ProductAggregate {
    productId;
    organizationId;
    version = 0;
    uncommittedEvents = [];
    state = {
        isActive: true,
    };
    constructor(productId, organizationId) {
        this.productId = productId;
        this.organizationId = organizationId;
    }
    /**
     * Create a new product
     */
    createProduct(command) {
        if (this.version > 0) {
            throw new Error('Product already created');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
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
    updateProduct(command) {
        if (this.version === 0) {
            throw new Error('Product does not exist');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
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
    changePrice(command) {
        if (this.version === 0) {
            throw new Error('Product does not exist');
        }
        if (!this.state.price) {
            throw new Error('Product has no current price');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
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
    apply(event) {
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
    loadFromHistory(events) {
        events.forEach((event) => this.apply(event));
    }
    /**
     * Get uncommitted events
     */
    getUncommittedEvents() {
        return [...this.uncommittedEvents];
    }
    /**
     * Mark events as committed
     */
    markEventsAsCommitted() {
        this.uncommittedEvents = [];
    }
    /**
     * Getters
     */
    getProductId() {
        return this.productId;
    }
    getVersion() {
        return this.version;
    }
    getState() {
        return { ...this.state };
    }
}
exports.ProductAggregate = ProductAggregate;
//# sourceMappingURL=ProductAggregate.js.map