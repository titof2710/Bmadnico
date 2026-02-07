"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const database_js_1 = require("../infrastructure/database.js");
const CompanyCommandHandler_js_1 = require("../domain/CompanyCommandHandler.js");
const router = (0, express_1.Router)();
/**
 * GET /api/companies
 * Get all companies (Platform Admin only)
 */
router.get('/', async (req, res) => {
    try {
        const companyStore = (0, database_js_1.getCompanyProjectionStore)();
        const { isActive } = req.query;
        const companies = await companyStore.getAllCompanies({
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        });
        res.json({
            companies,
            total: companies.length,
        });
    }
    catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ error: 'Failed to get companies' });
    }
});
/**
 * GET /api/companies/:companyId
 * Get company by ID
 */
router.get('/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const companyStore = (0, database_js_1.getCompanyProjectionStore)();
        const company = await companyStore.getCompany(companyId);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json(company);
    }
    catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({ error: 'Failed to get company' });
    }
});
/**
 * POST /api/companies
 * Create a new company (Platform Admin only)
 */
router.post('/', async (req, res) => {
    try {
        const { companyName, contactEmail, representativeEmail, representativeName } = req.body;
        if (!companyName || !contactEmail || !representativeEmail || !representativeName) {
            return res.status(400).json({
                error: 'companyName, contactEmail, representativeEmail, and representativeName are required',
            });
        }
        const companyId = `company-${(0, uuid_1.v4)()}`;
        const eventStore = (0, database_js_1.getEventStore)();
        const commandHandler = new CompanyCommandHandler_js_1.CompanyCommandHandler(eventStore);
        await commandHandler.createCompany({
            companyId,
            companyName,
            contactEmail,
            representativeEmail,
            representativeName,
        });
        // Create projection
        const events = await eventStore.getEvents(companyId, companyId);
        const companyStore = (0, database_js_1.getCompanyProjectionStore)();
        await companyStore.createProjection(companyId, events[0]);
        res.status(201).json({
            companyId,
            message: 'Company created successfully',
        });
    }
    catch (error) {
        console.error('Create company error:', error);
        res.status(500).json({ error: 'Failed to create company' });
    }
});
/**
 * POST /api/companies/:companyId/users
 * Add a user to a company
 */
router.post('/:companyId/users', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { email, fullName, role } = req.body;
        if (!email || !fullName || !role) {
            return res.status(400).json({ error: 'email, fullName, and role are required' });
        }
        if (role !== 'representative' && role !== 'consultant') {
            return res.status(400).json({ error: 'role must be representative or consultant' });
        }
        const userId = (0, uuid_1.v4)();
        const eventStore = (0, database_js_1.getEventStore)();
        const commandHandler = new CompanyCommandHandler_js_1.CompanyCommandHandler(eventStore);
        await commandHandler.addUser({
            companyId,
            userId,
            email,
            fullName,
            role,
        });
        // Update projection
        const events = await eventStore.getEvents(companyId, companyId);
        const lastEvent = events[events.length - 1];
        const companyStore = (0, database_js_1.getCompanyProjectionStore)();
        await companyStore.applyEvent(lastEvent);
        res.status(201).json({
            userId,
            message: 'User added successfully',
        });
    }
    catch (error) {
        console.error('Add user error:', error);
        if (error.message === 'User with this email already exists') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to add user' });
    }
});
/**
 * PUT /api/companies/:companyId/users/:userId/role
 * Update user role
 */
router.put('/:companyId/users/:userId/role', async (req, res) => {
    try {
        const { companyId, userId } = req.params;
        const { role } = req.body;
        if (!role || (role !== 'representative' && role !== 'consultant')) {
            return res.status(400).json({ error: 'Valid role is required (representative or consultant)' });
        }
        const eventStore = (0, database_js_1.getEventStore)();
        const commandHandler = new CompanyCommandHandler_js_1.CompanyCommandHandler(eventStore);
        await commandHandler.updateUserRole({
            companyId,
            userId,
            newRole: role,
        });
        // Update projection
        const events = await eventStore.getEvents(companyId, companyId);
        const lastEvent = events[events.length - 1];
        const companyStore = (0, database_js_1.getCompanyProjectionStore)();
        await companyStore.applyEvent(lastEvent);
        res.json({
            message: 'User role updated successfully',
        });
    }
    catch (error) {
        console.error('Update user role error:', error);
        if (error.message === 'User not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to update user role' });
    }
});
/**
 * PUT /api/companies/:companyId/branding
 * Update company branding
 */
router.put('/:companyId/branding', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { logoUrl, primaryColor, secondaryColor } = req.body;
        const eventStore = (0, database_js_1.getEventStore)();
        const commandHandler = new CompanyCommandHandler_js_1.CompanyCommandHandler(eventStore);
        await commandHandler.updateBranding({
            companyId,
            logoUrl,
            primaryColor,
            secondaryColor,
        });
        // Update projection
        const events = await eventStore.getEvents(companyId, companyId);
        const lastEvent = events[events.length - 1];
        const companyStore = (0, database_js_1.getCompanyProjectionStore)();
        await companyStore.applyEvent(lastEvent);
        res.json({
            message: 'Branding updated successfully',
        });
    }
    catch (error) {
        console.error('Update branding error:', error);
        res.status(500).json({ error: 'Failed to update branding' });
    }
});
/**
 * DELETE /api/companies/:companyId
 * Deactivate a company
 */
router.delete('/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { reason } = req.body;
        const eventStore = (0, database_js_1.getEventStore)();
        const commandHandler = new CompanyCommandHandler_js_1.CompanyCommandHandler(eventStore);
        await commandHandler.deactivateCompany({
            companyId,
            reason: reason || 'Deactivated by admin',
        });
        // Update projection
        const events = await eventStore.getEvents(companyId, companyId);
        const lastEvent = events[events.length - 1];
        const companyStore = (0, database_js_1.getCompanyProjectionStore)();
        await companyStore.applyEvent(lastEvent);
        res.json({
            message: 'Company deactivated successfully',
        });
    }
    catch (error) {
        console.error('Deactivate company error:', error);
        res.status(500).json({ error: 'Failed to deactivate company' });
    }
});
exports.default = router;
//# sourceMappingURL=companyRoutes.js.map