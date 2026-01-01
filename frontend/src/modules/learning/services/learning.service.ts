/** Learning Service - TODO: Plataforma de aprendizagem */
import api, { extractData } from '../../../core/utils/api';
import { Course, Enrollment, Lesson } from '../types';

/** TODO: Listar cursos */
export const getCourses = async (): Promise<Course[]> => {
  const response = await api.get('/learning/courses');
  return extractData(response);
};

/** TODO: Inscrever em curso */
export const enrollCourse = async (courseId: string): Promise<Enrollment> => {
  const response = await api.post('/learning/enrollments', { courseId });
  return extractData(response);
};

/** TODO: Buscar lições do curso */
export const getCourseLessons = async (courseId: string): Promise<Lesson[]> => {
  const response = await api.get(`/learning/courses/${courseId}/lessons`);
  return extractData(response);
};

/** TODO: Marcar lição como completa */
export const completeLesson = async (enrollmentId: string, lessonId: string): Promise<Enrollment> => {
  const response = await api.post(`/learning/enrollments/${enrollmentId}/complete`, { lessonId });
  return extractData(response);
};
