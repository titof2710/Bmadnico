import { Router, Request, Response } from 'express';
import { getDatabase } from '../infrastructure/database.js';
import bcrypt from 'bcryptjs';

const router = Router();

/**
 * GET /api/users
 * List all users for an organization
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const db = getDatabase();

    const users = await db
      .collection('users')
      .find({ organizationId })
      .sort({ createdAt: -1 })
      .toArray();

    // Remove password hashes from response
    const sanitizedUsers = users.map(({ passwordHash, ...user }) => user);

    res.json({ users: sanitizedUsers });
  } catch (error: any) {
    console.error('List users error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:userId
 * Get a specific user by ID
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const db = getDatabase();

    const user = await db.collection('users').findOne({
      userId,
      organizationId,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove password hash from response
    const { passwordHash, ...sanitizedUser } = user;

    res.json(sanitizedUser);
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const db = getDatabase();

    const { name, email, role, password, status = 'active' } = req.body;

    // Validation
    if (!name || !email || !role || !password) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, role, password',
      });
    }

    // Check if email already exists
    const existingUser = await db.collection('users').findOne({
      email,
      organizationId,
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'A user with this email already exists',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = {
      userId: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      name,
      email,
      role,
      status,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').insertOne(user);

    // Remove password hash from response
    const { passwordHash: _, ...sanitizedUser } = user;

    res.status(201).json({
      success: true,
      user: sanitizedUser,
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/users/:userId
 * Update an existing user
 */
router.put('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const db = getDatabase();

    const { name, role, status, password } = req.body;

    const update: any = {
      updatedAt: new Date(),
    };

    if (name) update.name = name;
    if (role) update.role = role;
    if (status) update.status = status;

    // Update password if provided
    if (password) {
      update.passwordHash = await bcrypt.hash(password, 10);
    }

    const result = await db.collection('users').updateOne(
      { userId, organizationId },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await db.collection('users').findOne({
      userId,
      organizationId,
    });

    // Remove password hash from response
    const { passwordHash, ...sanitizedUser } = updated!;

    res.json({
      success: true,
      user: sanitizedUser,
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/users/:userId
 * Delete a user
 */
router.delete('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const db = getDatabase();

    // Don't allow deleting yourself
    const currentUserId = (req as any).userId;
    if (currentUserId === userId) {
      return res.status(400).json({
        error: 'Cannot delete your own user account',
      });
    }

    const result = await db.collection('users').deleteOne({
      userId,
      organizationId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
