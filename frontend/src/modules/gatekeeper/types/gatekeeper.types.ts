/** Gatekeeper Types */
export interface Feature { id: string; name: string; key: string; description: string; isEnabled: boolean; rolloutPercentage: number; allowedUsers?: string[]; }
export interface FeatureUsage { featureKey: string; userId: string; accessedAt: string; }
