import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type {
  User,
  LoginRequest,
  LoginResponse,
  Contact,
  Conversation,
  Deal,
  Zettel,
  Gap,
  LearningPath,
  Workflow,
  DashboardStats,
  PaginatedResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/login', data);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  // Contacts
  async getContacts(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    tags?: string[];
  }): Promise<PaginatedResponse<Contact>> {
    const response = await this.client.get<PaginatedResponse<Contact>>('/contacts', { params });
    return response.data;
  }

  async getContact(id: string): Promise<Contact> {
    const response = await this.client.get<Contact>(`/contacts/${id}`);
    return response.data;
  }

  async createContact(data: Partial<Contact>): Promise<Contact> {
    const response = await this.client.post<Contact>('/contacts', data);
    return response.data;
  }

  async updateContact(id: string, data: Partial<Contact>): Promise<Contact> {
    const response = await this.client.patch<Contact>(`/contacts/${id}`, data);
    return response.data;
  }

  async deleteContact(id: string): Promise<void> {
    await this.client.delete(`/contacts/${id}`);
  }

  // Conversations
  async getConversations(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    channel?: string;
  }): Promise<PaginatedResponse<Conversation>> {
    const response = await this.client.get<PaginatedResponse<Conversation>>('/conversations', { params });
    return response.data;
  }

  async getConversation(id: string): Promise<Conversation> {
    const response = await this.client.get<Conversation>(`/conversations/${id}`);
    return response.data;
  }

  async sendMessage(conversationId: string, content: string): Promise<void> {
    await this.client.post(`/conversations/${conversationId}/messages`, { content });
  }

  async closeConversation(id: string): Promise<void> {
    await this.client.patch(`/conversations/${id}`, { status: 'closed' });
  }

  // Deals
  async getDeals(params?: {
    page?: number;
    pageSize?: number;
    stage?: string;
  }): Promise<PaginatedResponse<Deal>> {
    const response = await this.client.get<PaginatedResponse<Deal>>('/deals', { params });
    return response.data;
  }

  async getDeal(id: string): Promise<Deal> {
    const response = await this.client.get<Deal>(`/deals/${id}`);
    return response.data;
  }

  async createDeal(data: Partial<Deal>): Promise<Deal> {
    const response = await this.client.post<Deal>('/deals', data);
    return response.data;
  }

  async updateDeal(id: string, data: Partial<Deal>): Promise<Deal> {
    const response = await this.client.patch<Deal>(`/deals/${id}`, data);
    return response.data;
  }

  async deleteDeal(id: string): Promise<void> {
    await this.client.delete(`/deals/${id}`);
  }

  // Zettels (Knowledge Base)
  async getZettels(params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    search?: string;
    tags?: string[];
  }): Promise<PaginatedResponse<Zettel>> {
    const response = await this.client.get<PaginatedResponse<Zettel>>('/zettels', { params });
    return response.data;
  }

  async getZettel(id: string): Promise<Zettel> {
    const response = await this.client.get<Zettel>(`/zettels/${id}`);
    return response.data;
  }

  async createZettel(data: Partial<Zettel>): Promise<Zettel> {
    const response = await this.client.post<Zettel>('/zettels', data);
    return response.data;
  }

  async updateZettel(id: string, data: Partial<Zettel>): Promise<Zettel> {
    const response = await this.client.patch<Zettel>(`/zettels/${id}`, data);
    return response.data;
  }

  async deleteZettel(id: string): Promise<void> {
    await this.client.delete(`/zettels/${id}`);
  }

  async linkZettels(fromId: string, toId: string, relationshipType?: string): Promise<void> {
    await this.client.post(`/zettels/${fromId}/links`, { toZettelId: toId, relationshipType });
  }

  // Gaps & Learning
  async getGaps(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<PaginatedResponse<Gap>> {
    const response = await this.client.get<PaginatedResponse<Gap>>('/gaps', { params });
    return response.data;
  }

  async closeGap(id: string): Promise<void> {
    await this.client.patch(`/gaps/${id}`, { status: 'CLOSED' });
  }

  async getLearningPaths(params?: {
    page?: number;
    pageSize?: number;
    category?: string;
  }): Promise<PaginatedResponse<LearningPath>> {
    const response = await this.client.get<PaginatedResponse<LearningPath>>('/learning-paths', { params });
    return response.data;
  }

  // Workflows
  async getWorkflows(): Promise<Workflow[]> {
    const response = await this.client.get<Workflow[]>('/workflows');
    return response.data;
  }

  async createWorkflow(data: Partial<Workflow>): Promise<Workflow> {
    const response = await this.client.post<Workflow>('/workflows', data);
    return response.data;
  }

  async updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow> {
    const response = await this.client.patch<Workflow>(`/workflows/${id}`, data);
    return response.data;
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.client.delete(`/workflows/${id}`);
  }

  async toggleWorkflow(id: string, enabled: boolean): Promise<void> {
    await this.client.patch(`/workflows/${id}`, { enabled });
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.client.get<DashboardStats>('/dashboard/stats');
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
