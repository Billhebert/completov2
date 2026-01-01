/** People & Growth Types */
export interface Employee { id: string; name: string; position: string; department: string; manager?: string; hireDate: string; performance: number; }
export interface Goal { id: string; employeeId: string; title: string; description: string; dueDate: string; progress: number; status: 'not_started' | 'in_progress' | 'completed'; }
export interface Review { id: string; employeeId: string; reviewerId: string; period: string; rating: number; feedback: string; createdAt: string; }
