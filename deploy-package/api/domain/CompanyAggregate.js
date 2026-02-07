"use strict";
/**
 * Company Aggregate - Manages client companies (multi-tenant)
 * Implements Event Sourcing pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyAggregate = void 0;
const uuid_1 = require("uuid");
class CompanyAggregate {
    state;
    uncommittedEvents = [];
    constructor() {
        this.state = {
            companyId: '',
            companyName: '',
            contactEmail: '',
            brandingConfig: {},
            users: [],
            isActive: true,
            createdAt: new Date(),
            version: 0,
        };
    }
    /**
     * Create a new company
     */
    createCompany(command) {
        if (this.state.companyId) {
            throw new Error('Company already exists');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
            eventType: 'CompanyCreated',
            aggregateId: command.companyId,
            aggregateType: 'Company',
            organizationId: command.companyId, // Company is its own organization
            timestamp: new Date(),
            version: 1,
            payload: {
                companyName: command.companyName,
                contactEmail: command.contactEmail,
                representativeEmail: command.representativeEmail,
                representativeName: command.representativeName,
            },
            metadata: {},
        };
        this.apply(event);
        this.uncommittedEvents.push(event);
    }
    /**
     * Add a user to the company
     */
    addUser(command) {
        if (!this.state.companyId) {
            throw new Error('Company does not exist');
        }
        // Check if user already exists
        if (this.state.users.some(u => u.email === command.email)) {
            throw new Error('User with this email already exists');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
            eventType: 'UserAdded',
            aggregateId: this.state.companyId,
            aggregateType: 'Company',
            organizationId: this.state.companyId,
            timestamp: new Date(),
            version: this.state.version + 1,
            payload: {
                userId: command.userId,
                email: command.email,
                fullName: command.fullName,
                role: command.role,
            },
            metadata: {},
        };
        this.apply(event);
        this.uncommittedEvents.push(event);
    }
    /**
     * Update user role
     */
    updateUserRole(userId, newRole) {
        if (!this.state.companyId) {
            throw new Error('Company does not exist');
        }
        const user = this.state.users.find(u => u.userId === userId);
        if (!user) {
            throw new Error('User not found');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
            eventType: 'UserRoleUpdated',
            aggregateId: this.state.companyId,
            aggregateType: 'Company',
            organizationId: this.state.companyId,
            timestamp: new Date(),
            version: this.state.version + 1,
            payload: {
                userId,
                oldRole: user.role,
                newRole,
            },
            metadata: {},
        };
        this.apply(event);
        this.uncommittedEvents.push(event);
    }
    /**
     * Update branding configuration
     */
    updateBranding(config) {
        if (!this.state.companyId) {
            throw new Error('Company does not exist');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
            eventType: 'BrandingUpdated',
            aggregateId: this.state.companyId,
            aggregateType: 'Company',
            organizationId: this.state.companyId,
            timestamp: new Date(),
            version: this.state.version + 1,
            payload: {
                previousConfig: { ...this.state.brandingConfig },
                newConfig: config,
            },
            metadata: {},
        };
        this.apply(event);
        this.uncommittedEvents.push(event);
    }
    /**
     * Deactivate company
     */
    deactivateCompany(reason) {
        if (!this.state.companyId) {
            throw new Error('Company does not exist');
        }
        if (!this.state.isActive) {
            throw new Error('Company is already deactivated');
        }
        const event = {
            eventId: (0, uuid_1.v4)(),
            eventType: 'CompanyDeactivated',
            aggregateId: this.state.companyId,
            aggregateType: 'Company',
            organizationId: this.state.companyId,
            timestamp: new Date(),
            version: this.state.version + 1,
            payload: {
                reason,
            },
            metadata: {},
        };
        this.apply(event);
        this.uncommittedEvents.push(event);
    }
    /**
     * Apply an event to update state
     */
    apply(event) {
        switch (event.eventType) {
            case 'CompanyCreated': {
                const payload = event.payload;
                this.state.companyId = event.aggregateId;
                this.state.companyName = payload.companyName;
                this.state.contactEmail = payload.contactEmail;
                this.state.users = [
                    {
                        userId: (0, uuid_1.v4)(),
                        email: payload.representativeEmail,
                        fullName: payload.representativeName,
                        role: 'representative',
                        addedAt: event.timestamp,
                    },
                ];
                this.state.isActive = true;
                this.state.createdAt = event.timestamp;
                this.state.version = event.version;
                break;
            }
            case 'UserAdded': {
                const payload = event.payload;
                this.state.users.push({
                    userId: payload.userId,
                    email: payload.email,
                    fullName: payload.fullName,
                    role: payload.role,
                    addedAt: event.timestamp,
                });
                this.state.version = event.version;
                break;
            }
            case 'UserRoleUpdated': {
                const payload = event.payload;
                const user = this.state.users.find(u => u.userId === payload.userId);
                if (user) {
                    user.role = payload.newRole;
                }
                this.state.version = event.version;
                break;
            }
            case 'BrandingUpdated': {
                const payload = event.payload;
                this.state.brandingConfig = { ...payload.newConfig };
                this.state.version = event.version;
                break;
            }
            case 'CompanyDeactivated': {
                this.state.isActive = false;
                this.state.version = event.version;
                break;
            }
            default:
                throw new Error(`Unknown event type: ${event.eventType}`);
        }
    }
    /**
     * Rebuild state from event history
     */
    loadFromHistory(events) {
        events.forEach((event) => this.apply(event));
    }
    /**
     * Get uncommitted events
     */
    getUncommittedEvents() {
        return [...this.uncommittedEvents];
    }
    /**
     * Clear uncommitted events
     */
    clearUncommittedEvents() {
        this.uncommittedEvents = [];
    }
    /**
     * Get current state
     */
    getState() {
        return { ...this.state, users: [...this.state.users] };
    }
}
exports.CompanyAggregate = CompanyAggregate;
//# sourceMappingURL=CompanyAggregate.js.map