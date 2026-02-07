"use strict";
/**
 * Janus Assessment Platform - Backend Entry Point
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_js_1 = require("./infrastructure/database.js");
const sessionRoutes_js_1 = require("./api/sessionRoutes.js");
const adminRoutes_js_1 = __importDefault(require("./api/adminRoutes.js"));
const licensePoolRoutes_js_1 = __importDefault(require("./api/licensePoolRoutes.js"));
const companyRoutes_js_1 = __importDefault(require("./api/companyRoutes.js"));
const cronRoutes_js_1 = __importDefault(require("./api/cronRoutes.js"));
const productCatalogRoutes_js_1 = __importDefault(require("./api/productCatalogRoutes.js"));
const paymentRoutes_js_1 = __importDefault(require("./api/paymentRoutes.js"));
const participantRoutes_js_1 = __importDefault(require("./api/participantRoutes.js"));
const authRoutes_js_1 = __importDefault(require("./api/authRoutes.js"));
const templateRoutes_js_1 = __importDefault(require("./api/templateRoutes.js"));
const userRoutes_js_1 = __importDefault(require("./api/userRoutes.js"));
const auth_js_1 = require("./middleware/auth.js");
const rbac_js_1 = require("./middleware/rbac.js");
// Load environment variables
dotenv_1.default.config({ path: '.env' });
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, helmet_1.default)());
// CORS - Allow all localhost ports for demo
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // Allow all localhost origins for demo
        if (origin.startsWith('http://localhost:')) {
            return callback(null, true);
        }
        // Fallback to configured origins
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express_1.default.json());
// Health check (public, no auth required)
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// Auth routes (public - no auth required for login)
app.use('/api/auth', authRoutes_js_1.default);
// Optional auth: Try JWT first, fallback to demo admin if no token
// This allows testing with real tokens while having demo fallback
app.use((req, res, next) => {
    // Check if Authorization header exists
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        // Has token, use authenticate middleware
        return (0, auth_js_1.authenticate)(req, res, next);
    }
    else {
        // No token, use demo auth fallback
        return (0, auth_js_1.demoAuth)(req, res, next);
    }
});
// API Routes (protected by auth)
app.use('/api/sessions', (0, sessionRoutes_js_1.createSessionRoutes)());
app.use('/api/admin', rbac_js_1.requireAdmin, adminRoutes_js_1.default); // Admin only
app.use('/api/license-pools', rbac_js_1.requireManager, licensePoolRoutes_js_1.default); // Manager or Admin
app.use('/api/companies', rbac_js_1.requireManager, companyRoutes_js_1.default); // Manager or Admin
app.use('/api/cron', rbac_js_1.requireAdmin, cronRoutes_js_1.default); // Admin only
app.use('/api/products', rbac_js_1.requireManager, productCatalogRoutes_js_1.default); // Manager or Admin
app.use('/api/payments', rbac_js_1.requireManager, paymentRoutes_js_1.default); // Manager or Admin
app.use('/api/participants', participantRoutes_js_1.default); // All authenticated users
app.use('/api/templates', rbac_js_1.requireManager, templateRoutes_js_1.default); // Manager or Admin
app.use('/api/users', rbac_js_1.requireAdmin, userRoutes_js_1.default); // Admin only
// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
// Startup
async function start() {
    try {
        // Connect to database
        const mongoUri = process.env.MONGODB_URI ||
            'mongodb://localhost:27017/janus?replicaSet=rs0';
        const dbName = process.env.MONGODB_DB_NAME || 'janus';
        await (0, database_js_1.connectDatabase)(mongoUri, dbName);
        // Start server
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Janus Assessment Platform - Demo Backend            ║
║                                                            ║
║   Server:    http://localhost:${PORT}                        ║
║   Health:    http://localhost:${PORT}/health                ║
║   API Docs:  http://localhost:${PORT}/api                   ║
║                                                            ║
║   Features:                                                ║
║   ✅ Event Sourcing & CQRS                                ║
║   ✅ Multi-tenant Isolation                               ║
║   ✅ Auto-save (30s debounce)                             ║
║   ✅ Cross-device Session Resume                          ║
║   ✅ RBAC Authentication (admin/manager/participant)      ║
║                                                            ║
║   Demo Login:                                              ║
║   POST /api/auth/login                                    ║
║   • admin@janus-demo.com / admin123                       ║
║   • manager@acme-corp.com / manager123                    ║
║   • participant@acme-corp.com / participant123            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await (0, database_js_1.disconnectDatabase)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...');
    await (0, database_js_1.disconnectDatabase)();
    process.exit(0);
});
start();
//# sourceMappingURL=index.js.map