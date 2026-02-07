"use strict";
/**
 * Participant API Routes
 * Manages participant profiles and history
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const ParticipantAggregate_js_1 = require("../domain/ParticipantAggregate.js");
const database_js_1 = require("../infrastructure/database.js");
const router = (0, express_1.Router)();
/**
 * GET /api/participants
 * Get all participants
 */
router.get('/', async (req, res) => {
    try {
        const organizationId = req.organizationId || 'demo-org-1';
        const { companyId, isActive, limit, offset, search } = req.query;
        const participantStore = (0, database_js_1.getParticipantProjectionStore)();
        let participants;
        if (search) {
            participants = await participantStore.searchParticipants(organizationId, search, limit ? parseInt(limit) : 20);
        }
        else {
            participants = await participantStore.getParticipants(organizationId, {
                companyId: companyId,
                isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined,
            });
        }
        const total = await participantStore.countParticipants(organizationId, {
            companyId: companyId,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        });
        res.json({
            participants,
            total,
        });
    }
    catch (error) {
        console.error('Get participants error:', error);
        res.status(500).json({ error: 'Failed to get participants' });
    }
});
/**
 * GET /api/participants/:participantId
 * Get a specific participant
 */
router.get('/:participantId', async (req, res) => {
    try {
        const { participantId } = req.params;
        const organizationId = req.organizationId || 'demo-org-1';
        const participantStore = (0, database_js_1.getParticipantProjectionStore)();
        const participant = await participantStore.getParticipant(participantId, organizationId);
        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        res.json(participant);
    }
    catch (error) {
        console.error('Get participant error:', error);
        res.status(500).json({ error: 'Failed to get participant' });
    }
});
/**
 * GET /api/participants/email/:email
 * Get participant by email
 */
router.get('/email/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const organizationId = req.organizationId || 'demo-org-1';
        const participantStore = (0, database_js_1.getParticipantProjectionStore)();
        const participant = await participantStore.getParticipantByEmail(email, organizationId);
        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        res.json(participant);
    }
    catch (error) {
        console.error('Get participant by email error:', error);
        res.status(500).json({ error: 'Failed to get participant' });
    }
});
/**
 * POST /api/participants
 * Create a new participant
 */
router.post('/', async (req, res) => {
    try {
        const organizationId = req.organizationId || 'demo-org-1';
        const { email, firstName, lastName, companyId, metadata } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const participantStore = (0, database_js_1.getParticipantProjectionStore)();
        const eventStore = (0, database_js_1.getEventStore)();
        // Check if participant already exists
        const existing = await participantStore.getParticipantByEmail(email, organizationId);
        if (existing) {
            return res.status(409).json({
                error: 'Participant with this email already exists',
                participantId: existing.participantId,
            });
        }
        const participantId = (0, uuid_1.v4)();
        const aggregate = new ParticipantAggregate_js_1.ParticipantAggregate(participantId, organizationId);
        aggregate.createParticipant({
            email,
            firstName,
            lastName,
            companyId,
            metadata,
        });
        // Persist events
        const events = aggregate.getUncommittedEvents();
        for (const event of events) {
            await eventStore.append(event);
        }
        // Create projection
        await participantStore.createProjection(participantId, events[0]);
        aggregate.markEventsAsCommitted();
        res.status(201).json({
            participantId,
            message: 'Participant created successfully',
        });
    }
    catch (error) {
        console.error('Create participant error:', error);
        res.status(500).json({ error: error.message || 'Failed to create participant' });
    }
});
/**
 * PUT /api/participants/:participantId
 * Update participant profile
 */
router.put('/:participantId', async (req, res) => {
    try {
        const { participantId } = req.params;
        const organizationId = req.organizationId || 'demo-org-1';
        const { firstName, lastName, phone, metadata } = req.body;
        const eventStore = (0, database_js_1.getEventStore)();
        const participantStore = (0, database_js_1.getParticipantProjectionStore)();
        // Check if participant exists
        const existing = await participantStore.getParticipant(participantId, organizationId);
        if (!existing) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        // Load aggregate from events
        const events = await eventStore.getEvents(participantId, organizationId);
        const aggregate = new ParticipantAggregate_js_1.ParticipantAggregate(participantId, organizationId);
        aggregate.loadFromHistory(events);
        // Update profile
        aggregate.updateProfile({
            firstName,
            lastName,
            phone,
            metadata,
        });
        // Persist events
        const newEvents = aggregate.getUncommittedEvents();
        for (const event of newEvents) {
            await eventStore.append(event);
            await participantStore.applyEvent(event);
        }
        aggregate.markEventsAsCommitted();
        res.json({
            message: 'Participant updated successfully',
        });
    }
    catch (error) {
        console.error('Update participant error:', error);
        res.status(500).json({ error: error.message || 'Failed to update participant' });
    }
});
/**
 * POST /api/participants/:participantId/assign-session
 * Assign a session to participant
 */
router.post('/:participantId/assign-session', async (req, res) => {
    try {
        const { participantId } = req.params;
        const organizationId = req.organizationId || 'demo-org-1';
        const { sessionId, templateId } = req.body;
        if (!sessionId || !templateId) {
            return res.status(400).json({ error: 'sessionId and templateId are required' });
        }
        const eventStore = (0, database_js_1.getEventStore)();
        const participantStore = (0, database_js_1.getParticipantProjectionStore)();
        // Load aggregate
        const events = await eventStore.getEvents(participantId, organizationId);
        const aggregate = new ParticipantAggregate_js_1.ParticipantAggregate(participantId, organizationId);
        aggregate.loadFromHistory(events);
        // Assign session
        aggregate.assignSession({
            sessionId,
            templateId,
        });
        // Persist events
        const newEvents = aggregate.getUncommittedEvents();
        for (const event of newEvents) {
            await eventStore.append(event);
            await participantStore.applyEvent(event);
        }
        aggregate.markEventsAsCommitted();
        res.json({
            message: 'Session assigned successfully',
        });
    }
    catch (error) {
        console.error('Assign session error:', error);
        res.status(500).json({ error: error.message || 'Failed to assign session' });
    }
});
/**
 * DELETE /api/participants/:participantId
 * Deactivate a participant
 */
router.delete('/:participantId', async (req, res) => {
    try {
        const { participantId } = req.params;
        const organizationId = req.organizationId || 'demo-org-1';
        const { reason } = req.body;
        const eventStore = (0, database_js_1.getEventStore)();
        const participantStore = (0, database_js_1.getParticipantProjectionStore)();
        // Load aggregate
        const events = await eventStore.getEvents(participantId, organizationId);
        const aggregate = new ParticipantAggregate_js_1.ParticipantAggregate(participantId, organizationId);
        aggregate.loadFromHistory(events);
        // Deactivate
        aggregate.deactivate(reason);
        // Persist events
        const newEvents = aggregate.getUncommittedEvents();
        for (const event of newEvents) {
            await eventStore.append(event);
            await participantStore.applyEvent(event);
        }
        aggregate.markEventsAsCommitted();
        res.json({
            message: 'Participant deactivated successfully',
        });
    }
    catch (error) {
        console.error('Deactivate participant error:', error);
        res.status(500).json({ error: error.message || 'Failed to deactivate participant' });
    }
});
/**
 * GET /api/participants/:participantId/sessions
 * Get all sessions for a participant
 */
router.get('/:participantId/sessions', async (req, res) => {
    try {
        const { participantId } = req.params;
        const organizationId = req.organizationId || 'demo-org-1';
        const participantStore = (0, database_js_1.getParticipantProjectionStore)();
        const participant = await participantStore.getParticipant(participantId, organizationId);
        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        res.json({
            sessions: participant.sessions,
            count: participant.sessionCount,
        });
    }
    catch (error) {
        console.error('Get participant sessions error:', error);
        res.status(500).json({ error: 'Failed to get sessions' });
    }
});
exports.default = router;
//# sourceMappingURL=participantRoutes.js.map