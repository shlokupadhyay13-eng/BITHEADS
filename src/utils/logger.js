/**
 * @file logger.js
 * @description Safe, structured logger with automatic secret redaction and level filtering.
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

/**
 * Redacts potential secrets, API keys, and credentials from messages and metadata objects.
 * @param {any} item - Object, string, or primitive to sanitize.
 * @returns {any} Sanitized output safely stripped of sensitive data.
 */
function redactSecrets(item) {
  if (item === null || item === undefined) return item;
  
  if (typeof item === 'string') {
    // Redact Gemini API keys (AIza...) and generic potential API key patterns
    let sanitized = item.replace(/AIzaSy[A-Za-z0-9_-]{33}/g, '[REDACTED_API_KEY]');
    sanitized = sanitized.replace(/(key|token|secret|auth|bearer)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{16,})['"]?/gi, '$1: [REDACTED]');
    return sanitized;
  }

  if (typeof item === 'object') {
    if (Array.isArray(item)) {
      return item.map(redactSecrets);
    }
    const cleanObj = {};
    for (const [key, value] of Object.entries(item)) {
      if (/key|secret|token|password|auth|credential/i.test(key)) {
        cleanObj[key] = '[REDACTED]';
      } else {
        cleanObj[key] = redactSecrets(value);
      }
    }
    return cleanObj;
  }

  return item;
}

function shouldLog(level) {
  const configuredLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
  const currentPriority = LOG_LEVELS[configuredLevel] ?? LOG_LEVELS.info;
  const targetPriority = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  return targetPriority >= currentPriority;
}

function logMessage(level, message, meta = {}) {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString();
  const sanitizedMsg = redactSecrets(message);
  const sanitizedMeta = redactSecrets(meta);

  const payload = {
    timestamp,
    level: level.toUpperCase(),
    message: sanitizedMsg,
    ...(Object.keys(sanitizedMeta).length > 0 ? { meta: sanitizedMeta } : {})
  };

  const output = JSON.stringify(payload);

  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  /**
   * Log debug message
   * @param {string} message 
   * @param {Record<string, any>} [meta] 
   */
  debug: (message, meta) => logMessage('debug', message, meta),

  /**
   * Log info message
   * @param {string} message 
   * @param {Record<string, any>} [meta] 
   */
  info: (message, meta) => logMessage('info', message, meta),

  /**
   * Log warn message
   * @param {string} message 
   * @param {Record<string, any>} [meta] 
   */
  warn: (message, meta) => logMessage('warn', message, meta),

  /**
   * Log error message
   * @param {string} message 
   * @param {Record<string, any>} [meta] 
   */
  error: (message, meta) => logMessage('error', message, meta)
};
