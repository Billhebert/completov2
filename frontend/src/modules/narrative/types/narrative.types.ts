/** Narrative Types */
export interface Narrative { id: string; title: string; content: string; type: 'insight' | 'alert' | 'recommendation'; entityType: string; entityId: string; generatedAt: string; }
