export interface Feedback {
  id: string;
  companyId: string;
  userId: string;
  type: 'bug' | 'feature' | 'improvement' | 'question' | 'general';
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  response?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
}

export interface FeedbackFilters {
  status?: string;
  type?: string;
  priority?: string;
}
