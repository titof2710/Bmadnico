/**
 * Role-Based Access Control (RBAC) Middleware
 * Controls access to routes based on user roles
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from './auth.js';

/**
 * Require specific role(s) to access a route
 *
 * @example
 * router.get('/admin/dashboard', authenticate, requireRole('admin'), handler);
 * router.get('/manager/sessions', authenticate, requireRole(['admin', 'manager']), handler);
 */
export function requireRole(allowedRoles: UserRole | UserRole[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.user || !req.userRole) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Check if user has required role
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.userRole}`
      });
    }

    next();
  };
}

/**
 * Require admin role
 * Shortcut for requireRole('admin')
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole('admin')(req, res, next);
}

/**
 * Require manager or admin role
 * Managers can access, admins can also access
 */
export function requireManager(req: Request, res: Response, next: NextFunction) {
  return requireRole(['admin', 'manager'])(req, res, next);
}

/**
 * Require participant role (or higher)
 * All authenticated users can access
 */
export function requireParticipant(req: Request, res: Response, next: NextFunction) {
  return requireRole(['admin', 'manager', 'participant'])(req, res, next);
}

/**
 * Check if user owns the resource (same organizationId)
 * Admins bypass this check
 */
export function requireOwnership(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.organizationId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  // Admins can access all organizations
  if (req.userRole === 'admin') {
    return next();
  }

  // Get organizationId from request (query, params, or body)
  const targetOrgId =
    req.query.organizationId ||
    req.params.organizationId ||
    (req.body && req.body.organizationId);

  // If no target org specified, assume current user's org
  if (!targetOrgId) {
    return next();
  }

  // Check ownership
  if (targetOrgId !== req.organizationId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access resources from your own organization'
    });
  }

  next();
}

/**
 * Role hierarchy helper
 * Returns true if userRole has access level >= requiredRole
 */
export function hasRoleAccess(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    participant: 1,
    manager: 2,
    admin: 3,
  };

  return hierarchy[userRole] >= hierarchy[requiredRole];
}
