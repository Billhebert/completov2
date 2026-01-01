/**
 * Jobs Service
 *
 * Este serviço provê métodos para listar, criar, atualizar e remover
 * vagas de emprego, além de operações relacionadas a candidaturas e
 * interesses. Ele espelha a API do backend, que implementa controle
 * de acesso para diferentes tipos de vagas (públicas, internas e de parceiros)
 * e permite que candidatos apliquem e marquem interesse【638052685116415†L26-L68】【638052685116415†L283-L373】.
 */

import api, { extractData } from '../../../core/utils/api';

// ========================
// Vagas
// ========================

/**
 * Lista vagas com filtros opcionais e paginação【638052685116415†L27-L93】.
 *
 * @param params Objeto de consulta (page, pageSize, status, type, isSpecialized, search).
 */
export const listJobs = async (
  params?: Record<string, string | number | boolean>
): Promise<{ data: any[]; total: number; page: number; pageSize: number; totalPages: number }> => {
  const response = await api.get('/jobs', { params });
  return extractData(response);
};

/**
 * Recupera detalhes de uma vaga específica【638052685116415†L135-L161】.
 *
 * @param id ID da vaga.
 */
export const getJob = async (id: string): Promise<any> => {
  const response = await api.get(`/jobs/${id}`);
  return extractData(response);
};

/**
 * Cria uma nova vaga. Somente usuários com função apropriada (DEV, admin ou admin_empresa) podem criar【638052685116415†L169-L199】.
 *
 * @param data Objeto com dados da vaga (title, description, types, requiredSkills, desiredSkills, etc.).
 */
export const createJob = async (data: any): Promise<any> => {
  const response = await api.post('/jobs', data);
  return extractData(response);
};

/**
 * Atualiza uma vaga existente【638052685116415†L205-L244】.
 *
 * @param id ID da vaga.
 * @param data Dados a serem atualizados.
 */
export const updateJob = async (id: string, data: any): Promise<any> => {
  const response = await api.put(`/jobs/${id}`, data);
  return extractData(response);
};

/**
 * Remove uma vaga【638052685116415†L250-L274】.
 *
 * @param id ID da vaga.
 */
export const deleteJob = async (id: string): Promise<void> => {
  await api.delete(`/jobs/${id}`);
};

// ========================
// Candidaturas e interesse
// ========================

/**
 * Aplica a uma vaga com carta de apresentação, currículo e documentos【638052685116415†L283-L331】.
 *
 * @param id ID da vaga.
 * @param data Objeto contendo `coverLetter`, `resume` e opcional `documents`.
 */
export const applyToJob = async (
  id: string,
  data: { coverLetter?: string; resume?: string; documents?: any }
): Promise<any> => {
  const response = await api.post(`/jobs/${id}/apply`, data);
  return extractData(response);
};

/**
 * Marca interesse em uma vaga ou atualiza o interesse existente【638052685116415†L337-L372】.
 *
 * @param id ID da vaga.
 * @param data Objeto com `reason` e opcional `notifyOnChanges`.
 */
export const markJobInterest = async (
  id: string,
  data: { reason?: string; notifyOnChanges?: boolean }
): Promise<any> => {
  const response = await api.post(`/jobs/${id}/interest`, data);
  return extractData(response);
};

/**
 * Obtém sugestões de zettels (tarefas/estudos) para preencher requisitos da vaga【638052685116415†L379-L425】.
 *
 * @param id ID da vaga.
 */
export const getJobSuggestions = async (id: string): Promise<any> => {
  const response = await api.get(`/jobs/${id}/suggestions`);
  return extractData(response);
};

// ========================
// Aplicações
// ========================

/**
 * Lista as aplicações de candidatos para uma vaga (admin only)【638052685116415†L432-L467】.
 *
 * @param id ID da vaga.
 */
export const listJobApplications = async (id: string): Promise<any[]> => {
  const response = await api.get(`/jobs/${id}/applications`);
  return extractData(response);
};

/**
 * Atualiza o status de uma aplicação (admin only)【638052685116415†L474-L497】.
 *
 * @param id ID da aplicação.
 * @param data Objeto contendo `status`, `internalNotes`, `feedback` e/ou `rating`.
 */
export const updateApplication = async (
  id: string,
  data: { status?: string; internalNotes?: string; feedback?: string; rating?: number }
): Promise<any> => {
  const response = await api.patch(`/jobs/applications/${id}`, data);
  return extractData(response);
};
