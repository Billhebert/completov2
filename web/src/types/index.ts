// User & Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'company_admin' | 'agent' | 'viewer';
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Contact Types
export interface Contact {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  tags?: string[];
  isVIP?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Conversation Types
export interface Conversation {
  id: string;
  companyId: string;
  contactId: string;
  userId?: string;
  channel: 'whatsapp' | 'email' | 'sms' | 'webchat';
  status: 'open' | 'closed' | 'pending';
  messages?: Message[];
  contact?: Contact;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  direction: 'inbound' | 'outbound';
  channel: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Deal Types
export interface Deal {
  id: string;
  companyId: string;
  contactId: string;
  title: string;
  value?: number;
  stage: 'PROSPECTING' | 'QUALIFICATION' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  probability?: number;
  expectedCloseDate?: string;
  contact?: Contact;
  createdAt: string;
  updatedAt: string;
}

// Zettel (Knowledge) Types
export interface Zettel {
  id: string;
  companyId: string;
  userId?: string;
  type: 'FLEETING' | 'LITERATURE' | 'PERMANENT' | 'HUB' | 'CLIENT' | 'NEGOTIATION' | 'TASK' | 'LEARNING';
  title: string;
  content: string;
  tags?: string[];
  metadata?: Record<string, any>;
  links?: ZettelLink[];
  createdAt: string;
  updatedAt: string;
}

export interface ZettelLink {
  id: string;
  fromZettelId: string;
  toZettelId: string;
  relationshipType?: string;
  createdAt: string;
}

// Gap & Learning Types
export interface Gap {
  id: string;
  userId: string;
  category: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningPath {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  category: string;
  difficulty?: string;
  estimatedHours?: number;
  resources?: LearningResource[];
  createdAt: string;
  updatedAt: string;
}

export interface LearningResource {
  id: string;
  learningPathId: string;
  title: string;
  type: 'VIDEO' | 'ARTICLE' | 'BOOK' | 'COURSE' | 'EXERCISE';
  url?: string;
  content?: string;
  order: number;
  createdAt: string;
}

// Workflow Types
export interface Workflow {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  enabled: boolean;
  triggerType: string;
  triggerConfig: Record<string, any>;
  actions: WorkflowAction[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowAction {
  id: string;
  workflowId: string;
  type: string;
  config: Record<string, any>;
  order: number;
}

// Dashboard & Analytics Types
export interface DashboardStats {
  totalContacts: number;
  activeConversations: number;
  openDeals: number;
  dealsValue: number;
  zettelsCreated: number;
  gapsIdentified: number;
}

export interface ConversationMetrics {
  total: number;
  byChannel: Record<string, number>;
  byStatus: Record<string, number>;
  avgResponseTime?: number;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}
