/** Partnerships Types */
export interface Partner { id: string; name: string; type: 'reseller' | 'technology' | 'referral'; status: 'active' | 'inactive'; contactEmail: string; revenue: number; createdAt: string; }
export interface PartnerProgram { id: string; name: string; benefits: string[]; requirements: string[]; commission: number; }
