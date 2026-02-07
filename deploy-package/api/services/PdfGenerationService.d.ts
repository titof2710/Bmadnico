/**
 * PDF Generation Service
 * Generates assessment result PDFs with white-label branding
 */
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
export declare class PdfGenerationService {
    /**
     * Generate PDF report as a readable stream
     */
    generateReport(options: PdfGenerationOptions): Promise<Readable>;
    /**
     * Get color based on percentage
     */
    private getColorForPercentage;
}
export {};
//# sourceMappingURL=PdfGenerationService.d.ts.map