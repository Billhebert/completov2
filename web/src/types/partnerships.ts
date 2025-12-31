// web/src/types/partnerships.ts

export interface Partnership {
  id: string;
  companyAId: string;
  companyBId: string;
  name?: string;
  description?: string;
  type: string;
  shareJobs: boolean;
  shareServices: boolean;
  shareResources: boolean;
  status: string; // active, paused, terminated
  startDate: Date;
  endDate?: Date;
  terms?: any;
  metadata?: any;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  companyA?: {
    id: string;
    name: string;
    domain: string;
  };
  companyB?: {
    id: string;
    name: string;
    domain: string;
  };
}

export interface CreatePartnership {
  partnerCompanyId: string;
  name?: string;
  description?: string;
  type?: string;
  shareJobs?: boolean;
  shareServices?: boolean;
  shareResources?: boolean;
  terms?: any;
}

export interface PartnershipInvite {
  id: string;
  fromCompanyId: string;
  toCompanyId: string;
  message?: string;
  proposedTerms?: any;
  shareJobs: boolean;
  shareServices: boolean;
  shareResources: boolean;
  status: string; // pending, accepted, rejected, expired
  expiresAt?: Date;
  respondedBy?: string;
  respondedAt?: Date;
  rejectionReason?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  fromCompany?: {
    id: string;
    name: string;
    domain: string;
  };
  toCompany?: {
    id: string;
    name: string;
    domain: string;
  };
}

export interface CreatePartnershipInvite {
  toCompanyId: string;
  message?: string;
  shareJobs?: boolean;
  shareServices?: boolean;
  shareResources?: boolean;
  proposedTerms?: any;
  expiresAt?: string;
}
