"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_js_1 = require("../infrastructure/database.js");
const router = (0, express_1.Router)();
/**
 * GET /api/admin/kpis
 * Récupère les KPIs globaux de la plateforme
 */
router.get('/kpis', async (req, res) => {
    try {
        const projectionStore = (0, database_js_1.getProjectionStore)();
        // Récupérer toutes les sessions de toutes les organisations
        const allSessions = await projectionStore.getAllSessionsGlobal();
        // Calculer les KPIs
        const activeAssessments = allSessions.filter(s => s.status === 'active').length;
        const pendingAssessments = allSessions.filter(s => s.status === 'pending').length;
        const completedAssessments = allSessions.filter(s => s.status === 'completed').length;
        const totalAssessments = allSessions.length;
        // Calculer les métriques supplémentaires
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startedToday = allSessions.filter(s => s.startedAt && new Date(s.startedAt) >= today).length;
        const awaitingLicense = allSessions.filter(s => s.status === 'pending' && !s.startedAt).length;
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const completedThisMonth = allSessions.filter(s => s.status === 'completed' && s.completedAt && new Date(s.completedAt) >= firstDayOfMonth).length;
        // Pour la demo, on simule le revenu
        const totalRevenue = completedAssessments * 150; // 150€ par assessment complété
        const revenueThisMonth = completedThisMonth * 150;
        const pendingOrders = 0; // Sera implémenté avec EPIC-002
        res.json({
            kpis: {
                activeAssessments,
                pendingAssessments,
                completedAssessments,
                totalAssessments,
                startedToday,
                awaitingLicense,
                completedThisMonth,
                totalRevenue,
                revenueThisMonth,
                revenue: totalRevenue, // Backward compatibility
                pendingOrders,
            },
            lastUpdated: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Get admin KPIs error:', error);
        res.status(500).json({ error: 'Failed to get admin KPIs' });
    }
});
/**
 * GET /api/admin/assessments
 * Récupère tous les assessments de toutes les organisations
 */
router.get('/assessments', async (req, res) => {
    try {
        const projectionStore = (0, database_js_1.getProjectionStore)();
        // Query parameters pour filtrage
        const { company, status, search } = req.query;
        // Récupérer toutes les sessions
        let sessions = await projectionStore.getAllSessionsGlobal();
        // Appliquer les filtres
        if (company) {
            sessions = sessions.filter(s => s.organizationId === company);
        }
        if (status) {
            sessions = sessions.filter(s => s.status === status);
        }
        if (search && typeof search === 'string') {
            const searchLower = search.toLowerCase();
            sessions = sessions.filter(s => s.participantEmail.toLowerCase().includes(searchLower) ||
                s.templateId.toLowerCase().includes(searchLower) ||
                s.sessionId.toLowerCase().includes(searchLower));
        }
        // Enrichir avec des informations supplémentaires
        const enrichedSessions = sessions.map(session => ({
            ...session,
            companyName: session.organizationId, // Pour la demo
            consultantName: 'Demo Consultant', // Pour la demo
            assessmentType: session.templateId === 'template-001' ? 'Évaluation du Leadership' : session.templateId,
            workflowSteps: `${session.currentPage}/${session.totalPages}`,
        }));
        res.json({
            sessions: enrichedSessions,
            total: enrichedSessions.length,
        });
    }
    catch (error) {
        console.error('Get admin assessments error:', error);
        res.status(500).json({ error: 'Failed to get admin assessments' });
    }
});
/**
 * GET /api/admin/audit-logs
 * Récupère les audit logs de la plateforme
 */
router.get('/audit-logs', async (req, res) => {
    try {
        const eventStore = (0, database_js_1.getEventStore)();
        // Query parameters
        const { actionType, startDate, endDate } = req.query;
        // Récupérer tous les événements (pour la demo, limiter à 1000)
        const allEvents = await eventStore.getAllEventsGlobal(1000);
        // Filtrer par type d'action si spécifié
        let events = allEvents;
        if (actionType) {
            events = events.filter(e => e.eventType === actionType);
        }
        // Filtrer par date
        if (startDate) {
            const start = new Date(startDate);
            events = events.filter(e => new Date(e.timestamp) >= start);
        }
        if (endDate) {
            const end = new Date(endDate);
            events = events.filter(e => new Date(e.timestamp) <= end);
        }
        // Transformer en format audit log
        const auditLogs = events.map(event => ({
            logId: event.eventId,
            timestamp: event.timestamp,
            userId: 'platform-admin', // Pour la demo
            actionType: event.eventType,
            resourceType: 'session',
            resourceId: event.aggregateId,
            organizationId: event.organizationId,
            result: 'success',
            details: event.payload,
        }));
        res.json({
            logs: auditLogs,
            total: auditLogs.length,
        });
    }
    catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ error: 'Failed to get audit logs' });
    }
});
/**
 * GET /api/admin/meta-templates
 * Récupère la liste des meta-templates disponibles
 */
router.get('/meta-templates', async (req, res) => {
    try {
        // Pour la demo, on retourne les templates hard-codés
        const metaTemplates = [
            {
                id: 'template-001',
                name: 'Évaluation du Leadership',
                description: 'Template complet pour évaluer les compétences de leadership',
                language: 'fr',
                version: '1.0.0',
                totalQuestions: 9,
                subTemplates: [
                    { id: 'page-1', name: 'Vision & Stratégie', questionCount: 3 },
                    { id: 'page-2', name: 'Gestion des Personnes', questionCount: 3 },
                    { id: 'page-3', name: 'Exécution & Résultats', questionCount: 3 },
                ],
                published: true,
                productAssociated: true,
            },
        ];
        res.json({
            templates: metaTemplates,
            total: metaTemplates.length,
        });
    }
    catch (error) {
        console.error('Get meta-templates error:', error);
        res.status(500).json({ error: 'Failed to get meta-templates' });
    }
});
/**
 * GET /api/admin/revenue-trend
 * Récupère les tendances de revenu mensuel
 */
router.get('/revenue-trend', async (req, res) => {
    try {
        const projectionStore = (0, database_js_1.getProjectionStore)();
        // Récupérer toutes les sessions complétées
        const allSessions = await projectionStore.getAllSessionsGlobal();
        const completedSessions = allSessions.filter(s => s.status === 'completed' && s.completedAt);
        // Grouper par mois
        const monthlyRevenue = {};
        completedSessions.forEach(session => {
            if (session.completedAt) {
                const date = new Date(session.completedAt);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + 150; // 150€ par assessment
            }
        });
        // Convertir en array trié
        const trend = Object.entries(monthlyRevenue)
            .map(([month, revenue]) => ({ month, revenue }))
            .sort((a, b) => a.month.localeCompare(b.month));
        res.json({
            trend,
            totalRevenue: trend.reduce((sum, item) => sum + item.revenue, 0),
        });
    }
    catch (error) {
        console.error('Get revenue trend error:', error);
        res.status(500).json({ error: 'Failed to get revenue trend' });
    }
});
/**
 * GET /api/admin/license-consumption
 * Récupère les données de consommation de licences
 */
router.get('/license-consumption', async (req, res) => {
    try {
        const { poolId, organizationId, days = '30' } = req.query;
        const daysCount = parseInt(days, 10);
        // Générer des données de démonstration pour la consommation de licences
        const consumption = [];
        const today = new Date();
        for (let i = daysCount - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            // Générer des données aléatoires mais réalistes
            const consumed = Math.floor(Math.random() * 10) + 2; // 2-12 licences consommées
            const released = Math.floor(Math.random() * 5); // 0-5 licences libérées
            consumption.push({
                date: date.toISOString().split('T')[0],
                consumed,
                released,
                netChange: consumed - released,
            });
        }
        res.json({
            consumption,
            poolId: poolId || 'all',
            organizationId: organizationId || 'all',
            period: {
                days: daysCount,
                startDate: consumption[0]?.date,
                endDate: consumption[consumption.length - 1]?.date,
            },
        });
    }
    catch (error) {
        console.error('Get license consumption error:', error);
        res.status(500).json({ error: 'Failed to get license consumption data' });
    }
});
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map