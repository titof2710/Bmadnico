/**
 * Janus Assessment Platform - Backend Entry Point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './infrastructure/database.js';
import { createSessionRoutes } from './api/sessionRoutes.js';
import adminRoutes from './api/adminRoutes.js';
import licensePoolRoutes from './api/licensePoolRoutes.js';
import companyRoutes from './api/companyRoutes.js';
import cronRoutes from './api/cronRoutes.js';
import productCatalogRoutes from './api/productCatalogRoutes.js';
import paymentRoutes from './api/paymentRoutes.js';
import participantRoutes from './api/participantRoutes.js';
import authRoutes from './api/authRoutes.js';
import templateRoutes from './api/templateRoutes.js';
import userRoutes from './api/userRoutes.js';
import { authenticate, optionalAuth, demoAuth } from './middleware/auth.js';
import { requireAdmin, requireManager } from './middleware/rbac.js';

// Load environment variables
dotenv.config({ path: '.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());

// CORS - Allow all localhost ports for demo
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow all localhost origins for demo
      if (origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }

      // Fallback to configured origins
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Health check (public, no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Auth routes (public - no auth required for login)
app.use('/api/auth', authRoutes);

// Optional auth: Try JWT first, fallback to demo admin if no token
// This allows testing with real tokens while having demo fallback
app.use((req, res, next) => {
  // Check if Authorization header exists
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Has token, use authenticate middleware
    return authenticate(req, res, next);
  } else {
    // No token, use demo auth fallback
    return demoAuth(req, res, next);
  }
});

// API Routes (protected by auth)
app.use('/api/sessions', createSessionRoutes());
app.use('/api/admin', requireAdmin, adminRoutes); // Admin only
app.use('/api/license-pools', requireManager, licensePoolRoutes); // Manager or Admin
app.use('/api/companies', requireManager, companyRoutes); // Manager or Admin
app.use('/api/cron', requireAdmin, cronRoutes); // Admin only
app.use('/api/products', requireManager, productCatalogRoutes); // Manager or Admin
app.use('/api/payments', requireManager, paymentRoutes); // Manager or Admin
app.use('/api/participants', participantRoutes); // All authenticated users
app.use('/api/templates', requireManager, templateRoutes); // Manager or Admin
app.use('/api/users', requireAdmin, userRoutes); // Admin only

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

// Startup
async function start() {
  try {
    // Connect to database
    const mongoUri =
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/janus?replicaSet=rs0';
    const dbName = process.env.MONGODB_DB_NAME || 'janus';

    await connectDatabase(mongoUri, dbName);

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
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

start();

