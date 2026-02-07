"use strict";
/**
 * Migration Script: Copy licensePools to license_pool_projections
 * This fixes the mismatch between seed data and projection store
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017?directConnection=true';
const DB_NAME = process.env.MONGODB_DB_NAME || 'janus-platform';
async function migratePools() {
    console.log('🔄 Starting migration: licensePools → license_pool_projections');
    console.log('MongoDB URI:', MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    console.log('Database:', DB_NAME);
    const client = new mongodb_1.MongoClient(MONGO_URI);
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        const db = client.db(DB_NAME);
        // Get all pools from licensePools collection
        const pools = await db.collection('licensePools').find({}).toArray();
        console.log(`\n📦 Found ${pools.length} pools in 'licensePools' collection`);
        if (pools.length === 0) {
            console.log('⚠️  No pools found to migrate!');
            return;
        }
        // Transform to projection format
        const projections = pools.map(pool => ({
            poolId: pool.poolId,
            organizationId: pool.organizationId,
            productId: pool.templateId, // templateId is used as productId
            productName: `Template ${pool.templateId}`,
            availableLicenses: pool.availableLicenses,
            totalPurchased: pool.totalLicenses,
            consumedLicenses: pool.consumedLicenses,
            warningThreshold: pool.warningThreshold,
            isWarning: pool.isWarning,
            isDepleted: pool.isDepleted,
            createdAt: pool.createdAt,
            updatedAt: pool.updatedAt || new Date(),
            version: 1,
        }));
        // Clear existing projections
        const deleteResult = await db.collection('license_pool_projections').deleteMany({});
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing projections`);
        // Insert new projections
        const insertResult = await db.collection('license_pool_projections').insertMany(projections);
        console.log(`✅ Inserted ${insertResult.insertedCount} new projections`);
        // Display results
        console.log('\n📊 Migration Summary:');
        projections.forEach(p => {
            console.log(`  ✓ ${p.poolId} (org: ${p.organizationId}, ${p.availableLicenses}/${p.totalPurchased} licenses)`);
        });
        console.log('\n🎉 Migration completed successfully!');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
    finally {
        await client.close();
        console.log('\n👋 Disconnected from MongoDB');
    }
}
// Run migration
migratePools()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=migrate-pools-to-projections.js.map