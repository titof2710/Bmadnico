/**
 * Product Projection Store
 * Maintains read-optimized views of product catalog
 */
import { Db } from 'mongodb';
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
export declare class ProductProjectionStore {
    private collection;
    constructor(db: Db);
    /**
     * Create indexes
     */
    createIndexes(): Promise<void>;
    /**
     * Get product by ID
     */
    getProduct(productId: string, organizationId: string): Promise<ProductProjection | null>;
    /**
     * Get all products for an organization
     */
    getProducts(organizationId: string, options?: {
        category?: string;
        isActive?: boolean;
    }): Promise<ProductProjection[]>;
    /**
     * Get products by category
     */
    getProductsByCategory(organizationId: string, category: string): Promise<ProductProjection[]>;
    /**
     * Get all categories
     */
    getCategories(organizationId: string): Promise<string[]>;
    /**
     * Create initial projection from ProductCreated event
     */
    createProjection(productId: string, event: ProductEvent): Promise<void>;
    /**
     * Apply event to update projection
     */
    applyEvent(event: ProductEvent): Promise<void>;
    /**
     * Calculate projection updates based on event
     */
    private calculateUpdates;
}
//# sourceMappingURL=ProductProjectionStore.d.ts.map