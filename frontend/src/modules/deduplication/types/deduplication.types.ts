/** Deduplication Types */
export interface Duplicate { id: string; entity: string; records: Array<{ id: string; confidence: number; data: Record<string, unknown> }>; status: 'pending' | 'merged' | 'dismissed'; }
