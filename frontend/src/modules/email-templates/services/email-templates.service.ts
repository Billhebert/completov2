/**
 * Email Templates Service
 * TODO: Implementar serviço de templates de email
 */

import api, { extractData } from '../../../core/utils/api';
import { EmailTemplate, TemplateCategory, SendEmailRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

/**
 * TODO: Implementar listagem de templates
 * - Filtrar por categoria e status
 * - Suportar busca por nome
 */
export const getTemplates = async (
  params?: PaginationParams & { category?: string; isActive?: boolean }
): Promise<PaginatedResult<EmailTemplate>> => {
  const response = await api.get('/email-templates', { params });
  return extractData(response);
};

/**
 * TODO: Implementar criação de template
 * - Validar HTML
 * - Extrair variáveis automaticamente do conteúdo
 * - Suportar preview
 */
export const createTemplate = async (data: Partial<EmailTemplate>): Promise<EmailTemplate> => {
  const response = await api.post('/email-templates', data);
  return extractData(response);
};

/**
 * TODO: Implementar envio de email usando template
 * - Substituir variáveis no template
 * - Validar que todas variáveis foram fornecidas
 * - Adicionar à fila de envio
 * - Registrar log de envio
 */
export const sendEmail = async (data: SendEmailRequest): Promise<{ success: boolean; messageId: string }> => {
  const response = await api.post('/email-templates/send', data);
  return extractData(response);
};

/**
 * TODO: Implementar preview de template
 * - Renderizar com variáveis de exemplo
 * - Retornar HTML renderizado
 */
export const previewTemplate = async (
  templateId: string,
  variables: Record<string, string>
): Promise<{ html: string; text: string }> => {
  const response = await api.post(`/email-templates/${templateId}/preview`, { variables });
  return extractData(response);
};

/**
 * TODO: Implementar gestão de categorias
 */
export const getCategories = async (): Promise<TemplateCategory[]> => {
  const response = await api.get('/email-templates/categories');
  return extractData(response);
};
