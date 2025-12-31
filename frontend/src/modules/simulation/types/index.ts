/**
 * Simulações Module Types
 */

export interface Simulation {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSimulationRequest {
  name: string;
  description?: string;
}

export interface UpdateSimulationRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
