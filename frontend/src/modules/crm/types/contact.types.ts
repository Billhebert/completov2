/**
 * Contact Types (alinhado com o backend)
 */

export type ContactLeadStatus =
  | "lead"
  | "prospect"
  | "customer"
  | "inactive"
  | "qualified"
  | "lost"
  | "nurturing";

export type ContactLeadSource =
  | "website"
  | "referral"
  | "social"
  | "email"
  | "phone"
  | "event"
  | "other";

export interface Contact {
  id: string;
  companyId: string;

  name: string;
  email?: string | null;
  phone?: string | null;

  companyName?: string | null;
  position?: string | null;

  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipCode?: string | null;

  tags?: string[] | null;
  customFields?: Record<string, any> | null;

  ownerId?: string | null;

  leadSource?: ContactLeadSource | string | null;
  leadStatus?: ContactLeadStatus | string | null;
  leadScore?: number | null;
  rating?: number | null;

  stripeCustomerId?: string | null;

  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string | null;

  // agregados que aparecem no SELECT do prisma (podem vir como _aggr_count_*)
  _aggr_count_deals?: number;
  _aggr_count_interactions?: number;

  // opcional se o backend mandar num formato diferente
  dealsCount?: number;
  interactionsCount?: number;
}

export interface ContactFilters {
  search?: string;
  leadStatus?: ContactLeadStatus | string;
  leadSource?: ContactLeadSource | string;
}

export interface CreateContactRequest {
  name: string;
  email?: string;
  phone?: string;

  companyName?: string;
  position?: string;

  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;

  tags?: string[];

  leadSource?: ContactLeadSource | string;
  leadStatus?: ContactLeadStatus | string;
}

export type UpdateContactRequest = Partial<CreateContactRequest>;
