/**
 * Deduplication Service
 *
 * Este serviço fornece uma API de alto nível para interação com o módulo de deduplicação do backend.
 * O backend implementa todas as funcionalidades de detecção, listagem, merge e feedback de duplicatas
 * disponíveis em `/api/v1/deduplication` conforme definido no arquivo
 * `backend/src/modules/deduplication/index.ts`【361028060794306†L24-L49】.
 *
 * Diferentemente da versão gerada automaticamente que apenas montava URLs genéricas com o
 * `entityType` na rota, este serviço utiliza as rotas reais expostas pelo backend. Ele aceita
 * parâmetros fortemente tipados e converte as respostas em dados prontos para uso no frontend.
 */

import api, { extractData } from '../../../core/utils/api';

/**
 * Detecta possíveis registros duplicados utilizando algoritmos de similaridade e IA.
 *
 * @param entityType Tipo de entidade a analisar (`contact`, `deal` ou `company`).
 * @param minSimilarity Valor mínimo de similaridade (0–1) para que dois registros sejam considerados
 *        duplicados. Quando omitido, o backend utiliza o valor padrão definido pelo módulo
 *        (tipicamente 0.85)【361028060794306†L29-L37】.
 * @returns Lista de grupos de candidatos a duplicados. Cada grupo contém uma entrada `candidates`
 *          com a quantidade de registros e `items` com os dados brutos retornados pelo backend.
 */
export const detectDuplicates = async (
  entityType: 'contact' | 'deal' | 'company',
  minSimilarity?: number
): Promise<{ totalGroups: number; groups: Array<{ candidates: number; items: any }> }> => {
  const response = await api.post('/deduplication/detect', { entityType, minSimilarity });
  return extractData(response);
};

/**
 * Obtém a lista de detecções pendentes de duplicatas que ainda não foram revisadas.
 *
 * @returns Array de detecções pendentes conforme retornado pelo backend【361028060794306†L55-L66】.
 */
export const getPendingDetections = async (): Promise<any[]> => {
  const response = await api.get('/deduplication/pending');
  return extractData(response);
};

/**
 * Realiza o merge de um grupo de duplicatas em um registro principal. O backend valida
 * permissões e executa o merge atômico de acordo com o schema Prisma【361028060794306†L72-L83】.
 *
 * @param primaryId ID do registro que deve permanecer como master.
 * @param duplicateIds IDs dos registros duplicados a serem mesclados ao master.
 * @param entityType Tipo da entidade (`contact`, `deal` ou `company`).
 * @returns Resultado do merge com possíveis contagens ou dados adicionais.
 */
export const mergeDuplicates = async (
  primaryId: string,
  duplicateIds: string[],
  entityType: 'contact' | 'deal' | 'company'
): Promise<any> => {
  const response = await api.post('/deduplication/merge', {
    primaryId,
    duplicateIds,
    entityType,
  });
  return extractData(response);
};

/**
 * Envia feedback sobre uma detecção de duplicata para treinar o algoritmo.
 * A ação pode ser `accept`, `reject` ou `ignore` e é aplicada à detecção com o ID fornecido【361028060794306†L89-L103】.
 *
 * @param detectionId ID da detecção de duplicata a ser revisada.
 * @param action Ação tomada pelo usuário (`accept`, `reject` ou `ignore`).
 */
export const sendFeedback = async (
  detectionId: string,
  action: 'accept' | 'reject' | 'ignore'
): Promise<void> => {
  await api.post('/deduplication/feedback', { detectionId, action });
};

/**
 * Lista o histórico de merges realizados para a empresa atual【361028060794306†L110-L118】.
 *
 * @returns Array de registros de merge contendo IDs, datas e metadados do merge.
 */
export const getHistory = async (): Promise<any[]> => {
  const response = await api.get('/deduplication/history');
  return extractData(response);
};

/**
 * Desfaz um merge previamente realizado. Apenas administradores podem executar esta operação
 * conforme definido no backend【361028060794306†L124-L135】.
 *
 * @param mergeId ID do merge a ser revertido.
 */
export const rollbackMerge = async (mergeId: string): Promise<void> => {
  await api.post(`/deduplication/rollback/${mergeId}`);
};

/**
 * Executa merge automático de duplicatas com alta confiança. O backend detecta duplicatas
 * com similaridade superior a 95% e as mescla em lote【361028060794306†L164-L184】.
 *
 * @returns Objeto contendo o número de grupos processados e a quantidade de registros mesclados.
 */
export const autoMerge = async (): Promise<{ groups: number; mergedCount: number }> => {
  const response = await api.post('/deduplication/auto-merge');
  return extractData(response);
};