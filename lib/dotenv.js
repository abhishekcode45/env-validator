'use strict';

const fs = require('fs');
const path = require('path');

function unescapeQuotes(str) {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function parseDotenv(src) {
  if (typeof src !== 'string') {
    return {};
  }

  const result = {};
  const lines = src.split(/\r?\n/);

  let inQuotes = false;
  let quoteChar = null;
  let currentKey = null;
  let currentValue = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (inQuotes) {
      const endQuoteIdx = line.indexOf(quoteChar);
      if (endQuoteIdx === -1) {
        currentValue += '\n' + line;
        continue;
      } else {
        currentValue += '\n' + line.slice(0, endQuoteIdx);
        if (quoteChar === '"') {
          currentValue = unescapeQuotes(currentValue);
        }
        result[currentKey] = currentValue;
        inQuotes = false;
        quoteChar = null;
        currentKey = null;
        currentValue = '';
        continue;
      }
    }

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const effectiveLine = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
    const eqIdx = effectiveLine.indexOf('=');
    if (eqIdx === -1) {
      continue;
    }

    const key = effectiveLine.slice(0, eqIdx).trim();
    let val = effectiveLine.slice(eqIdx + 1).trim();

    if (!key) continue;

    if (
      (val.startsWith('"') && (!val.endsWith('"') || val.length === 1)) ||
      (val.startsWith("'") && (!val.endsWith("'") || val.length === 1))
    ) {
      quoteChar = val[0];
      inQuotes = true;
      currentKey = key;
      currentValue = val.slice(1);
      continue;
    }

    if (
      (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
      (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
    ) {
      const q = val[0];
      val = val.slice(1, -1);
      if (q === '"') {
        val = unescapeQuotes(val);
      }
    } else {
      const commentIdx = val.indexOf(' #');
      if (commentIdx !== -1) {
        val = val.slice(0, commentIdx).trim();
      }
    }

    result[key] = val;
  }

  return result;
}

function loadDotenv(options = {}) {
  const envPath = options.path ? path.resolve(process.cwd(), options.path) : path.resolve(process.cwd(), '.env');
  const override = options.override === true;

  if (!fs.existsSync(envPath)) {
    return { parsed: {}, path: envPath, loaded: false };
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const parsed = parseDotenv(content);

  for (const [k, v] of Object.entries(parsed)) {
    if (override || process.env[k] === undefined) {
      process.env[k] = v;
    }
  }

  return { parsed, path: envPath, loaded: true };
}

module.exports = {
  parseDotenv,
  loadDotenv,
};
