/**
 * Company Command Handler
 * Handles commands and persists events to Event Store
 */
import { EventStore } from '../infrastructure/EventStore.js';
export declare class CompanyCommandHandler {
    private eventStore;
    constructor(eventStore: EventStore);
    /**
     * Load aggregate from event history
     */
    private loadAggregate;
    /**
     * Persist uncommitted events
     */
    private persistEvents;
    /**
     * Create a new company
     */
    createCompany(command: {
        companyId: string;
        companyName: string;
        contactEmail: string;
        representativeEmail: string;
        representativeName: string;
    }): Promise<void>;
    /**
     * Add user to company
     */
    addUser(command: {
        companyId: string;
        userId: string;
        email: string;
        fullName: string;
        role: 'representative' | 'consultant';
    }): Promise<void>;
    /**
     * Update user role
     */
    updateUserRole(command: {
        companyId: string;
        userId: string;
        newRole: 'representative' | 'consultant';
    }): Promise<void>;
    /**
     * Update branding
     */
    updateBranding(command: {
        companyId: string;
        logoUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
    }): Promise<void>;
    /**
     * Deactivate company
     */
    deactivateCompany(command: {
        companyId: string;
        reason: string;
    }): Promise<void>;
}
//# sourceMappingURL=CompanyCommandHandler.d.ts.map