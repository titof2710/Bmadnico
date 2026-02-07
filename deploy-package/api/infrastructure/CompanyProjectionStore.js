"use strict";
/**
 * Company Projection Store
 * Maintains read-optimized views of company state
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyProjectionStore = void 0;
class CompanyProjectionStore {
    collection;
    constructor(db) {
        this.collection = db.collection('company_projections');
    }
    /**
     * Create indexes
     */
    async createIndexes() {
        await this.collection.createIndex({ companyId: 1 }, { unique: true });
        await this.collection.createIndex({ companyName: 1 });
        await this.collection.createIndex({ isActive: 1 });
    }
    /**
     * Get company by ID
     */
    async getCompany(companyId) {
        const doc = await this.collection.findOne({ companyId });
        if (!doc)
            return null;
        const { _id, ...projection } = doc;
        return projection;
    }
    /**
     * Get all companies
     */
    async getAllCompanies(filters) {
        const query = {};
        if (filters?.isActive !== undefined) {
            query.isActive = filters.isActive;
        }
        const docs = await this.collection
            .find(query)
            .sort({ createdAt: -1 })
            .limit(filters?.limit || 100)
            .toArray();
        return docs.map(({ _id, ...projection }) => projection);
    }
    /**
     * Create initial projection from CompanyCreated event
     */
    async createProjection(companyId, event) {
        if (event.eventType !== 'CompanyCreated') {
            throw new Error('Can only create projection from CompanyCreated event');
        }
        const payload = event.payload;
        const projection = {
            companyId,
            companyName: payload.companyName,
            contactEmail: payload.contactEmail,
            brandingConfig: {},
            users: [
                {
                    userId: event.eventId, // Use eventId as temporary userId
                    email: payload.representativeEmail,
                    fullName: payload.representativeName,
                    role: 'representative',
                    addedAt: event.timestamp,
                },
            ],
            userCount: 1,
            representativeCount: 1,
            consultantCount: 0,
            isActive: true,
            createdAt: event.timestamp,
            updatedAt: event.timestamp,
            version: event.version,
        };
        await this.collection.insertOne(projection);
    }
    /**
     * Apply event to update projection
     */
    async applyEvent(event) {
        const company = await this.getCompany(event.aggregateId);
        if (!company) {
            throw new Error(`Projection not found for company ${event.aggregateId}`);
        }
        const updates = this.calculateUpdates(company, event);
        await this.collection.updateOne({ companyId: event.aggregateId }, {
            $set: {
                ...updates,
                version: event.version,
                updatedAt: event.timestamp,
            },
        });
    }
    /**
     * Calculate projection updates based on event
     */
    calculateUpdates(company, event) {
        const updates = {};
        switch (event.eventType) {
            case 'UserAdded': {
                const payload = event.payload;
                const newUser = {
                    userId: payload.userId,
                    email: payload.email,
                    fullName: payload.fullName,
                    role: payload.role,
                    addedAt: event.timestamp,
                };
                updates.users = [...company.users, newUser];
                updates.userCount = company.userCount + 1;
                if (payload.role === 'representative') {
                    updates.representativeCount = company.representativeCount + 1;
                }
                else {
                    updates.consultantCount = company.consultantCount + 1;
                }
                break;
            }
            case 'UserRoleUpdated': {
                const payload = event.payload;
                const updatedUsers = company.users.map(u => u.userId === payload.userId ? { ...u, role: payload.newRole } : u);
                updates.users = updatedUsers;
                if (payload.oldRole === 'representative' && payload.newRole === 'consultant') {
                    updates.representativeCount = company.representativeCount - 1;
                    updates.consultantCount = company.consultantCount + 1;
                }
                else if (payload.oldRole === 'consultant' && payload.newRole === 'representative') {
                    updates.representativeCount = company.representativeCount + 1;
                    updates.consultantCount = company.consultantCount - 1;
                }
                break;
            }
            case 'BrandingUpdated': {
                const payload = event.payload;
                updates.brandingConfig = payload.newConfig;
                break;
            }
            case 'CompanyDeactivated': {
                updates.isActive = false;
                break;
            }
        }
        return updates;
    }
}
exports.CompanyProjectionStore = CompanyProjectionStore;
//# sourceMappingURL=CompanyProjectionStore.js.map