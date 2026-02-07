/**
 * Database connection and initialization
 */
import { Db } from 'mongodb';
import { EventStore } from './EventStore.js';
import { ProjectionStore } from './ProjectionStore.js';
import { LicensePoolProjectionStore } from './LicensePoolProjectionStore.js';
import { CompanyProjectionStore } from './CompanyProjectionStore.js';
import { ProductProjectionStore } from './ProductProjectionStore.js';
import { ParticipantProjectionStore } from './ParticipantProjectionStore.js';
export declare function connectDatabase(uri: string, dbName: string): Promise<void>;
export declare function disconnectDatabase(): Promise<void>;
export declare function getDatabase(): Db;
export declare function getEventStore(): EventStore;
export declare function getProjectionStore(): ProjectionStore;
export declare function getLicensePoolProjectionStore(): LicensePoolProjectionStore;
export declare function getCompanyProjectionStore(): CompanyProjectionStore;
export declare function getProductProjectionStore(): ProductProjectionStore;
export declare function getParticipantProjectionStore(): ParticipantProjectionStore;
//# sourceMappingURL=database.d.ts.map