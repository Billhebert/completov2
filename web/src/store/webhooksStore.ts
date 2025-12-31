// web/src/store/webhooksStore.ts
import { create } from 'zustand';
import type {
  EventDefinition,
  WebhookEndpoint,
  WebhookDelivery,
  CreateEventDefinition,
  CreateWebhookEndpoint,
} from '../types/webhooks';
import api from '../services/api';

interface WebhooksState {
  // State
  events: EventDefinition[];
  endpoints: WebhookEndpoint[];
  deliveries: WebhookDelivery[];
  selectedEndpoint: WebhookEndpoint | null;
  isLoading: boolean;
  error: string | null;

  // Actions - Events
  fetchEvents: (params?: { page?: number; pageSize?: number; category?: string }) => Promise<void>;
  createEvent: (data: CreateEventDefinition) => Promise<EventDefinition>;
  updateEvent: (id: string, data: Partial<CreateEventDefinition>) => Promise<EventDefinition>;
  deleteEvent: (id: string) => Promise<void>;

  // Actions - Endpoints
  fetchEndpoints: (params?: { page?: number; pageSize?: number }) => Promise<void>;
  createEndpoint: (data: CreateWebhookEndpoint) => Promise<WebhookEndpoint>;
  updateEndpoint: (id: string, data: Partial<CreateWebhookEndpoint>) => Promise<WebhookEndpoint>;
  deleteEndpoint: (id: string) => Promise<void>;
  toggleEndpoint: (id: string, isActive: boolean) => Promise<void>;
  testEndpoint: (id: string) => Promise<void>;
  selectEndpoint: (endpoint: WebhookEndpoint | null) => void;

  // Actions - Deliveries
  fetchDeliveries: (params?: {
    endpointId?: string;
    eventName?: string;
    success?: boolean;
    page?: number;
    pageSize?: number;
  }) => Promise<void>;
  retryDelivery: (id: string) => Promise<void>;

  clearError: () => void;
}

export const useWebhooksStore = create<WebhooksState>((set, get) => ({
  // Initial state
  events: [],
  endpoints: [],
  deliveries: [],
  selectedEndpoint: null,
  isLoading: false,
  error: null,

  // Events actions
  fetchEvents: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getEventDefinitions(params);
      set({ events: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createEvent: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const event = await api.createEventDefinition(data);
      set((state) => ({
        events: [...state.events, event],
        isLoading: false,
      }));
      return event;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateEvent: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const event = await api.updateEventDefinition(id, data);
      set((state) => ({
        events: state.events.map((e) => (e.id === id ? event : e)),
        isLoading: false,
      }));
      return event;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteEvent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteEventDefinition(id);
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Endpoints actions
  fetchEndpoints: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getWebhookEndpoints(params);
      set({ endpoints: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createEndpoint: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const endpoint = await api.createWebhookEndpoint(data);
      set((state) => ({
        endpoints: [...state.endpoints, endpoint],
        isLoading: false,
      }));
      return endpoint;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateEndpoint: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const endpoint = await api.updateWebhookEndpoint(id, data);
      set((state) => ({
        endpoints: state.endpoints.map((e) => (e.id === id ? endpoint : e)),
        isLoading: false,
      }));
      return endpoint;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteEndpoint: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteWebhookEndpoint(id);
      set((state) => ({
        endpoints: state.endpoints.filter((e) => e.id !== id),
        selectedEndpoint: state.selectedEndpoint?.id === id ? null : state.selectedEndpoint,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  toggleEndpoint: async (id, isActive) => {
    set({ isLoading: true, error: null });
    try {
      const endpoint = await api.toggleWebhookEndpoint(id, isActive);
      set((state) => ({
        endpoints: state.endpoints.map((e) => (e.id === id ? endpoint : e)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  testEndpoint: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.testWebhookEndpoint(id);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  selectEndpoint: (endpoint) => {
    set({ selectedEndpoint: endpoint });
  },

  // Deliveries actions
  fetchDeliveries: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getWebhookDeliveries(params);
      set({ deliveries: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  retryDelivery: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.retryWebhookDelivery(id);
      set({ isLoading: false });
      // Refresh deliveries after retry
      await get().fetchDeliveries();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
