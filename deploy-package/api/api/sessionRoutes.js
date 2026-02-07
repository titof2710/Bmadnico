"use strict";
/**
 * Session API Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSessionRoutes = createSessionRoutes;
const express_1 = require("express");
const SessionCommandHandler_js_1 = require("../domain/SessionCommandHandler.js");
const database_js_1 = require("../infrastructure/database.js");
const LicensePoolCommandHandler_js_1 = require("../domain/LicensePoolCommandHandler.js");
const mockTemplateService_js_1 = require("./mockTemplateService.js");
const EmailService_js_1 = require("../services/EmailService.js");
function createSessionRoutes() {
    const router = (0, express_1.Router)();
    const emailService = new EmailService_js_1.EmailService();
    /**
     * POST /api/sessions
     * Create a new assessment session (Manager)
     */
    router.post('/', async (req, res) => {
        try {
            const body = req.body;
            const organizationId = req.organizationId || 'demo-org-1';
            const userId = req.userId || 'demo-user-1';
            // Check license availability
            const licensePoolStore = (0, database_js_1.getLicensePoolProjectionStore)();
            const eventStore = (0, database_js_1.getEventStore)();
            // Try to find a license pool for this template/product
            // For now, we'll use a default pool or the first available pool
            const pools = await licensePoolStore.getPools(organizationId);
            const availablePool = pools.find(p => p.availableLicenses > 0);
            if (!availablePool) {
                return res.status(400).json({
                    error: 'No licenses available. Please purchase more licenses.',
                    code: 'NO_LICENSES_AVAILABLE',
                });
            }
            // Create session
            const handler = new SessionCommandHandler_js_1.SessionCommandHandler((0, database_js_1.getEventStore)(), (0, database_js_1.getProjectionStore)());
            const { sessionId, sessionToken } = await handler.createSession({
                organizationId,
                participantEmail: body.participantEmail,
                templateId: body.templateId,
                expiresInHours: body.expiresInHours || 72,
                createdBy: userId,
            });
            // Consume a license from the pool
            const licenseHandler = new LicensePoolCommandHandler_js_1.LicensePoolCommandHandler(eventStore);
            try {
                await licenseHandler.consumeLicense({
                    poolId: availablePool.poolId,
                    organizationId,
                    sessionId,
                });
                // Update projection
                const events = await eventStore.getEvents(availablePool.poolId, organizationId);
                const lastEvent = events[events.length - 1];
                await licensePoolStore.applyEvent(lastEvent);
            }
            catch (licenseError) {
                console.error('Failed to consume license:', licenseError);
                // Session created but license not consumed - handle this edge case
                // For now, we'll continue but log the error
            }
            const expiresAtDate = new Date(Date.now() + (body.expiresInHours || 72) * 60 * 60 * 1000);
            const accessUrl = `http://localhost:5173/session/${sessionToken}`;
            const response = {
                sessionId,
                sessionToken,
                expiresAt: expiresAtDate.toISOString(),
                accessUrl,
            };
            // Send invitation email
            const template = await mockTemplateService_js_1.mockTemplateService.getTemplate(body.templateId, organizationId);
            if (template) {
                await emailService.sendSessionInvitation({
                    participantEmail: body.participantEmail,
                    templateName: template.name,
                    accessUrl,
                    expiresAt: expiresAtDate.toISOString(),
                });
            }
            res.status(201).json(response);
        }
        catch (error) {
            console.error('Create session error:', error);
            res.status(500).json({ error: 'Failed to create session' });
        }
    });
    /**
     * GET /api/sessions/:token
     * Get session details and current page (Participant)
     */
    router.get('/:token', async (req, res) => {
        try {
            const { token } = req.params;
            const organizationId = req.organizationId || 'demo-org-1';
            // Handle demo session - create a persistent demo session
            if (token === 'demo') {
                const template = await mockTemplateService_js_1.mockTemplateService.getTemplate('template-001', organizationId);
                if (!template) {
                    return res.status(404).json({ error: 'Demo template not found' });
                }
                const response = {
                    session: {
                        sessionId: 'demo-session-' + Date.now(),
                        status: 'pending',
                        currentPage: 0,
                        totalPages: template.pages.length,
                        startedAt: undefined,
                        completedAt: undefined,
                        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
                        progress: 0,
                    },
                    template: {
                        id: template.id,
                        name: template.name,
                        description: template.description,
                    },
                    currentPageData: undefined,
                };
                return res.json(response);
            }
            const projectionStore = (0, database_js_1.getProjectionStore)();
            const session = await projectionStore.getSessionByToken(token, organizationId);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            // Get template data
            const template = await mockTemplateService_js_1.mockTemplateService.getTemplate(session.templateId, organizationId);
            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }
            // Get current page data
            const currentPageData = session.status === 'active' && session.currentPage > 0
                ? template.pages[session.currentPage - 1]
                : undefined;
            const response = {
                session: {
                    sessionId: session.sessionId,
                    status: session.status,
                    currentPage: session.currentPage,
                    totalPages: template.pages.length,
                    startedAt: session.startedAt?.toISOString(),
                    completedAt: session.completedAt?.toISOString(),
                    expiresAt: session.expiresAt.toISOString(),
                    progress: template.pages.length > 0
                        ? (session.currentPage / template.pages.length) * 100
                        : 0,
                },
                template: {
                    id: template.id,
                    name: template.name,
                    description: template.description,
                },
                currentPageData,
            };
            res.json(response);
        }
        catch (error) {
            console.error('Get session error:', error);
            res.status(500).json({ error: 'Failed to get session' });
        }
    });
    /**
     * POST /api/sessions/:token/start
     * Start an assessment session
     */
    router.post('/:token/start', async (req, res) => {
        try {
            const { token } = req.params;
            const organizationId = req.organizationId || 'demo-org-1';
            const { device, userAgent } = req.body;
            // Handle demo session - just return success
            if (token === 'demo') {
                return res.json({ success: true });
            }
            const handler = new SessionCommandHandler_js_1.SessionCommandHandler((0, database_js_1.getEventStore)(), (0, database_js_1.getProjectionStore)());
            await handler.startSession({
                sessionToken: token,
                organizationId,
                participantInfo: { device, userAgent },
            });
            res.json({ success: true });
        }
        catch (error) {
            console.error('Start session error:', error);
            res.status(400).json({ error: error.message });
        }
    });
    /**
     * POST /api/sessions/:token/responses
     * Submit a response (auto-save)
     */
    router.post('/:token/responses', async (req, res) => {
        try {
            const { token } = req.params;
            const organizationId = req.organizationId || 'demo-org-1';
            const body = req.body;
            const handler = new SessionCommandHandler_js_1.SessionCommandHandler((0, database_js_1.getEventStore)(), (0, database_js_1.getProjectionStore)());
            const eventId = await handler.recordResponse({
                sessionToken: token,
                organizationId,
                questionId: body.questionId,
                pageId: body.pageId,
                responseValue: body.responseValue,
            });
            const response = {
                success: true,
                eventId,
                timestamp: new Date().toISOString(),
            };
            res.json(response);
        }
        catch (error) {
            console.error('Submit response error:', error);
            res.status(400).json({ error: error.message });
        }
    });
    /**
     * POST /api/sessions/:token/pages/:pageId/complete
     * Mark a page as completed
     */
    router.post('/:token/pages/:pageId/complete', async (req, res) => {
        try {
            const { token, pageId } = req.params;
            const organizationId = req.organizationId || 'demo-org-1';
            const projectionStore = (0, database_js_1.getProjectionStore)();
            const session = await projectionStore.getSessionByToken(token, organizationId);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            const handler = new SessionCommandHandler_js_1.SessionCommandHandler((0, database_js_1.getEventStore)(), projectionStore);
            await handler.completePage({
                sessionToken: token,
                organizationId,
                pageId,
            });
            // Check if session was just completed (refresh projection)
            const updatedSession = await projectionStore.getSessionByToken(token, organizationId);
            if (updatedSession && updatedSession.status === 'completed' && session.status !== 'completed') {
                // Session just completed - send notification email
                const template = await mockTemplateService_js_1.mockTemplateService.getTemplate(updatedSession.templateId, organizationId);
                if (template) {
                    await emailService.sendCompletionNotification({
                        managerEmail: 'demo-manager@example.com', // TODO: Get from organization/company
                        participantEmail: updatedSession.participantEmail,
                        templateName: template.name,
                        resultsUrl: `http://localhost:5173/results/${updatedSession.sessionId}`,
                        completedAt: updatedSession.completedAt?.toISOString() || new Date().toISOString(),
                    });
                }
            }
            res.json({ success: true });
        }
        catch (error) {
            console.error('Complete page error:', error);
            res.status(400).json({ error: error.message });
        }
    });
    /**
     * GET /api/sessions/:sessionId/results
     * Get session results with scores by category
     */
    router.get('/:sessionId/results', async (req, res) => {
        try {
            const { sessionId } = req.params;
            const organizationId = req.organizationId || 'demo-org-1';
            const eventStore = (0, database_js_1.getEventStore)();
            const projectionStore = (0, database_js_1.getProjectionStore)();
            // Get session projection
            const session = await projectionStore.getSession(sessionId, organizationId);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            if (session.status !== 'completed') {
                return res.status(400).json({ error: 'Session not completed yet' });
            }
            // Get responses from session projection
            // This works for both event-sourced sessions and seeded demo data
            const responses = session.responses || {};
            // Get template to categorize questions
            const { mockTemplateService } = await import('./mockTemplateService.js');
            const template = await mockTemplateService.getTemplate(session.templateId, organizationId);
            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }
            // Calculate scores by page (category)
            const categories = template.pages.map(page => {
                const categoryQuestions = page.questions;
                let totalScore = 0;
                let maxScore = 0;
                let answeredCount = 0;
                categoryQuestions.forEach(q => {
                    const response = responses[q.id];
                    if (response !== undefined) {
                        answeredCount++;
                        if (q.type === 'scale') {
                            totalScore += Number(response);
                            maxScore += q.scaleMax || 10;
                        }
                        else if (q.type === 'single_choice' && q.options) {
                            const selectedOption = q.options.find(opt => opt.value === response);
                            if (selectedOption && selectedOption.value) {
                                totalScore += Number(selectedOption.value);
                                maxScore += Math.max(...q.options.map(opt => Number(opt.value) || 0));
                            }
                        }
                        else if (q.type === 'multiple_choice' && Array.isArray(response)) {
                            // Count selected options
                            totalScore += response.length;
                            maxScore += (q.options?.length || 0);
                        }
                    }
                });
                const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
                return {
                    categoryId: page.id,
                    categoryName: page.title,
                    score: totalScore,
                    maxScore,
                    percentage,
                    questionsAnswered: answeredCount,
                    totalQuestions: categoryQuestions.length
                };
            });
            // Calculate overall score
            const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);
            const totalMaxScore = categories.reduce((sum, cat) => sum + cat.maxScore, 0);
            const overallPercentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
            res.json({
                sessionId: session.sessionId,
                participantEmail: session.participantEmail,
                templateName: template.name,
                completedAt: session.completedAt,
                overall: {
                    score: totalScore,
                    maxScore: totalMaxScore,
                    percentage: overallPercentage
                },
                categories,
                totalResponses: Object.keys(responses).length
            });
        }
        catch (error) {
            console.error('Get results error:', error);
            res.status(500).json({ error: 'Failed to get results' });
        }
    });
    /**
     * GET /api/sessions/:sessionId/pdf
     * Download PDF report
     */
    router.get('/:sessionId/pdf', async (req, res) => {
        try {
            const { sessionId } = req.params;
            const organizationId = req.organizationId || 'demo-org-1';
            const eventStore = (0, database_js_1.getEventStore)();
            const projectionStore = (0, database_js_1.getProjectionStore)();
            const session = await projectionStore.getSession(sessionId, organizationId);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            if (session.status !== 'completed') {
                return res.status(400).json({ error: 'Session not completed yet' });
            }
            // Get results data (same logic as results endpoint)
            // Use responses from session projection (works for both event-sourced and seeded data)
            const responses = session.responses || {};
            const { mockTemplateService } = await import('./mockTemplateService.js');
            const template = await mockTemplateService.getTemplate(session.templateId, organizationId);
            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }
            // Calculate categories scores
            const categories = template.pages.map(page => {
                let score = 0;
                let maxScore = 0;
                let questionsAnswered = 0;
                page.questions.forEach(question => {
                    const response = responses[question.id];
                    if (response !== undefined && response !== null) {
                        questionsAnswered++;
                    }
                    if (question.type === 'scale') {
                        maxScore += 10;
                        if (typeof response === 'number') {
                            score += response;
                        }
                        else if (typeof response === 'string') {
                            score += parseInt(response, 10) || 0;
                        }
                    }
                    else if (question.type === 'single_choice' && question.options) {
                        maxScore += question.options.length;
                        const selectedIndex = question.options.findIndex(opt => opt.value === response);
                        if (selectedIndex >= 0) {
                            score += selectedIndex + 1;
                        }
                    }
                    else if (question.type === 'multiple_choice' && question.options) {
                        maxScore += question.options.length;
                        if (Array.isArray(response)) {
                            score += response.length;
                        }
                    }
                });
                const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
                return {
                    categoryName: page.title,
                    score,
                    maxScore,
                    percentage,
                    questionsAnswered,
                };
            });
            const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);
            const totalMaxScore = categories.reduce((sum, cat) => sum + cat.maxScore, 0);
            const overallPercentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
            // Generate PDF
            const { PdfGenerationService } = await import('../services/PdfGenerationService.js');
            const pdfService = new PdfGenerationService();
            const pdfStream = await pdfService.generateReport({
                sessionId: session.sessionId,
                participantEmail: session.participantEmail,
                templateName: template.name,
                completedAt: session.completedAt ? session.completedAt.toISOString() : new Date().toISOString(),
                overallScore: totalScore,
                overallPercentage,
                categories,
                branding: {
                    companyName: 'Janus Assessment Platform',
                    primaryColor: '#6366F1',
                },
            });
            // Set headers for PDF download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="rapport-${session.participantEmail.split('@')[0]}-${sessionId.substring(0, 8)}.pdf"`);
            // Pipe PDF stream to response
            pdfStream.pipe(res);
        }
        catch (error) {
            console.error('Generate PDF error:', error);
            res.status(500).json({ error: 'Failed to generate PDF' });
        }
    });
    /**
     * GET /api/sessions
     * List all sessions (Manager)
     * Query params: status, page, limit, search
     */
    router.get('/', async (req, res) => {
        try {
            const organizationId = req.organizationId || 'demo-org-1';
            const { status, page, limit, search } = req.query;
            const pageNum = page ? parseInt(page) : 1;
            const limitNum = limit ? parseInt(limit) : 10;
            const skip = (pageNum - 1) * limitNum;
            const projectionStore = (0, database_js_1.getProjectionStore)();
            // Get all sessions (we'll filter in memory for now)
            const allSessions = await projectionStore.getSessions(organizationId, {
                status: status,
            });
            // Filter by search query (participant email)
            let filteredSessions = allSessions;
            if (search) {
                const searchLower = search.toLowerCase();
                filteredSessions = allSessions.filter(s => s.participantEmail.toLowerCase().includes(searchLower));
            }
            // Calculate pagination
            const total = filteredSessions.length;
            const totalPages = Math.ceil(total / limitNum);
            const sessions = filteredSessions.slice(skip, skip + limitNum);
            res.json({
                sessions,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1,
                }
            });
        }
        catch (error) {
            console.error('List sessions error:', error);
            res.status(500).json({ error: 'Failed to list sessions' });
        }
    });
    /**
     * POST /api/sessions/expire-old
     * Batch expire sessions that are past their expiration date
     */
    router.post('/expire-old', async (req, res) => {
        try {
            const organizationId = req.organizationId || 'demo-org-1';
            const projectionStore = (0, database_js_1.getProjectionStore)();
            const eventStore = (0, database_js_1.getEventStore)();
            // Get all pending and active sessions
            const allSessions = await projectionStore.getSessions(organizationId, {});
            const now = new Date();
            const handler = new SessionCommandHandler_js_1.SessionCommandHandler(eventStore, projectionStore);
            let expiredCount = 0;
            for (const session of allSessions) {
                if ((session.status === 'pending' || session.status === 'active') &&
                    session.expiresAt < now) {
                    try {
                        await handler.expireSession({
                            sessionId: session.sessionId,
                            organizationId: session.organizationId,
                            reason: 'Automatic expiration - exceeded expiration time',
                        });
                        expiredCount++;
                    }
                    catch (error) {
                        console.error(`Failed to expire session ${session.sessionId}:`, error);
                    }
                }
            }
            res.json({
                success: true,
                expiredCount,
                message: `Expired ${expiredCount} sessions`,
            });
        }
        catch (error) {
            console.error('Expire old sessions error:', error);
            res.status(500).json({ error: 'Failed to expire sessions' });
        }
    });
    /**
     * POST /api/sessions/:sessionId/suspend
     * Manually suspend a session (e.g., license depleted)
     */
    router.post('/:sessionId/suspend', async (req, res) => {
        try {
            const { sessionId } = req.params;
            const organizationId = req.organizationId || 'demo-org-1';
            const { reason } = req.body;
            const handler = new SessionCommandHandler_js_1.SessionCommandHandler((0, database_js_1.getEventStore)(), (0, database_js_1.getProjectionStore)());
            await handler.suspendSession({
                sessionId,
                organizationId,
                reason: reason || 'Session suspended',
            });
            res.json({ success: true });
        }
        catch (error) {
            console.error('Suspend session error:', error);
            res.status(400).json({ error: error.message });
        }
    });
    return router;
}
//# sourceMappingURL=sessionRoutes.js.map