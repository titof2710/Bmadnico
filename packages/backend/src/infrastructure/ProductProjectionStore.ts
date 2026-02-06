/**
 * Product Projection Store
 * Maintains read-optimized views of product catalog
 */

import { Collection, Db } from 'mongodb';
import { ProductEvent } from '../domain/ProductAggregate.js';

export interface ProductProjection {
  productId: string;
  organizationId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  templateId: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  priceHistory: Array<{
    price: number;
    changedAt: Date;
    reason?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

interface ProductProjectionDocument extends ProductProjection {
  _id?: any;
}

export class ProductProjectionStore {
  private collection: Collection<ProductProjectionDocument>;

  constructor(db: Db) {
    this.collection = db.collection<ProductProjectionDocument>('product_projections');
  }

  /**
   * Create indexes
   */
  async createIndexes(): Promise<void> {
    await this.collection.createIndex({ productId: 1, organizationId: 1 }, { unique: true });
    await this.collection.createIndex({ organizationId: 1, category: 1 });
    await this.collection.createIndex({ organizationId: 1, isActive: 1 });
  }

  /**
   * Get product by ID
   */
  async getProduct(
    productId: string,
    organizationId: string
  ): Promise<ProductProjection | null> {
    const doc = await this.collection.findOne({
      productId,
      organizationId,
    });

    if (!doc) return null;

    const { _id, ...projection } = doc;
    return projection;
  }

  /**
   * Get all products for an organization
   */
  async getProducts(
    organizationId: string,
    options?: {
      category?: string;
      isActive?: boolean;
    }
  ): Promise<ProductProjection[]> {
    const filter: any = { organizationId };

    if (options?.category) {
      filter.category = options.category;
    }

    if (options?.isActive !== undefined) {
      filter.isActive = options.isActive;
    }

    const docs = await this.collection
      .find(filter)
      .sort({ category: 1, name: 1 })
      .toArray();

    return docs.map(({ _id, ...projection }) => projection);
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    organizationId: string,
    category: string
  ): Promise<ProductProjection[]> {
    const docs = await this.collection
      .find({ organizationId, category, isActive: true })
      .sort({ name: 1 })
      .toArray();

    return docs.map(({ _id, ...projection }) => projection);
  }

  /**
   * Get all categories
   */
  async getCategories(organizationId: string): Promise<string[]> {
    const categories = await this.collection.distinct('category', {
      organizationId,
      isActive: true,
    });

    return categories.sort();
  }

  /**
   * Create initial projection from ProductCreated event
   */
  async createProjection(productId: string, event: ProductEvent): Promise<void> {
    if (event.eventType !== 'ProductCreated') {
      throw new Error('Can only create projection from ProductCreated event');
    }

    const payload = event.payload as any;

    const projection: ProductProjectionDocument = {
      productId,
      organizationId: event.organizationId,
      name: payload.name,
      description: payload.description,
      category: payload.category,
      price: payload.price,
      currency: payload.currency,
      templateId: payload.templateId,
      isActive: payload.isActive,
      metadata: payload.metadata,
      priceHistory: [
        {
          price: payload.price,
          changedAt: event.timestamp,
          reason: 'Initial price',
        },
      ],
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
      version: event.version,
    };

    await this.collection.insertOne(projection);
  }

  /**
   * Apply event to update projection
   */
  async applyEvent(event: ProductEvent): Promise<void> {
    const product = await this.getProduct(event.aggregateId, event.organizationId);

    if (!product) {
      throw new Error(`Projection not found for product ${event.aggregateId}`);
    }

    const updates = this.calculateUpdates(product, event);

    await this.collection.updateOne(
      {
        productId: event.aggregateId,
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
  private calculateUpdates(product: ProductProjection, event: ProductEvent): Partial<ProductProjection> {
    const updates: any = {};

    switch (event.eventType) {
      case 'ProductUpdated': {
        const payload = event.payload as any;
        Object.assign(updates, payload);
        break;
      }

      case 'ProductPriceChanged': {
        const payload = event.payload as any;
        updates.price = payload.newPrice;
        updates.priceHistory = [
          ...product.priceHistory,
          {
            price: payload.newPrice,
            changedAt: event.timestamp,
            reason: payload.reason || 'Price updated',
          },
        ];
        break;
      }
    }

    return updates;
  }
}
