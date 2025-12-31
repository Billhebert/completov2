// web/src/types/mcp.ts
export interface MCPServer {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  type: 'builtin' | 'custom' | 'community';
  command: string;
  args?: any;
  env?: any;
  config?: any;
  isActive: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tools: number;
    resources: number;
  };
}

export interface MCPTool {
  id: string;
  serverId: string;
  name: string;
  description?: string;
  inputSchema: any;
  createdAt: string;
}

export interface MCPResource {
  id: string;
  serverId: string;
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  createdAt: string;
}

export interface MCPServerLog {
  id: string;
  serverId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: any;
  timestamp: string;
}

export interface CreateMCPServer {
  name: string;
  description?: string;
  type: 'builtin' | 'custom' | 'community';
  command: string;
  args?: any;
  env?: any;
  config?: any;
  isPublic?: boolean;
}
