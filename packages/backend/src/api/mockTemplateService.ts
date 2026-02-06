/**
 * Service de Template Mock - Templates de démonstration pour l'évaluation
 * En production, cela serait chargé depuis la base de données
 */

import { AssessmentTemplate, AssessmentPage, Question } from '../shared/types.js';

const MOCK_TEMPLATE: AssessmentTemplate = {
  id: 'template-001',
  name: 'Évaluation du Leadership',
  description:
    'Évaluation complète pour évaluer les capacités et le potentiel de leadership',
  organizationId: 'demo-org-1',
  pages: [
    {
      id: 'page-1',
      title: 'Vision & Stratégie',
      description: 'Questions sur votre vision et votre pensée stratégique',
      questions: [
        {
          id: 'q1',
          type: 'single_choice',
          text: 'À quelle fréquence communiquez-vous votre vision à votre équipe ?',
          required: true,
          options: [
            { id: 'q1-opt1', text: 'Quotidiennement', value: 5 },
            { id: 'q1-opt2', text: 'Hebdomadairement', value: 4 },
            { id: 'q1-opt3', text: 'Mensuellement', value: 3 },
            { id: 'q1-opt4', text: 'Trimestriellement', value: 2 },
            { id: 'q1-opt5', text: 'Rarement', value: 1 },
          ],
        },
        {
          id: 'q2',
          type: 'scale',
          text: 'Évaluez votre capacité à développer des plans stratégiques à long terme',
          required: true,
          scaleMin: 1,
          scaleMax: 10,
        },
        {
          id: 'q3',
          type: 'multiple_choice',
          text: 'Quels outils stratégiques utilisez-vous régulièrement ? (Sélectionnez tous ceux qui s\'appliquent)',
          required: false,
          options: [
            { id: 'q3-opt1', text: 'Analyse SWOT', value: 1 },
            { id: 'q3-opt2', text: 'OKRs (Objectifs & Résultats Clés)', value: 1 },
            { id: 'q3-opt3', text: 'Balanced Scorecard', value: 1 },
            { id: 'q3-opt4', text: 'Les 5 Forces de Porter', value: 1 },
            { id: 'q3-opt5', text: 'Planification de scénarios', value: 1 },
          ],
        },
      ],
    },
    {
      id: 'page-2',
      title: 'Gestion des Personnes',
      description: 'Questions sur votre leadership d\'équipe et le développement des personnes',
      questions: [
        {
          id: 'q4',
          type: 'single_choice',
          text: 'Comment préférez-vous donner du feedback aux membres de l\'équipe ?',
          required: true,
          options: [
            { id: 'q4-opt1', text: 'Immédiatement après avoir observé un comportement', value: 5 },
            { id: 'q4-opt2', text: 'Lors des réunions individuelles planifiées', value: 4 },
            { id: 'q4-opt3', text: 'Lors des évaluations de performance', value: 3 },
            { id: 'q4-opt4', text: 'Quand on me le demande', value: 2 },
            { id: 'q4-opt5', text: 'Je donne rarement du feedback direct', value: 1 },
          ],
        },
        {
          id: 'q5',
          type: 'scale',
          text: 'À quel point êtes-vous à l\'aise avec les conversations difficiles ?',
          required: true,
          scaleMin: 1,
          scaleMax: 10,
        },
        {
          id: 'q6',
          type: 'text',
          text: 'Décrivez une situation récente où vous avez aidé quelqu\'un de votre équipe à grandir professionnellement',
          required: false,
        },
      ],
    },
    {
      id: 'page-3',
      title: 'Exécution & Résultats',
      description: 'Questions sur vos capacités d\'exécution',
      questions: [
        {
          id: 'q7',
          type: 'single_choice',
          text: 'Face à des priorités concurrentes, comment décidez-vous sur quoi vous concentrer ?',
          required: true,
          options: [
            {
              id: 'q7-opt1',
              text: 'Aligner sur les objectifs stratégiques',
              value: 5,
            },
            { id: 'q7-opt2', text: 'Me concentrer sur le plus grand impact', value: 4 },
            { id: 'q7-opt3', text: 'Faire d\'abord le plus urgent', value: 3 },
            { id: 'q7-opt4', text: 'Travailler sur ce que je maîtrise le mieux', value: 2 },
            { id: 'q7-opt5', text: 'Essayer de tout faire', value: 1 },
          ],
        },
        {
          id: 'q8',
          type: 'scale',
          text: 'Évaluez votre capacité à livrer des résultats sous pression',
          required: true,
          scaleMin: 1,
          scaleMax: 10,
        },
        {
          id: 'q9',
          type: 'multiple_choice',
          text: 'Quels indicateurs suivez-vous régulièrement ? (Sélectionnez tous ceux qui s\'appliquent)',
          required: false,
          options: [
            { id: 'q9-opt1', text: 'Productivité de l\'équipe', value: 1 },
            { id: 'q9-opt2', text: 'Indicateurs de qualité', value: 1 },
            { id: 'q9-opt3', text: 'Satisfaction client', value: 1 },
            { id: 'q9-opt4', text: 'Performance financière', value: 1 },
            { id: 'q9-opt5', text: 'Engagement des employés', value: 1 },
          ],
        },
      ],
    },
  ],
  scoringRules: [
    {
      dimension: 'Pensée Stratégique',
      questionIds: ['q1', 'q2', 'q3'],
      calculation: 'average',
    },
    {
      dimension: 'Leadership des Personnes',
      questionIds: ['q4', 'q5', 'q6'],
      calculation: 'average',
    },
    {
      dimension: 'Excellence en Exécution',
      questionIds: ['q7', 'q8', 'q9'],
      calculation: 'average',
    },
  ],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

class MockTemplateService {
  async getTemplate(
    templateId: string,
    organizationId: string
  ): Promise<AssessmentTemplate | null> {
    // For demo purposes, return the mock template for all demo orgs and template IDs
    // In production, this would query a database
    const demoOrgs = ['demo-org-1', 'demo-org-2', 'demo-org-3'];
    const demoTemplateIds = ['template-001', 'template-002', 'template-003', 'template-004', 'template-005'];

    if (demoOrgs.includes(organizationId) && demoTemplateIds.includes(templateId)) {
      // Return the same template structure but with the requested IDs
      return {
        ...MOCK_TEMPLATE,
        id: templateId,
        organizationId: organizationId
      };
    }
    return null;
  }

  async listTemplates(organizationId: string): Promise<AssessmentTemplate[]> {
    const demoOrgs = ['demo-org-1', 'demo-org-2', 'demo-org-3'];
    if (demoOrgs.includes(organizationId)) {
      return [MOCK_TEMPLATE];
    }
    return [];
  }
}

export const mockTemplateService = new MockTemplateService();
