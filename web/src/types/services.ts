// web/src/types/services.ts

export interface Service {
  id: string;
  companyId: string;
  title: string;
  description: string;
  category: string;
  allowCompanies: boolean;
  allowIndividuals: boolean;
  budget: number;
  currency: string;
  status: string; // "open", "in_progress", "completed", "cancelled"
  acceptedById?: string;
  acceptedByType?: string; // "company" or "individual"
  rating?: number;
  clientFeedback?: string;
  deliverables?: any;
  completionNotes?: string;
  isActive: boolean;
  completedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    proposals: number;
  };
}

export interface CreateService {
  title: string;
  description: string;
  category: string;
  allowCompanies?: boolean;
  allowIndividuals?: boolean;
  budget: number;
  currency?: string;
}

export interface ServiceProposal {
  id: string;
  serviceId: string;
  proposerId: string;
  proposerType: string; // "company" or "individual"
  message?: string;
  estimatedDuration?: number;
  portfolio?: any;
  status: string; // "pending", "accepted", "rejected"
  rejectionReason?: string;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  proposer?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  service?: Service;
}

export interface ServiceTransaction {
  id: string;
  serviceId: string;
  providerId: string;
  clientId: string;
  serviceAmount: number;
  serviceFee: number;
  totalAmount: number;
  paymentStatus: string; // "pending", "paid", "failed", "refunded"
  paymentMethod?: string;
  transactionId?: string;
  currency: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  service?: {
    id: string;
    title: string;
    category: string;
  };
  provider?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SystemSettings {
  id: string;
  serviceFeePercentage: number;
  minServiceFee: number;
  maxServiceFee?: number;
  currency: string;
  metadata?: any;
  updatedBy: string;
  updatedAt: Date;
  createdAt: Date;
}
