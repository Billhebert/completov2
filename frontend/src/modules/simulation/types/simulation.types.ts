/** Simulation Types */
export interface Simulation { id: string; name: string; type: 'sales' | 'capacity' | 'growth'; parameters: Record<string, unknown>; results?: Record<string, unknown>; status: 'draft' | 'running' | 'completed'; createdAt: string; }
