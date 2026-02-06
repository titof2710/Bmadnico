/**
 * API Service - Backend communication
 */

import axios, { type AxiosInstance } from 'axios';

export interface SessionData {
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
  currentPageData?: PageData;
}

export interface PageData {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface Question {
  id: string;
  type: 'single_choice' | 'multiple_choice' | 'scale' | 'text';
  text: string;
  required: boolean;
  options?: { id: string; text: string; value: number }[];
  scaleMin?: number;
  scaleMax?: number;
}

export interface SubmitResponsePayload {
  questionId: string;
  pageId: string;
  responseValue: unknown;
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getSession(token: string): Promise<SessionData> {
    const response = await this.client.get(`/sessions/${token}`);
    return response.data;
  }

  async startSession(
    token: string,
    device: string,
    userAgent: string
  ): Promise<void> {
    await this.client.post(`/sessions/${token}/start`, {
      device,
      userAgent,
    });
  }

  async submitResponse(
    token: string,
    payload: SubmitResponsePayload
  ): Promise<{ success: boolean; eventId: string; timestamp: string }> {
    const response = await this.client.post(
      `/sessions/${token}/responses`,
      payload
    );
    return response.data;
  }

  async completePage(token: string, pageId: string): Promise<void> {
    await this.client.post(`/sessions/${token}/pages/${pageId}/complete`);
  }
}

export const apiService = new ApiService();
