'use strict';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateString(val, item) {
  const strVal = String(val);

  if (item.pattern) {
    let regex;
    if (item.pattern instanceof RegExp) {
      regex = item.pattern;
    } else if (typeof item.pattern === 'string') {
      try {
        regex = new RegExp(item.pattern);
      } catch (e) {
        return { error: `invalid pattern regex: ${item.pattern}` };
      }
    }

    if (regex && !regex.test(strVal)) {
      return {
        error: item.message || `expected value to match pattern ${item.pattern}, got "${strVal}"`,
      };
    }
  }

  return { value: strVal };
}

function validateNumber(val, item) {
  const trimmed = typeof val === 'string' ? val.trim() : val;
  if (trimmed === '' || trimmed === null || trimmed === undefined) {
    return { error: item.message || `expected a number, got "${val}"` };
  }

  const num = Number(trimmed);
  if (isNaN(num) || !isFinite(num)) {
    return { error: item.message || `expected a number, got "${val}"` };
  }

  if (item.min !== undefined && num < item.min) {
    return { error: item.message || `expected a number >= ${item.min}, got ${num}` };
  }

  if (item.max !== undefined && num > item.max) {
    return { error: item.message || `expected a number <= ${item.max}, got ${num}` };
  }

  return { value: num };
}

function validateBoolean(val, item) {
  if (typeof val === 'boolean') {
    return { value: val };
  }

  const str = String(val).trim().toLowerCase();
  if (str === 'true' || str === '1' || str === 'yes') {
    return { value: true };
  }
  if (str === 'false' || str === '0' || str === 'no') {
    return { value: false };
  }

  return { error: item.message || `expected a boolean (true/false, 1/0, yes/no), got "${val}"` };
}

function validatePort(val, item) {
  const trimmed = typeof val === 'string' ? val.trim() : val;
  if (trimmed === '' || trimmed === null || trimmed === undefined) {
    return { error: item.message || `expected a port (1-65535), got "${val}"` };
  }

  const num = Number(trimmed);
  if (!Number.isInteger(num) || num < 1 || num > 65535 || String(num) !== String(trimmed)) {
    return { error: item.message || `expected a port (1-65535), got "${val}"` };
  }

  return { value: num };
}

function validateUrl(val, item) {
  const str = String(val).trim();
  try {
    const parsed = new URL(str);
    if (!parsed.protocol) {
      throw new Error();
    }
    return { value: str };
  } catch (err) {
    return { error: item.message || `expected a valid URL, got "${val}"` };
  }
}

function validateEmail(val, item) {
  const str = String(val).trim();
  if (!EMAIL_REGEX.test(str)) {
    return { error: item.message || `expected a valid email address, got "${val}"` };
  }
  return { value: str };
}

function validateEnum(val, item) {
  const choices = Array.isArray(item.choices) ? item.choices : [];
  const stringVal = String(val);

  const matchedChoice = choices.find(choice => String(choice) === stringVal);
  if (matchedChoice !== undefined) {
    return { value: matchedChoice };
  }

  return {
    error: item.message || `expected one of [${choices.join(', ')}], got "${val}"`,
  };
}

const TYPE_VALIDATORS = {
  string: validateString,
  number: validateNumber,
  boolean: validateBoolean,
  port: validatePort,
  url: validateUrl,
  email: validateEmail,
  enum: validateEnum,
};

module.exports = {
  TYPE_VALIDATORS,
};
