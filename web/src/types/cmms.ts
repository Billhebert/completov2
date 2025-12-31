// web/src/types/cmms.ts
export interface Asset {
  id: string;
  companyId: string;
  name: string;
  assetTag: string;
  category: 'equipment' | 'vehicle' | 'facility' | 'tool';
  type?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiry?: string;
  location?: any;
  status: 'operational' | 'maintenance' | 'down' | 'retired';
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  parentAssetId?: string;
  specifications?: any;
  documents?: any;
  qrCode?: string;
  customFields?: any;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  parentAsset?: Partial<Asset>;
  childAssets?: Partial<Asset>[];
  _count?: {
    maintenancePlans: number;
    maintenanceHistory: number;
    childAssets: number;
  };
}

export interface MaintenancePlan {
  id: string;
  companyId: string;
  assetId: string;
  name: string;
  description?: string;
  type: 'time-based' | 'meter-based' | 'condition-based';
  frequency: {
    value: number;
    unit: string;
  };
  tasks: any[];
  estimatedDuration?: number;
  assignedToId?: string;
  priority: string;
  isActive: boolean;
  lastPerformed?: string;
  nextDue?: string;
  metadata?: any;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  asset?: Partial<Asset>;
}

export interface MaintenanceRecord {
  id: string;
  companyId: string;
  assetId: string;
  planId?: string;
  type: 'preventive' | 'corrective' | 'predictive' | 'emergency';
  title: string;
  description: string;
  performedBy?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  partsUsed?: any[];
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  outcome?: string;
  notes?: string;
  attachments?: any;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  asset?: Partial<Asset>;
}

export interface SparePart {
  id: string;
  companyId: string;
  partNumber: string;
  name: string;
  description?: string;
  category?: string;
  manufacturer?: string;
  supplier?: string;
  unitCost?: number;
  quantityOnHand: number;
  minQuantity: number;
  maxQuantity?: number;
  location?: string;
  compatibleAssets?: any;
  lastRestocked?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAsset {
  name: string;
  assetTag: string;
  category: string;
  type?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  location?: any;
  specifications?: any;
  parentAssetId?: string;
}
