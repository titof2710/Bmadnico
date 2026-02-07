/**
 * License Pool Projection Store
 * Maintains read-optimized views of license pool state
 */

import { Collection, Db } from 'mongodb';
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
  isWarning: boolean; // Computed: availableLicenses <= warningThreshold
  isDepleted: boolean; // Computed: availableLicenses === 0
  consumptionRate?: number; // Licenses per week (computed from events)
  createdAt: Date;
  updatedAt: Date;
  version: number;
  isDeleted?: boolean; // Soft delete flag
  deletedAt?: Date; // Deletion timestamp
}

interface LicensePoolProjectionDocument extends LicensePoolProjection {
  _id?: any;
}

export class LicensePoolProjectionStore {
  private collection: Collection<LicensePoolProjectionDocument>;

  constructor(db: Db) {
    this.collection = db.collection<LicensePoolProjectionDocument>('license_pool_projections');
  }

  /**
   * Create indexes
   */
  async createIndexes(): Promise<void> {
    await this.collection.createIndex({ poolId: 1, organizationId: 1 }, { unique: true });
    await this.collection.createIndex({ organizationId: 1 });
    await this.collection.createIndex({ productId: 1 });
  }

  /**
   * Get pool projection by ID
   */
  async getPool(
    poolId: string,
    organizationId: string
  ): Promise<LicensePoolProjection | null> {
    const doc = await this.collection.findOne({
      poolId,
      organizationId,
    });

    if (!doc) return null;

    const { _id, ...projection } = doc;
    return projection;
  }

  /**
   * Get all pools for an organization
   */
  async getPools(organizationId: string): Promise<LicensePoolProjection[]> {
    console.log('[LicensePoolProjectionStore] getPools called with organizationId:', organizationId);
    console.log('[LicensePoolProjectionStore] Collection name:', this.collection.collectionName);

    const docs = await this.collection
      .find({ organizationId })
      .sort({ createdAt: -1 })
      .toArray();

    console.log('[LicensePoolProjectionStore] Found', docs.length, 'documents');
    if (docs.length > 0) {
      console.log('[LicensePoolProjectionStore] Sample doc:', JSON.stringify(docs[0], null, 2));
    }

    const result = docs.map(({ _id, ...projection }) => projection);
    console.log('[LicensePoolProjectionStore] Returning', result.length, 'pools');
    return result;
  }

  /**
   * Get all pools globally (admin use only)
   */
  async getAllPoolsGlobal(): Promise<LicensePoolProjection[]> {
    const docs = await this.collection
      .find({ isDeleted: { $ne: true } }) // Exclude deleted pools
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map(({ _id, ...projection }) => projection);
  }

  /**
   * Mark a pool as deleted (soft delete)
   */
  async markAsDeleted(poolId: string, organizationId: string): Promise<void> {
    await this.collection.updateOne(
      { poolId, organizationId },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      }
    );
  }

  /**
   * Get pool by product ID
   */
  async getPoolByProduct(
    organizationId: string,
    productId: string
  ): Promise<LicensePoolProjection | null> {
    const doc = await this.collection.findOne({
      organizationId,
      productId,
    });

    if (!doc) return null;

    const { _id, ...projection } = doc;
    return projection;
  }

  /**
   * Create initial projection from LicensePoolCreated event
   */
  async createProjection(poolId: string, event: DomainEvent): Promise<void> {
    if (event.eventType !== 'LicensePoolCreated') {
      throw new Error('Can only create projection from LicensePoolCreated event');
    }

    const payload = event.payload as {
      productId: string;
      productName: string;
      initialLicenses: number;
      warningThreshold: number;
    };

    const projection: LicensePoolProjectionDocument = {
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
  async applyEvent(event: DomainEvent): Promise<void> {
    const pool = await this.getPool(event.aggregateId, event.organizationId);

    if (!pool) {
      throw new Error(`Projection not found for pool ${event.aggregateId}`);
    }

    const updates = this.calculateUpdates(pool, event);

    await this.collection.updateOne(
      {
        poolId: event.aggregateId,
        organizationId: event.organizationId,
      },
      {
        $set: {
          ...updates,
          version: event.version,
          updatedAt: event.timestamp,
        },
      }
    );
  }

  /**
   * Calculate projection updates based on event
   */
  private calculateUpdates(pool: LicensePoolProjection, event: DomainEvent): Partial<LicensePoolProjection> {
    const updates: Partial<LicensePoolProjection> = {};

    switch (event.eventType) {
      case 'LicensesAdded': {
        const payload = event.payload as {
          quantity: number;
          newTotal: number;
        };
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
        const payload = event.payload as {
          newThreshold: number;
        };
        updates.warningThreshold = payload.newThreshold;
        updates.isWarning = pool.availableLicenses <= payload.newThreshold;
        break;
      }
    }

    return updates;
  }
}
