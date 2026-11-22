'use strict';

const { TYPE_VALIDATORS } = require('./types');
const { EnvValidationError } = require('./errors');
const { loadDotenv } = require('./dotenv');

function validateEnv(schema, options = {}) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new TypeError('Schema must be an object defining environment variables');
  }

  const {
    loadDotenv: shouldLoadDotenv = true,
    path: envPath = './.env',
    strict = false,
  } = options;

  let dotenvKeys = [];
  if (shouldLoadDotenv) {
    const loaded = loadDotenv({ path: envPath });
    if (loaded.loaded) {
      dotenvKeys = Object.keys(loaded.parsed);
      if (options.source && typeof options.source === 'object') {
        for (const [k, v] of Object.entries(loaded.parsed)) {
          if (options.source[k] === undefined) {
            options.source[k] = v;
          }
        }
      }
    }
  }

  const source = options.source !== undefined ? options.source : process.env;
  const errors = [];
  const result = {};

  for (const [key, item] of Object.entries(schema)) {
    if (!item || typeof item !== 'object') {
      throw new TypeError(`Schema definition for "${key}" must be an object`);
    }

    const { type } = item;
    if (!type || !TYPE_VALIDATORS[type]) {
      throw new TypeError(
        `Unknown or missing type "${type}" for "${key}". Supported types: ${Object.keys(TYPE_VALIDATORS).join(', ')}`
      );
    }

    const isRequired = item.required !== undefined ? item.required === true : item.default === undefined;
    const rawVal = source ? source[key] : undefined;

    const isMissing =
      rawVal === undefined || rawVal === null || (typeof rawVal === 'string' && rawVal.trim() === '');

    if (isMissing) {
      if (item.default !== undefined) {
        const validatedDefault = TYPE_VALIDATORS[type](item.default, item);
        if (validatedDefault.error) {
          errors.push({
            key,
            message: `default value is invalid: ${validatedDefault.error}`,
          });
        } else {
          result[key] = validatedDefault.value;
        }
      } else if (isRequired) {
        errors.push({
          key,
          message: item.message || 'is required but missing',
        });
      } else {
        result[key] = undefined;
      }
    } else {
      const validated = TYPE_VALIDATORS[type](rawVal, item);
      if (validated.error) {
        errors.push({
          key,
          message: item.message || validated.error,
        });
      } else {
        result[key] = validated.value;
      }
    }
  }

  if (strict) {
    const schemaKeys = new Set(Object.keys(schema));
    let keysToCheck = [];

    if (options.source !== undefined) {
      keysToCheck = Object.keys(source);
    } else if (dotenvKeys.length > 0) {
      keysToCheck = dotenvKeys;
    }

    for (const key of keysToCheck) {
      if (!schemaKeys.has(key)) {
        errors.push({
          key,
          message: 'unknown variable not in schema',
        });
      }
    }
  }

  if (errors.length > 0) {
    throw new EnvValidationError(errors);
  }

  return result;
}

module.exports = {
  validateEnv,
};
