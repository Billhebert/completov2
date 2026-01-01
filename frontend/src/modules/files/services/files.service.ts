/**
 * Files Service
 * TODO: Implementar serviço de gestão de arquivos
 */

import api, { extractData } from '../../../core/utils/api';
import { FileItem, Folder, UploadFileRequest, FileFilters } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

/**
 * TODO: Implementar listagem de arquivos
 * - Filtrar por pasta, tipo, tags, usuário
 * - Suportar busca por nome
 * - Ordenar por data, nome, tamanho
 */
export const getFiles = async (
  params?: PaginationParams & FileFilters
): Promise<PaginatedResult<FileItem>> => {
  const response = await api.get('/files', { params });
  return extractData(response);
};

/**
 * TODO: Implementar upload de arquivo
 * - Validar tipo e tamanho máximo
 * - Gerar thumbnail para imagens
 * - Escanear por vírus
 * - Salvar em storage (S3/local)
 */
export const uploadFile = async (data: UploadFileRequest): Promise<FileItem> => {
  const formData = new FormData();
  formData.append('file', data.file);
  if (data.folderId) formData.append('folderId', data.folderId);
  if (data.isPublic !== undefined) formData.append('isPublic', String(data.isPublic));
  if (data.tags) formData.append('tags', JSON.stringify(data.tags));
  
  const response = await api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return extractData(response);
};

/**
 * TODO: Implementar download de arquivo
 * - Incrementar contador de downloads
 * - Validar permissões (se não for público)
 * - Gerar URL assinada temporária
 */
export const downloadFile = async (id: string): Promise<Blob> => {
  const response = await api.get(`/files/${id}/download`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * TODO: Implementar exclusão de arquivo
 * - Remover do storage
 * - Remover registros do DB
 * - Validar permissões
 */
export const deleteFile = async (id: string): Promise<void> => {
  await api.delete(`/files/${id}`);
};

/**
 * TODO: Implementar criação de pasta
 * - Validar nome único no mesmo nível
 * - Criar estrutura de path
 */
export const createFolder = async (name: string, parentId?: string): Promise<Folder> => {
  const response = await api.post('/files/folders', { name, parentId });
  return extractData(response);
};

/**
 * TODO: Implementar listagem de pastas
 * - Estrutura em árvore
 * - Incluir contagem de arquivos
 */
export const getFolders = async (parentId?: string): Promise<Folder[]> => {
  const response = await api.get('/files/folders', { params: { parentId } });
  return extractData(response);
};
