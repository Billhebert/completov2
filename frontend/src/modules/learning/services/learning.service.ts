/**
 * Learning Service
 *
 * Este serviço oferece métodos para interagir com o módulo de aprendizagem
 * do backend. As funções incluem listagem e criação de trilhas de
 * aprendizagem, matrículas, progresso de itens, gestão de habilidades e
 * planos de desenvolvimento【342141902301556†L27-L285】.
 */

import api, { extractData } from '../../../core/utils/api';

// ----------------------------
// LEARNING PATHS
// ----------------------------

/**
 * Lista trilhas de aprendizagem (learning paths) disponíveis para a empresa
 * atual com filtros opcionais de categoria e dificuldade【342141902301556†L27-L45】.
 *
 * @param params Filtros opcionais: categoria e dificuldade.
 * @returns Lista de trilhas com contagem de itens e matrículas.
 */
export const getLearningPaths = async (params: {
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
} = {}): Promise<any[]> => {
  const response = await api.get('/learning/paths', { params });
  return extractData(response);
};

/**
 * Cria uma nova trilha de aprendizagem. Requer permissão de leitura de usuários no
 * backend【342141902301556†L51-L61】.
 *
 * @param path Dados da trilha (título, descrição, categoria, dificuldade, horas e skills). 
 * @returns Trilha de aprendizagem criada.
 */
export const createLearningPath = async (path: {
  title: string;
  description?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  targetSkills?: string[];
}): Promise<any> => {
  const response = await api.post('/learning/paths', path);
  return extractData(response);
};

/**
 * Recupera uma trilha de aprendizagem específica, incluindo seus itens e
 * matrícula do usuário logado【342141902301556†L66-L86】.
 *
 * @param id ID da trilha.
 * @returns Trilha completa com itens ordenados e estado de matrícula.
 */
export const getLearningPath = async (id: string): Promise<any> => {
  const response = await api.get(`/learning/paths/${id}`);
  return extractData(response);
};

// ----------------------------
// ENROLLMENTS
// ----------------------------

/**
 * Inscreve o usuário logado em uma trilha de aprendizagem【342141902301556†L95-L106】.
 *
 * @param pathId ID da trilha.
 * @returns Registro de matrícula criado.
 */
export const enrollInPath = async (pathId: string): Promise<any> => {
  const response = await api.post(`/learning/paths/${pathId}/enroll`);
  return extractData(response);
};

/**
 * Lista as matrículas do usuário logado【342141902301556†L111-L124】.
 *
 * @returns Lista de matrículas com contagem de itens por trilha.
 */
export const getEnrollments = async (): Promise<any[]> => {
  const response = await api.get('/learning/enrollments');
  return extractData(response);
};

// ----------------------------
// PROGRESS
// ----------------------------

/**
 * Marca um item da trilha como concluído e atualiza o progresso na matrícula
 * correspondente【342141902301556†L135-L197】.
 *
 * @param itemId ID do item dentro da trilha.
 * @returns Registro de progresso atualizado.
 */
export const completeLearningItem = async (itemId: string): Promise<any> => {
  const response = await api.post(`/learning/items/${itemId}/complete`);
  return extractData(response);
};

// ----------------------------
// SKILLS
// ----------------------------

/**
 * Lista habilidades disponíveis e indica se o usuário já possui cada uma【342141902301556†L207-L223】.
 *
 * @param category Filtra por categoria de habilidade opcionalmente.
 * @returns Lista de habilidades com dados de proficiência do usuário, se houver.
 */
export const getSkills = async (category?: string): Promise<any[]> => {
  const params: any = {};
  if (category) params.category = category;
  const response = await api.get('/learning/skills', { params });
  return extractData(response);
};

/**
 * Lista apenas as habilidades atribuídas ao usuário logado【342141902301556†L229-L236】.
 *
 * @returns Array de habilidades do usuário com proficiência e data de avaliação.
 */
export const getMySkills = async (): Promise<any[]> => {
  const response = await api.get('/learning/skills/my');
  return extractData(response);
};

/**
 * Avalia ou atualiza a proficiência do usuário em uma habilidade específica【342141902301556†L242-L266】.
 *
 * @param skillId ID da habilidade.
 * @param proficiency Grau de proficiência (por exemplo, 1–5 ou percentual).
 * @returns Registro de employeeSkill atualizado.
 */
export const assessSkill = async (skillId: string, proficiency: number): Promise<any> => {
  const response = await api.post(`/learning/skills/${skillId}/assess`, { proficiency });
  return extractData(response);
};

// ----------------------------
// DEVELOPMENT PLANS
// ----------------------------

/**
 * Recupera os planos de desenvolvimento de habilidades para o usuário【342141902301556†L275-L285】.
 *
 * @returns Lista de planos de desenvolvimento com metas e status.
 */
export const getDevelopmentPlans = async (): Promise<any[]> => {
  const response = await api.get('/learning/development-plans');
  return extractData(response);
};