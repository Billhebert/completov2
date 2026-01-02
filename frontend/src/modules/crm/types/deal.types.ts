// src/modules/crm/types/deal.types.ts

export type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency?: string;
  stage: DealStage;
  probability?: number;
  expectedCloseDate?: string | null;
  createdAt?: string;
  updatedAt?: string;

  // relacionais
  contactId?: string;
  ownerId?: string;

  // extras (se o backend devolver)
  description?: string;
  priority?: "low" | "medium" | "high";
  notes?: string;
}

export interface GetDealsParams {
  page?: number;
  limit?: number;
  search?: string;
  stage?: DealStage;
  _ts?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

type DealContactRef =
  | { contactId: string; contactName?: never }
  | { contactId?: never; contactName: string };

export type CreateDealRequest = DealContactRef & {
  title: string;
  value: number | string;
  currency?: string;
  stage?: DealStage;
  expectedCloseDate?: string;
  ownerId?: string;
  products?: any[];

  // extras
  description?: string;
  priority?: "low" | "medium" | "high";
  probability?: number | string;
  notes?: string;
  companyName?: string;
};

export type UpdateDealRequest = Partial<Omit<CreateDealRequest, "contactName" | "contactId">> & {
  // update pode manter contato como está; se quiser mudar contato, faça endpoint específico depois
};
