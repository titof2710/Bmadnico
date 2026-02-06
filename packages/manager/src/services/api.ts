/**
 * Manager API Service
 */

import axios, { type AxiosInstance } from 'axios';

export interface CreateSessionPayload {
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

export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
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

  async createSession(payload: CreateSessionPayload): Promise<CreateSessionResponse> {
    const response = await this.client.post('/sessions', payload);
    return response.data;
  }

  async getSessions(params?: PaginationParams): Promise<{ sessions: any[]; pagination?: PaginationMeta }> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const url = `/sessions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.client.get(url);
    return response.data;
  }
}

export const apiService = new ApiService();
