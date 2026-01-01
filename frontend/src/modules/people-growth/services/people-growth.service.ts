/** People & Growth Service - TODO: Gestão de pessoas e desenvolvimento */
import api, { extractData } from '../../../core/utils/api';
import { Employee, Goal, Review } from '../types';

/** TODO: Listar funcionários */
export const getEmployees = async (): Promise<Employee[]> => {
  const response = await api.get('/people/employees');
  return extractData(response);
};

/** TODO: Criar meta */
export const createGoal = async (data: Partial<Goal>): Promise<Goal> => {
  const response = await api.post('/people/goals', data);
  return extractData(response);
};

/** TODO: Atualizar progresso de meta */
export const updateGoalProgress = async (id: string, progress: number): Promise<Goal> => {
  const response = await api.patch(`/people/goals/${id}`, { progress });
  return extractData(response);
};

/** TODO: Criar avaliação */
export const createReview = async (data: Partial<Review>): Promise<Review> => {
  const response = await api.post('/people/reviews', data);
  return extractData(response);
};
