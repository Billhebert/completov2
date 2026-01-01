/**
 * Services Service
 *
 * Este serviço fornece funções para interagir com o marketplace de serviços
 * corporativos. As rotas do backend cobrem listagem, criação e edição de
 * serviços, envio e gerenciamento de propostas, conclusão e avaliação de
 * serviços e transações de pagamento.【522691621467066†L17-L110】【522691621467066†L145-L261】
 */

import api, { extractData } from '../../../core/utils/api';

// ===== Services CRUD =====

/**
 * Lista serviços acessíveis à empresa e parceiros. Permite filtrar por
 * status, categoria, orçamento mínimo/máximo e busca textual【522691621467066†L17-L110】.
 *
 * @param params Parâmetros de filtragem e paginação.
 */
export const listServices = async (
  params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    category?: string;
    minBudget?: number;
    maxBudget?: number;
    search?: string;
  }
): Promise<any> => {
  const response = await api.get('/services', { params });
  return extractData(response);
};

/**
 * Recupera um serviço específico pelo seu ID【522691621467066†L113-L139】.
 *
 * @param id ID do serviço
 */
export const getService = async (id: string): Promise<any> => {
  const response = await api.get(`/services/${id}`);
  return extractData(response);
};

/**
 * Cria um novo serviço. Apenas usuários com papel de administrador podem
 * executar esta ação【522691621467066†L145-L177】.
 *
 * @param data Objeto com dados do serviço (title, description, budget, categoria, etc.)
 */
export const createService = async (data: any): Promise<any> => {
  const response = await api.post('/services', data);
  return extractData(response);
};

/**
 * Atualiza um serviço existente. Não é permitido alterar serviços em
 * andamento ou concluídos【522691621467066†L180-L224】.
 *
 * @param id   ID do serviço
 * @param data Campos a atualizar
 */
export const updateService = async (id: string, data: any): Promise<any> => {
  const response = await api.put(`/services/${id}`, data);
  return extractData(response);
};

/**
 * Remove um serviço. Apenas administradores podem deletar serviços e não é
 * possível remover serviços em andamento ou concluídos【522691621467066†L227-L260】.
 *
 * @param id ID do serviço
 */
export const deleteService = async (id: string): Promise<void> => {
  await api.delete(`/services/${id}`);
};

// ===== Proposals =====

/**
 * Envia uma proposta para um serviço aberto. O backend valida se o tipo de
 * proponente é aceito pelo serviço【522691621467066†L267-L316】.
 *
 * @param serviceId ID do serviço
 * @param proposerType 'company' ou 'individual'
 * @param message Mensagem do proponente
 * @param portfolio Portfólio ou informações adicionais (opcional)
 */
export const submitProposal = async (
  serviceId: string,
  proposerType: 'company' | 'individual',
  message: string,
  portfolio?: any
): Promise<any> => {
  const response = await api.post(`/services/${serviceId}/propose`, {
    proposerType,
    message,
    portfolio,
  });
  return extractData(response);
};

/**
 * Lista as propostas recebidas para um determinado serviço. Apenas admins
 * podem acessar【522691621467066†L327-L360】.
 *
 * @param serviceId ID do serviço
 */
export const getServiceProposals = async (serviceId: string): Promise<any[]> => {
  const response = await api.get(`/services/${serviceId}/proposals`);
  return extractData(response);
};

/**
 * Aceita uma proposta específica【522691621467066†L367-L461】.
 *
 * @param proposalId ID da proposta
 */
export const acceptProposal = async (proposalId: string): Promise<any> => {
  const response = await api.patch(`/services/proposals/${proposalId}/accept`);
  return extractData(response);
};

/**
 * Rejeita uma proposta específica com um motivo【522691621467066†L462-L507】.
 *
 * @param proposalId ID da proposta
 * @param reason Motivo da rejeição
 */
export const rejectProposal = async (proposalId: string, reason?: string): Promise<any> => {
  const response = await api.patch(`/services/proposals/${proposalId}/reject`, { reason });
  return extractData(response);
};

// ===== Service Lifecycle =====

/**
 * Marca um serviço como concluído. Somente o provedor aceito pode concluir【522691621467066†L514-L548】.
 *
 * @param serviceId ID do serviço
 * @param deliverables Entregáveis finalizados (opcional)
 * @param notes Notas adicionais (opcional)
 */
export const completeService = async (
  serviceId: string,
  deliverables?: any,
  notes?: string
): Promise<any> => {
  const response = await api.patch(`/services/${serviceId}/complete`, {
    deliverables,
    notes,
  });
  return extractData(response);
};

/**
 * Avalia um serviço concluído com uma nota de 1 a 5 e feedback opcional【522691621467066†L554-L590】.
 *
 * @param serviceId ID do serviço
 * @param rating Nota entre 1 e 5
 * @param feedback Comentários adicionais (opcional)
 */
export const rateService = async (
  serviceId: string,
  rating: number,
  feedback?: string
): Promise<any> => {
  const response = await api.patch(`/services/${serviceId}/rate`, {
    rating,
    feedback,
  });
  return extractData(response);
};

// ===== Transactions =====

/**
 * Lista transações de serviços do cliente. Apenas administradores da empresa
 * podem consultar. Permite filtrar por status de pagamento【522691621467066†L601-L654】.
 *
 * @param params Parâmetros de filtragem e paginação
 */
export const listTransactions = async (
  params?: { page?: number; pageSize?: number; paymentStatus?: string }
): Promise<any> => {
  const response = await api.get('/services/transactions', { params });
  return extractData(response);
};

/**
 * Atualiza o status de pagamento de uma transação【522691621467066†L661-L699】.
 *
 * @param transactionId ID da transação
 * @param paymentStatus Novo status ('pending' ou 'paid')
 * @param paymentMethod Método de pagamento (ex.: 'pix', 'cartao') (opcional)
 * @param transactionIdExt ID fornecido pelo provedor de pagamento (opcional)
 */
export const updateTransactionPayment = async (
  transactionId: string,
  paymentStatus: string,
  paymentMethod?: string,
  transactionIdExt?: string
): Promise<any> => {
  const response = await api.patch(`/services/transactions/${transactionId}/payment`, {
    paymentStatus,
    paymentMethod,
    transactionId: transactionIdExt,
  });
  return extractData(response);
};