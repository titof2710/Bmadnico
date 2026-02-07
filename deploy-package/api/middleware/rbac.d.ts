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
export declare function requireRole(allowedRoles: UserRole | UserRole[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Require admin role
 * Shortcut for requireRole('admin')
 */
export declare function requireAdmin(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/**
 * Require manager or admin role
 * Managers can access, admins can also access
 */
export declare function requireManager(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/**
 * Require participant role (or higher)
 * All authenticated users can access
 */
export declare function requireParticipant(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/**
 * Check if user owns the resource (same organizationId)
 * Admins bypass this check
 */
export declare function requireOwnership(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
/**
 * Role hierarchy helper
 * Returns true if userRole has access level >= requiredRole
 */
export declare function hasRoleAccess(userRole: UserRole, requiredRole: UserRole): boolean;
//# sourceMappingURL=rbac.d.ts.map