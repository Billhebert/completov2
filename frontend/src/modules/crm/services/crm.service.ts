/**
 * CRM Service
 *
 * Este serviço encapsula as chamadas ao módulo CRM do backend. Ele
 * expõe funções de alto nível para listar, criar, atualizar e excluir
 * contatos e negócios, além de registrar interações e obter análises
 * baseadas em IA. Ao utilizar os endpoints reais definidos no backend,
 * evitamos duplicar lógica de URL e garantimos consistência com a API.
 */

import api, { extractData } from '../../../core/utils/api';

/**
 * Lista contatos com filtros opcionais e paginação. O backend permite
 * pesquisar por nome/empresa/email, filtrar por tag, status de lead ou
 * proprietário, e retorna a lista com paginação conforme definido em
 * `backend/src/modules/crm/index.ts`【106286760689486†L52-L95】.
 *
 * @param params Filtros opcionais: search, tag, leadStatus, ownerId, page, limit.
 * @returns Objeto contendo array de contatos e metadados de paginação.
 */
export const getContacts = async (params: {
  search?: string;
  tag?: string;
  leadStatus?: string;
  ownerId?: string;
  page?: number;
  limit?: number;
} = {}): Promise<any> => {
  const response = await api.get('/crm/contacts', { params });
  return extractData(response);
};

/**
 * Recupera um contato específico com seus negócios e interações recentes【106286760689486†L126-L152】.
 *
 * @param id ID do contato a ser buscado.
 * @returns Dados completos do contato incluindo proprietário, deals e interações.
 */
export const getContact = async (id: string): Promise<any> => {
  const response = await api.get(`/crm/contacts/${id}`);
  return extractData(response);
};

/**
 * Cria um novo contato. O backend atribui a empresa e o proprietário
 * conforme o usuário autenticado【106286760689486†L101-L121】.
 *
 * @param contactData Dados do contato a ser criado.
 * @returns Contato criado.
 */
export const createContact = async (contactData: {
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  position?: string;
  website?: string;
  tags?: string[];
  ownerId?: string;
}): Promise<any> => {
  const response = await api.post('/crm/contacts', contactData);
  return extractData(response);
};

/**
 * Atualiza os dados de um contato existente【106286760689486†L154-L160】.
 *
 * @param id Identificador do contato.
 * @param updates Objeto contendo os campos a serem atualizados.
 * @returns Contato atualizado.
 */
export const updateContact = async (id: string, updates: any): Promise<any> => {
  const response = await api.patch(`/crm/contacts/${id}`, updates);
  return extractData(response);
};

/**
 * Exclui permanentemente um contato【106286760689486†L166-L172】.
 *
 * @param id Identificador do contato a ser removido.
 */
export const deleteContact = async (id: string): Promise<void> => {
  await api.delete(`/crm/contacts/${id}`);
};

/**
 * Lista negócios (deals) associados à empresa com filtros opcionais de estágio
 * e proprietário【106286760689486†L181-L216】.
 *
 * @param params Filtros: stage, ownerId, page e limit para paginação.
 * @returns Lista de deals com informações de contato, proprietário e produtos.
 */
export const getDeals = async (params: {
  stage?: string;
  ownerId?: string;
  page?: number;
  limit?: number;
} = {}): Promise<any> => {
  const response = await api.get('/crm/deals', { params });
  return extractData(response);
};

/**
 * Cria um novo negócio (deal) no CRM【106286760689486†L221-L250】.
 * O backend calcula o total dos produtos e publica um evento de criação.
 *
 * @param dealData Dados do deal incluindo título, ID do contato, valor e produtos.
 * @returns Deal criado com detalhes de produtos.
 */
export const createDeal = async (dealData: {
  title: string;
  contactId: string;
  value: number;
  currency?: string;
  stage?: string;
  expectedCloseDate?: string;
  ownerId?: string;
  products?: { productId: string; productName: string; quantity: number; unitPrice: number }[];
}): Promise<any> => {
  const response = await api.post('/crm/deals', dealData);
  return extractData(response);
};

/**
 * Atualiza o estágio de um negócio e define a data de fechamento quando ganho ou perdido【106286760689486†L255-L279】.
 *
 * @param id ID do deal a ser atualizado.
 * @param stage Novo estágio (por exemplo, 'prospect', 'qualified', 'won', 'lost').
 * @returns Deal atualizado.
 */
export const updateDealStage = async (id: string, stage: string): Promise<any> => {
  const response = await api.patch(`/crm/deals/${id}/stage`, { stage });
  return extractData(response);
};

/**
 * Registra uma nova interação (ligação, email, reunião ou anotação)【106286760689486†L288-L298】.
 *
 * @param interactionData Dados da interação a ser criada.
 * @returns Interação criada.
 */
export const createInteraction = async (interactionData: {
  type: 'call' | 'email' | 'meeting' | 'note';
  contactId?: string;
  dealId?: string;
  subject?: string;
  content: string;
  direction?: 'inbound' | 'outbound';
  scheduledFor?: string;
}): Promise<any> => {
  const response = await api.post('/crm/interactions', interactionData);
  return extractData(response);
};

/**
 * Lista interações com filtros de contato, deal e tipo【106286760689486†L303-L327】.
 *
 * @param params Filtros opcionais: contactId, dealId, type e limite de resultados.
 * @returns Lista de interações ordenada por data (mais recente primeiro).
 */
export const getInteractions = async (params: {
  contactId?: string;
  dealId?: string;
  type?: string;
  limit?: number;
} = {}): Promise<any> => {
  const response = await api.get('/crm/interactions', { params });
  return extractData(response);
};

/**
 * Obtém a probabilidade de um negócio ser fechado com sucesso, calculada por IA【106286760689486†L333-L415】.
 *
 * @param id ID do deal para análise.
 * @returns Objeto contendo probabilidade, confiança, nível de risco e ações sugeridas.
 */
export const getDealProbability = async (id: string): Promise<any> => {
  const response = await api.get(`/crm/deals/${id}/probability`);
  return extractData(response);
};

/**
 * Solicita sugestões de enriquecimento de dados para um contato específico【106286760689486†L420-L493】.
 *
 * @param id Identificador do contato.
 * @returns Dados contendo campos faltantes, percentual de completude e sugestões de enriquecimento.
 */
export const getContactEnrichment = async (id: string): Promise<any> => {
  const response = await api.get(`/crm/contacts/${id}/enrich`);
  return extractData(response);
};

/**
 * Calcula o score de engajamento de um contato com base em interações e negócios【106286760689486†L498-L580】.
 *
 * @param id Identificador do contato.
 * @returns Dados contendo score de engajamento, nível de engajamento, métricas e próxima ação sugerida.
 */
export const getContactEngagement = async (id: string): Promise<any> => {
  const response = await api.get(`/crm/contacts/${id}/engagement`);
  return extractData(response);
};

/**
 * Obtém um resumo do pipeline de negócios, agrupando por estágio e somando valores【106286760689486†L590-L599】.
 *
 * @returns Array com objetos representando cada estágio do pipeline e respectivos totais.
 */
export const getPipelineSummary = async (): Promise<any> => {
  const response = await api.get('/crm/analytics/pipeline');
  return extractData(response);
};