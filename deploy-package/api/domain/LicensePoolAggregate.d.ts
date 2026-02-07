/**
 * License Pool Aggregate - Manages license inventory for products
 * Implements Event Sourcing pattern
 */
import { DomainEvent } from '../shared/types.js';
interface LicensePoolState {
    poolId: string;
    organizationId: string;
    productId: string;
    productName: string;
    availableLicenses: number;
    totalPurchased: number;
    consumedLicenses: number;
    warningThreshold: number;
    createdAt: Date;
    version: number;
}
export declare class LicensePoolAggregate {
    private state;
    private uncommittedEvents;
    constructor();
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
    }): void;
    /**
     * Add licenses to pool (from purchase)
     */
    addLicenses(quantity: number, orderId: string): void;
    /**
     * Consume a license (assign to session)
     */
    consumeLicense(sessionId: string): void;
    /**
     * Release a license (if session cancelled)
     */
    releaseLicense(sessionId: string, reason: string): void;
    /**
     * Update warning threshold
     */
    updateWarningThreshold(threshold: number): void;
    /**
     * Apply an event to update state
     */
    private apply;
    /**
     * Rebuild state from event history
     */
    loadFromHistory(events: DomainEvent[]): void;
    /**
     * Get uncommitted events
     */
    getUncommittedEvents(): DomainEvent[];
    /**
     * Clear uncommitted events (after persisting)
     */
    clearUncommittedEvents(): void;
    /**
     * Get current state (for queries)
     */
    getState(): LicensePoolState;
    /**
     * Check if pool is below warning threshold
     */
    isBelowThreshold(): boolean;
    /**
     * Check if pool is depleted
     */
    isDepleted(): boolean;
}
export {};
//# sourceMappingURL=LicensePoolAggregate.d.ts.map