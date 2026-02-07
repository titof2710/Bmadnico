"use strict";
/**
 * Authentication Middleware
 * Handles JWT token verification and user context injection
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
exports.demoAuth = demoAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Auth middleware - Verifies JWT and injects user context
 */
function authenticate(req, res, next) {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing or invalid Authorization header'
            });
        }
        const token = authHeader.substring(7); // Remove 'Bearer '
        const jwtSecret = process.env.JWT_SECRET || 'demo-secret-change-in-production';
        // Verify and decode JWT
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // Inject user context into request
        req.user = decoded;
        req.userId = decoded.sub;
        req.organizationId = decoded.organizationId;
        req.userRole = decoded.role;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                error: 'TokenExpired',
                message: 'Your session has expired. Please login again.'
            });
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
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
function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token provided, continue without user context
            return next();
        }
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET || 'demo-secret-change-in-production';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = decoded;
        req.userId = decoded.sub;
        req.organizationId = decoded.organizationId;
        req.userRole = decoded.role;
        next();
    }
    catch (error) {
        // Token invalid, but don't fail - just continue without user context
        next();
    }
}
/**
 * Demo mode middleware - Auto-injects demo user (for development)
 * NEVER use in production!
 */
function demoAuth(req, res, next) {
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
//# sourceMappingURL=auth.js.map