/**
 * Omnichannel Service
 *
 * Este serviço encapsula as operações de integração omnichannel, incluindo
 * gerenciamento de contas WhatsApp, envio de mensagens e controle de conversas.
 * O backend expõe rotas para criar e listar contas, gerar QR codes, obter o
 * status de instâncias, desconectar e remover contas, além de listar,
 * criar e atualizar conversas【880247964071651†L23-L61】.
 */

import api, { extractData } from '../../../core/utils/api';

// ========================
// Contas WhatsApp
// ========================

/**
 * Lista as contas do WhatsApp registradas para a empresa do usuário.
 *
 * Retorna id, nome, instanceName, status e datas de criação/conexão【880247964071651†L28-L41】.
 */
export const getWhatsAppAccounts = async (): Promise<any[]> => {
  const response = await api.get('/omnichannel/whatsapp/accounts');
  return extractData(response);
};

/**
 * Cria uma nova conta do WhatsApp e inicia a instância no Evolution API.
 *
 * A propriedade `webhookUrl` é opcional; caso omitida, o backend define uma URL padrão【880247964071651†L49-L63】.
 *
 * @param data Objeto contendo `name`, `instanceName`, `apiUrl`, `apiKey` e opcionalmente `webhookUrl`.
 */
export const createWhatsAppAccount = async (data: {
  name: string;
  instanceName: string;
  apiUrl: string;
  apiKey: string;
  webhookUrl?: string;
}): Promise<any> => {
  const response = await api.post('/omnichannel/whatsapp/accounts', data);
  return extractData(response);
};

/**
 * Gera o QR code necessário para autenticar a instância de WhatsApp.
 *
 * @param accountId ID da conta de WhatsApp.
 */
export const getWhatsAppQRCode = async (accountId: string): Promise<{ qr: string }> => {
  const response = await api.get(`/omnichannel/whatsapp/accounts/${accountId}/qrcode`);
  return extractData(response);
};

/**
 * Envia uma mensagem para um contato a partir de uma conta específica.
 *
 * @param accountId ID da conta de WhatsApp.
 * @param to Número de telefone do destinatário (incluindo DDI).
 * @param text Conteúdo da mensagem.
 */
export const sendWhatsAppMessage = async (
  accountId: string,
  to: string,
  text: string
): Promise<any> => {
  const response = await api.post(`/omnichannel/whatsapp/accounts/${accountId}/send`, {
    to,
    text,
  });
  return extractData(response);
};

/**
 * Recupera o status atual da instância (conectado, desconectado, etc.).
 *
 * @param accountId ID da conta de WhatsApp.
 */
export const getInstanceStatus = async (accountId: string): Promise<any> => {
  const response = await api.get(`/omnichannel/whatsapp/accounts/${accountId}/status`);
  return extractData(response);
};

/**
 * Desconecta a instância de WhatsApp.
 *
 * @param accountId ID da conta de WhatsApp.
 */
export const disconnectInstance = async (accountId: string): Promise<{ message: string }> => {
  const response = await api.post(`/omnichannel/whatsapp/accounts/${accountId}/disconnect`);
  return extractData(response);
};

/**
 * Exclui uma conta de WhatsApp. O backend também tenta desconectar a instância automaticamente【880247964071651†L155-L176】.
 *
 * @param accountId ID da conta a ser removida.
 */
export const deleteWhatsAppAccount = async (accountId: string): Promise<void> => {
  await api.delete(`/omnichannel/whatsapp/accounts/${accountId}`);
};

// ========================
// Conversas
// ========================

/**
 * Lista conversas com filtros opcionais por status, canal e contato, além de suporte a paginação【880247964071651†L186-L223】.
 *
 * @param params Query params: `status`, `channel`, `contactId`, `page`, `pageSize`.
 */
export const listConversations = async (
  params?: Record<string, string | number>
): Promise<{
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> => {
  const response = await api.get('/omnichannel/conversations', { params });
  return extractData(response);
};

/**
 * Cria uma nova conversa para um contato em um canal específico【880247964071651†L229-L255】.
 *
 * Se nenhum `assignedToId` for fornecido, o backend atribui a conversa ao usuário atual.
 *
 * @param data Objeto contendo `contactId`, `channel`, `status` e opcionalmente `assignedToId`.
 */
export const createConversation = async (data: {
  contactId: string;
  channel?: string;
  status?: string;
  assignedToId?: string;
}): Promise<any> => {
  const response = await api.post('/omnichannel/conversations', data);
  return extractData(response);
};

/**
 * Recupera os detalhes de uma conversa específica, incluindo contato, responsável e últimas mensagens【880247964071651†L260-L283】.
 *
 * @param id ID da conversa.
 */
export const getConversation = async (id: string): Promise<any> => {
  const response = await api.get(`/omnichannel/conversations/${id}`);
  return extractData(response);
};

/**
 * Atualiza o status ou o responsável de uma conversa【880247964071651†L289-L309】.
 *
 * @param id ID da conversa.
 * @param data Campos para atualizar (`status` e/ou `assignedToId`).
 */
export const updateConversation = async (
  id: string,
  data: { status?: string; assignedToId?: string }
): Promise<any> => {
  const response = await api.patch(`/omnichannel/conversations/${id}`, data);
  return extractData(response);
};
