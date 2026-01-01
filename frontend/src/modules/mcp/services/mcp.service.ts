/**
 * MCP Service
 *
 * Este serviço fornece uma interface de alto nível para o módulo Model Context
 * Protocol (MCP) do backend. O MCP permite registrar servidores que expõem
 * recursos, ferramentas e outras capacidades que podem ser consumidas por
 * modelos de linguagem ou agentes de IA. O backend expõe rotas REST para
 * listar, recuperar, criar, atualizar e excluir servidores MCP, bem como
 * gerenciar suas ferramentas, recursos e logs. Estas rotas são definidas em
 * `backend/src/modules/mcp/index.ts` e incluem:
 *
 * - **Listar servidores**: `GET /mcp/servers` retorna todos os servidores
 *   MCP ativos para a empresa, incluindo contagem de ferramentas e
 *   recursos【516780721931819†L14-L33】.
 * - **Recuperar servidor**: `GET /mcp/servers/:id` obtém um servidor pelo
 *   ID e inclui suas ferramentas, recursos e últimos 50 logs【516780721931819†L41-L60】.
 * - **Criar servidor**: `POST /mcp/servers` cria um novo servidor com
 *   informações como nome, descrição, tipo, comando e args【516780721931819†L67-L87】.
 * - **Atualizar servidor**: `PATCH /mcp/servers/:id` atualiza campos de
 *   configuração de um servidor existente【516780721931819†L93-L100】.
 * - **Excluir servidor**: `DELETE /mcp/servers/:id` remove um servidor
 *   definitivamente【516780721931819†L106-L113】.
 * - **Listar ferramentas**: `GET /mcp/servers/:id/tools` lista todas as
 *   ferramentas registradas para um servidor【516780721931819†L118-L127】.
 * - **Criar ferramenta**: `POST /mcp/servers/:id/tools` registra uma
 *   nova ferramenta para o servidor【516780721931819†L133-L146】.
 * - **Listar recursos**: `GET /mcp/servers/:id/resources` retorna
 *   recursos disponíveis no servidor【516780721931819†L152-L161】.
 * - **Criar recurso**: `POST /mcp/servers/:id/resources` adiciona
 *   um recurso ao servidor【516780721931819†L166-L181】.
 * - **Listar logs**: `GET /mcp/servers/:id/logs` recupera logs do
 *   servidor, opcionalmente filtrados por nível e limite【516780721931819†L189-L201】.
 * - **Criar log**: `POST /mcp/servers/:id/logs` registra um evento de
 *   log manualmente【516780721931819†L207-L219】.
 *
 * Este serviço implementa funções que refletem essas rotas, retornando
 * diretamente os dados do backend via Axios. Todas as respostas são
 * processadas com `extractData` para extrair o campo `data`.
 */

import api, { extractData } from '../../../core/utils/api';

/**
 * Lista todos os servidores MCP da empresa atual.
 *
 * @param params Parâmetros opcionais para filtragem ou ordenação (por exemplo,
 *               `{ type: 'filesystem', status: 'connected' }`).
 * @returns Um array de servidores MCP com contagens de ferramentas e
 *          recursos. Veja o backend para detalhes de campos retornados【516780721931819†L14-L33】.
 */
export const getServers = async (
  params?: Record<string, string | number | boolean>
): Promise<any[]> => {
  const response = await api.get('/mcp/servers', { params });
  return extractData(response);
};

/**
 * Recupera um único servidor MCP pelo ID. Inclui listas de ferramentas,
 * recursos e os 50 logs mais recentes【516780721931819†L41-L60】.
 *
 * @param id ID do servidor MCP.
 * @returns Objeto representando o servidor.
 */
export const getServer = async (id: string): Promise<any> => {
  const response = await api.get(`/mcp/servers/${id}`);
  return extractData(response);
};

/**
 * Cria um novo servidor MCP. O usuário deve ter permissão de administrador
 * de empresa para executar esta operação【516780721931819†L67-L87】.
 *
 * @param data Objeto de criação contendo campos como `name`, `description`,
 *             `type`, `command`, `args`, `env`, `config` e `isPublic`.
 * @returns O servidor recém-criado.
 */
export const createServer = async (data: any): Promise<any> => {
  const response = await api.post('/mcp/servers', data);
  return extractData(response);
};

/**
 * Atualiza campos de um servidor MCP existente【516780721931819†L93-L100】.
 * Somente administradores podem executar esta operação.
 *
 * @param id ID do servidor a ser atualizado.
 * @param data Dados parciais para atualização.
 * @returns O servidor atualizado.
 */
export const updateServer = async (id: string, data: any): Promise<any> => {
  const response = await api.patch(`/mcp/servers/${id}`, data);
  return extractData(response);
};

/**
 * Remove definitivamente um servidor MCP【516780721931819†L106-L113】.
 * Apenas administradores podem excluir servidores.
 *
 * @param id ID do servidor a ser removido.
 */
export const deleteServer = async (id: string): Promise<void> => {
  await api.delete(`/mcp/servers/${id}`);
};

/**
 * Lista as ferramentas registradas em um servidor MCP【516780721931819†L118-L127】.
 *
 * @param serverId ID do servidor.
 * @returns Array de ferramentas.
 */
export const getServerTools = async (serverId: string): Promise<any[]> => {
  const response = await api.get(`/mcp/servers/${serverId}/tools`);
  return extractData(response);
};

/**
 * Cria uma nova ferramenta para um servidor MCP【516780721931819†L133-L146】.
 * Requer permissões de administrador.
 *
 * @param serverId ID do servidor.
 * @param data Objeto contendo `name`, `description` e, opcionalmente,
 *             `inputSchema`.
 * @returns A ferramenta criada.
 */
export const createServerTool = async (
  serverId: string,
  data: { name: string; description?: string; inputSchema?: any }
): Promise<any> => {
  const response = await api.post(`/mcp/servers/${serverId}/tools`, data);
  return extractData(response);
};

/**
 * Lista os recursos expostos por um servidor MCP【516780721931819†L152-L161】.
 *
 * @param serverId ID do servidor.
 * @returns Array de recursos.
 */
export const getServerResources = async (serverId: string): Promise<any[]> => {
  const response = await api.get(`/mcp/servers/${serverId}/resources`);
  return extractData(response);
};

/**
 * Cria um novo recurso para um servidor MCP【516780721931819†L166-L181】.
 *
 * @param serverId ID do servidor.
 * @param data Objeto contendo `uri`, `name`, `description` e `mimeType`.
 * @returns O recurso criado.
 */
export const createResource = async (
  serverId: string,
  data: { uri: string; name: string; description?: string; mimeType?: string }
): Promise<any> => {
  const response = await api.post(`/mcp/servers/${serverId}/resources`, data);
  return extractData(response);
};

/**
 * Recupera logs de um servidor MCP. É possível filtrar pelo nível de log
 * (por exemplo, `info`, `warn`, `error`) e definir um limite de registros
 * retornados【516780721931819†L189-L201】.
 *
 * @param serverId ID do servidor.
 * @param params Objeto opcional com `level` e `limit`.
 * @returns Array de logs do servidor.
 */
export const getServerLogs = async (
  serverId: string,
  params?: { level?: string; limit?: number }
): Promise<any[]> => {
  const response = await api.get(`/mcp/servers/${serverId}/logs`, { params });
  return extractData(response);
};

/**
 * Cria um log manualmente para um servidor MCP【516780721931819†L207-L219】.
 *
 * @param serverId ID do servidor.
 * @param data Objeto contendo `level` (default `info`), `message` e
 *             `metadata` adicional.
 * @returns O log criado.
 */
export const createServerLog = async (
  serverId: string,
  data: { level?: string; message: string; metadata?: any }
): Promise<any> => {
  const response = await api.post(`/mcp/servers/${serverId}/logs`, data);
  return extractData(response);
};

/**
 * Executa uma ação (tool) em um recurso MCP. Embora o backend atual
 * não exponha explicitamente uma rota `/mcp/resources/{resourceId}/execute`,
 * alguns servidores MCP suportam invocações diretas de tools nos seus
 * recursos. Esta função mantém compatibilidade com versões futuras em que
 * essa rota seja implementada.
 *
 * @param resourceId Identificador do recurso (URI ou ID dependendo do servidor).
 * @param action Nome da ação/tool a ser executada.
 * @param params Parâmetros de entrada para a tool.
 * @returns Resultado da execução da tool.
 */
export const executeAction = async (
  resourceId: string,
  action: string,
  params?: Record<string, unknown>
): Promise<unknown> => {
  const response = await api.post(`/mcp/resources/${resourceId}/execute`, {
    action,
    params,
  });
  return extractData(response);
};