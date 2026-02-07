"use strict";
/**
 * Database connection and initialization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
exports.getDatabase = getDatabase;
exports.getEventStore = getEventStore;
exports.getProjectionStore = getProjectionStore;
exports.getLicensePoolProjectionStore = getLicensePoolProjectionStore;
exports.getCompanyProjectionStore = getCompanyProjectionStore;
exports.getProductProjectionStore = getProductProjectionStore;
exports.getParticipantProjectionStore = getParticipantProjectionStore;
const mongodb_1 = require("mongodb");
const EventStore_js_1 = require("./EventStore.js");
const ProjectionStore_js_1 = require("./ProjectionStore.js");
const LicensePoolProjectionStore_js_1 = require("./LicensePoolProjectionStore.js");
const CompanyProjectionStore_js_1 = require("./CompanyProjectionStore.js");
const ProductProjectionStore_js_1 = require("./ProductProjectionStore.js");
const ParticipantProjectionStore_js_1 = require("./ParticipantProjectionStore.js");
let mongoClient = null;
let database = null;
let eventStore = null;
let projectionStore = null;
let licensePoolProjectionStore = null;
let companyProjectionStore = null;
let productProjectionStore = null;
let participantProjectionStore = null;
async function connectDatabase(uri, dbName) {
    if (mongoClient) {
        console.log('Database already connected');
        return;
    }
    console.log('Connecting to MongoDB...');
    mongoClient = new mongodb_1.MongoClient(uri);
    await mongoClient.connect();
    database = mongoClient.db(dbName);
    console.log(`Connected to database: ${dbName}`);
    // Initialize stores
    eventStore = new EventStore_js_1.EventStore(database);
    projectionStore = new ProjectionStore_js_1.ProjectionStore(database);
    licensePoolProjectionStore = new LicensePoolProjectionStore_js_1.LicensePoolProjectionStore(database);
    companyProjectionStore = new CompanyProjectionStore_js_1.CompanyProjectionStore(database);
    productProjectionStore = new ProductProjectionStore_js_1.ProductProjectionStore(database);
    participantProjectionStore = new ParticipantProjectionStore_js_1.ParticipantProjectionStore(database);
    // Create indexes
    await eventStore.createIndexes();
    await projectionStore.createIndexes();
    await licensePoolProjectionStore.createIndexes();
    await companyProjectionStore.createIndexes();
    await productProjectionStore.createIndexes();
    await participantProjectionStore.createIndexes();
    console.log('Database indexes created');
}
async function disconnectDatabase() {
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
function getDatabase() {
    if (!database) {
        throw new Error('Database not connected');
    }
    return database;
}
function getEventStore() {
    if (!eventStore) {
        throw new Error('EventStore not initialized');
    }
    return eventStore;
}
function getProjectionStore() {
    if (!projectionStore) {
        throw new Error('ProjectionStore not initialized');
    }
    return projectionStore;
}
function getLicensePoolProjectionStore() {
    if (!licensePoolProjectionStore) {
        throw new Error('LicensePoolProjectionStore not initialized');
    }
    return licensePoolProjectionStore;
}
function getCompanyProjectionStore() {
    if (!companyProjectionStore) {
        throw new Error('CompanyProjectionStore not initialized');
    }
    return companyProjectionStore;
}
function getProductProjectionStore() {
    if (!productProjectionStore) {
        throw new Error('ProductProjectionStore not initialized');
    }
    return productProjectionStore;
}
function getParticipantProjectionStore() {
    if (!participantProjectionStore) {
        throw new Error('ParticipantProjectionStore not initialized');
    }
    return participantProjectionStore;
}
//# sourceMappingURL=database.js.map