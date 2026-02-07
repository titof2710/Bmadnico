"use strict";
/**
 * Company Command Handler
 * Handles commands and persists events to Event Store
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyCommandHandler = void 0;
const CompanyAggregate_js_1 = require("./CompanyAggregate.js");
class CompanyCommandHandler {
    eventStore;
    constructor(eventStore) {
        this.eventStore = eventStore;
    }
    /**
     * Load aggregate from event history
     */
    async loadAggregate(companyId) {
        const events = await this.eventStore.getEvents(companyId, companyId);
        const aggregate = new CompanyAggregate_js_1.CompanyAggregate();
        if (events.length > 0) {
            aggregate.loadFromHistory(events);
        }
        return aggregate;
    }
    /**
     * Persist uncommitted events
     */
    async persistEvents(aggregate) {
        const events = aggregate.getUncommittedEvents();
        for (const event of events) {
            await this.eventStore.append(event);
        }
        aggregate.clearUncommittedEvents();
    }
    /**
     * Create a new company
     */
    async createCompany(command) {
        const aggregate = new CompanyAggregate_js_1.CompanyAggregate();
        aggregate.createCompany(command);
        await this.persistEvents(aggregate);
    }
    /**
     * Add user to company
     */
    async addUser(command) {
        const aggregate = await this.loadAggregate(command.companyId);
        aggregate.addUser({
            userId: command.userId,
            email: command.email,
            fullName: command.fullName,
            role: command.role,
        });
        await this.persistEvents(aggregate);
    }
    /**
     * Update user role
     */
    async updateUserRole(command) {
        const aggregate = await this.loadAggregate(command.companyId);
        aggregate.updateUserRole(command.userId, command.newRole);
        await this.persistEvents(aggregate);
    }
    /**
     * Update branding
     */
    async updateBranding(command) {
        const aggregate = await this.loadAggregate(command.companyId);
        aggregate.updateBranding({
            logoUrl: command.logoUrl,
            primaryColor: command.primaryColor,
            secondaryColor: command.secondaryColor,
        });
        await this.persistEvents(aggregate);
    }
    /**
     * Deactivate company
     */
    async deactivateCompany(command) {
        const aggregate = await this.loadAggregate(command.companyId);
        aggregate.deactivateCompany(command.reason);
        await this.persistEvents(aggregate);
    }
}
exports.CompanyCommandHandler = CompanyCommandHandler;
//# sourceMappingURL=CompanyCommandHandler.js.map