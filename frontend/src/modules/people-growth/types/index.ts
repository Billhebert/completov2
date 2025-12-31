/**
 * Crescimento Pessoal Module Types
 */

export interface PeopleGrowth {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreatePeopleGrowthRequest {
  name: string;
  description?: string;
}

export interface UpdatePeopleGrowthRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
