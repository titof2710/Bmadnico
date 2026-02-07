"use strict";
/**
 * License Pool Command Handler
 * Handles commands and persists events to Event Store
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicensePoolCommandHandler = void 0;
const LicensePoolAggregate_js_1 = require("./LicensePoolAggregate.js");
class LicensePoolCommandHandler {
    eventStore;
    constructor(eventStore) {
        this.eventStore = eventStore;
    }
    /**
     * Load aggregate from event history
     */
    async loadAggregate(poolId, organizationId) {
        const events = await this.eventStore.getEvents(poolId, organizationId);
        const aggregate = new LicensePoolAggregate_js_1.LicensePoolAggregate();
        if (events.length > 0) {
            aggregate.loadFromHistory(events);
        }
        return aggregate;
    }
    /**
     * Persist uncommitted events to event store
     */
    async persistEvents(aggregate) {
        const events = aggregate.getUncommittedEvents();
        for (const event of events) {
            await this.eventStore.append(event);
        }
        aggregate.clearUncommittedEvents();
    }
    /**
     * Create a new license pool
     */
    async createPool(command) {
        const aggregate = new LicensePoolAggregate_js_1.LicensePoolAggregate();
        aggregate.createPool(command);
        await this.persistEvents(aggregate);
    }
    /**
     * Add licenses to pool
     */
    async addLicenses(command) {
        const aggregate = await this.loadAggregate(command.poolId, command.organizationId);
        aggregate.addLicenses(command.quantity, command.orderId);
        await this.persistEvents(aggregate);
    }
    /**
     * Consume a license
     */
    async consumeLicense(command) {
        const aggregate = await this.loadAggregate(command.poolId, command.organizationId);
        aggregate.consumeLicense(command.sessionId);
        await this.persistEvents(aggregate);
    }
    /**
     * Release a license
     */
    async releaseLicense(command) {
        const aggregate = await this.loadAggregate(command.poolId, command.organizationId);
        aggregate.releaseLicense(command.sessionId, command.reason);
        await this.persistEvents(aggregate);
    }
    /**
     * Update warning threshold
     */
    async updateWarningThreshold(command) {
        const aggregate = await this.loadAggregate(command.poolId, command.organizationId);
        aggregate.updateWarningThreshold(command.threshold);
        await this.persistEvents(aggregate);
    }
}
exports.LicensePoolCommandHandler = LicensePoolCommandHandler;
//# sourceMappingURL=LicensePoolCommandHandler.js.map