// src/core/utils/file-validator.ts
import { BadRequestError } from '../errors';

/**
 * File type definitions with magic numbers for validation
 */
interface FileTypeDefinition {
  mimeTypes: string[];
  extensions: string[];
  magicNumbers: { offset: number; bytes: number[] }[];
}

const ALLOWED_FILE_TYPES: Record<string, FileTypeDefinition> = {
  'image/jpeg': {
    mimeTypes: ['image/jpeg', 'image/jpg'],
    extensions: ['.jpg', '.jpeg'],
    magicNumbers: [
      { offset: 0, bytes: [0xff, 0xd8, 0xff] },
    ],
  },
  'image/png': {
    mimeTypes: ['image/png'],
    extensions: ['.png'],
    magicNumbers: [
      { offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
    ],
  },
  'image/gif': {
    mimeTypes: ['image/gif'],
    extensions: ['.gif'],
    magicNumbers: [
      { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
      { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
    ],
  },
  'image/webp': {
    mimeTypes: ['image/webp'],
    extensions: ['.webp'],
    magicNumbers: [
      { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
      { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // WEBP
    ],
  },
  'application/pdf': {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    magicNumbers: [
      { offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
    ],
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    extensions: ['.docx'],
    magicNumbers: [
      { offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }, // ZIP signature
    ],
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    extensions: ['.xlsx'],
    magicNumbers: [
      { offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }, // ZIP signature
    ],
  },
  'application/msword': {
    mimeTypes: ['application/msword'],
    extensions: ['.doc'],
    magicNumbers: [
      { offset: 0, bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // OLE
    ],
  },
  'text/csv': {
    mimeTypes: ['text/csv', 'application/csv'],
    extensions: ['.csv'],
    magicNumbers: [], // CSV has no magic number
  },
};

/**
 * Configuration for file upload validation
 */
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB default
  ALLOWED_MIME_TYPES: Object.values(ALLOWED_FILE_TYPES).flatMap(t => t.mimeTypes),
  ALLOWED_EXTENSIONS: Object.values(ALLOWED_FILE_TYPES).flatMap(t => t.extensions),
};

/**
 * Validate file extension against filename
 */
export function validateFileExtension(filename: string, mimeType: string): boolean {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));

  for (const [type, definition] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (definition.mimeTypes.includes(mimeType)) {
      return definition.extensions.includes(extension);
    }
  }

  return false;
}

/**
 * Validate file magic numbers (file signature)
 * Prevents MIME type spoofing by checking actual file content
 */
export function validateFileMagicNumber(buffer: Buffer, mimeType: string): boolean {
  for (const [type, definition] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (definition.mimeTypes.includes(mimeType)) {
      // Skip magic number check for types without magic numbers (like CSV)
      if (definition.magicNumbers.length === 0) {
        return true;
      }

      // Check if any of the magic number patterns match
      return definition.magicNumbers.some(magic => {
        if (buffer.length < magic.offset + magic.bytes.length) {
          return false;
        }

        return magic.bytes.every((byte, index) => {
          return buffer[magic.offset + index] === byte;
        });
      });
    }
  }

  return false;
}

/**
 * Detect potentially malicious file content
 * Basic heuristics for common attack patterns
 */
export function detectMaliciousContent(buffer: Buffer, filename: string): string[] {
  const warnings: string[] = [];
  const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 1024));

  // Check for script tags in non-script files
  if (!filename.match(/\.(js|ts|jsx|tsx)$/i)) {
    if (/<script[^>]*>|javascript:/i.test(content)) {
      warnings.push('Suspicious script content detected');
    }
  }

  // Check for PHP tags in non-PHP files
  if (!filename.match(/\.php$/i)) {
    if (/<\?php|<\?=/i.test(content)) {
      warnings.push('Suspicious PHP content detected');
    }
  }

  // Check for double extensions (e.g., file.pdf.exe)
  const parts = filename.split('.');
  if (parts.length > 2) {
    const suspiciousExtensions = ['exe', 'bat', 'cmd', 'sh', 'ps1', 'vbs', 'jar'];
    const allExtensions = parts.slice(1).map(e => e.toLowerCase());
    if (allExtensions.some(ext => suspiciousExtensions.includes(ext))) {
      warnings.push('Suspicious double extension detected');
    }
  }

  // Check for null bytes (often used to bypass filters)
  if (buffer.includes(0x00) && !filename.match(/\.(pdf|docx|xlsx|doc|xls|zip)$/i)) {
    warnings.push('Null byte detected in file');
  }

  return warnings;
}

/**
 * Comprehensive file validation
 */
export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateUploadedFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  maxSize: number = FILE_UPLOAD_CONFIG.MAX_FILE_SIZE
): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check file size
  if (buffer.length > maxSize) {
    errors.push(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
  }

  if (buffer.length === 0) {
    errors.push('File is empty');
  }

  // 2. Validate MIME type
  if (!FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(mimeType)) {
    errors.push(`File type ${mimeType} is not allowed`);
  }

  // 3. Validate file extension matches MIME type
  if (!validateFileExtension(filename, mimeType)) {
    errors.push('File extension does not match MIME type');
  }

  // 4. Validate magic numbers (file signature)
  if (!validateFileMagicNumber(buffer, mimeType)) {
    errors.push('File content does not match declared MIME type (possible spoofing)');
  }

  // 5. Check for malicious content
  const maliciousWarnings = detectMaliciousContent(buffer, filename);
  warnings.push(...maliciousWarnings);

  // If malicious content is detected, treat as error
  if (maliciousWarnings.length > 0) {
    errors.push('File contains potentially malicious content');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize filename to prevent directory traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  let sanitized = filename.replace(/^.*[\\\/]/, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Replace dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '_');

  // Prevent directory traversal
  sanitized = sanitized.replace(/\.\./g, '_');

  // Limit length
  const maxLength = 255;
  if (sanitized.length > maxLength) {
    const extension = sanitized.substring(sanitized.lastIndexOf('.'));
    const basename = sanitized.substring(0, maxLength - extension.length);
    sanitized = basename + extension;
  }

  return sanitized;
}

/**
 * Generate a safe storage filename
 */
export function generateSafeFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const extension = sanitized.substring(sanitized.lastIndexOf('.'));
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  return `${timestamp}-${random}${extension}`;
}
