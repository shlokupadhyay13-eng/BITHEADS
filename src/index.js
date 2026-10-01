/**
 * @file index.js
 * @description Public exports for Document Intelligence & AI Research Engine service module (Person 1).
 */

export { processDocument } from './research/processDocument.js';
export { extractPolicyInformation } from './research/extract.js';
export { summarizeDocument } from './research/summarize.js';
export { answerQuestion } from './research/answer.js';
export { compareDocuments } from './research/compare.js';
export { AppError, ERROR_CODES } from './utils/errors.js';
