/**
 * Authentication Middleware
 * Handles JWT token verification and user context injection
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type UserRole = 'admin' | 'manager' | 'participant';

export interface JWTPayload {
  sub: string;              // User ID
  organizationId: string;   // Tenant isolation
  role: UserRole;           // Access control
  email: string;
  name: string;
  iat: number;
  exp: number;
}

// Extend Express Request to include user context
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      userId?: string;
      organizationId?: string;
      userRole?: UserRole;
    }
  }
}

/**
 * Auth middleware - Verifies JWT and injects user context
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    console.log('[AUTH] authenticate middleware called for:', req.method, req.path);

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('[AUTH] Authorization header:', authHeader ? 'Present (Bearer...)' : 'Missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AUTH] FAILED: Missing or invalid Authorization header');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    const jwtSecret = process.env.JWT_SECRET || 'demo-secret-change-in-production';

    // Verify and decode JWT
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    console.log('[AUTH] Token decoded successfully');
    console.log('[AUTH] User:', decoded.email, '| Role:', decoded.role, '| Org:', decoded.organizationId);

    // Inject user context into request
    req.user = decoded;
    req.userId = decoded.sub;
    req.organizationId = decoded.organizationId;
    req.userRole = decoded.role;

    console.log('[AUTH] Request context injected successfully');
    next();
  } catch (error) {
    console.log('[AUTH] ERROR:', error);

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'TokenExpired',
        message: 'Your session has expired. Please login again.'
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'InvalidToken',
        message: 'Invalid authentication token'
      });
    }

    return res.status(500).json({
      error: 'AuthenticationFailed',
      message: 'Failed to authenticate request'
    });
  }
}

/**
 * Optional auth middleware - Doesn't fail if no token provided
 * Useful for public endpoints that have optional authenticated features
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user context
      return next();
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'demo-secret-change-in-production';

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    req.user = decoded;
    req.userId = decoded.sub;
    req.organizationId = decoded.organizationId;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    // Token invalid, but don't fail - just continue without user context
    next();
  }
}

/**
 * Demo mode middleware - Auto-injects demo user (for development)
 * NEVER use in production!
 */
export function demoAuth(req: Request, res: Response, next: NextFunction) {
  // Inject demo admin user
  req.user = {
    sub: 'demo-admin-1',
    organizationId: 'demo-org-1',
    role: 'admin',
    email: 'admin@janus-demo.com',
    name: 'Demo Admin',
    iat: Date.now(),
    exp: Date.now() + 86400000, // 24 hours
  };

  req.userId = req.user.sub;
  req.organizationId = req.user.organizationId;
  req.userRole = req.user.role;

  next();
}
