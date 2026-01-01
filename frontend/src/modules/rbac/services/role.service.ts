/**
 * Role Service
 * TODO: Implementar serviço de gestão de roles/perfis
 */

import api, { extractData } from '../../../core/utils/api';
import { Role, CreateRoleRequest, UpdateRoleRequest, Permission, RoleAssignment, RoleFilters } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

/**
 * TODO: Implementar busca de roles com paginação e filtros
 * - Deve suportar busca por nome
 * - Filtrar por roles do sistema vs customizadas
 * - Retornar contagem de usuários por role
 */
export const getRoles = async (
  params?: PaginationParams & RoleFilters
): Promise<PaginatedResult<Role>> => {
  const response = await api.get('/rbac/roles', { params });
  return extractData(response);
};

/**
 * TODO: Implementar busca de role por ID
 * - Deve incluir lista completa de permissões
 * - Incluir lista de usuários com esta role
 */
export const getRoleById = async (id: string): Promise<Role> => {
  const response = await api.get(`/rbac/roles/${id}`);
  return extractData(response);
};

/**
 * TODO: Implementar criação de nova role
 * - Validar que nome é único
 * - Validar que permissões existem
 * - Não permitir criar role com isSystem=true
 */
export const createRole = async (data: CreateRoleRequest): Promise<Role> => {
  const response = await api.post('/rbac/roles', data);
  return extractData(response);
};

/**
 * TODO: Implementar atualização de role
 * - Não permitir editar roles do sistema
 * - Validar permissões
 * - Atualizar cache de permissões dos usuários afetados
 */
export const updateRole = async (id: string, data: UpdateRoleRequest): Promise<Role> => {
  const response = await api.put(`/rbac/roles/${id}`, data);
  return extractData(response);
};

/**
 * TODO: Implementar exclusão de role
 * - Não permitir deletar roles do sistema
 * - Não permitir deletar se houver usuários com esta role
 * - Ou mover usuários para outra role antes de deletar
 */
export const deleteRole = async (id: string): Promise<void> => {
  await api.delete(`/rbac/roles/${id}`);
};

/**
 * TODO: Implementar listagem de todas as permissões disponíveis
 * - Agrupar por módulo
 * - Incluir descrição de cada permissão
 */
export const getAllPermissions = async (): Promise<Permission[]> => {
  const response = await api.get('/rbac/permissions');
  return extractData(response);
};

/**
 * TODO: Implementar atribuição de role a usuário
 * - Validar que usuário existe
 * - Validar que role existe
 * - Suportar data de expiração opcional
 */
export const assignRoleToUser = async (
  userId: string,
  roleId: string,
  expiresAt?: string
): Promise<RoleAssignment> => {
  const response = await api.post('/rbac/assignments', {
    userId,
    roleId,
    expiresAt,
  });
  return extractData(response);
};

/**
 * TODO: Implementar remoção de role de usuário
 * - Validar que usuário tem a role
 * - Remover do cache
 */
export const removeRoleFromUser = async (assignmentId: string): Promise<void> => {
  await api.delete(`/rbac/assignments/${assignmentId}`);
};

/**
 * TODO: Implementar busca de atribuições de role
 * - Filtrar por usuário ou por role
 * - Incluir informações de expiração
 */
export const getRoleAssignments = async (
  params?: { userId?: string; roleId?: string }
): Promise<RoleAssignment[]> => {
  const response = await api.get('/rbac/assignments', { params });
  return extractData(response);
};
