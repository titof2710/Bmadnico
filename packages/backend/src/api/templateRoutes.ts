import { Router, Request, Response } from 'express';
import { getDatabase } from '../infrastructure/database.js';

const router = Router();

/**
 * GET /api/templates
 * List all templates for an organization
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const db = getDatabase();

    const templates = await db
      .collection('templates')
      .find({ organizationId, published: true })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ templates });
  } catch (error: any) {
    console.error('List templates error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/templates/:templateId
 * Get a specific template by ID
 */
router.get('/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const db = getDatabase();

    const template = await db.collection('templates').findOne({
      templateId,
      organizationId,
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error: any) {
    console.error('Get template error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/templates
 * Create a new template
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const db = getDatabase();

    const template = {
      ...req.body,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('templates').insertOne(template);

    res.status(201).json({
      success: true,
      template
    });
  } catch (error: any) {
    console.error('Create template error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/templates/:templateId
 * Update an existing template
 */
router.put('/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const db = getDatabase();

    const update = {
      ...req.body,
      updatedAt: new Date(),
    };

    // Don't allow changing templateId or organizationId
    delete update.templateId;
    delete update.organizationId;
    delete update.createdAt;
    delete update._id;

    const result = await db.collection('templates').updateOne(
      { templateId, organizationId },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const updated = await db.collection('templates').findOne({
      templateId,
      organizationId,
    });

    res.json({
      success: true,
      template: updated
    });
  } catch (error: any) {
    console.error('Update template error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/templates/:templateId
 * Delete a template
 */
router.delete('/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const db = getDatabase();

    // Check if template is in use
    const sessionsUsingTemplate = await db
      .collection('session_projections')
      .countDocuments({ templateId, organizationId });

    if (sessionsUsingTemplate > 0) {
      return res.status(400).json({
        error: `Cannot delete template: ${sessionsUsingTemplate} session(s) are using it`,
      });
    }

    const result = await db.collection('templates').deleteOne({
      templateId,
      organizationId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
