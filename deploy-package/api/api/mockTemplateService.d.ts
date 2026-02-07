/**
 * Service de Template Mock - Templates de démonstration pour l'évaluation
 * En production, cela serait chargé depuis la base de données
 */
import { AssessmentTemplate } from '../shared/types.js';
declare class MockTemplateService {
    getTemplate(templateId: string, organizationId: string): Promise<AssessmentTemplate | null>;
    listTemplates(organizationId: string): Promise<AssessmentTemplate[]>;
}
export declare const mockTemplateService: MockTemplateService;
export {};
//# sourceMappingURL=mockTemplateService.d.ts.map