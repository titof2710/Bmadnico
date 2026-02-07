"use strict";
/**
 * Seed Demo Users
 * Creates initial admin, manager, and participant users for demo purposes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017?directConnection=true';
const DB_NAME = process.env.MONGODB_DB_NAME || 'janus';
async function seedUsers() {
    const client = new mongodb_1.MongoClient(MONGO_URI);
    try {
        console.log('🌱 Seeding demo users...\n');
        // Connect to database
        await client.connect();
        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');
        // Demo users data
        const demoUsers = [
            {
                userId: 'user-admin-demo',
                organizationId: 'demo-org-1',
                name: 'Admin Demo',
                email: 'admin@janus-demo.com',
                role: 'admin',
                status: 'active',
                password: 'admin123',
            },
            {
                userId: 'user-manager-acme',
                organizationId: 'demo-org-1',
                name: 'Manager Acme',
                email: 'manager@acme-corp.com',
                role: 'manager',
                status: 'active',
                password: 'manager123',
            },
            {
                userId: 'user-participant-acme',
                organizationId: 'demo-org-1',
                name: 'Jean Dupont',
                email: 'participant@acme-corp.com',
                role: 'participant',
                status: 'active',
                password: 'participant123',
            },
            {
                userId: 'user-manager-techstart',
                organizationId: 'demo-org-2',
                name: 'Sophie Martin',
                email: 'sophie.martin@techstart.fr',
                role: 'manager',
                status: 'active',
                password: 'manager123',
            },
            {
                userId: 'user-participant-innovate',
                organizationId: 'demo-org-3',
                name: 'Lucas Bernard',
                email: 'lucas.bernard@innovate.io',
                role: 'participant',
                status: 'inactive',
                password: 'participant123',
            },
        ];
        // Clear existing users (for demo reset)
        const deleteResult = await usersCollection.deleteMany({
            organizationId: { $in: ['demo-org-1', 'demo-org-2', 'demo-org-3'] }
        });
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing demo users\n`);
        // Create users
        let createdCount = 0;
        for (const userData of demoUsers) {
            // Hash password
            const passwordHash = await bcryptjs_1.default.hash(userData.password, 10);
            const user = {
                userId: userData.userId,
                organizationId: userData.organizationId,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                status: userData.status,
                passwordHash,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLogin: userData.role === 'admin' ? new Date() : undefined,
            };
            await usersCollection.insertOne(user);
            console.log(`✅ Created user: ${user.name} (${user.email}) - Role: ${user.role}`);
            createdCount++;
        }
        console.log(`\n✨ Successfully seeded ${createdCount} demo users!\n`);
        // Display login credentials
        console.log('📋 Login Credentials:');
        console.log('─────────────────────────────────────────');
        demoUsers.forEach(user => {
            console.log(`${user.name.padEnd(20)} | ${user.email.padEnd(30)} | ${user.password}`);
        });
        console.log('─────────────────────────────────────────\n');
        await client.close();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error seeding users:', error);
        await client.close();
        process.exit(1);
    }
}
seedUsers();
//# sourceMappingURL=seed-users.js.map