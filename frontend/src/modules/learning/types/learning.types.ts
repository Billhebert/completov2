/** Learning Types */
export interface Course { id: string; title: string; description: string; instructor: string; duration: number; level: 'beginner' | 'intermediate' | 'advanced'; enrolledCount: number; }
export interface Enrollment { id: string; userId: string; courseId: string; progress: number; completedLessons: string[]; startedAt: string; completedAt?: string; }
export interface Lesson { id: string; courseId: string; title: string; content: string; type: 'video' | 'text' | 'quiz'; duration: number; order: number; }
