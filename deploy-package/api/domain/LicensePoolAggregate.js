"use strict";
/**
 * License Pool Aggregate - Manages license inventory for products
 * Implements Event Sourcing pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicensePoolAggregate = void 0;
const uuid_1 = require("uuid");
class LicensePoolAggregate {
    state;
    uncommittedEvents = [];
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
    createPool(command) {
        if (this.state.poolId) {
            throw new Error('License pool already exists');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
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
    addLicenses(quantity, orderId) {
        if (!this.state.poolId) {
            throw new Error('License pool does not exist');
        }
        if (quantity <= 0) {
            throw new Error('Quantity must be positive');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
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
    consumeLicense(sessionId) {
        if (!this.state.poolId) {
            throw new Error('License pool does not exist');
        }
        if (this.state.availableLicenses <= 0) {
            throw new Error('No licenses available');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
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
    releaseLicense(sessionId, reason) {
        if (!this.state.poolId) {
            throw new Error('License pool does not exist');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
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
    updateWarningThreshold(threshold) {
        if (!this.state.poolId) {
            throw new Error('License pool does not exist');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
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
    apply(event) {
        switch (event.eventType) {
            case 'LicensePoolCreated': {
                const payload = event.payload;
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
                const payload = event.payload;
                this.state.availableLicenses += payload.quantity;
                this.state.totalPurchased = payload.newTotal;
                this.state.version = event.version;
                break;
            }
            case 'LicenseConsumed': {
                const payload = event.payload;
                this.state.availableLicenses = payload.newAvailable;
                this.state.consumedLicenses += 1;
                this.state.version = event.version;
                break;
            }
            case 'LicenseReleased': {
                const payload = event.payload;
                this.state.availableLicenses = payload.newAvailable;
                this.state.consumedLicenses -= 1;
                this.state.version = event.version;
                break;
            }
            case 'WarningThresholdUpdated': {
                const payload = event.payload;
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
     * Clear uncommitted events (after persisting)
     */
    clearUncommittedEvents() {
        this.uncommittedEvents = [];
    }
    /**
     * Get current state (for queries)
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Check if pool is below warning threshold
     */
    isBelowThreshold() {
        return this.state.availableLicenses <= this.state.warningThreshold;
    }
    /**
     * Check if pool is depleted
     */
    isDepleted() {
        return this.state.availableLicenses === 0;
    }
}
exports.LicensePoolAggregate = LicensePoolAggregate;
//# sourceMappingURL=LicensePoolAggregate.js.map