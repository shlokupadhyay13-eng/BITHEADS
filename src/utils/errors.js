/**
 * @file errors.js
 * @description Standardized error types and constants for Person 1 services.
 */

export const ERROR_CODES = Object.freeze({
  INVALID_FILE: 'INVALID_FILE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  CORRUPT_PDF: 'CORRUPT_PDF',
  INSUFFICIENT_TEXT: 'INSUFFICIENT_TEXT',
  OCR_NOT_CONFIGURED: 'OCR_NOT_CONFIGURED',
  CONFIG_MISSING_API_KEY: 'CONFIG_MISSING_API_KEY',
  AI_REQUEST_FAILED: 'AI_REQUEST_FAILED',
  AI_INVALID_RESPONSE: 'AI_INVALID_RESPONSE',
  INSUFFICIENT_EVIDENCE: 'INSUFFICIENT_EVIDENCE',
  INVALID_INPUT: 'INVALID_INPUT'
});

export class AppError extends Error {
  /**
   * @param {string} code - Error code from ERROR_CODES
   * @param {string} message - Human-readable error message
   * @param {Record<string, any>} [details=null] - Additional safe context/metadata
   * @param {boolean} [isOperational=true] - Whether the error is operational
   */
  constructor(code, message, details = null, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}
