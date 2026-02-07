"use strict";
/**
 * Participant Projection Store
 * Maintains read-optimized views of participant data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipantProjectionStore = void 0;
class ParticipantProjectionStore {
    collection;
    constructor(db) {
        this.collection = db.collection('participant_projections');
    }
    /**
     * Create indexes
     */
    async createIndexes() {
        await this.collection.createIndex({ participantId: 1, organizationId: 1 }, { unique: true });
        await this.collection.createIndex({ organizationId: 1, email: 1 }, { unique: true });
        await this.collection.createIndex({ organizationId: 1, companyId: 1 });
        await this.collection.createIndex({ organizationId: 1, isActive: 1 });
    }
    /**
     * Get participant by ID
     */
    async getParticipant(participantId, organizationId) {
        const doc = await this.collection.findOne({
            participantId,
            organizationId,
        });
        if (!doc)
            return null;
        const { _id, ...projection } = doc;
        return projection;
    }
    /**
     * Get participant by email
     */
    async getParticipantByEmail(email, organizationId) {
        const doc = await this.collection.findOne({
            email: email.toLowerCase(),
            organizationId,
        });
        if (!doc)
            return null;
        const { _id, ...projection } = doc;
        return projection;
    }
    /**
     * Get all participants for an organization
     */
    async getParticipants(organizationId, options) {
        const filter = { organizationId };
        if (options?.companyId) {
            filter.companyId = options.companyId;
        }
        if (options?.isActive !== undefined) {
            filter.isActive = options.isActive;
        }
        let query = this.collection.find(filter).sort({ createdAt: -1 });
        if (options?.offset) {
            query = query.skip(options.offset);
        }
        if (options?.limit) {
            query = query.limit(options.limit);
        }
        const docs = await query.toArray();
        return docs.map(({ _id, ...projection }) => projection);
    }
    /**
     * Get participants by company
     */
    async getParticipantsByCompany(organizationId, companyId) {
        const docs = await this.collection
            .find({ organizationId, companyId, isActive: true })
            .sort({ lastName: 1, firstName: 1 })
            .toArray();
        return docs.map(({ _id, ...projection }) => projection);
    }
    /**
     * Count participants
     */
    async countParticipants(organizationId, options) {
        const filter = { organizationId };
        if (options?.companyId) {
            filter.companyId = options.companyId;
        }
        if (options?.isActive !== undefined) {
            filter.isActive = options.isActive;
        }
        return await this.collection.countDocuments(filter);
    }
    /**
     * Create initial projection from ParticipantCreated event
     */
    async createProjection(participantId, event) {
        if (event.eventType !== 'ParticipantCreated') {
            throw new Error('Can only create projection from ParticipantCreated event');
        }
        const payload = event.payload;
        const projection = {
            participantId,
            organizationId: event.organizationId,
            email: payload.email,
            firstName: payload.firstName,
            lastName: payload.lastName,
            companyId: payload.companyId,
            isActive: true,
            sessionCount: 0,
            sessions: [],
            metadata: payload.metadata,
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
        const participant = await this.getParticipant(event.aggregateId, event.organizationId);
        if (!participant) {
            throw new Error(`Projection not found for participant ${event.aggregateId}`);
        }
        const updates = this.calculateUpdates(participant, event);
        await this.collection.updateOne({
            participantId: event.aggregateId,
            organizationId: event.organizationId,
        }, {
            $set: {
                ...updates,
                version: event.version,
                updatedAt: event.timestamp,
                lastActivityAt: event.timestamp,
            },
        });
    }
    /**
     * Calculate projection updates based on event
     */
    calculateUpdates(participant, event) {
        const updates = {};
        switch (event.eventType) {
            case 'ParticipantProfileUpdated': {
                const payload = event.payload;
                if (payload.firstName !== undefined)
                    updates.firstName = payload.firstName;
                if (payload.lastName !== undefined)
                    updates.lastName = payload.lastName;
                if (payload.phone !== undefined)
                    updates.phone = payload.phone;
                if (payload.metadata !== undefined) {
                    updates.metadata = {
                        ...participant.metadata,
                        ...payload.metadata,
                    };
                }
                break;
            }
            case 'ParticipantSessionAssigned': {
                const payload = event.payload;
                updates.sessions = [
                    ...participant.sessions,
                    {
                        sessionId: payload.sessionId,
                        templateId: payload.templateId,
                        assignedAt: payload.assignedAt,
                    },
                ];
                updates.sessionCount = participant.sessionCount + 1;
                break;
            }
            case 'ParticipantDeactivated': {
                updates.isActive = false;
                break;
            }
        }
        return updates;
    }
    /**
     * Search participants by name or email
     */
    async searchParticipants(organizationId, searchTerm, limit = 20) {
        const searchRegex = new RegExp(searchTerm, 'i');
        const docs = await this.collection
            .find({
            organizationId,
            $or: [
                { email: searchRegex },
                { firstName: searchRegex },
                { lastName: searchRegex },
            ],
        })
            .limit(limit)
            .toArray();
        return docs.map(({ _id, ...projection }) => projection);
    }
}
exports.ParticipantProjectionStore = ParticipantProjectionStore;
//# sourceMappingURL=ParticipantProjectionStore.js.map