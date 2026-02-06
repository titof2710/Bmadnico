/**
 * Email Service - Sends transactional emails
 * Uses Nodemailer with configurable SMTP transport
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SessionInvitationData {
  participantEmail: string;
  templateName: string;
  accessUrl: string;
  expiresAt: string;
  companyName?: string;
}

export interface CompletionNotificationData {
  managerEmail: string;
  participantEmail: string;
  templateName: string;
  resultsUrl: string;
  completedAt: string;
}

export interface ExpirationReminderData {
  participantEmail: string;
  templateName: string;
  accessUrl: string;
  expiresAt: string;
  hoursRemaining: number;
}

export interface LicenseAlertData {
  managerEmail: string;
  productName: string;
  availableLicenses: number;
  warningThreshold: number;
}

export class EmailService {
  private transporter: Transporter;
  private fromEmail: string;

  constructor() {
    // For demo purposes, use Ethereal Email (fake SMTP)
    // In production, use real SMTP like SendGrid, AWS SES, etc.
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@janus-assessment.com';

    if (process.env.NODE_ENV === 'production') {
      // Production SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development: Use Ethereal Email (logs to console)
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.password',
        },
      });
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log('Email sent:', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      // Don't throw - email failures shouldn't break the main flow
    }
  }

  /**
   * Send session invitation to participant
   */
  async sendSessionInvitation(data: SessionInvitationData): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: white;
      padding: 30px;
      border: 1px solid #E5E7EB;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      background: #6366F1;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      font-size: 12px;
      color: #6B7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 Invitation à une Évaluation</h1>
  </div>
  <div class="content">
    <p>Bonjour,</p>

    <p>Vous avez été invité(e) à participer à une évaluation : <strong>${data.templateName}</strong>.</p>

    ${data.companyName ? `<p>Cette évaluation est organisée par <strong>${data.companyName}</strong>.</p>` : ''}

    <p>Pour commencer l'évaluation, veuillez cliquer sur le bouton ci-dessous :</p>

    <div style="text-align: center;">
      <a href="${data.accessUrl}" class="button">Commencer l'Évaluation</a>
    </div>

    <p><strong>Informations importantes :</strong></p>
    <ul>
      <li>Ce lien est unique et personnel</li>
      <li>L'évaluation expire le ${new Date(data.expiresAt).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</li>
      <li>Vos réponses sont automatiquement sauvegardées</li>
      <li>Vous pouvez reprendre l'évaluation sur n'importe quel appareil</li>
    </ul>

    <p>Si vous avez des questions, n'hésitez pas à contacter votre administrateur.</p>
  </div>
  <div class="footer">
    <p>Janus Assessment Platform - ${new Date().getFullYear()}</p>
    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
  </div>
</body>
</html>
    `;

    await this.sendEmail({
      to: data.participantEmail,
      subject: `🎯 Invitation à l'évaluation: ${data.templateName}`,
      html,
      text: `Vous avez été invité à participer à l'évaluation "${data.templateName}". Accédez à l'évaluation ici: ${data.accessUrl}. L'évaluation expire le ${data.expiresAt}.`,
    });
  }

  /**
   * Send completion notification to manager
   */
  async sendCompletionNotification(data: CompletionNotificationData): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: white;
      padding: 30px;
      border: 1px solid #E5E7EB;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      background: #10B981;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      font-size: 12px;
      color: #6B7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Évaluation Complétée</h1>
  </div>
  <div class="content">
    <p>Bonjour,</p>

    <p>L'évaluation <strong>${data.templateName}</strong> a été complétée par <strong>${data.participantEmail}</strong>.</p>

    <p><strong>Détails :</strong></p>
    <ul>
      <li>Participant : ${data.participantEmail}</li>
      <li>Évaluation : ${data.templateName}</li>
      <li>Date de complétion : ${new Date(data.completedAt).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</li>
    </ul>

    <p>Vous pouvez maintenant consulter les résultats détaillés et télécharger le rapport PDF.</p>

    <div style="text-align: center;">
      <a href="${data.resultsUrl}" class="button">Voir les Résultats</a>
    </div>
  </div>
  <div class="footer">
    <p>Janus Assessment Platform - ${new Date().getFullYear()}</p>
    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
  </div>
</body>
</html>
    `;

    await this.sendEmail({
      to: data.managerEmail,
      subject: `✅ Évaluation complétée par ${data.participantEmail}`,
      html,
      text: `L'évaluation "${data.templateName}" a été complétée par ${data.participantEmail} le ${data.completedAt}. Consultez les résultats ici: ${data.resultsUrl}`,
    });
  }

  /**
   * Send expiration reminder to participant
   */
  async sendExpirationReminder(data: ExpirationReminderData): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: white;
      padding: 30px;
      border: 1px solid #E5E7EB;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      background: #F59E0B;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .alert {
      background: #FEF3C7;
      border-left: 4px solid #F59E0B;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      font-size: 12px;
      color: #6B7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⏰ Rappel : Évaluation Expire Bientôt</h1>
  </div>
  <div class="content">
    <p>Bonjour,</p>

    <div class="alert">
      <strong>⚠️ Attention :</strong> Votre évaluation expire dans ${data.hoursRemaining} heures !
    </div>

    <p>L'évaluation <strong>${data.templateName}</strong> expire le ${new Date(data.expiresAt).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}.</p>

    <p>Veuillez compléter l'évaluation avant cette date pour que vos réponses soient prises en compte.</p>

    <div style="text-align: center;">
      <a href="${data.accessUrl}" class="button">Reprendre l'Évaluation</a>
    </div>

    <p><em>Vos réponses actuelles sont sauvegardées. Vous pouvez reprendre où vous vous êtes arrêté.</em></p>
  </div>
  <div class="footer">
    <p>Janus Assessment Platform - ${new Date().getFullYear()}</p>
    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
  </div>
</body>
</html>
    `;

    await this.sendEmail({
      to: data.participantEmail,
      subject: `⏰ Rappel : Votre évaluation expire dans ${data.hoursRemaining}h`,
      html,
      text: `Rappel : L'évaluation "${data.templateName}" expire dans ${data.hoursRemaining} heures. Complétez-la ici: ${data.accessUrl}`,
    });
  }

  /**
   * Send license alert to manager
   */
  async sendLicenseAlert(data: LicenseAlertData): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: white;
      padding: 30px;
      border: 1px solid #E5E7EB;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
    .alert {
      background: #FEE2E2;
      border-left: 4px solid #EF4444;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      font-size: 12px;
      color: #6B7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚨 Alerte Licences</h1>
  </div>
  <div class="content">
    <p>Bonjour,</p>

    <div class="alert">
      <strong>🚨 Alerte :</strong> Le nombre de licences disponibles est faible !
    </div>

    <p>Le pool de licences pour <strong>${data.productName}</strong> a atteint le seuil d'alerte.</p>

    <p><strong>Détails :</strong></p>
    <ul>
      <li>Produit : ${data.productName}</li>
      <li>Licences disponibles : ${data.availableLicenses}</li>
      <li>Seuil d'alerte : ${data.warningThreshold}</li>
    </ul>

    <p>Veuillez commander des licences supplémentaires pour continuer à créer de nouvelles évaluations.</p>

    <p><em>Vous recevrez cette alerte jusqu'à ce que le nombre de licences disponibles dépasse le seuil d'alerte.</em></p>
  </div>
  <div class="footer">
    <p>Janus Assessment Platform - ${new Date().getFullYear()}</p>
    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
  </div>
</body>
</html>
    `;

    await this.sendEmail({
      to: data.managerEmail,
      subject: `🚨 Alerte : Licences ${data.productName} faibles (${data.availableLicenses} restantes)`,
      html,
      text: `Alerte : Le pool de licences "${data.productName}" a ${data.availableLicenses} licences restantes (seuil: ${data.warningThreshold}). Commandez des licences supplémentaires.`,
    });
  }
}
