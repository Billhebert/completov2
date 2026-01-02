import api, { extractData } from '../../../core/utils/api';
import type { Feedback, FeedbackFilters } from '../types';

export const listFeedback = async (filters?: FeedbackFilters): Promise<Feedback[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.priority) params.append('priority', filters.priority);

  const response = await api.get(`/feedback?${params.toString()}`);
  return extractData(response);
};

export const createFeedback = async (data: Partial<Feedback>): Promise<Feedback> => {
  const response = await api.post('/feedback', data);
  return extractData(response);
};

export const updateFeedback = async (id: string, data: Partial<Feedback>): Promise<Feedback> => {
  const response = await api.patch(`/feedback/${id}`, data);
  return extractData(response);
};
