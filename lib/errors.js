'use strict';

class EnvValidationError extends Error {
  constructor(errors) {
    const list = Array.isArray(errors) ? errors : [];
    const count = list.length;
    const summary = `${count} ${count === 1 ? 'problem' : 'problems'} found`;

    const maxKeyLen = list.reduce((max, err) => Math.max(max, (err.key || '').length), 0);

    const formattedLines = list.map(err => {
      const paddedKey = (err.key || '').padEnd(maxKeyLen, ' ');
      return `  x ${paddedKey}  ${err.message}`;
    });

    const fullMessage = `${summary}\n\n${formattedLines.join('\n')}`;
    super(fullMessage);
    this.name = 'EnvValidationError';
    this.errors = list;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EnvValidationError);
    }
  }
}

module.exports = {
  EnvValidationError,
};
