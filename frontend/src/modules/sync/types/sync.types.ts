/** Sync Types */
export interface SyncConfig { id: string; name: string; source: string; destination: string; mapping: Record<string, string>; schedule: string; isActive: boolean; }
export interface SyncExecution { id: string; configId: string; status: 'running' | 'success' | 'failed'; recordsSynced: number; errors?: string[]; startedAt: string; completedAt?: string; }
