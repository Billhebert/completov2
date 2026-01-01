/**
 * Email Templates Types
 * Tipos para templates de email
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  variables: string[];
  category: string;
  isActive: boolean;
  createdBy: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  templatesCount: number;
}

export interface SendEmailRequest {
  templateId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  variables: Record<string, string>;
  attachments?: Array<{ name: string; url: string }>;
}
