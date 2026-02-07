/**
 * Authentication Routes
 * Handles login, token generation, and demo accounts
 */

import { Router, Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole, JWTPayload } from '../middleware/auth.js';

const router = Router();

// Demo users database (in production, this would be a real database)
interface DemoUser {
  id: string;
  email: string;
  password: string; // In production: hashed with bcrypt
  name: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    id: 'admin-001',
    email: 'admin@janus-demo.com',
    password: 'admin123', // Plain text for DEMO only!
    name: 'Pierre Administrateur',
    role: 'admin',
    organizationId: 'demo-org-1',
    organizationName: 'Acme Corporation',
  },
  {
    id: 'manager-001',
    email: 'manager@acme-corp.com',
    password: 'manager123',
    name: 'Sophie Gestionnaire',
    role: 'manager',
    organizationId: 'demo-org-1',
    organizationName: 'Acme Corporation',
  },
  {
    id: 'manager-002',
    email: 'manager@techstart.fr',
    password: 'manager123',
    name: 'Marc Responsable',
    role: 'manager',
    organizationId: 'demo-org-2',
    organizationName: 'TechStart Solutions',
  },
  {
    id: 'participant-001',
    email: 'participant@acme-corp.com',
    password: 'participant123',
    name: 'Julie Candidate',
    role: 'participant',
    organizationId: 'demo-org-1',
    organizationName: 'Acme Corporation',
  },
  {
    id: 'participant-002',
    email: 'jean.dupont@test.fr',
    password: 'participant123',
    name: 'Jean Dupont',
    role: 'participant',
    organizationId: 'demo-org-2',
    organizationName: 'TechStart Solutions',
  },
];

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Email and password are required',
      });
    }

    // Find user
    const user = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return res.status(401).json({
        error: 'InvalidCredentials',
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Verify password (in production: bcrypt.compare)
    if (user.password !== password) {
      return res.status(401).json({
        error: 'InvalidCredentials',
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'demo-secret-change-in-production';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    const payload: Record<string, any> = {
      sub: user.id,
      organizationId: user.organizationId,
      role: user.role,
      email: user.email,
      name: user.name,
    };

    const signOptions: SignOptions = {
      expiresIn: expiresIn as any
    };

    const token = jwt.sign(payload, jwtSecret, signOptions);

    // Return success with token and user info
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organizationName,
      },
      expiresIn,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'LoginFailed',
      message: 'Failed to process login request',
    });
  }
});

/**
 * GET /api/auth/demo-accounts
 * List all available demo accounts (for demo purposes only!)
 */
router.get('/demo-accounts', (req: Request, res: Response) => {
  // Return list of demo accounts (without passwords)
  const accounts = DEMO_USERS.map((user) => ({
    email: user.email,
    password: user.password, // ⚠️ Only for DEMO! Never do this in production!
    name: user.name,
    role: user.role,
    organizationName: user.organizationName,
  }));

  res.json({
    success: true,
    accounts,
    warning: '⚠️ These are DEMO accounts only. Never expose passwords in production!',
  });
});

/**
 * POST /api/auth/verify
 * Verify if a token is valid
 */
router.post('/verify', (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Token is required',
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'demo-secret-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    return res.json({
      valid: true,
      user: {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        organizationId: decoded.organizationId,
      },
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        valid: false,
        error: 'TokenExpired',
        message: 'Token has expired',
      });
    }

    return res.status(401).json({
      valid: false,
      error: 'InvalidToken',
      message: 'Invalid token',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', (req: Request, res: Response) => {
  // This route would typically use authenticate middleware
  // For demo, we'll check the Authorization header manually

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing authentication token',
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'demo-secret-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Find user details
    const user = DEMO_USERS.find((u) => u.id === decoded.sub);

    if (!user) {
      return res.status(404).json({
        error: 'UserNotFound',
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organizationName,
      },
    });
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
});

export default router;
