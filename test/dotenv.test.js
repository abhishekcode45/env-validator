'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { parseDotenv, loadDotenv } = require('../index');

test('parseDotenv parses key values, quotes, comments, and empty lines', () => {
  const content = `
# Comment line
PORT=3000
NODE_ENV="production"
SINGLE_QUOTES='hello world'
UNQUOTED=text with spaces # inline comment
ESCAPED="line1\\nline2"
export EXPORTED=true
`;

  const parsed = parseDotenv(content);

  assert.equal(parsed.PORT, '3000');
  assert.equal(parsed.NODE_ENV, 'production');
  assert.equal(parsed.SINGLE_QUOTES, 'hello world');
  assert.equal(parsed.UNQUOTED, 'text with spaces');
  assert.equal(parsed.ESCAPED, 'line1\nline2');
  assert.equal(parsed.EXPORTED, 'true');
});

test('parseDotenv handles multiline quoted values', () => {
  const content = `
CERT="-----BEGIN CERT-----
ABC123
-----END CERT-----"
PORT=80
`;

  const parsed = parseDotenv(content);
  assert.equal(parsed.CERT, '-----BEGIN CERT-----\nABC123\n-----END CERT-----');
  assert.equal(parsed.PORT, '80');
});

test('loadDotenv loads file into process.env without overwriting existing unless override is true', () => {
  const tempPath = path.resolve(__dirname, 'test.env');
  fs.writeFileSync(tempPath, 'TEST_ENV_KEY_1=val1\nTEST_ENV_KEY_2=val2\n');

  try {
    process.env.TEST_ENV_KEY_1 = 'original';

    loadDotenv({ path: tempPath, override: false });
    assert.equal(process.env.TEST_ENV_KEY_1, 'original');
    assert.equal(process.env.TEST_ENV_KEY_2, 'val2');

    loadDotenv({ path: tempPath, override: true });
    assert.equal(process.env.TEST_ENV_KEY_1, 'val1');
  } finally {
    delete process.env.TEST_ENV_KEY_1;
    delete process.env.TEST_ENV_KEY_2;
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
});
