/**
 * Knowledge Types
 * Tipos para base de conhecimento
 */

export interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  categoryId: string;
  categoryName: string;
  tags: string[];
  author: string;
  authorName: string;
  status: 'draft' | 'published' | 'archived';
  views: number;
  helpful: number;
  notHelpful: number;
  attachments: string[];
  relatedArticles: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  icon?: string;
  articlesCount: number;
  order: number;
  createdAt: string;
}

export interface ArticleFilters {
  categoryId?: string;
  status?: 'draft' | 'published' | 'archived';
  author?: string;
  tags?: string[];
  search?: string;
}
