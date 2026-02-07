/**
 * License Pool Projection Store
 * Maintains read-optimized views of license pool state
 */
import { Db } from 'mongodb';
import { DomainEvent } from '../shared/types.js';
export interface LicensePoolProjection {
    poolId: string;
    organizationId: string;
    productId: string;
    productName: string;
    availableLicenses: number;
    totalPurchased: number;
    consumedLicenses: number;
    warningThreshold: number;
    isWarning: boolean;
    isDepleted: boolean;
    consumptionRate?: number;
    createdAt: Date;
    updatedAt: Date;
    version: number;
}
export declare class LicensePoolProjectionStore {
    private collection;
    constructor(db: Db);
    /**
     * Create indexes
     */
    createIndexes(): Promise<void>;
    /**
     * Get pool projection by ID
     */
    getPool(poolId: string, organizationId: string): Promise<LicensePoolProjection | null>;
    /**
     * Get all pools for an organization
     */
    getPools(organizationId: string): Promise<LicensePoolProjection[]>;
    /**
     * Get pool by product ID
     */
    getPoolByProduct(organizationId: string, productId: string): Promise<LicensePoolProjection | null>;
    /**
     * Create initial projection from LicensePoolCreated event
     */
    createProjection(poolId: string, event: DomainEvent): Promise<void>;
    /**
     * Apply event to update projection
     */
    applyEvent(event: DomainEvent): Promise<void>;
    /**
     * Calculate projection updates based on event
     */
    private calculateUpdates;
}
//# sourceMappingURL=LicensePoolProjectionStore.d.ts.map