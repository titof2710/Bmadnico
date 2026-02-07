/**
 * Company Projection Store
 * Maintains read-optimized views of company state
 */
import { Db } from 'mongodb';
import { DomainEvent } from '../shared/types.js';
interface CompanyUser {
    userId: string;
    email: string;
    fullName: string;
    role: 'representative' | 'consultant';
    addedAt: Date;
}
export interface CompanyProjection {
    companyId: string;
    companyName: string;
    contactEmail: string;
    brandingConfig: {
        logoUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
    };
    users: CompanyUser[];
    userCount: number;
    representativeCount: number;
    consultantCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    version: number;
}
export declare class CompanyProjectionStore {
    private collection;
    constructor(db: Db);
    /**
     * Create indexes
     */
    createIndexes(): Promise<void>;
    /**
     * Get company by ID
     */
    getCompany(companyId: string): Promise<CompanyProjection | null>;
    /**
     * Get all companies
     */
    getAllCompanies(filters?: {
        isActive?: boolean;
        limit?: number;
    }): Promise<CompanyProjection[]>;
    /**
     * Create initial projection from CompanyCreated event
     */
    createProjection(companyId: string, event: DomainEvent): Promise<void>;
    /**
     * Apply event to update projection
     */
    applyEvent(event: DomainEvent): Promise<void>;
    /**
     * Calculate projection updates based on event
     */
    private calculateUpdates;
}
export {};
//# sourceMappingURL=CompanyProjectionStore.d.ts.map