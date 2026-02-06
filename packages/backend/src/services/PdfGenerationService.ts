/**
 * PDF Generation Service
 * Generates assessment result PDFs with white-label branding
 */

import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface PdfGenerationOptions {
  sessionId: string;
  participantEmail: string;
  templateName: string;
  completedAt: string;
  overallScore: number;
  overallPercentage: number;
  categories: Array<{
    categoryName: string;
    percentage: number;
    score: number;
    maxScore: number;
    questionsAnswered: number;
  }>;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    companyName?: string;
  };
}

export class PdfGenerationService {
  /**
   * Generate PDF report as a readable stream
   */
  async generateReport(options: PdfGenerationOptions): Promise<Readable> {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const primaryColor = options.branding?.primaryColor || '#6366F1';

    // Header
    doc
      .fontSize(24)
      .fillColor(primaryColor)
      .text('Rapport d\'Évaluation', { align: 'center' });

    doc.moveDown(0.5);

    // Company branding
    if (options.branding?.companyName) {
      doc
        .fontSize(14)
        .fillColor('#666666')
        .text(options.branding.companyName, { align: 'center' });
    }

    doc.moveDown(1);

    // Assessment info
    doc
      .fontSize(16)
      .fillColor('#333333')
      .text(options.templateName, { align: 'center' });

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(`Participant: ${options.participantEmail}`, { align: 'center' })
      .text(`Date: ${new Date(options.completedAt).toLocaleDateString('fr-FR')}`, {
        align: 'center',
      });

    doc.moveDown(2);

    // Overall Score - Big Circle
    const centerX = doc.page.width / 2;
    const circleY = doc.y + 60;
    const radius = 50;

    // Draw circle
    doc
      .circle(centerX, circleY, radius)
      .lineWidth(8)
      .strokeColor(this.getColorForPercentage(options.overallPercentage))
      .stroke();

    // Score text
    doc
      .fontSize(32)
      .fillColor('#333333')
      .text(`${options.overallPercentage}%`, centerX - 40, circleY - 15, {
        width: 80,
        align: 'center',
      });

    doc.moveDown(5);

    doc
      .fontSize(12)
      .fillColor('#666666')
      .text('Score Global', { align: 'center' })
      .text(`${options.overallScore} / ${options.categories.reduce((sum, c) => sum + c.maxScore, 0)} points`, {
        align: 'center',
      });

    doc.moveDown(2);

    // Categories
    doc
      .fontSize(16)
      .fillColor('#333333')
      .text('Scores par Catégorie');

    doc.moveDown(1);

    options.categories.forEach((category) => {
      const barWidth = 400;
      const barHeight = 20;
      const barX = 95;
      const barY = doc.y;

      // Category name
      doc
        .fontSize(12)
        .fillColor('#333333')
        .text(category.categoryName, 50, barY - 5);

      // Progress bar background
      doc
        .rect(barX, barY + 15, barWidth, barHeight)
        .fillColor('#E5E7EB')
        .fill();

      // Progress bar fill
      const fillWidth = (barWidth * category.percentage) / 100;
      doc
        .rect(barX, barY + 15, fillWidth, barHeight)
        .fillColor(this.getColorForPercentage(category.percentage))
        .fill();

      // Percentage text
      doc
        .fontSize(10)
        .fillColor('#333333')
        .text(`${category.percentage}%`, barX + barWidth + 10, barY + 19);

      // Score text
      doc
        .fontSize(9)
        .fillColor('#666666')
        .text(
          `${category.score} / ${category.maxScore} points • ${category.questionsAnswered} questions`,
          50,
          barY + 38
        );

      doc.moveDown(3);
    });

    // Footer
    doc
      .fontSize(8)
      .fillColor('#999999')
      .text(
        `Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

    doc
      .fontSize(8)
      .fillColor('#999999')
      .text('🤖 Généré avec Janus Assessment Platform', {
        align: 'center',
      });

    // Finalize PDF
    doc.end();

    return doc as unknown as Readable;
  }

  /**
   * Get color based on percentage
   */
  private getColorForPercentage(percentage: number): string {
    if (percentage >= 75) return '#10B981'; // Green
    if (percentage >= 50) return '#F59E0B'; // Yellow
    if (percentage >= 25) return '#F97316'; // Orange
    return '#EF4444'; // Red
  }
}
