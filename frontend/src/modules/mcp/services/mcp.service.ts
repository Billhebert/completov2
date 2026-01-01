/**
 * MCP Service
 * TODO: Implementar Model Context Protocol
 */

import api, { extractData } from '../../../core/utils/api';
import { MCPServer, MCPResource } from '../types';

/**
 * TODO: Listar servidores MCP
 */
export const getServers = async (): Promise<MCPServer[]> => {
  const response = await api.get('/mcp/servers');
  return extractData(response);
};

/**
 * TODO: Registrar servidor MCP
 * - Validar URL e capabilities
 * - Testar conexão
 */
export const registerServer = async (data: Partial<MCPServer>): Promise<MCPServer> => {
  const response = await api.post('/mcp/servers', data);
  return extractData(response);
};

/**
 * TODO: Buscar recursos de um servidor
 */
export const getServerResources = async (serverId: string): Promise<MCPResource[]> => {
  const response = await api.get(`/mcp/servers/${serverId}/resources`);
  return extractData(response);
};

/**
 * TODO: Executar ação em recurso MCP
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
