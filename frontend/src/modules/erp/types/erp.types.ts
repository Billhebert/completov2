/** ERP Types */
export interface ERPIntegration { id: string; name: string; type: 'sap' | 'oracle' | 'totvs'; isActive: boolean; config: Record<string, unknown>; lastSyncAt?: string; }
export interface ERPSync { id: string; entity: string; action: 'import' | 'export'; status: 'pending' | 'running' | 'success' | 'failed'; recordsProcessed: number; errors?: string[]; startedAt: string; completedAt?: string; }
