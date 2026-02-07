"use strict";
/**
 * License Pool Projection Store
 * Maintains read-optimized views of license pool state
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicensePoolProjectionStore = void 0;
class LicensePoolProjectionStore {
    collection;
    constructor(db) {
        this.collection = db.collection('license_pool_projections');
    }
    /**
     * Create indexes
     */
    async createIndexes() {
        await this.collection.createIndex({ poolId: 1, organizationId: 1 }, { unique: true });
        await this.collection.createIndex({ organizationId: 1 });
        await this.collection.createIndex({ productId: 1 });
    }
    /**
     * Get pool projection by ID
     */
    async getPool(poolId, organizationId) {
        const doc = await this.collection.findOne({
            poolId,
            organizationId,
        });
        if (!doc)
            return null;
        const { _id, ...projection } = doc;
        return projection;
    }
    /**
     * Get all pools for an organization
     */
    async getPools(organizationId) {
        const docs = await this.collection
            .find({ organizationId })
            .sort({ createdAt: -1 })
            .toArray();
        return docs.map(({ _id, ...projection }) => projection);
    }
    /**
     * Get pool by product ID
     */
    async getPoolByProduct(organizationId, productId) {
        const doc = await this.collection.findOne({
            organizationId,
            productId,
        });
        if (!doc)
            return null;
        const { _id, ...projection } = doc;
        return projection;
    }
    /**
     * Create initial projection from LicensePoolCreated event
     */
    async createProjection(poolId, event) {
        if (event.eventType !== 'LicensePoolCreated') {
            throw new Error('Can only create projection from LicensePoolCreated event');
        }
        const payload = event.payload;
        const projection = {
            poolId,
            organizationId: event.organizationId,
            productId: payload.productId,
            productName: payload.productName,
            availableLicenses: payload.initialLicenses,
            totalPurchased: payload.initialLicenses,
            consumedLicenses: 0,
            warningThreshold: payload.warningThreshold,
            isWarning: payload.initialLicenses <= payload.warningThreshold,
            isDepleted: payload.initialLicenses === 0,
            createdAt: event.timestamp,
            updatedAt: event.timestamp,
            version: event.version,
        };
        await this.collection.insertOne(projection);
    }
    /**
     * Apply event to update projection
     */
    async applyEvent(event) {
        const pool = await this.getPool(event.aggregateId, event.organizationId);
        if (!pool) {
            throw new Error(`Projection not found for pool ${event.aggregateId}`);
        }
        const updates = this.calculateUpdates(pool, event);
        await this.collection.updateOne({
            poolId: event.aggregateId,
            organizationId: event.organizationId,
        }, {
            $set: {
                ...updates,
                version: event.version,
                updatedAt: event.timestamp,
            },
        });
    }
    /**
     * Calculate projection updates based on event
     */
    calculateUpdates(pool, event) {
        const updates = {};
        switch (event.eventType) {
            case 'LicensesAdded': {
                const payload = event.payload;
                updates.availableLicenses = pool.availableLicenses + payload.quantity;
                updates.totalPurchased = payload.newTotal;
                updates.isWarning = (pool.availableLicenses + payload.quantity) <= pool.warningThreshold;
                updates.isDepleted = false;
                break;
            }
            case 'LicenseConsumed': {
                const newAvailable = pool.availableLicenses - 1;
                updates.availableLicenses = newAvailable;
                updates.consumedLicenses = pool.consumedLicenses + 1;
                updates.isWarning = newAvailable <= pool.warningThreshold;
                updates.isDepleted = newAvailable === 0;
                break;
            }
            case 'LicenseReleased': {
                const newAvailable = pool.availableLicenses + 1;
                updates.availableLicenses = newAvailable;
                updates.consumedLicenses = pool.consumedLicenses - 1;
                updates.isWarning = newAvailable <= pool.warningThreshold;
                updates.isDepleted = false;
                break;
            }
            case 'WarningThresholdUpdated': {
                const payload = event.payload;
                updates.warningThreshold = payload.newThreshold;
                updates.isWarning = pool.availableLicenses <= payload.newThreshold;
                break;
            }
        }
        return updates;
    }
}
exports.LicensePoolProjectionStore = LicensePoolProjectionStore;
//# sourceMappingURL=LicensePoolProjectionStore.js.map