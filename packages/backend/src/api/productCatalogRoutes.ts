/**
 * Product Catalog API Routes
 * Manages assessment product catalog with pricing
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ProductAggregate } from '../domain/ProductAggregate.js';
import { getProductProjectionStore } from '../infrastructure/database.js';

const router = Router();

/**
 * GET /api/products
 * Get all products in catalog
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const { category, isActive } = req.query;

    const productStore = getProductProjectionStore();

    const products = await productStore.getProducts(organizationId, {
      category: category as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });

    res.json({
      products,
      total: products.length,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

/**
 * GET /api/products/categories
 * Get all product categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const productStore = getProductProjectionStore();

    const categories = await productStore.getCategories(organizationId);

    res.json({
      categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

/**
 * GET /api/products/:productId
 * Get a specific product
 */
router.get('/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const organizationId = (req as any).organizationId || 'demo-org-1';

    const productStore = getProductProjectionStore();
    const product = await productStore.getProduct(productId, organizationId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

/**
 * POST /api/products
 * Create a new product
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const { name, description, category, price, currency, templateId, metadata } = req.body;

    if (!name || !description || !category || price === undefined || !currency || !templateId) {
      return res.status(400).json({
        error: 'Missing required fields: name, description, category, price, currency, templateId',
      });
    }

    const productId = uuidv4();
    const aggregate = new ProductAggregate(productId, organizationId);

    aggregate.createProduct({
      name,
      description,
      category,
      price: parseFloat(price),
      currency,
      templateId,
      metadata,
    });

    // Persist events (simplified - in production use event store)
    const events = aggregate.getUncommittedEvents();
    const productStore = getProductProjectionStore();

    for (const event of events) {
      await productStore.createProjection(productId, event);
    }

    aggregate.markEventsAsCommitted();

    res.status(201).json({
      productId,
      message: 'Product created successfully',
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

/**
 * PUT /api/products/:productId
 * Update a product
 */
router.put('/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const { name, description, isActive, metadata } = req.body;

    const productStore = getProductProjectionStore();
    const existingProduct = await productStore.getProduct(productId, organizationId);

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const aggregate = new ProductAggregate(productId, organizationId);
    // Load from history (simplified - should load from event store)
    aggregate.updateProduct({
      name,
      description,
      isActive,
      metadata,
    });

    const events = aggregate.getUncommittedEvents();
    for (const event of events) {
      await productStore.applyEvent(event);
    }

    aggregate.markEventsAsCommitted();

    res.json({
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

/**
 * PUT /api/products/:productId/price
 * Update product price
 */
router.put('/:productId/price', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const { newPrice, reason } = req.body;

    if (newPrice === undefined || newPrice < 0) {
      return res.status(400).json({ error: 'Valid newPrice is required' });
    }

    const productStore = getProductProjectionStore();
    const existingProduct = await productStore.getProduct(productId, organizationId);

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const aggregate = new ProductAggregate(productId, organizationId);
    // In production, load from event store
    aggregate.changePrice({
      newPrice: parseFloat(newPrice),
      reason,
    });

    const events = aggregate.getUncommittedEvents();
    for (const event of events) {
      await productStore.applyEvent(event);
    }

    aggregate.markEventsAsCommitted();

    res.json({
      message: 'Product price updated successfully',
    });
  } catch (error) {
    console.error('Update price error:', error);
    res.status(500).json({ error: 'Failed to update price' });
  }
});

export default router;
