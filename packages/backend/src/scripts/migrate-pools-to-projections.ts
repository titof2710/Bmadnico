/**
 * Migration Script: Copy licensePools to license_pool_projections
 * This fixes the mismatch between seed data and projection store
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017?directConnection=true';
const DB_NAME = process.env.MONGODB_DB_NAME || 'janus-platform';

async function migratePools() {
  console.log('🔄 Starting migration: licensePools → license_pool_projections');
  console.log('MongoDB URI:', MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
  console.log('Database:', DB_NAME);

  const client = new MongoClient(MONGO_URI);

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
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
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
