/**
 * MCP Types (Model Context Protocol)
 */

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  type: string;
  isActive: boolean;
  capabilities: string[];
  config: Record<string, unknown>;
  lastPingAt?: string;
  createdAt: string;
}

export interface MCPResource {
  id: string;
  serverId: string;
  type: string;
  name: string;
  uri: string;
  metadata?: Record<string, unknown>;
}
