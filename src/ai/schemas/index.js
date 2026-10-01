/**
 * @file index.js
 * @description JSON schemas and Ajv validation helper for AI research responses.
 */

import Ajv from 'ajv';
import { AppError, ERROR_CODES } from '../../utils/errors.js';

const ajv = new Ajv({ allErrors: true, coerceTypes: true });

const evidenceItemSchema = {
  type: 'object',
  properties: {
    chunkId: { type: 'string' },
    quote: { type: 'string' }
  },
  required: ['chunkId', 'quote'],
  additionalProperties: true
};

const valueWithEvidenceSchema = {
  type: 'object',
  properties: {
    value: { type: 'string' },
    evidence: { type: 'array', items: evidenceItemSchema }
  },
  required: ['value', 'evidence'],
  additionalProperties: true
};

export const SCHEMAS = {
  policyExtraction: {
    type: 'object',
    properties: {
      title: valueWithEvidenceSchema,
      issuingBody: valueWithEvidenceSchema,
      dateIssued: valueWithEvidenceSchema,
      effectiveDate: valueWithEvidenceSchema,
      objectives: { type: 'array', items: valueWithEvidenceSchema },
      beneficiaries: { type: 'array', items: valueWithEvidenceSchema },
      budget: valueWithEvidenceSchema,
      deadlines: { type: 'array', items: valueWithEvidenceSchema },
      keyProvisions: { type: 'array', items: valueWithEvidenceSchema },
      insufficientEvidence: { type: 'boolean' }
    },
    required: ['insufficientEvidence'],
    additionalProperties: true
  },

  summary: {
    type: 'object',
    properties: {
      shortSummary: { type: 'string' },
      keyPoints: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            point: { type: 'string' },
            evidence: { type: 'array', items: evidenceItemSchema }
          },
          required: ['point', 'evidence'],
          additionalProperties: true
        }
      },
      insufficientEvidence: { type: 'boolean' }
    },
    required: ['shortSummary', 'keyPoints', 'insufficientEvidence'],
    additionalProperties: true
  },

  answer: {
    type: 'object',
    properties: {
      answer: { type: 'string' },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
      evidence: { type: 'array', items: evidenceItemSchema },
      insufficientEvidence: { type: 'boolean' }
    },
    required: ['answer', 'confidence', 'evidence', 'insufficientEvidence'],
    additionalProperties: true
  },

  comparison: {
    type: 'object',
    properties: {
      similarities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            detail: { type: 'string' },
            evidenceA: { type: 'array', items: evidenceItemSchema },
            evidenceB: { type: 'array', items: evidenceItemSchema }
          },
          required: ['topic', 'detail', 'evidenceA', 'evidenceB'],
          additionalProperties: true
        }
      },
      differences: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            documentADetail: { type: 'string' },
            documentBDetail: { type: 'string' },
            evidenceA: { type: 'array', items: evidenceItemSchema },
            evidenceB: { type: 'array', items: evidenceItemSchema }
          },
          required: ['topic', 'documentADetail', 'documentBDetail', 'evidenceA', 'evidenceB'],
          additionalProperties: true
        }
      },
      insufficientEvidence: { type: 'boolean' }
    },
    required: ['similarities', 'differences', 'insufficientEvidence'],
    additionalProperties: true
  }
};

// Compile schemas in Ajv
const validators = {};
for (const [name, schema] of Object.entries(SCHEMAS)) {
  validators[name] = ajv.compile(schema);
}

/**
 * Validates data object against a registered schema name.
 * @param {'policyExtraction'|'summary'|'answer'|'comparison'} schemaName 
 * @param {any} data 
 * @returns {boolean} True if valid
 * @throws {AppError} AI_INVALID_RESPONSE if validation fails
 */
export function validateSchema(schemaName, data) {
  const validator = validators[schemaName];
  if (!validator) {
    throw new AppError(
      ERROR_CODES.AI_INVALID_RESPONSE,
      `Unknown schema name: ${schemaName}`
    );
  }

  const valid = validator(data);
  if (!valid) {
    const errorDetails = validator.errors.map(e => `${e.instancePath} ${e.message}`).join('; ');
    throw new AppError(
      ERROR_CODES.AI_INVALID_RESPONSE,
      `AI response schema validation failed for ${schemaName}: ${errorDetails}`,
      { schemaName, errors: validator.errors }
    );
  }

  return true;
}
