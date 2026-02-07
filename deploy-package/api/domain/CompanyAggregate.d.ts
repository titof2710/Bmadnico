/**
 * Company Aggregate - Manages client companies (multi-tenant)
 * Implements Event Sourcing pattern
 */
import { DomainEvent } from '../shared/types.js';
interface CompanyUser {
    userId: string;
    email: string;
    fullName: string;
    role: 'representative' | 'consultant';
    addedAt: Date;
}
interface CompanyState {
    companyId: string;
    companyName: string;
    contactEmail: string;
    brandingConfig: {
        logoUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
    };
    users: CompanyUser[];
    isActive: boolean;
    createdAt: Date;
    version: number;
}
export declare class CompanyAggregate {
    private state;
    private uncommittedEvents;
    constructor();
    /**
     * Create a new company
     */
    createCompany(command: {
        companyId: string;
        companyName: string;
        contactEmail: string;
        representativeEmail: string;
        representativeName: string;
    }): void;
    /**
     * Add a user to the company
     */
    addUser(command: {
        userId: string;
        email: string;
        fullName: string;
        role: 'representative' | 'consultant';
    }): void;
    /**
     * Update user role
     */
    updateUserRole(userId: string, newRole: 'representative' | 'consultant'): void;
    /**
     * Update branding configuration
     */
    updateBranding(config: {
        logoUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
    }): void;
    /**
     * Deactivate company
     */
    deactivateCompany(reason: string): void;
    /**
     * Apply an event to update state
     */
    private apply;
    /**
     * Rebuild state from event history
     */
    loadFromHistory(events: DomainEvent[]): void;
    /**
     * Get uncommitted events
     */
    getUncommittedEvents(): DomainEvent[];
    /**
     * Clear uncommitted events
     */
    clearUncommittedEvents(): void;
    /**
     * Get current state
     */
    getState(): CompanyState;
}
export {};
//# sourceMappingURL=CompanyAggregate.d.ts.map