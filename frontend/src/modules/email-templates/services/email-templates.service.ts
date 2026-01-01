/**
 * Email Templates Service
 *
 * Este serviço encapsula as chamadas para os modelos de email disponíveis no
 * backend. É possível listar modelos disponíveis, gerar uma prévia com
 * variáveis customizadas e enviar emails transacionais usando esses
 * modelos【533419220309048†L11-L66】.
 */

import api, { extractData } from '../../../core/utils/api';

/**
 * Lista os modelos de email disponíveis para a empresa. Cada item contém
 * nome e descrição【533419220309048†L11-L19】.
 */
export const listEmailTemplates = async (): Promise<any[]> => {
  const response = await api.get('/email-templates');
  return extractData(response);
};

/**
 * Gera uma prévia do email renderizado para o template informado, usando as
 * variáveis fornecidas【533419220309048†L25-L39】.
 *
 * @param templateName Nome do template (ex.: 'welcome', 'invoice')
 * @param variables    Objeto de variáveis para interpolação no template
 */
export const previewEmailTemplate = async (
  templateName: string,
  variables: Record<string, any>
): Promise<any> => {
  const response = await api.post('/email-templates/preview', { templateName, variables });
  return extractData(response);
};

/**
 * Envia um email utilizando um template pré-definido. O backend enfileira o
 * envio e retorna mensagem de sucesso【533419220309048†L45-L66】.
 *
 * @param to           Destinatário do email
 * @param templateName Nome do template
 * @param variables    Variáveis para preencher no template
 */
export const sendTemplatedEmail = async (
  to: string,
  templateName: string,
  variables: Record<string, any>
): Promise<any> => {
  const response = await api.post('/email-templates/send', { to, templateName, variables });
  return extractData(response);
};