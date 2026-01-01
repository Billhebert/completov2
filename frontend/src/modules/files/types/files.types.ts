/**
 * Files Types
 * Tipos para gestão de arquivos
 */

export interface FileItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  path: string;
  folderId?: string;
  uploadedBy: string;
  uploadedByName: string;
  isPublic: boolean;
  downloads: number;
  tags: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  path: string;
  filesCount: number;
  size: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadFileRequest {
  file: File;
  folderId?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface FileFilters {
  folderId?: string;
  mimeType?: string;
  uploadedBy?: string;
  tags?: string[];
  search?: string;
}
