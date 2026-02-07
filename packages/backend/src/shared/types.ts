/**
 * Shared types for Janus Platform Demo
 */

// ============================================================================
// Domain Events (Event Sourcing)
// ============================================================================

export type DomainEventType =
  | 'SessionCreated'
  | 'ParticipantInvited'
  | 'SessionStarted'
  | 'ResponseRecorded'
  | 'PageCompleted'
  | 'SessionCompleted'
  | 'SessionExpired'
  | 'SessionSuspended'
  | 'ParticipantCreated'
  | 'ParticipantProfileUpdated'
  | 'ParticipantSessionAssigned'
  | 'ParticipantDeactivated'
  | 'CompanyCreated'
  | 'UserAdded'
  | 'UserRoleUpdated'
  | 'BrandingUpdated'
  | 'CompanyDeactivated'
  | 'LicensePoolCreated'
  | 'LicensesAdded'
  | 'LicenseConsumed'
  | 'LicenseReleased'
  | 'WarningThresholdUpdated'
  | 'LicensePoolDeleted';

export interface BaseDomainEvent {
  eventId: string;
  eventType: DomainEventType;
  aggregateId: string;
  aggregateType: 'Session' | 'Participant' | 'Company' | 'LicensePool';
  organizationId: string;
  timestamp: Date;
  version: number;
  metadata?: Record<string, unknown>;
}

export interface SessionCreatedEvent extends BaseDomainEvent {
  eventType: 'SessionCreated';
  payload: {
    sessionToken: string;
    participantEmail: string;
    templateId: string;
    expiresAt: Date;
    createdBy: string;
  };
}

export interface SessionStartedEvent extends BaseDomainEvent {
  eventType: 'SessionStarted';
  payload: {
    startedAt: Date;
    participantInfo?: {
      device: string;
      userAgent: string;
    };
  };
}

export interface ResponseRecordedEvent extends BaseDomainEvent {
  eventType: 'ResponseRecorded';
  payload: {
    questionId: string;
    pageId: string;
    responseValue: unknown;
    recordedAt: Date;
  };
}

export interface PageCompletedEvent extends BaseDomainEvent {
  eventType: 'PageCompleted';
  payload: {
    pageId: string;
    completedAt: Date;
  };
}

export interface SessionCompletedEvent extends BaseDomainEvent {
  eventType: 'SessionCompleted';
  payload: {
    completedAt: Date;
    totalPages: number;
    totalResponses: number;
  };
}

export interface SessionExpiredEvent extends BaseDomainEvent {
  eventType: 'SessionExpired';
  payload: {
    expiredAt: Date;
    reason: string;
  };
}

export interface SessionSuspendedEvent extends BaseDomainEvent {
  eventType: 'SessionSuspended';
  payload: {
    suspendedAt: Date;
    reason: string;
  };
}

export interface ParticipantCreatedEvent extends BaseDomainEvent {
  eventType: 'ParticipantCreated';
  aggregateType: 'Participant';
  payload: {
    email: string;
    firstName?: string;
    lastName?: string;
    companyId?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface ParticipantProfileUpdatedEvent extends BaseDomainEvent {
  eventType: 'ParticipantProfileUpdated';
  aggregateType: 'Participant';
  payload: {
    updatedFields: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      metadata?: Record<string, unknown>;
    };
    updatedAt: Date;
  };
}

export interface ParticipantSessionAssignedEvent extends BaseDomainEvent {
  eventType: 'ParticipantSessionAssigned';
  aggregateType: 'Participant';
  payload: {
    sessionId: string;
    templateId: string;
    assignedAt: Date;
  };
}

export interface ParticipantDeactivatedEvent extends BaseDomainEvent {
  eventType: 'ParticipantDeactivated';
  aggregateType: 'Participant';
  payload: {
    deactivatedAt: Date;
    reason?: string;
  };
}

export interface CompanyCreatedEvent extends BaseDomainEvent {
  eventType: 'CompanyCreated';
  aggregateType: 'Company';
  payload: {
    companyName: string;
    contactEmail: string;
    representativeEmail: string;
    representativeName: string;
  };
}

export interface UserAddedEvent extends BaseDomainEvent {
  eventType: 'UserAdded';
  aggregateType: 'Company';
  payload: {
    userId: string;
    email: string;
    fullName: string;
    role: 'representative' | 'consultant';
  };
}

export interface UserRoleUpdatedEvent extends BaseDomainEvent {
  eventType: 'UserRoleUpdated';
  aggregateType: 'Company';
  payload: {
    userId: string;
    oldRole: string;
    newRole: string;
  };
}

export interface BrandingUpdatedEvent extends BaseDomainEvent {
  eventType: 'BrandingUpdated';
  aggregateType: 'Company';
  payload: {
    previousConfig: Record<string, unknown>;
    newConfig: Record<string, unknown>;
  };
}

export interface CompanyDeactivatedEvent extends BaseDomainEvent {
  eventType: 'CompanyDeactivated';
  aggregateType: 'Company';
  payload: {
    reason: string;
  };
}

export interface LicensePoolCreatedEvent extends BaseDomainEvent {
  eventType: 'LicensePoolCreated';
  aggregateType: 'LicensePool';
  payload: {
    productId: string;
    productName: string;
    initialLicenses: number;
    warningThreshold: number;
  };
}

export interface LicensesAddedEvent extends BaseDomainEvent {
  eventType: 'LicensesAdded';
  aggregateType: 'LicensePool';
  payload: {
    quantity: number;
    orderId: string;
    previousTotal: number;
    newTotal: number;
  };
}

export interface LicenseConsumedEvent extends BaseDomainEvent {
  eventType: 'LicenseConsumed';
  aggregateType: 'LicensePool';
  payload: {
    sessionId: string;
    previousAvailable: number;
    newAvailable: number;
  };
}

export interface LicenseReleasedEvent extends BaseDomainEvent {
  eventType: 'LicenseReleased';
  aggregateType: 'LicensePool';
  payload: {
    sessionId: string;
    reason: string;
    previousAvailable: number;
    newAvailable: number;
  };
}

export interface WarningThresholdUpdatedEvent extends BaseDomainEvent {
  eventType: 'WarningThresholdUpdated';
  aggregateType: 'LicensePool';
  payload: {
    previousThreshold: number;
    newThreshold: number;
  };
}

export interface LicensePoolDeletedEvent extends BaseDomainEvent {
  eventType: 'LicensePoolDeleted';
  aggregateType: 'LicensePool';
  payload: {
    reason: string;
  };
}

export type DomainEvent =
  | SessionCreatedEvent
  | SessionStartedEvent
  | ResponseRecordedEvent
  | PageCompletedEvent
  | SessionCompletedEvent
  | SessionExpiredEvent
  | SessionSuspendedEvent
  | ParticipantCreatedEvent
  | ParticipantProfileUpdatedEvent
  | ParticipantSessionAssignedEvent
  | ParticipantDeactivatedEvent
  | CompanyCreatedEvent
  | UserAddedEvent
  | UserRoleUpdatedEvent
  | BrandingUpdatedEvent
  | CompanyDeactivatedEvent
  | LicensePoolCreatedEvent
  | LicensesAddedEvent
  | LicenseConsumedEvent
  | LicenseReleasedEvent
  | WarningThresholdUpdatedEvent
  | LicensePoolDeletedEvent;

// ============================================================================
// Projections (Read Models)
// ============================================================================

export interface SessionProjection {
  sessionId: string;
  organizationId: string;
  sessionToken: string;
  participantEmail: string;
  templateId: string;
  status: 'pending' | 'active' | 'completed' | 'expired' | 'suspended';
  currentPage: number;
  totalPages: number;
  responses: Record<string, unknown>;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Assessment Template
// ============================================================================

export interface QuestionOption {
  id: string;
  text: string;
  value: number;
}

export interface Question {
  id: string;
  type: 'single_choice' | 'multiple_choice' | 'scale' | 'text';
  text: string;
  required: boolean;
  options?: QuestionOption[];
  scaleMin?: number;
  scaleMax?: number;
}

export interface AssessmentPage {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface AssessmentTemplate {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  pages: AssessmentPage[];
  scoringRules?: ScoringRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoringRule {
  dimension: string;
  questionIds: string[];
  calculation: 'sum' | 'average' | 'weighted';
  weights?: Record<string, number>;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateSessionRequest {
  participantEmail: string;
  templateId: string;
  expiresInHours?: number;
}

export interface CreateSessionResponse {
  sessionId: string;
  sessionToken: string;
  expiresAt: string;
  accessUrl: string;
}

export interface GetSessionResponse {
  session: {
    sessionId: string;
    status: string;
    currentPage: number;
    totalPages: number;
    startedAt?: string;
    completedAt?: string;
    expiresAt: string;
    progress: number;
  };
  template: {
    id: string;
    name: string;
    description: string;
  };
  currentPageData?: AssessmentPage;
}

export interface SubmitResponseRequest {
  questionId: string;
  pageId: string;
  responseValue: unknown;
}

export interface SubmitResponseResponse {
  success: boolean;
  eventId: string;
  timestamp: string;
}

// ============================================================================
// JWT Claims
// ============================================================================

export interface JWTClaims {
  sub: string; // userId or sessionToken
  organizationId: string;
  role: 'admin' | 'manager' | 'participant';
  email?: string;
  iat: number;
  exp: number;
}

// ============================================================================
// Database Documents
// ============================================================================

export interface EventStoreDocument {
  _id?: string;
  eventId: string;
  eventType: DomainEventType;
  aggregateId: string;
  aggregateType: string;
  organizationId: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  version: number;
}

export interface ProjectionDocument extends SessionProjection {
  _id?: string;
}
