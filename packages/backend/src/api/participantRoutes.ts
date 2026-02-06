/**
 * Participant API Routes
 * Manages participant profiles and history
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ParticipantAggregate } from '../domain/ParticipantAggregate.js';
import { getParticipantProjectionStore, getEventStore } from '../infrastructure/database.js';

const router = Router();

/**
 * GET /api/participants
 * Get all participants
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const { companyId, isActive, limit, offset, search } = req.query;

    const participantStore = getParticipantProjectionStore();

    let participants;

    if (search) {
      participants = await participantStore.searchParticipants(
        organizationId,
        search as string,
        limit ? parseInt(limit as string) : 20
      );
    } else {
      participants = await participantStore.getParticipants(organizationId, {
        companyId: companyId as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
    }

    const total = await participantStore.countParticipants(organizationId, {
      companyId: companyId as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });

    res.json({
      participants,
      total,
    });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ error: 'Failed to get participants' });
  }
});

/**
 * GET /api/participants/:participantId
 * Get a specific participant
 */
router.get('/:participantId', async (req: Request, res: Response) => {
  try {
    const { participantId } = req.params;
    const organizationId = (req as any).organizationId || 'demo-org-1';

    const participantStore = getParticipantProjectionStore();
    const participant = await participantStore.getParticipant(participantId, organizationId);

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    res.json(participant);
  } catch (error) {
    console.error('Get participant error:', error);
    res.status(500).json({ error: 'Failed to get participant' });
  }
});

/**
 * GET /api/participants/email/:email
 * Get participant by email
 */
router.get('/email/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const organizationId = (req as any).organizationId || 'demo-org-1';

    const participantStore = getParticipantProjectionStore();
    const participant = await participantStore.getParticipantByEmail(email, organizationId);

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    res.json(participant);
  } catch (error) {
    console.error('Get participant by email error:', error);
    res.status(500).json({ error: 'Failed to get participant' });
  }
});

/**
 * POST /api/participants
 * Create a new participant
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const { email, firstName, lastName, companyId, metadata } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const participantStore = getParticipantProjectionStore();
    const eventStore = getEventStore();

    // Check if participant already exists
    const existing = await participantStore.getParticipantByEmail(email, organizationId);
    if (existing) {
      return res.status(409).json({
        error: 'Participant with this email already exists',
        participantId: existing.participantId,
      });
    }

    const participantId = uuidv4();
    const aggregate = new ParticipantAggregate(participantId, organizationId);

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
  } catch (error: any) {
    console.error('Create participant error:', error);
    res.status(500).json({ error: error.message || 'Failed to create participant' });
  }
});

/**
 * PUT /api/participants/:participantId
 * Update participant profile
 */
router.put('/:participantId', async (req: Request, res: Response) => {
  try {
    const { participantId } = req.params;
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const { firstName, lastName, phone, metadata } = req.body;

    const eventStore = getEventStore();
    const participantStore = getParticipantProjectionStore();

    // Check if participant exists
    const existing = await participantStore.getParticipant(participantId, organizationId);
    if (!existing) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Load aggregate from events
    const events = await eventStore.getEvents(participantId, organizationId);
    const aggregate = new ParticipantAggregate(participantId, organizationId);
    aggregate.loadFromHistory(events as any);

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
  } catch (error: any) {
    console.error('Update participant error:', error);
    res.status(500).json({ error: error.message || 'Failed to update participant' });
  }
});

/**
 * POST /api/participants/:participantId/assign-session
 * Assign a session to participant
 */
router.post('/:participantId/assign-session', async (req: Request, res: Response) => {
  try {
    const { participantId } = req.params;
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const { sessionId, templateId } = req.body;

    if (!sessionId || !templateId) {
      return res.status(400).json({ error: 'sessionId and templateId are required' });
    }

    const eventStore = getEventStore();
    const participantStore = getParticipantProjectionStore();

    // Load aggregate
    const events = await eventStore.getEvents(participantId, organizationId);
    const aggregate = new ParticipantAggregate(participantId, organizationId);
    aggregate.loadFromHistory(events as any);

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
  } catch (error: any) {
    console.error('Assign session error:', error);
    res.status(500).json({ error: error.message || 'Failed to assign session' });
  }
});

/**
 * DELETE /api/participants/:participantId
 * Deactivate a participant
 */
router.delete('/:participantId', async (req: Request, res: Response) => {
  try {
    const { participantId } = req.params;
    const organizationId = (req as any).organizationId || 'demo-org-1';
    const { reason } = req.body;

    const eventStore = getEventStore();
    const participantStore = getParticipantProjectionStore();

    // Load aggregate
    const events = await eventStore.getEvents(participantId, organizationId);
    const aggregate = new ParticipantAggregate(participantId, organizationId);
    aggregate.loadFromHistory(events as any);

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
  } catch (error: any) {
    console.error('Deactivate participant error:', error);
    res.status(500).json({ error: error.message || 'Failed to deactivate participant' });
  }
});

/**
 * GET /api/participants/:participantId/sessions
 * Get all sessions for a participant
 */
router.get('/:participantId/sessions', async (req: Request, res: Response) => {
  try {
    const { participantId } = req.params;
    const organizationId = (req as any).organizationId || 'demo-org-1';

    const participantStore = getParticipantProjectionStore();
    const participant = await participantStore.getParticipant(participantId, organizationId);

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    res.json({
      sessions: participant.sessions,
      count: participant.sessionCount,
    });
  } catch (error) {
    console.error('Get participant sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

export default router;
