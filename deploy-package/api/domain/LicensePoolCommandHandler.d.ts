/**
 * License Pool Command Handler
 * Handles commands and persists events to Event Store
 */
import { EventStore } from '../infrastructure/EventStore.js';
export declare class LicensePoolCommandHandler {
    private eventStore;
    constructor(eventStore: EventStore);
    /**
     * Load aggregate from event history
     */
    private loadAggregate;
    /**
     * Persist uncommitted events to event store
     */
    private persistEvents;
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
    }): Promise<void>;
    /**
     * Add licenses to pool
     */
    addLicenses(command: {
        poolId: string;
        organizationId: string;
        quantity: number;
        orderId: string;
    }): Promise<void>;
    /**
     * Consume a license
     */
    consumeLicense(command: {
        poolId: string;
        organizationId: string;
        sessionId: string;
    }): Promise<void>;
    /**
     * Release a license
     */
    releaseLicense(command: {
        poolId: string;
        organizationId: string;
        sessionId: string;
        reason: string;
    }): Promise<void>;
    /**
     * Update warning threshold
     */
    updateWarningThreshold(command: {
        poolId: string;
        organizationId: string;
        threshold: number;
    }): Promise<void>;
}
//# sourceMappingURL=LicensePoolCommandHandler.d.ts.map