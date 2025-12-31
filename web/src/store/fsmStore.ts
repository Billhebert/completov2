// web/src/store/fsmStore.ts
import { create } from 'zustand';
import type {
  FieldTechnician,
  WorkOrder,
  CreateWorkOrder,
} from '../types/fsm';
import type { PaginatedResponse } from '../types';
import api from '../services/api';

interface FSMState {
  // State
  technicians: FieldTechnician[];
  workOrders: WorkOrder[];
  selectedWorkOrder: WorkOrder | null;
  isLoading: boolean;
  error: string | null;

  // Actions - Technicians
  fetchTechnicians: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }) => Promise<void>;
  getTechnician: (id: string) => Promise<FieldTechnician>;
  createTechnician: (data: Partial<FieldTechnician>) => Promise<FieldTechnician>;
  updateTechnician: (id: string, data: Partial<FieldTechnician>) => Promise<FieldTechnician>;
  updateTechnicianLocation: (id: string, location: { lat: number; lng: number; address: string }) => Promise<void>;

  // Actions - Work Orders
  fetchWorkOrders: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    priority?: string;
    technicianId?: string;
  }) => Promise<void>;
  getWorkOrder: (id: string) => Promise<WorkOrder>;
  createWorkOrder: (data: CreateWorkOrder) => Promise<WorkOrder>;
  updateWorkOrder: (id: string, data: Partial<CreateWorkOrder>) => Promise<WorkOrder>;
  assignWorkOrder: (id: string, technicianId: string) => Promise<void>;
  startWorkOrder: (id: string) => Promise<void>;
  completeWorkOrder: (id: string, data?: { signature?: string; feedback?: any }) => Promise<void>;
  addWorkOrderTask: (workOrderId: string, task: { title: string; description?: string }) => Promise<void>;
  toggleWorkOrderTask: (workOrderId: string, taskId: string) => Promise<void>;
  selectWorkOrder: (workOrder: WorkOrder | null) => void;

  clearError: () => void;
}

export const useFSMStore = create<FSMState>((set, get) => ({
  // Initial state
  technicians: [],
  workOrders: [],
  selectedWorkOrder: null,
  isLoading: false,
  error: null,

  // Technicians actions
  fetchTechnicians: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getTechnicians(params);
      set({ technicians: response.items, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  getTechnician: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const technician = await api.getTechnician(id);
      set({ isLoading: false });
      return technician;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createTechnician: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const technician = await api.createTechnician(data);
      set((state) => ({
        technicians: [...state.technicians, technician],
        isLoading: false,
      }));
      return technician;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateTechnician: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const technician = await api.updateTechnician(id, data);
      set((state) => ({
        technicians: state.technicians.map((t) => (t.id === id ? technician : t)),
        isLoading: false,
      }));
      return technician;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateTechnicianLocation: async (id, location) => {
    set({ isLoading: true, error: null });
    try {
      await api.updateTechnicianLocation(id, location);
      set({ isLoading: false });
      // Optionally refresh technician data
      await get().fetchTechnicians();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Work Orders actions
  fetchWorkOrders: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getWorkOrders(params);
      set({ workOrders: response.items, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  getWorkOrder: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const workOrder = await api.getWorkOrder(id);
      set({ isLoading: false });
      return workOrder;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createWorkOrder: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const workOrder = await api.createWorkOrder(data);
      set((state) => ({
        workOrders: [...state.workOrders, workOrder],
        isLoading: false,
      }));
      return workOrder;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateWorkOrder: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const workOrder = await api.updateWorkOrder(id, data);
      set((state) => ({
        workOrders: state.workOrders.map((wo) => (wo.id === id ? workOrder : wo)),
        isLoading: false,
      }));
      return workOrder;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  assignWorkOrder: async (id, technicianId) => {
    set({ isLoading: true, error: null });
    try {
      const workOrder = await api.assignWorkOrder(id, technicianId);
      set((state) => ({
        workOrders: state.workOrders.map((wo) => (wo.id === id ? workOrder : wo)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  startWorkOrder: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const workOrder = await api.startWorkOrder(id);
      set((state) => ({
        workOrders: state.workOrders.map((wo) => (wo.id === id ? workOrder : wo)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  completeWorkOrder: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const workOrder = await api.completeWorkOrder(id, data);
      set((state) => ({
        workOrders: state.workOrders.map((wo) => (wo.id === id ? workOrder : wo)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  addWorkOrderTask: async (workOrderId, task) => {
    set({ isLoading: true, error: null });
    try {
      await api.addWorkOrderTask(workOrderId, task);
      set({ isLoading: false });
      // Refresh work order
      const workOrder = await api.getWorkOrder(workOrderId);
      set((state) => ({
        workOrders: state.workOrders.map((wo) => (wo.id === workOrderId ? workOrder : wo)),
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  toggleWorkOrderTask: async (workOrderId, taskId) => {
    set({ isLoading: true, error: null });
    try {
      await api.toggleWorkOrderTask(workOrderId, taskId);
      set({ isLoading: false });
      // Refresh work order
      const workOrder = await api.getWorkOrder(workOrderId);
      set((state) => ({
        workOrders: state.workOrders.map((wo) => (wo.id === workOrderId ? workOrder : wo)),
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  selectWorkOrder: (workOrder) => {
    set({ selectedWorkOrder: workOrder });
  },

  clearError: () => set({ error: null }),
}));
