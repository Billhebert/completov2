// web/src/store/servicesStore.ts
import { create } from 'zustand';
import type {
  Service,
  ServiceProposal,
  ServiceTransaction,
  SystemSettings,
  CreateService,
} from '../types/services';
import api from '../services/api';

interface ServicesState {
  // State
  services: Service[];
  selectedService: Service | null;
  proposals: ServiceProposal[];
  transactions: ServiceTransaction[];
  systemSettings: SystemSettings | null;
  isLoading: boolean;
  error: string | null;

  // Actions - Services
  fetchServices: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    category?: string;
    minBudget?: number;
    maxBudget?: number;
    search?: string;
  }) => Promise<void>;
  getService: (id: string) => Promise<Service>;
  createService: (data: CreateService) => Promise<Service>;
  updateService: (id: string, data: Partial<CreateService>) => Promise<Service>;
  deleteService: (id: string) => Promise<void>;
  completeService: (serviceId: string, data: {
    deliverables?: any;
    notes?: string;
  }) => Promise<void>;
  rateService: (serviceId: string, data: {
    rating: number;
    feedback?: string;
  }) => Promise<void>;
  selectService: (service: Service | null) => void;

  // Actions - Proposals
  submitProposal: (serviceId: string, data: {
    proposerType: string;
    message?: string;
    estimatedDuration?: number;
    portfolio?: any;
  }) => Promise<ServiceProposal>;
  fetchProposals: (serviceId: string) => Promise<void>;
  acceptProposal: (proposalId: string) => Promise<void>;
  rejectProposal: (proposalId: string, reason?: string) => Promise<void>;

  // Actions - Transactions
  fetchTransactions: (params?: {
    page?: number;
    pageSize?: number;
    paymentStatus?: string;
  }) => Promise<void>;
  updateTransactionPayment: (transactionId: string, data: {
    paymentStatus: string;
    paymentMethod?: string;
    transactionId?: string;
  }) => Promise<void>;

  // Actions - System Settings
  fetchSystemSettings: () => Promise<void>;
  updateSystemSettings: (data: {
    serviceFeePercentage?: number;
    minServiceFee?: number;
    maxServiceFee?: number;
    currency?: string;
    metadata?: any;
  }) => Promise<SystemSettings>;

  clearError: () => void;
}

export const useServicesStore = create<ServicesState>((set) => ({
  // Initial state
  services: [],
  selectedService: null,
  proposals: [],
  transactions: [],
  systemSettings: null,
  isLoading: false,
  error: null,

  // Services actions
  fetchServices: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getServices(params);
      set({ services: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  getService: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const service = await api.getService(id);
      set({ isLoading: false });
      return service;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createService: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const service = await api.createService(data);
      set((state) => ({
        services: [...state.services, service],
        isLoading: false,
      }));
      return service;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateService: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const service = await api.updateService(id, data);
      set((state) => ({
        services: state.services.map((s) => (s.id === id ? service : s)),
        isLoading: false,
      }));
      return service;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteService: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteService(id);
      set((state) => ({
        services: state.services.filter((s) => s.id !== id),
        selectedService: state.selectedService?.id === id ? null : state.selectedService,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  completeService: async (serviceId, data) => {
    set({ isLoading: true, error: null });
    try {
      await api.completeService(serviceId, data);
      // Refresh the service
      const updated = await api.getService(serviceId);
      set((state) => ({
        services: state.services.map((s) => (s.id === serviceId ? updated : s)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  rateService: async (serviceId, data) => {
    set({ isLoading: true, error: null });
    try {
      await api.rateService(serviceId, data);
      // Refresh the service
      const updated = await api.getService(serviceId);
      set((state) => ({
        services: state.services.map((s) => (s.id === serviceId ? updated : s)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  selectService: (service) => {
    set({ selectedService: service });
  },

  // Proposals actions
  submitProposal: async (serviceId, data) => {
    set({ isLoading: true, error: null });
    try {
      const proposal = await api.submitServiceProposal(serviceId, data);
      set({ isLoading: false });
      return proposal;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchProposals: async (serviceId) => {
    set({ isLoading: true, error: null });
    try {
      const proposals = await api.getServiceProposals(serviceId);
      set({ proposals, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  acceptProposal: async (proposalId) => {
    set({ isLoading: true, error: null });
    try {
      await api.acceptServiceProposal(proposalId);
      set((state) => ({
        proposals: state.proposals.map((p) =>
          p.id === proposalId ? { ...p, status: 'accepted' } : p
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  rejectProposal: async (proposalId, reason) => {
    set({ isLoading: true, error: null });
    try {
      await api.rejectServiceProposal(proposalId, reason);
      set((state) => ({
        proposals: state.proposals.map((p) =>
          p.id === proposalId ? { ...p, status: 'rejected', rejectionReason: reason } : p
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Transactions actions
  fetchTransactions: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getServiceTransactions(params);
      set({ transactions: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateTransactionPayment: async (transactionId, data) => {
    set({ isLoading: true, error: null });
    try {
      await api.updateTransactionPayment(transactionId, data);
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === transactionId ? { ...t, ...data } : t
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // System Settings actions
  fetchSystemSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await api.getSystemSettings();
      set({ systemSettings: settings, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateSystemSettings: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const settings = await api.updateSystemSettings(data);
      set({ systemSettings: settings, isLoading: false });
      return settings;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
