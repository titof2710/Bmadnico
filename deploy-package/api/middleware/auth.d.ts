/**
 * Authentication Middleware
 * Handles JWT token verification and user context injection
 */
import { Request, Response, NextFunction } from 'express';
export type UserRole = 'admin' | 'manager' | 'participant';
export interface JWTPayload {
    sub: string;
    organizationId: string;
    role: UserRole;
    email: string;
    name: string;
    iat: number;
    exp: number;
}
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
export declare function authenticate(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/**
 * Optional auth middleware - Doesn't fail if no token provided
 * Useful for public endpoints that have optional authenticated features
 */
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * Demo mode middleware - Auto-injects demo user (for development)
 * NEVER use in production!
 */
export declare function demoAuth(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map