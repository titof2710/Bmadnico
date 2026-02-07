/**
 * Email Service - Sends transactional emails
 * Uses Nodemailer with configurable SMTP transport
 */
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
export declare class EmailService {
    private transporter;
    private fromEmail;
    constructor();
    /**
     * Send a generic email
     */
    sendEmail(options: EmailOptions): Promise<void>;
    /**
     * Send session invitation to participant
     */
    sendSessionInvitation(data: SessionInvitationData): Promise<void>;
    /**
     * Send completion notification to manager
     */
    sendCompletionNotification(data: CompletionNotificationData): Promise<void>;
    /**
     * Send expiration reminder to participant
     */
    sendExpirationReminder(data: ExpirationReminderData): Promise<void>;
    /**
     * Send license alert to manager
     */
    sendLicenseAlert(data: LicenseAlertData): Promise<void>;
}
//# sourceMappingURL=EmailService.d.ts.map