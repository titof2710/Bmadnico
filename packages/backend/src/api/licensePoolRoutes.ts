import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getEventStore, getLicensePoolProjectionStore } from '../infrastructure/database.js';
import { LicensePoolCommandHandler } from '../domain/LicensePoolCommandHandler.js';

const router = Router();

/**
 * GET /api/license-pools
 * Get all license pools for the organization
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).organizationId;
    const licensePoolStore = getLicensePoolProjectionStore();

    const pools = await licensePoolStore.getPools(organizationId);

    res.json({
      pools,
      total: pools.length,
    });
  } catch (error) {
    console.error('Get license pools error:', error);
    res.status(500).json({ error: 'Failed to get license pools' });
  }
});

/**
 * POST /api/license-pools
 * Create a new license pool
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).organizationId;
    const { productId, productName, initialLicenses, warningThreshold } = req.body;

    if (!productId || !productName) {
      return res.status(400).json({ error: 'productId and productName are required' });
    }

    const poolId = uuidv4();
    const eventStore = getEventStore();
    const commandHandler = new LicensePoolCommandHandler(eventStore);

    await commandHandler.createPool({
      poolId,
      organizationId,
      productId,
      productName,
      initialLicenses: initialLicenses || 0,
      warningThreshold: warningThreshold || 5,
    });

    // Create projection
    const events = await eventStore.getEvents(poolId, organizationId);
    const licensePoolStore = getLicensePoolProjectionStore();
    await licensePoolStore.createProjection(poolId, events[0]);

    res.status(201).json({
      poolId,
      message: 'License pool created successfully',
    });
  } catch (error) {
    console.error('Create license pool error:', error);
    res.status(500).json({ error: 'Failed to create license pool' });
  }
});

/**
 * POST /api/license-pools/:poolId/add-licenses
 * Add licenses to a pool (simulate purchase)
 */
router.post('/:poolId/add-licenses', async (req: Request, res: Response) => {
  try {
    const { poolId } = req.params;
    const organizationId = (req as any).organizationId;
    const { quantity, orderId } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    const eventStore = getEventStore();
    const commandHandler = new LicensePoolCommandHandler(eventStore);

    await commandHandler.addLicenses({
      poolId,
      organizationId,
      quantity,
      orderId: orderId || uuidv4(),
    });

    // Update projection
    const events = await eventStore.getEvents(poolId, organizationId);
    const lastEvent = events[events.length - 1];
    const licensePoolStore = getLicensePoolProjectionStore();
    await licensePoolStore.applyEvent(lastEvent);

    res.json({
      message: `${quantity} licenses added successfully`,
    });
  } catch (error) {
    console.error('Add licenses error:', error);
    res.status(500).json({ error: 'Failed to add licenses' });
  }
});

/**
 * POST /api/license-pools/:poolId/consume
 * Consume a license (assign to session)
 */
router.post('/:poolId/consume', async (req: Request, res: Response) => {
  try {
    const { poolId } = req.params;
    const organizationId = (req as any).organizationId;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const eventStore = getEventStore();
    const commandHandler = new LicensePoolCommandHandler(eventStore);

    await commandHandler.consumeLicense({
      poolId,
      organizationId,
      sessionId,
    });

    // Update projection
    const events = await eventStore.getEvents(poolId, organizationId);
    const lastEvent = events[events.length - 1];
    const licensePoolStore = getLicensePoolProjectionStore();
    await licensePoolStore.applyEvent(lastEvent);

    res.json({
      message: 'License consumed successfully',
    });
  } catch (error: any) {
    console.error('Consume license error:', error);

    if (error.message === 'No licenses available') {
      return res.status(400).json({ error: 'No licenses available' });
    }

    res.status(500).json({ error: 'Failed to consume license' });
  }
});

/**
 * PUT /api/license-pools/:poolId/threshold
 * Update warning threshold
 */
router.put('/:poolId/threshold', async (req: Request, res: Response) => {
  try {
    const { poolId } = req.params;
    const organizationId = (req as any).organizationId;
    const { threshold } = req.body;

    if (threshold === undefined || threshold < 0) {
      return res.status(400).json({ error: 'Valid threshold is required' });
    }

    const eventStore = getEventStore();
    const commandHandler = new LicensePoolCommandHandler(eventStore);

    await commandHandler.updateWarningThreshold({
      poolId,
      organizationId,
      threshold,
    });

    // Update projection
    const events = await eventStore.getEvents(poolId, organizationId);
    const lastEvent = events[events.length - 1];
    const licensePoolStore = getLicensePoolProjectionStore();
    await licensePoolStore.applyEvent(lastEvent);

    res.json({
      message: 'Warning threshold updated successfully',
    });
  } catch (error) {
    console.error('Update threshold error:', error);
    res.status(500).json({ error: 'Failed to update threshold' });
  }
});

export default router;
