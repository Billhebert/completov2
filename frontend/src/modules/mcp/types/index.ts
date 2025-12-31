/**
 * MCP Module Types
 */

export interface Mcp {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateMcpRequest {
  name: string;
  description?: string;
}

export interface UpdateMcpRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
