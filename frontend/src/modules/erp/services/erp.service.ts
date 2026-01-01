/**
 * ERP Integration Service
 * Integração completa com sistemas ERP (SAP, Oracle, TOTVS)
 */

import api, { extractData } from '../../../core/utils/api';
import { ERPIntegration, ERPSyncJob, ERPMapping } from '../types';
import { PaginatedResult } from '../../../core/types';

/**
 * Lista integrações ERP configuradas
 * TODO: Implementar gestão de integrações ERP
 * - Suportar SAP, Oracle NetSuite, TOTVS Protheus
 * - Status de conexão em tempo real
 * - Sincronização bidire

cional de dados
 * - Mapeamento de campos customizável
 * - Logs de sincronização
 */
export const getIntegrations = async (): Promise<ERPIntegration[]> => {
  const response = await api.get('/erp/integrations');
  return extractData(response);
};

/**
 * Criar nova integração ERP
 * TODO: Implementar configuração e teste de conexão
 * - Wizard de configuração passo-a-passo
 * - Testar credenciais e conectividade
 * - Mapear entidades (produtos, clientes, pedidos)
 * - Configurar regras de sincronização
 * - Validar compatibilidade de versão
 */
export const createIntegration = async (data: Partial<ERPIntegration>): Promise<ERPIntegration> => {
  const response = await api.post('/erp/integrations', data);
  return extractData(response);
};

/**
 * Sincronizar dados com ERP
 * TODO: Implementar sincronização assíncrona
 * - Queue de sync (evitar sobrecarga)
 * - Sincronização incremental (apenas mudanças)
 * - Tratamento de conflitos
 * - Rollback em caso de erro
 * - Notificar conclusão
 */
export const syncData = async (integrationId: string): Promise<ERPSyncJob> => {
  const response = await api.post(\`/erp/integrations/\${integrationId}/sync\`);
  return extractData(response);
};

/**
 * Buscar mapeamentos de campos
 * TODO: Implementar sistema de mapeamento flexível
 * - Mapear campos do sistema → campos ERP
 * - Transformações customizadas (scripts)
 * - Validação de tipos
 * - Preview de dados mapeados
 */
export const getMappings = async (integrationId: string): Promise<ERPMapping[]> => {
  const response = await api.get(\`/erp/integrations/\${integrationId}/mappings\`);
  return extractData(response);
};
