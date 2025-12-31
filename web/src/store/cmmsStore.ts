// web/src/store/cmmsStore.ts
import { create } from 'zustand';
import type {
  Asset,
  MaintenancePlan,
  MaintenanceRecord,
  SparePart,
  CreateAsset,
} from '../types/cmms';
import api from '../services/api';

interface CMmsState {
  // State
  assets: Asset[];
  maintenancePlans: MaintenancePlan[];
  maintenanceRecords: MaintenanceRecord[];
  spareParts: SparePart[];
  selectedAsset: Asset | null;
  isLoading: boolean;
  error: string | null;

  // Actions - Assets
  fetchAssets: (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    status?: string;
    parentAssetId?: string;
  }) => Promise<void>;
  getAsset: (id: string) => Promise<Asset>;
  createAsset: (data: CreateAsset) => Promise<Asset>;
  updateAsset: (id: string, data: Partial<CreateAsset>) => Promise<Asset>;
  deleteAsset: (id: string) => Promise<void>;
  generateAssetQRCode: (id: string) => Promise<string>;
  selectAsset: (asset: Asset | null) => void;

  // Actions - Maintenance Plans
  fetchMaintenancePlans: (params?: {
    page?: number;
    pageSize?: number;
    assetId?: string;
    isActive?: boolean;
  }) => Promise<void>;
  createMaintenancePlan: (data: Partial<MaintenancePlan>) => Promise<MaintenancePlan>;
  updateMaintenancePlan: (id: string, data: Partial<MaintenancePlan>) => Promise<MaintenancePlan>;
  deleteMaintenancePlan: (id: string) => Promise<void>;

  // Actions - Maintenance Records
  fetchMaintenanceRecords: (params?: {
    page?: number;
    pageSize?: number;
    assetId?: string;
    type?: string;
  }) => Promise<void>;
  createMaintenanceRecord: (data: Partial<MaintenanceRecord>) => Promise<MaintenanceRecord>;

  // Actions - Spare Parts
  fetchSpareParts: (params?: {
    page?: number;
    pageSize?: number;
    lowStock?: boolean;
  }) => Promise<void>;
  createSparePart: (data: Partial<SparePart>) => Promise<SparePart>;
  updateSparePart: (id: string, data: Partial<SparePart>) => Promise<SparePart>;

  clearError: () => void;
}

export const useCmmsStore = create<CMmsState>((set, get) => ({
  // Initial state
  assets: [],
  maintenancePlans: [],
  maintenanceRecords: [],
  spareParts: [],
  selectedAsset: null,
  isLoading: false,
  error: null,

  // Assets actions
  fetchAssets: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getAssets(params);
      set({ assets: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  getAsset: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const asset = await api.getAsset(id);
      set({ isLoading: false });
      return asset;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createAsset: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const asset = await api.createAsset(data);
      set((state) => ({
        assets: [...state.assets, asset],
        isLoading: false,
      }));
      return asset;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateAsset: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const asset = await api.updateAsset(id, data);
      set((state) => ({
        assets: state.assets.map((a) => (a.id === id ? asset : a)),
        isLoading: false,
      }));
      return asset;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteAsset: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteAsset(id);
      set((state) => ({
        assets: state.assets.filter((a) => a.id !== id),
        selectedAsset: state.selectedAsset?.id === id ? null : state.selectedAsset,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  generateAssetQRCode: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.generateAssetQRCode(id);
      set({ isLoading: false });
      // Update asset with QR code
      await get().fetchAssets();
      return result.qrCode;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  selectAsset: (asset) => {
    set({ selectedAsset: asset });
  },

  // Maintenance Plans actions
  fetchMaintenancePlans: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getMaintenancePlans(params);
      set({ maintenancePlans: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createMaintenancePlan: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const plan = await api.createMaintenancePlan(data);
      set((state) => ({
        maintenancePlans: [...state.maintenancePlans, plan],
        isLoading: false,
      }));
      return plan;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateMaintenancePlan: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const plan = await api.updateMaintenancePlan(id, data);
      set((state) => ({
        maintenancePlans: state.maintenancePlans.map((p) => (p.id === id ? plan : p)),
        isLoading: false,
      }));
      return plan;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteMaintenancePlan: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteMaintenancePlan(id);
      set((state) => ({
        maintenancePlans: state.maintenancePlans.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Maintenance Records actions
  fetchMaintenanceRecords: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getMaintenanceRecords(params);
      set({ maintenanceRecords: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createMaintenanceRecord: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const record = await api.createMaintenanceRecord(data);
      set((state) => ({
        maintenanceRecords: [...state.maintenanceRecords, record],
        isLoading: false,
      }));
      return record;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Spare Parts actions
  fetchSpareParts: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getSpareParts(params);
      set({ spareParts: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createSparePart: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const part = await api.createSparePart(data);
      set((state) => ({
        spareParts: [...state.spareParts, part],
        isLoading: false,
      }));
      return part;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateSparePart: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const part = await api.updateSparePart(id, data);
      set((state) => ({
        spareParts: state.spareParts.map((p) => (p.id === id ? part : p)),
        isLoading: false,
      }));
      return part;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
