/** AI Types */
export interface AIModel { id: string; name: string; type: 'classification' | 'prediction' | 'generation'; status: 'training' | 'ready' | 'failed'; accuracy?: number; }
export interface Prediction { id: string; modelId: string; input: Record<string, unknown>; output: Record<string, unknown>; confidence: number; createdAt: string; }
