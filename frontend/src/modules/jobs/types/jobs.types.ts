/** Jobs Types */
export interface Job { id: string; name: string; type: string; schedule: string; isActive: boolean; lastRunAt?: string; nextRunAt?: string; successCount: number; failureCount: number; }
export interface JobExecution { id: string; jobId: string; status: 'running' | 'success' | 'failed'; startedAt: string; completedAt?: string; duration?: number; error?: string; logs?: string; }
