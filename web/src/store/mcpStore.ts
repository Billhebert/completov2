// web/src/store/mcpStore.ts
import { create } from 'zustand';
import type {
  MCPServer,
  MCPTool,
  MCPResource,
  MCPServerLog,
  CreateMCPServer,
} from '../types/mcp';
import type { PaginatedResponse } from '../types';
import api from '../services/api';

interface McpState {
  // State
  servers: MCPServer[];
  selectedServer: MCPServer | null;
  tools: MCPTool[];
  resources: MCPResource[];
  logs: MCPServerLog[];
  isLoading: boolean;
  error: string | null;

  // Actions - Servers
  fetchServers: (params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    isActive?: boolean;
  }) => Promise<void>;
  getServer: (id: string) => Promise<MCPServer>;
  createServer: (data: CreateMCPServer) => Promise<MCPServer>;
  updateServer: (id: string, data: Partial<CreateMCPServer>) => Promise<MCPServer>;
  deleteServer: (id: string) => Promise<void>;
  toggleServer: (id: string, isActive: boolean) => Promise<void>;
  testServer: (id: string) => Promise<{ success: boolean; message: string }>;
  selectServer: (server: MCPServer | null) => void;

  // Actions - Tools & Resources
  fetchTools: (serverId: string) => Promise<void>;
  fetchResources: (serverId: string) => Promise<void>;
  fetchLogs: (serverId: string, params?: { level?: string; limit?: number }) => Promise<void>;

  clearError: () => void;
}

export const useMcpStore = create<McpState>((set, get) => ({
  // Initial state
  servers: [],
  selectedServer: null,
  tools: [],
  resources: [],
  logs: [],
  isLoading: false,
  error: null,

  // Servers actions
  fetchServers: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getMCPServers(params);
      set({ servers: response.items, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  getServer: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const server = await api.getMCPServer(id);
      set({ isLoading: false });
      return server;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createServer: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const server = await api.createMCPServer(data);
      set((state) => ({
        servers: [...state.servers, server],
        isLoading: false,
      }));
      return server;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateServer: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const server = await api.updateMCPServer(id, data);
      set((state) => ({
        servers: state.servers.map((s) => (s.id === id ? server : s)),
        isLoading: false,
      }));
      return server;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteServer: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteMCPServer(id);
      set((state) => ({
        servers: state.servers.filter((s) => s.id !== id),
        selectedServer: state.selectedServer?.id === id ? null : state.selectedServer,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  toggleServer: async (id, isActive) => {
    set({ isLoading: true, error: null });
    try {
      const server = await api.toggleMCPServer(id, isActive);
      set((state) => ({
        servers: state.servers.map((s) => (s.id === id ? server : s)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  testServer: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.testMCPServer(id);
      set({ isLoading: false });
      return result;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  selectServer: (server) => {
    set({ selectedServer: server });
  },

  // Tools & Resources actions
  fetchTools: async (serverId) => {
    set({ isLoading: true, error: null });
    try {
      const tools = await api.getMCPTools(serverId);
      set({ tools, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchResources: async (serverId) => {
    set({ isLoading: true, error: null });
    try {
      const resources = await api.getMCPResources(serverId);
      set({ resources, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchLogs: async (serverId, params) => {
    set({ isLoading: true, error: null });
    try {
      const logs = await api.getMCPServerLogs(serverId, params);
      set({ logs, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
