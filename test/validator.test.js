'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateEnv, EnvValidationError } = require('../index');

test('validates and coerces all supported types', () => {
  const schema = {
    APP_NAME: { type: 'string' },
    PORT: { type: 'port' },
    DEBUG: { type: 'boolean' },
    TIMEOUT: { type: 'number' },
    DATABASE_URL: { type: 'url' },
    ADMIN_EMAIL: { type: 'email' },
    NODE_ENV: { type: 'enum', choices: ['development', 'production', 'test'] },
  };

  const source = {
    APP_NAME: 'My App',
    PORT: '8080',
    DEBUG: 'yes',
    TIMEOUT: '3000',
    DATABASE_URL: 'https://example.com/db',
    ADMIN_EMAIL: 'admin@example.com',
    NODE_ENV: 'production',
  };

  const env = validateEnv(schema, { source, loadDotenv: false });

  assert.equal(env.APP_NAME, 'My App');
  assert.equal(env.PORT, 8080);
  assert.equal(env.DEBUG, true);
  assert.equal(env.TIMEOUT, 3000);
  assert.equal(env.DATABASE_URL, 'https://example.com/db');
  assert.equal(env.ADMIN_EMAIL, 'admin@example.com');
  assert.equal(env.NODE_ENV, 'production');
});

test('boolean handles true/false, 1/0, yes/no case-insensitively', () => {
  const schema = {
    B1: { type: 'boolean' },
    B2: { type: 'boolean' },
    B3: { type: 'boolean' },
    B4: { type: 'boolean' },
    B5: { type: 'boolean' },
    B6: { type: 'boolean' },
  };

  const source = {
    B1: 'TRUE',
    B2: '1',
    B3: 'yes',
    B4: 'FALSE',
    B5: '0',
    B6: 'no',
  };

  const env = validateEnv(schema, { source, loadDotenv: false });
  assert.equal(env.B1, true);
  assert.equal(env.B2, true);
  assert.equal(env.B3, true);
  assert.equal(env.B4, false);
  assert.equal(env.B5, false);
  assert.equal(env.B6, false);
});

test('port validates range 1-65535 and fails on invalid input', () => {
  const schema = { PORT: { type: 'port' } };

  assert.throws(
    () => validateEnv(schema, { source: { PORT: 'abc' }, loadDotenv: false }),
    (err) => {
      assert.equal(err.name, 'EnvValidationError');
      assert.equal(err.errors[0].key, 'PORT');
      assert.match(err.errors[0].message, /expected a port \(1-65535\), got "abc"/);
      return true;
    }
  );

  assert.throws(
    () => validateEnv(schema, { source: { PORT: '0' }, loadDotenv: false }),
    EnvValidationError
  );

  assert.throws(
    () => validateEnv(schema, { source: { PORT: '65536' }, loadDotenv: false }),
    EnvValidationError
  );
});

test('number supports min and max constraints', () => {
  const schema = {
    VAL: { type: 'number', min: 10, max: 100 },
  };

  assert.throws(
    () => validateEnv(schema, { source: { VAL: '5' }, loadDotenv: false }),
    (err) => {
      assert.match(err.errors[0].message, /expected a number >= 10, got 5/);
      return true;
    }
  );

  assert.throws(
    () => validateEnv(schema, { source: { VAL: '150' }, loadDotenv: false }),
    (err) => {
      assert.match(err.errors[0].message, /expected a number <= 100, got 150/);
      return true;
    }
  );

  const valid = validateEnv(schema, { source: { VAL: '42.5' }, loadDotenv: false });
  assert.equal(valid.VAL, 42.5);
});

test('string supports pattern matching and custom error messages', () => {
  const schema = {
    API_KEY: {
      type: 'string',
      pattern: /^[A-Za-z0-9]{32}$/,
      message: 'API_KEY must be 32 alphanumeric chars',
    },
  };

  assert.throws(
    () => validateEnv(schema, { source: { API_KEY: 'short' }, loadDotenv: false }),
    (err) => {
      assert.equal(err.errors[0].message, 'API_KEY must be 32 alphanumeric chars');
      return true;
    }
  );

  const ok = validateEnv(schema, {
    source: { API_KEY: 'a'.repeat(32) },
    loadDotenv: false,
  });
  assert.equal(ok.API_KEY, 'a'.repeat(32));
});

test('uses defaults for missing optional variables and fails on missing required variables', () => {
  const schema = {
    PORT: { type: 'port', default: 3000 },
    HOST: { type: 'string', default: 'localhost' },
    REQUIRED_KEY: { type: 'string' },
  };

  assert.throws(
    () => validateEnv(schema, { source: {}, loadDotenv: false }),
    (err) => {
      assert.equal(err.errors.length, 1);
      assert.equal(err.errors[0].key, 'REQUIRED_KEY');
      assert.equal(err.errors[0].message, 'is required but missing');
      return true;
    }
  );

  const env = validateEnv(schema, {
    source: { REQUIRED_KEY: 'secret' },
    loadDotenv: false,
  });
  assert.equal(env.PORT, 3000);
  assert.equal(env.HOST, 'localhost');
  assert.equal(env.REQUIRED_KEY, 'secret');
});

test('EnvValidationError formats error message with proper alignment', () => {
  const schema = {
    DATABASE_URL: { type: 'url', required: true },
    PORT: { type: 'port' },
  };

  try {
    validateEnv(schema, { source: { PORT: 'abc' }, loadDotenv: false });
    assert.fail('Should have thrown EnvValidationError');
  } catch (err) {
    assert.equal(err.name, 'EnvValidationError');
    assert.equal(err.errors.length, 2);
    const msg = err.message;
    assert.match(msg, /2 problems found/);
    assert.match(msg, /DATABASE_URL\s+is required but missing/);
    assert.match(msg, /PORT\s+expected a port \(1-65535\), got "abc"/);
  }
});

test('strict mode flags unknown variables', () => {
  const schema = {
    PORT: { type: 'port' },
  };

  assert.throws(
    () =>
      validateEnv(schema, {
        source: { PORT: '3000', UNKNOWN_A: '1', UNKNOWN_B: '2' },
        strict: true,
        loadDotenv: false,
      }),
    (err) => {
      assert.equal(err.name, 'EnvValidationError');
      assert.equal(err.errors.length, 2);
      assert.equal(err.errors[0].key, 'UNKNOWN_A');
      assert.equal(err.errors[1].key, 'UNKNOWN_B');
      return true;
    }
  );
});
