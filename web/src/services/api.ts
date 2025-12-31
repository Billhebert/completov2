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
import type {
  EventDefinition,
  WebhookEndpoint,
  WebhookDelivery,
  CreateEventDefinition,
  CreateWebhookEndpoint,
} from '../types/webhooks';
import type {
  FieldTechnician,
  WorkOrder,
  CreateWorkOrder,
} from '../types/fsm';
import type {
  Asset,
  MaintenancePlan,
  MaintenanceRecord,
  SparePart,
  CreateAsset,
} from '../types/cmms';
import type {
  MCPServer,
  MCPTool,
  MCPResource,
  MCPServerLog,
  CreateMCPServer,
} from '../types/mcp';
import type {
  Job,
  JobApplication,
  JobInterest,
  JobZettelSuggestion,
  CreateJob,
} from '../types/jobs';
import type {
  Service,
  ServiceProposal,
  ServiceTransaction,
  SystemSettings,
  CreateService,
} from '../types/services';
import type {
  Partnership,
  PartnershipInvite,
  CreatePartnership,
  CreatePartnershipInvite,
} from '../types/partnerships';

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
        console.log('[API Client] Request interceptor:', {
          url: config.url,
          hasToken: !!token,
          tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
        });
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
        // Log the error but don't crash for 404s/500s on module endpoints
        const url = error.config?.url || '';
        const is404 = error.response?.status === 404;
        const is500 = error.response?.status === 500;
        const isModuleEndpoint = url.includes('/webhooks') ||
                                 url.includes('/fsm') ||
                                 url.includes('/cmms') ||
                                 url.includes('/mcp') ||
                                 url.includes('/workflows');

        if ((is404 || is500) && isModuleEndpoint) {
          console.warn(`[API] Module not available: ${url} (${error.response?.status})`);

          // Some endpoints return arrays directly, others return PaginatedResponse
          const arrayEndpoints = [
            /^\/workflows(\?.*)?$/,
            /\/tools(\?.*)?$/,
            /\/resources(\?.*)?$/,
            /\/logs(\?.*)?$/,
          ];

          const isArrayEndpoint = arrayEndpoints.some(pattern => url.match(pattern));

          // Return appropriate empty data structure
          if (isArrayEndpoint) {
            return Promise.resolve({ data: [] } as any);
          } else {
            // Return empty PaginatedResponse for other endpoints
            return Promise.resolve({
              data: {
                data: [],
                total: 0,
                page: 1,
                pageSize: 10,
                totalPages: 0
              }
            } as any);
          }
        }

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

  async register(data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
    companyDomain: string;
  }): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/register', data);
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
    const response = await this.client.get<PaginatedResponse<Contact>>('/crm/contacts', { params });
    return response.data;
  }

  async getContact(id: string): Promise<Contact> {
    const response = await this.client.get<Contact>(`/crm/contacts/${id}`);
    return response.data;
  }

  async createContact(data: Partial<Contact>): Promise<Contact> {
    const response = await this.client.post<Contact>('/crm/contacts', data);
    return response.data;
  }

  async updateContact(id: string, data: Partial<Contact>): Promise<Contact> {
    const response = await this.client.patch<Contact>(`/crm/contacts/${id}`, data);
    return response.data;
  }

  async deleteContact(id: string): Promise<void> {
    await this.client.delete(`/crm/contacts/${id}`);
  }

  // Conversations
  async getConversations(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    channel?: string;
  }): Promise<PaginatedResponse<Conversation>> {
    const response = await this.client.get<PaginatedResponse<Conversation>>('/omnichannel/conversations', { params });
    return response.data;
  }

  async getConversation(id: string): Promise<Conversation> {
    const response = await this.client.get<Conversation>(`/omnichannel/conversations/${id}`);
    return response.data;
  }

  async sendMessage(conversationId: string, content: string): Promise<void> {
    await this.client.post(`/omnichannel/conversations/${conversationId}/messages`, { content });
  }

  async closeConversation(id: string): Promise<void> {
    await this.client.patch(`/omnichannel/conversations/${id}`, { status: 'closed' });
  }

  // Deals
  async getDeals(params?: {
    page?: number;
    pageSize?: number;
    stage?: string;
  }): Promise<PaginatedResponse<Deal>> {
    const response = await this.client.get<PaginatedResponse<Deal>>('/crm/deals', { params });
    return response.data;
  }

  async getDeal(id: string): Promise<Deal> {
    const response = await this.client.get<Deal>(`/crm/deals/${id}`);
    return response.data;
  }

  async createDeal(data: Partial<Deal>): Promise<Deal> {
    const response = await this.client.post<Deal>('/crm/deals', data);
    return response.data;
  }

  async updateDeal(id: string, data: Partial<Deal>): Promise<Deal> {
    const response = await this.client.patch<Deal>(`/crm/deals/${id}`, data);
    return response.data;
  }

  async deleteDeal(id: string): Promise<void> {
    await this.client.delete(`/crm/deals/${id}`);
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

  // Webhooks & Events
  async getEventDefinitions(params?: {
    page?: number;
    pageSize?: number;
    category?: string;
  }): Promise<PaginatedResponse<EventDefinition>> {
    const response = await this.client.get<PaginatedResponse<EventDefinition>>('/webhooks/events', { params });
    return response.data;
  }

  async createEventDefinition(data: CreateEventDefinition): Promise<EventDefinition> {
    const response = await this.client.post<EventDefinition>('/webhooks/events', data);
    return response.data;
  }

  async updateEventDefinition(id: string, data: Partial<CreateEventDefinition>): Promise<EventDefinition> {
    const response = await this.client.put<EventDefinition>(`/webhooks/events/${id}`, data);
    return response.data;
  }

  async deleteEventDefinition(id: string): Promise<void> {
    await this.client.delete(`/webhooks/events/${id}`);
  }

  async getWebhookEndpoints(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<WebhookEndpoint>> {
    const response = await this.client.get<PaginatedResponse<WebhookEndpoint>>('/webhooks/endpoints', { params });
    return response.data;
  }

  async createWebhookEndpoint(data: CreateWebhookEndpoint): Promise<WebhookEndpoint> {
    const response = await this.client.post<WebhookEndpoint>('/webhooks/endpoints', data);
    return response.data;
  }

  async updateWebhookEndpoint(id: string, data: Partial<CreateWebhookEndpoint>): Promise<WebhookEndpoint> {
    const response = await this.client.put<WebhookEndpoint>(`/webhooks/endpoints/${id}`, data);
    return response.data;
  }

  async deleteWebhookEndpoint(id: string): Promise<void> {
    await this.client.delete(`/webhooks/endpoints/${id}`);
  }

  async toggleWebhookEndpoint(id: string, isActive: boolean): Promise<WebhookEndpoint> {
    const response = await this.client.patch<WebhookEndpoint>(`/webhooks/endpoints/${id}/toggle`, { isActive });
    return response.data;
  }

  async testWebhookEndpoint(id: string): Promise<void> {
    await this.client.post(`/webhooks/endpoints/${id}/test`);
  }

  async getWebhookDeliveries(params?: {
    endpointId?: string;
    eventName?: string;
    success?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<WebhookDelivery>> {
    const response = await this.client.get<PaginatedResponse<WebhookDelivery>>('/webhooks/deliveries', { params });
    return response.data;
  }

  async retryWebhookDelivery(id: string): Promise<void> {
    await this.client.post(`/webhooks/deliveries/${id}/retry`);
  }

  // Field Service Management (FSM)
  async getTechnicians(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<PaginatedResponse<FieldTechnician>> {
    const response = await this.client.get<PaginatedResponse<FieldTechnician>>('/fsm/technicians', { params });
    return response.data;
  }

  async getTechnician(id: string): Promise<FieldTechnician> {
    const response = await this.client.get<FieldTechnician>(`/fsm/technicians/${id}`);
    return response.data;
  }

  async createTechnician(data: Partial<FieldTechnician>): Promise<FieldTechnician> {
    const response = await this.client.post<FieldTechnician>('/fsm/technicians', data);
    return response.data;
  }

  async updateTechnician(id: string, data: Partial<FieldTechnician>): Promise<FieldTechnician> {
    const response = await this.client.put<FieldTechnician>(`/fsm/technicians/${id}`, data);
    return response.data;
  }

  async updateTechnicianLocation(id: string, location: { lat: number; lng: number; address: string }): Promise<void> {
    await this.client.patch(`/fsm/technicians/${id}/location`, location);
  }

  async getWorkOrders(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    priority?: string;
    technicianId?: string;
  }): Promise<PaginatedResponse<WorkOrder>> {
    const response = await this.client.get<PaginatedResponse<WorkOrder>>('/fsm/workorders', { params });
    return response.data;
  }

  async getWorkOrder(id: string): Promise<WorkOrder> {
    const response = await this.client.get<WorkOrder>(`/fsm/workorders/${id}`);
    return response.data;
  }

  async createWorkOrder(data: CreateWorkOrder): Promise<WorkOrder> {
    const response = await this.client.post<WorkOrder>('/fsm/workorders', data);
    return response.data;
  }

  async updateWorkOrder(id: string, data: Partial<CreateWorkOrder>): Promise<WorkOrder> {
    const response = await this.client.put<WorkOrder>(`/fsm/workorders/${id}`, data);
    return response.data;
  }

  async assignWorkOrder(id: string, technicianId: string): Promise<WorkOrder> {
    const response = await this.client.patch<WorkOrder>(`/fsm/workorders/${id}/assign`, { technicianId });
    return response.data;
  }

  async startWorkOrder(id: string): Promise<WorkOrder> {
    const response = await this.client.post<WorkOrder>(`/fsm/workorders/${id}/start`);
    return response.data;
  }

  async completeWorkOrder(id: string, data?: { signature?: string; feedback?: any }): Promise<WorkOrder> {
    const response = await this.client.post<WorkOrder>(`/fsm/workorders/${id}/complete`, data);
    return response.data;
  }

  async addWorkOrderTask(workOrderId: string, task: { title: string; description?: string }): Promise<void> {
    await this.client.post(`/fsm/workorders/${workOrderId}/tasks`, task);
  }

  async toggleWorkOrderTask(workOrderId: string, taskId: string): Promise<void> {
    await this.client.patch(`/fsm/workorders/${workOrderId}/tasks/${taskId}/toggle`);
  }

  // CMMS + EAM
  async getAssets(params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    status?: string;
    parentAssetId?: string;
  }): Promise<PaginatedResponse<Asset>> {
    const response = await this.client.get<PaginatedResponse<Asset>>('/cmms/assets', { params });
    return response.data;
  }

  async getAsset(id: string): Promise<Asset> {
    const response = await this.client.get<Asset>(`/cmms/assets/${id}`);
    return response.data;
  }

  async createAsset(data: CreateAsset): Promise<Asset> {
    const response = await this.client.post<Asset>('/cmms/assets', data);
    return response.data;
  }

  async updateAsset(id: string, data: Partial<CreateAsset>): Promise<Asset> {
    const response = await this.client.put<Asset>(`/cmms/assets/${id}`, data);
    return response.data;
  }

  async deleteAsset(id: string): Promise<void> {
    await this.client.delete(`/cmms/assets/${id}`);
  }

  async generateAssetQRCode(id: string): Promise<{ qrCode: string }> {
    const response = await this.client.post<{ qrCode: string }>(`/cmms/assets/${id}/qr-code`);
    return response.data;
  }

  async getMaintenancePlans(params?: {
    page?: number;
    pageSize?: number;
    assetId?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<MaintenancePlan>> {
    const response = await this.client.get<PaginatedResponse<MaintenancePlan>>('/cmms/maintenance-plans', { params });
    return response.data;
  }

  async createMaintenancePlan(data: Partial<MaintenancePlan>): Promise<MaintenancePlan> {
    const response = await this.client.post<MaintenancePlan>('/cmms/maintenance-plans', data);
    return response.data;
  }

  async updateMaintenancePlan(id: string, data: Partial<MaintenancePlan>): Promise<MaintenancePlan> {
    const response = await this.client.put<MaintenancePlan>(`/cmms/maintenance-plans/${id}`, data);
    return response.data;
  }

  async deleteMaintenancePlan(id: string): Promise<void> {
    await this.client.delete(`/cmms/maintenance-plans/${id}`);
  }

  async getMaintenanceRecords(params?: {
    page?: number;
    pageSize?: number;
    assetId?: string;
    type?: string;
  }): Promise<PaginatedResponse<MaintenanceRecord>> {
    const response = await this.client.get<PaginatedResponse<MaintenanceRecord>>('/cmms/maintenance-records', { params });
    return response.data;
  }

  async createMaintenanceRecord(data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    const response = await this.client.post<MaintenanceRecord>('/cmms/maintenance-records', data);
    return response.data;
  }

  async getSpareParts(params?: {
    page?: number;
    pageSize?: number;
    lowStock?: boolean;
  }): Promise<PaginatedResponse<SparePart>> {
    const response = await this.client.get<PaginatedResponse<SparePart>>('/cmms/spare-parts', { params });
    return response.data;
  }

  async createSparePart(data: Partial<SparePart>): Promise<SparePart> {
    const response = await this.client.post<SparePart>('/cmms/spare-parts', data);
    return response.data;
  }

  async updateSparePart(id: string, data: Partial<SparePart>): Promise<SparePart> {
    const response = await this.client.put<SparePart>(`/cmms/spare-parts/${id}`, data);
    return response.data;
  }

  // MCP Servers
  async getMCPServers(params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<MCPServer>> {
    const response = await this.client.get<PaginatedResponse<MCPServer>>('/mcp/servers', { params });
    return response.data;
  }

  async getMCPServer(id: string): Promise<MCPServer> {
    const response = await this.client.get<MCPServer>(`/mcp/servers/${id}`);
    return response.data;
  }

  async createMCPServer(data: CreateMCPServer): Promise<MCPServer> {
    const response = await this.client.post<MCPServer>('/mcp/servers', data);
    return response.data;
  }

  async updateMCPServer(id: string, data: Partial<CreateMCPServer>): Promise<MCPServer> {
    const response = await this.client.put<MCPServer>(`/mcp/servers/${id}`, data);
    return response.data;
  }

  async deleteMCPServer(id: string): Promise<void> {
    await this.client.delete(`/mcp/servers/${id}`);
  }

  async toggleMCPServer(id: string, isActive: boolean): Promise<MCPServer> {
    const response = await this.client.patch<MCPServer>(`/mcp/servers/${id}/toggle`, { isActive });
    return response.data;
  }

  async testMCPServer(id: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post<{ success: boolean; message: string }>(`/mcp/servers/${id}/test`);
    return response.data;
  }

  async getMCPTools(serverId: string): Promise<MCPTool[]> {
    const response = await this.client.get<MCPTool[]>(`/mcp/servers/${serverId}/tools`);
    return response.data;
  }

  async getMCPResources(serverId: string): Promise<MCPResource[]> {
    const response = await this.client.get<MCPResource[]>(`/mcp/servers/${serverId}/resources`);
    return response.data;
  }

  async getMCPServerLogs(serverId: string, params?: {
    level?: string;
    limit?: number;
  }): Promise<MCPServerLog[]> {
    const response = await this.client.get<MCPServerLog[]>(`/mcp/servers/${serverId}/logs`, { params });
    return response.data;
  }

  // Jobs
  async getJobs(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    type?: string;
    isSpecialized?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<Job>> {
    const response = await this.client.get<PaginatedResponse<Job>>('/jobs', { params });
    return response.data;
  }

  async getJob(id: string): Promise<Job> {
    const response = await this.client.get<Job>(`/jobs/${id}`);
    return response.data;
  }

  async createJob(data: CreateJob): Promise<Job> {
    const response = await this.client.post<Job>('/jobs', data);
    return response.data;
  }

  async updateJob(id: string, data: Partial<CreateJob>): Promise<Job> {
    const response = await this.client.put<Job>(`/jobs/${id}`, data);
    return response.data;
  }

  async deleteJob(id: string): Promise<void> {
    await this.client.delete(`/jobs/${id}`);
  }

  async applyToJob(jobId: string, data: {
    coverLetter?: string;
    resume?: any;
    documents?: any;
  }): Promise<JobApplication> {
    const response = await this.client.post<JobApplication>(`/jobs/${jobId}/apply`, data);
    return response.data;
  }

  async markJobInterest(jobId: string, data: {
    reason?: string;
    notifyOnChanges?: boolean;
  }): Promise<JobInterest> {
    const response = await this.client.post<JobInterest>(`/jobs/${jobId}/interest`, data);
    return response.data;
  }

  async getJobSuggestions(jobId: string): Promise<JobZettelSuggestion> {
    const response = await this.client.get<JobZettelSuggestion>(`/jobs/${jobId}/suggestions`);
    return response.data;
  }

  async getJobApplications(jobId: string): Promise<JobApplication[]> {
    const response = await this.client.get<JobApplication[]>(`/jobs/${jobId}/applications`);
    return response.data;
  }

  async updateJobApplication(applicationId: string, data: {
    status?: string;
    internalNotes?: string;
    feedback?: string;
    rating?: number;
  }): Promise<JobApplication> {
    const response = await this.client.patch<JobApplication>(`/jobs/applications/${applicationId}`, data);
    return response.data;
  }

  // Services
  async getServices(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    category?: string;
    minBudget?: number;
    maxBudget?: number;
    search?: string;
  }): Promise<PaginatedResponse<Service>> {
    const response = await this.client.get<PaginatedResponse<Service>>('/services', { params });
    return response.data;
  }

  async getService(id: string): Promise<Service> {
    const response = await this.client.get<Service>(`/services/${id}`);
    return response.data;
  }

  async createService(data: CreateService): Promise<Service> {
    const response = await this.client.post<Service>('/services', data);
    return response.data;
  }

  async updateService(id: string, data: Partial<CreateService>): Promise<Service> {
    const response = await this.client.put<Service>(`/services/${id}`, data);
    return response.data;
  }

  async deleteService(id: string): Promise<void> {
    await this.client.delete(`/services/${id}`);
  }

  async submitServiceProposal(serviceId: string, data: {
    proposerType: string;
    message?: string;
    estimatedDuration?: number;
    portfolio?: any;
  }): Promise<ServiceProposal> {
    const response = await this.client.post<ServiceProposal>(`/services/${serviceId}/propose`, data);
    return response.data;
  }

  async getServiceProposals(serviceId: string): Promise<ServiceProposal[]> {
    const response = await this.client.get<ServiceProposal[]>(`/services/${serviceId}/proposals`);
    return response.data;
  }

  async acceptServiceProposal(proposalId: string): Promise<{ message: string }> {
    const response = await this.client.patch<{ message: string }>(`/services/proposals/${proposalId}/accept`);
    return response.data;
  }

  async rejectServiceProposal(proposalId: string, reason?: string): Promise<{ message: string }> {
    const response = await this.client.patch<{ message: string }>(`/services/proposals/${proposalId}/reject`, { reason });
    return response.data;
  }

  async completeService(serviceId: string, data: {
    deliverables?: any;
    notes?: string;
  }): Promise<{ message: string }> {
    const response = await this.client.patch<{ message: string }>(`/services/${serviceId}/complete`, data);
    return response.data;
  }

  async rateService(serviceId: string, data: {
    rating: number;
    feedback?: string;
  }): Promise<{ message: string }> {
    const response = await this.client.patch<{ message: string }>(`/services/${serviceId}/rate`, data);
    return response.data;
  }

  async getServiceTransactions(params?: {
    page?: number;
    pageSize?: number;
    paymentStatus?: string;
  }): Promise<PaginatedResponse<ServiceTransaction>> {
    const response = await this.client.get<PaginatedResponse<ServiceTransaction>>('/services/transactions', { params });
    return response.data;
  }

  async updateTransactionPayment(transactionId: string, data: {
    paymentStatus: string;
    paymentMethod?: string;
    transactionId?: string;
  }): Promise<{ message: string }> {
    const response = await this.client.patch<{ message: string }>(`/services/transactions/${transactionId}/payment`, data);
    return response.data;
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings> {
    const response = await this.client.get<SystemSettings>('/settings');
    return response.data;
  }

  async updateSystemSettings(data: {
    serviceFeePercentage?: number;
    minServiceFee?: number;
    maxServiceFee?: number;
    currency?: string;
    metadata?: any;
  }): Promise<SystemSettings> {
    const response = await this.client.put<SystemSettings>('/settings', data);
    return response.data;
  }

  async getSettingsHistory(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<SystemSettings>> {
    const response = await this.client.get<PaginatedResponse<SystemSettings>>('/settings/history', { params });
    return response.data;
  }

  // Partnerships
  async getPartnerships(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<PaginatedResponse<Partnership>> {
    const response = await this.client.get<PaginatedResponse<Partnership>>('/partnerships', { params });
    return response.data;
  }

  async getPartnership(id: string): Promise<Partnership> {
    const response = await this.client.get<Partnership>(`/partnerships/${id}`);
    return response.data;
  }

  async createPartnership(data: CreatePartnership): Promise<Partnership> {
    const response = await this.client.post<Partnership>('/partnerships', data);
    return response.data;
  }

  async updatePartnership(id: string, data: Partial<CreatePartnership> & {
    status?: string;
    endDate?: string;
  }): Promise<Partnership> {
    const response = await this.client.patch<Partnership>(`/partnerships/${id}`, data);
    return response.data;
  }

  async terminatePartnership(id: string): Promise<void> {
    await this.client.delete(`/partnerships/${id}`);
  }

  // Partnership Invites
  async getPartnershipInvites(params?: {
    page?: number;
    pageSize?: number;
    type?: 'sent' | 'received';
    status?: string;
  }): Promise<PaginatedResponse<PartnershipInvite>> {
    const response = await this.client.get<PaginatedResponse<PartnershipInvite>>('/partnerships/invites', { params });
    return response.data;
  }

  async sendPartnershipInvite(data: CreatePartnershipInvite): Promise<PartnershipInvite> {
    const response = await this.client.post<PartnershipInvite>('/partnerships/invites', data);
    return response.data;
  }

  async acceptPartnershipInvite(id: string): Promise<Partnership> {
    const response = await this.client.patch<Partnership>(`/partnerships/invites/${id}/accept`);
    return response.data;
  }

  async rejectPartnershipInvite(id: string, reason?: string): Promise<{ message: string }> {
    const response = await this.client.patch<{ message: string }>(`/partnerships/invites/${id}/reject`, { reason });
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
