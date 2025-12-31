// web/src/types/fsm.ts
export interface FieldTechnician {
  id: string;
  companyId: string;
  userId: string;
  skills: string[];
  certifications?: any;
  availability: any;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'available' | 'busy' | 'offline';
  rating: number;
  metadata?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: string;
  companyId: string;
  customerId?: string;
  assetId?: string;
  technicianId?: string;
  title: string;
  description: string;
  type: 'installation' | 'maintenance' | 'repair' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  location: {
    lat?: number;
    lng?: number;
    address: string;
  };
  instructions?: string;
  partsRequired?: any[];
  estimatedHours?: number;
  actualHours?: number;
  cost?: number;
  attachments?: string[];
  signature?: string;
  feedback?: {
    rating: number;
    comment: string;
  };
  metadata?: any;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  technician?: Partial<FieldTechnician>;
  tasks?: WorkOrderTask[];
  checklistItems?: WorkOrderChecklist[];
  _count?: {
    tasks: number;
    checklistItems: number;
  };
}

export interface WorkOrderTask {
  id: string;
  workOrderId: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  order: number;
  createdAt: string;
}

export interface WorkOrderChecklist {
  id: string;
  workOrderId: string;
  item: string;
  isChecked: boolean;
  checkedAt?: string;
  checkedBy?: string;
  notes?: string;
  order: number;
  createdAt: string;
}

export interface WorkOrderTimeEntry {
  id: string;
  workOrderId: string;
  technicianId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
  createdAt: string;
}

export interface CreateWorkOrder {
  title: string;
  description: string;
  type: string;
  priority?: string;
  customerId?: string;
  assetId?: string;
  technicianId?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  location: any;
  instructions?: string;
  partsRequired?: any[];
}
