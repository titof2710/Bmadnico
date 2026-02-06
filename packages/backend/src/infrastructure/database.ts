/**
 * Database connection and initialization
 */

import { MongoClient, Db } from 'mongodb';
import { EventStore } from './EventStore.js';
import { ProjectionStore } from './ProjectionStore.js';
import { LicensePoolProjectionStore } from './LicensePoolProjectionStore.js';
import { CompanyProjectionStore } from './CompanyProjectionStore.js';
import { ProductProjectionStore } from './ProductProjectionStore.js';
import { ParticipantProjectionStore } from './ParticipantProjectionStore.js';

let mongoClient: MongoClient | null = null;
let database: Db | null = null;
let eventStore: EventStore | null = null;
let projectionStore: ProjectionStore | null = null;
let licensePoolProjectionStore: LicensePoolProjectionStore | null = null;
let companyProjectionStore: CompanyProjectionStore | null = null;
let productProjectionStore: ProductProjectionStore | null = null;
let participantProjectionStore: ParticipantProjectionStore | null = null;

export async function connectDatabase(uri: string, dbName: string) {
  if (mongoClient) {
    console.log('Database already connected');
    return;
  }

  console.log('Connecting to MongoDB...');
  mongoClient = new MongoClient(uri);
  await mongoClient.connect();

  database = mongoClient.db(dbName);
  console.log(`Connected to database: ${dbName}`);

  // Initialize stores
  eventStore = new EventStore(database);
  projectionStore = new ProjectionStore(database);
  licensePoolProjectionStore = new LicensePoolProjectionStore(database);
  companyProjectionStore = new CompanyProjectionStore(database);
  productProjectionStore = new ProductProjectionStore(database);
  participantProjectionStore = new ParticipantProjectionStore(database);

  // Create indexes
  await eventStore.createIndexes();
  await projectionStore.createIndexes();
  await licensePoolProjectionStore.createIndexes();
  await companyProjectionStore.createIndexes();
  await productProjectionStore.createIndexes();
  await participantProjectionStore.createIndexes();
  console.log('Database indexes created');
}

export async function disconnectDatabase() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    database = null;
    eventStore = null;
    projectionStore = null;
    licensePoolProjectionStore = null;
    companyProjectionStore = null;
    productProjectionStore = null;
    participantProjectionStore = null;
    console.log('Database disconnected');
  }
}

export function getDatabase(): Db {
  if (!database) {
    throw new Error('Database not connected');
  }
  return database;
}

export function getEventStore(): EventStore {
  if (!eventStore) {
    throw new Error('EventStore not initialized');
  }
  return eventStore;
}

export function getProjectionStore(): ProjectionStore {
  if (!projectionStore) {
    throw new Error('ProjectionStore not initialized');
  }
  return projectionStore;
}

export function getLicensePoolProjectionStore(): LicensePoolProjectionStore {
  if (!licensePoolProjectionStore) {
    throw new Error('LicensePoolProjectionStore not initialized');
  }
  return licensePoolProjectionStore;
}

export function getCompanyProjectionStore(): CompanyProjectionStore {
  if (!companyProjectionStore) {
    throw new Error('CompanyProjectionStore not initialized');
  }
  return companyProjectionStore;
}

export function getProductProjectionStore(): ProductProjectionStore {
  if (!productProjectionStore) {
    throw new Error('ProductProjectionStore not initialized');
  }
  return productProjectionStore;
}

export function getParticipantProjectionStore(): ParticipantProjectionStore {
  if (!participantProjectionStore) {
    throw new Error('ParticipantProjectionStore not initialized');
  }
  return participantProjectionStore;
}
