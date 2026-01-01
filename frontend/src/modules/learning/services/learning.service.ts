/**
 * Learning Platform Service
 * Plataforma de cursos, trilhas de aprendizagem e certificações
 */

import api, { extractData } from '../../../core/utils/api';
import { Course, Enrollment, Lesson, Certificate } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

/**
 * Lista cursos disponíveis
 * TODO: Implementar catálogo de cursos
 * - Cursos internos e externos
 * - Categorias e tags
 * - Níveis (beginner, intermediate, advanced)
 * - Rating e reviews
 * - Pré-requisitos
 * - Certificação ao final
 */
export const getCourses = async (params?: PaginationParams): Promise<PaginatedResult<Course>> => {
  const response = await api.get('/learning/courses', { params });
  return extractData(response);
};

/**
 * Inscrever em curso
 * TODO: Implementar enrollment
 * - Verificar pré-requisitos
 * - Aprovação do gestor se necessário
 * - Agendar início
 * - Criar trilha de progresso
 * - Notificações de início
 */
export const enrollInCourse = async (courseId: string): Promise<Enrollment> => {
  const response = await api.post(\`/learning/courses/\${courseId}/enroll\`);
  return extractData(response);
};

/**
 * Buscar progresso no curso
 * TODO: Implementar tracking de progresso
 * - Lições completadas
 * - Tempo dedicado
 * - Quizzes e scores
 * - Progresso % por módulo
 * - Próxima lição sugerida
 */
export const getCourseProgress = async (enrollmentId: string): Promise<unknown> => {
  const response = await api.get(\`/learning/enrollments/\${enrollmentId}/progress\`);
  return extractData(response);
};

/**
 * Completar lição
 * TODO: Implementar tracking de lições
 * - Marcar lição como completa
 * - Salvar anotações do usuário
 * - Atualizar progresso geral
 * - Desbloquear próxima lição
 * - Gamification (pontos, badges)
 */
export const completeLesson = async (enrollmentId: string, lessonId: string): Promise<void> => {
  await api.post(\`/learning/enrollments/\${enrollmentId}/lessons/\${lessonId}/complete\`);
};

/**
 * Realizar quiz/avaliação
 * TODO: Implementar sistema de avaliação
 * - Questões múltipla escolha
 * - Questões dissertativas
 * - Limite de tempo
 * - Cálculo de score
 * - Feedback imediato
 * - Certificado se aprovado
 */
export const submitQuiz = async (lessonId: string, answers: Record<string, unknown>): Promise<{ score: number; passed: boolean }> => {
  const response = await api.post(\`/learning/lessons/\${lessonId}/quiz/submit\`, { answers });
  return extractData(response);
};

/**
 * Buscar certificados
 * TODO: Implementar gestão de certificados
 * - Certificados obtidos
 * - Download em PDF
 * - Compartilhar em LinkedIn
 * - Verificação de autenticidade
 * - Data de expiração (se aplicável)
 */
export const getCertificates = async (): Promise<Certificate[]> => {
  const response = await api.get('/learning/certificates');
  return extractData(response);
};
