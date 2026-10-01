import { formatFileSize } from './formatters';

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates file prior to upload.
 * NOTE:
 * // Frontend validation is for UX convenience only; the backend is authoritative.
 */
export function validateUploadFile(file: File | null | undefined): FileValidationResult {
  // Frontend validation is for UX convenience only; the backend is authoritative.
  if (!file) {
    return {
      isValid: false,
      error: 'Please choose a statutory policy document to upload.',
    };
  }

  // 1. Check for empty file (0 bytes)
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'The selected file is empty (0 bytes). Please upload a valid document.',
    };
  }

  // 2. Check maximum allowable size (50MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the maximum statutory limit of 50 MB.`,
    };
  }

  // 3. Check file extension & type
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = SUPPORTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

  if (!hasValidExtension) {
    return {
      isValid: false,
      error: `Unsupported file format. Supported extensions: ${SUPPORTED_EXTENSIONS.join(', ')}.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates metadata form fields.
 * NOTE:
 * // Frontend validation is for UX convenience only; the backend is authoritative.
 */
export function validateUploadMetadata(metadata: {
  title: string;
  issuingMinistry: string;
  publicationDate: string;
}): Record<string, string> {
  // Frontend validation is for UX convenience only; the backend is authoritative.
  const errors: Record<string, string> = {};

  if (!metadata.title || !metadata.title.trim()) {
    errors.title = 'Document title is required.';
  } else if (metadata.title.trim().length < 3) {
    errors.title = 'Document title must be at least 3 characters.';
  }

  if (!metadata.issuingMinistry || !metadata.issuingMinistry.trim()) {
    errors.ministry = 'Issuing ministry or regulatory authority is required.';
  }

  if (!metadata.publicationDate || !metadata.publicationDate.trim()) {
    errors.pubDate = 'Official gazette or publication date is required.';
  }

  return errors;
}
