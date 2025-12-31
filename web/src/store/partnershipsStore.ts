// web/src/store/partnershipsStore.ts
import { create } from 'zustand';
import type {
  Partnership,
  PartnershipInvite,
  CreatePartnership,
  CreatePartnershipInvite,
} from '../types/partnerships';
import api from '../services/api';

interface PartnershipsState {
  // State
  partnerships: Partnership[];
  selectedPartnership: Partnership | null;
  invites: PartnershipInvite[];
  isLoading: boolean;
  error: string | null;

  // Actions - Partnerships
  fetchPartnerships: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }) => Promise<void>;
  getPartnership: (id: string) => Promise<Partnership>;
  createPartnership: (data: CreatePartnership) => Promise<Partnership>;
  updatePartnership: (id: string, data: Partial<CreatePartnership> & {
    status?: string;
    endDate?: string;
  }) => Promise<Partnership>;
  terminatePartnership: (id: string) => Promise<void>;
  selectPartnership: (partnership: Partnership | null) => void;

  // Actions - Invites
  fetchInvites: (params?: {
    page?: number;
    pageSize?: number;
    type?: 'sent' | 'received';
    status?: string;
  }) => Promise<void>;
  sendInvite: (data: CreatePartnershipInvite) => Promise<PartnershipInvite>;
  acceptInvite: (id: string) => Promise<Partnership>;
  rejectInvite: (id: string, reason?: string) => Promise<void>;

  clearError: () => void;
}

export const usePartnershipsStore = create<PartnershipsState>((set) => ({
  // Initial state
  partnerships: [],
  selectedPartnership: null,
  invites: [],
  isLoading: false,
  error: null,

  // Partnerships actions
  fetchPartnerships: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getPartnerships(params);
      set({ partnerships: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  getPartnership: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const partnership = await api.getPartnership(id);
      set({ isLoading: false });
      return partnership;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createPartnership: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const partnership = await api.createPartnership(data);
      set((state) => ({
        partnerships: [...state.partnerships, partnership],
        isLoading: false,
      }));
      return partnership;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updatePartnership: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const partnership = await api.updatePartnership(id, data);
      set((state) => ({
        partnerships: state.partnerships.map((p) => (p.id === id ? partnership : p)),
        isLoading: false,
      }));
      return partnership;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  terminatePartnership: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.terminatePartnership(id);
      set((state) => ({
        partnerships: state.partnerships.map((p) =>
          p.id === id ? { ...p, status: 'terminated' } : p
        ),
        selectedPartnership: state.selectedPartnership?.id === id ? null : state.selectedPartnership,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  selectPartnership: (partnership) => {
    set({ selectedPartnership: partnership });
  },

  // Invites actions
  fetchInvites: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getPartnershipInvites(params);
      set({ invites: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  sendInvite: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const invite = await api.sendPartnershipInvite(data);
      set((state) => ({
        invites: [...state.invites, invite],
        isLoading: false,
      }));
      return invite;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  acceptInvite: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const partnership = await api.acceptPartnershipInvite(id);
      set((state) => ({
        invites: state.invites.map((i) =>
          i.id === id ? { ...i, status: 'accepted' } : i
        ),
        partnerships: [...state.partnerships, partnership],
        isLoading: false,
      }));
      return partnership;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  rejectInvite: async (id, reason) => {
    set({ isLoading: true, error: null });
    try {
      await api.rejectPartnershipInvite(id, reason);
      set((state) => ({
        invites: state.invites.map((i) =>
          i.id === id ? { ...i, status: 'rejected', rejectionReason: reason } : i
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
