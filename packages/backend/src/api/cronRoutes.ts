/**
 * Cron/Background Job Routes
 * Endpoints for scheduled tasks (expiration reminders, license alerts, etc.)
 */

import { Router, Request, Response } from 'express';
import { getProjectionStore, getLicensePoolProjectionStore } from '../infrastructure/database.js';
import { EmailService } from '../services/EmailService.js';

const router = Router();
const emailService = new EmailService();

/**
 * POST /api/cron/send-expiration-reminders
 * Send expiration reminders for sessions expiring soon
 */
router.post('/send-expiration-reminders', async (req: Request, res: Response) => {
  try {
    const projectionStore = getProjectionStore();
    const organizationId = (req as any).organizationId || 'demo-org-1';

    // Get all active and pending sessions
    const allSessions = await projectionStore.getSessions(organizationId, {});
    const now = new Date();
    const reminderWindow = 24 * 60 * 60 * 1000; // 24 hours

    let sentCount = 0;

    for (const session of allSessions) {
      if (session.status === 'pending' || session.status === 'active') {
        const expiresAt = new Date(session.expiresAt);
        const timeUntilExpiration = expiresAt.getTime() - now.getTime();

        // Send reminder if expiring in the next 24 hours
        if (timeUntilExpiration > 0 && timeUntilExpiration <= reminderWindow) {
          const hoursRemaining = Math.floor(timeUntilExpiration / (60 * 60 * 1000));

          const { mockTemplateService } = await import('./mockTemplateService.js');
          const template = await mockTemplateService.getTemplate(session.templateId, organizationId);

          if (template) {
            await emailService.sendExpirationReminder({
              participantEmail: session.participantEmail,
              templateName: template.name,
              accessUrl: `http://localhost:5173/session/${session.sessionToken}`,
              expiresAt: session.expiresAt.toISOString(),
              hoursRemaining,
            });
            sentCount++;
          }
        }
      }
    }

    res.json({
      success: true,
      sentCount,
      message: `Sent ${sentCount} expiration reminders`,
    });
  } catch (error) {
    console.error('Send expiration reminders error:', error);
    res.status(500).json({ error: 'Failed to send reminders' });
  }
});

/**
 * POST /api/cron/check-license-alerts
 * Check license pools and send alerts if below threshold
 */
router.post('/check-license-alerts', async (req: Request, res: Response) => {
  try {
    const licensePoolStore = getLicensePoolProjectionStore();
    const organizationId = (req as any).organizationId || 'demo-org-1';

    const pools = await licensePoolStore.getPools(organizationId);
    let alertCount = 0;

    for (const pool of pools) {
      if (pool.isWarning && pool.availableLicenses > 0) {
        await emailService.sendLicenseAlert({
          managerEmail: 'demo-manager@example.com', // TODO: Get from organization
          productName: pool.productName,
          availableLicenses: pool.availableLicenses,
          warningThreshold: pool.warningThreshold,
        });
        alertCount++;
      }
    }

    res.json({
      success: true,
      alertCount,
      message: `Sent ${alertCount} license alerts`,
    });
  } catch (error) {
    console.error('Check license alerts error:', error);
    res.status(500).json({ error: 'Failed to check license alerts' });
  }
});

export default router;
