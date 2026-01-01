/**
 * Search Types
 */

export interface SearchResult {
  id: string;
  type: 'contact' | 'deal' | 'company' | 'article' | 'file' | 'conversation';
  title: string;
  description: string;
  url: string;
  highlights: string[];
  score: number;
  metadata?: Record<string, unknown>;
}

export interface SearchFilters {
  types?: string[];
  dateFrom?: string;
  dateTo?: string;
  createdBy?: string;
}
