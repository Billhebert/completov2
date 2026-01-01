/**
 * Files Service
 *
 * Este serviço fornece métodos para interagir com o módulo de arquivos do
 * backend. As rotas contemplam upload de arquivos genéricos ou avatars,
 * listagem de arquivos associados a entidades, geração de URLs assinadas
 * para visualização, download e exclusão de arquivos【455765087530948†L39-L223】.
 */

import api, { extractData } from '../../../core/utils/api';

/**
 * Faz upload de um arquivo para o servidor. O backend aceita arquivos
 * de imagem, PDF e documentos Office de até 10MB【455765087530948†L8-L25】.
 *
 * @param file Objeto `File` ou `Blob` a ser enviado.
 * @param entityType Tipo de entidade associada (ex.: 'contact', 'deal'); opcional.
 * @param entityId ID da entidade associada; opcional.
 * @returns Metadados do arquivo armazenado.
 */
export const uploadFile = async (
  file: File | Blob,
  entityType?: string,
  entityId?: string
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  if (entityType) formData.append('entityType', entityType);
  if (entityId) formData.append('entityId', entityId);
  const response = await api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return extractData(response);
};

/**
 * Lista arquivos conforme filtros de tipo e entidade【455765087530948†L85-L104】.
 *
 * @param entityType Tipo de entidade (caso especificado, filtra por este tipo).
 * @param entityId ID da entidade para filtrar arquivos específicos.
 * @returns Lista de arquivos com informações de quem enviou, tamanho e
 *          data de upload.
 */
export const listFiles = async (
  entityType?: string,
  entityId?: string
): Promise<any[]> => {
  const params: any = {};
  if (entityType) params.entityType = entityType;
  if (entityId) params.entityId = entityId;
  const response = await api.get('/files', { params });
  return extractData(response);
};

/**
 * Recupera uma URL assinada para acessar o arquivo. A URL expira em 1 hora【455765087530948†L110-L129】.
 *
 * @param id Identificador do arquivo.
 * @returns Objeto contendo URL e tempo de expiração em segundos.
 */
export const getFileUrl = async (id: string): Promise<{ url: string; expiresIn: number }> => {
  const response = await api.get(`/files/${id}/url`);
  return extractData(response);
};

/**
 * Faz download de um arquivo binário. O chamador é responsável por
 * criar um blob e salvar via `URL.createObjectURL` ou outra técnica【455765087530948†L136-L156】.
 *
 * @param id Identificador do arquivo.
 * @returns `Blob` com o conteúdo do arquivo.
 */
export const downloadFile = async (id: string): Promise<Blob> => {
  const response = await api.get(`/files/${id}/download`, { responseType: 'blob' });
  return response.data;
};

/**
 * Exclui definitivamente um arquivo tanto do armazenamento quanto do banco de dados【455765087530948†L162-L185】.
 *
 * @param id Identificador do arquivo.
 */
export const deleteFile = async (id: string): Promise<void> => {
  await api.delete(`/files/${id}`);
};

/**
 * Envia um avatar para o perfil do usuário logado. O backend salva o
 * objeto no bucket `avatars` e atualiza o usuário【455765087530948†L191-L223】.
 *
 * @param avatar Objeto `File` ou `Blob` representando o avatar.
 * @returns Objeto contendo o nome do objeto e a URL assinada.
 */
export const uploadAvatar = async (avatar: File | Blob): Promise<{ avatar: string; url: string }> => {
  const formData = new FormData();
  formData.append('avatar', avatar);
  const response = await api.post('/files/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return extractData(response);
};