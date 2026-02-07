"use strict";
/**
 * Authentication Routes
 * Handles login, token generation, and demo accounts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const DEMO_USERS = [
    {
        id: 'admin-001',
        email: 'admin@janus-demo.com',
        password: 'admin123', // Plain text for DEMO only!
        name: 'Pierre Administrateur',
        role: 'admin',
        organizationId: 'platform-root',
        organizationName: 'Janus Platform',
    },
    {
        id: 'manager-001',
        email: 'manager@acme-corp.com',
        password: 'manager123',
        name: 'Sophie Gestionnaire',
        role: 'manager',
        organizationId: 'org-acme-001',
        organizationName: 'ACME Corporation',
    },
    {
        id: 'manager-002',
        email: 'manager@techstart.fr',
        password: 'manager123',
        name: 'Marc Responsable',
        role: 'manager',
        organizationId: 'org-techstart-001',
        organizationName: 'TechStart SAS',
    },
    {
        id: 'participant-001',
        email: 'participant@acme-corp.com',
        password: 'participant123',
        name: 'Julie Candidate',
        role: 'participant',
        organizationId: 'org-acme-001',
        organizationName: 'ACME Corporation',
    },
    {
        id: 'participant-002',
        email: 'jean.dupont@test.fr',
        password: 'participant123',
        name: 'Jean Dupont',
        role: 'participant',
        organizationId: 'org-techstart-001',
        organizationName: 'TechStart SAS',
    },
];
/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
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
        const user = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
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
        const payload = {
            sub: user.id,
            organizationId: user.organizationId,
            role: user.role,
            email: user.email,
            name: user.name,
        };
        const signOptions = {
            expiresIn: expiresIn
        };
        const token = jsonwebtoken_1.default.sign(payload, jwtSecret, signOptions);
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
    }
    catch (error) {
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
router.get('/demo-accounts', (req, res) => {
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
router.post('/verify', (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                error: 'ValidationError',
                message: 'Token is required',
            });
        }
        const jwtSecret = process.env.JWT_SECRET || 'demo-secret-change-in-production';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
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
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
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
router.get('/me', (req, res) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
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
    }
    catch (error) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
        });
    }
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map