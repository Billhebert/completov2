// web/src/types/jobs.ts

export interface Job {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requirements: string;
  responsibilities?: string;
  benefits?: string;
  types: string[]; // "public", "internal", "partners"
  isSpecialized: boolean;
  requiredSkills?: any;
  desiredSkills?: any;
  requiredZettels?: any;
  requiredDocuments?: any;
  status: string; // "open", "closed", "filled", "cancelled"
  vacancies: number;
  filledVacancies: number;
  location?: string;
  workMode?: string;
  salary?: number;
  salaryMax?: number;
  currency?: string;
  experienceLevel?: string;
  isActive: boolean;
  publishedAt?: Date;
  closedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    applications: number;
    interests: number;
  };
}

export interface CreateJob {
  title: string;
  description: string;
  requirements: string;
  responsibilities?: string;
  benefits?: string;
  types: string[];
  isSpecialized: boolean;
  requiredSkills?: any;
  desiredSkills?: any;
  requiredZettels?: any;
  requiredDocuments?: any;
  status?: string;
  vacancies?: number;
  location?: string;
  workMode?: string;
  salary?: number;
  salaryMax?: number;
  currency?: string;
  experienceLevel?: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  coverLetter?: string;
  resume?: any;
  documents?: any;
  documentsVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  status: string; // "pending", "reviewing", "interview", "approved", "rejected"
  currentStep: number;
  internalNotes?: string;
  feedback?: string;
  rating?: number;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface JobInterest {
  id: string;
  jobId: string;
  userId: string;
  reason?: string;
  notifyOnChanges: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobZettelSuggestion {
  id: string;
  jobId: string;
  userId: string;
  suggestedZettels: any; // [{zettelId, title, relevance, reason}]
  skillGaps: any; // Skills que faltam ao usuario
  learningPath?: any; // Caminho de aprendizado sugerido
  estimatedTime?: number; // Tempo estimado em horas
  priority: string; // "low", "medium", "high"
  status: string; // "active", "in_progress", "completed"
  completionRate: number;
  createdAt: Date;
  updatedAt: Date;
}
