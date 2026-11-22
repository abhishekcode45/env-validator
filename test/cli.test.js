'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const cliPath = path.resolve(__dirname, '../bin/env-validator.js');

test('CLI check succeeds with valid env and schema', () => {
  const schemaPath = path.resolve(__dirname, 'valid.schema.json');
  const envPath = path.resolve(__dirname, 'valid.env');

  fs.writeFileSync(
    schemaPath,
    JSON.stringify({
      PORT: { type: 'port', default: 3000 },
      URL: { type: 'url', required: true },
    })
  );
  fs.writeFileSync(envPath, 'PORT=8080\nURL=https://google.com\n');

  try {
    const output = execFileSync('node', [cliPath, 'check', '--schema', schemaPath, '--file', envPath], {
      encoding: 'utf8',
    });
    assert.match(output, /Environment validation passed/);
  } finally {
    fs.unlinkSync(schemaPath);
    fs.unlinkSync(envPath);
  }
});

test('CLI check fails with exit code 1 on validation error', () => {
  const schemaPath = path.resolve(__dirname, 'invalid.schema.json');
  const envPath = path.resolve(__dirname, 'invalid.env');

  fs.writeFileSync(
    schemaPath,
    JSON.stringify({
      PORT: { type: 'port' },
      DB: { type: 'url', required: true },
    })
  );
  fs.writeFileSync(envPath, 'PORT=not-a-port\n');

  try {
    assert.throws(
      () => {
        execFileSync('node', [cliPath, 'check', '--schema', schemaPath, '--file', envPath], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      },
      (err) => {
        assert.equal(err.status, 1);
        const stderr = err.stderr.toString();
        assert.match(stderr, /EnvValidationError: 2 problems found/);
        assert.match(stderr, /PORT/);
        assert.match(stderr, /DB/);
        return true;
      }
    );
  } finally {
    fs.unlinkSync(schemaPath);
    fs.unlinkSync(envPath);
  }
});

test('CLI --help outputs usage information', () => {
  const output = execFileSync('node', [cliPath, '--help'], { encoding: 'utf8' });
  assert.match(output, /Usage:/);
  assert.match(output, /--schema/);
  assert.match(output, /--strict/);
});
