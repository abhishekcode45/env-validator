# env-validator: Instruction Manual

Validate your environment variables at startup. Catch missing or invalid `.env` values **before** your app crashes in production.

---

## 1. Introduction

**env-validator** checks that required environment variables exist and have the correct type and format. If something is wrong, it stops the app with a clear, readable error message.

**Why use it?**

- Fails fast instead of failing mysteriously later
- Converts values to the right type (`"3000"` becomes `3000`)
- Gives defaults for optional variables
- Works as a library and as a CLI

---

## 2. Installation

```bash
npm install env-validator
```

Requirements: Node.js 16 or higher.

---

## 3. Quick Start

**Step 1:** Create a `.env` file

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=https://db.example.com
DEBUG=true
```

**Step 2:** Define a schema and validate

```js
const { validateEnv } = require('env-validator');

const env = validateEnv({
  PORT:         { type: 'port', default: 3000 },
  NODE_ENV:     { type: 'enum', choices: ['development', 'production', 'test'] },
  DATABASE_URL: { type: 'url', required: true },
  DEBUG:        { type: 'boolean', default: false },
});

console.log(env.PORT);   // 3000 (number)
console.log(env.DEBUG);  // true (boolean)
```

**Step 3:** If a variable is invalid, you get a clear error:

```
EnvValidationError: 2 problems found

  x DATABASE_URL  is required but missing
  x PORT          expected a port (1-65535), got "abc"
```

---

## 4. Supported Types

| Type      | Description                         | Example value       |
|-----------|-------------------------------------|---------------------|
| `string`  | Any text                            | `hello`             |
| `number`  | Integer or decimal                  | `42`, `3.14`        |
| `boolean` | `true/false`, `1/0`, `yes/no`       | `true`              |
| `port`    | Integer between 1 and 65535         | `8080`              |
| `url`     | Valid URL                           | `https://site.com`  |
| `email`   | Valid email address                 | `me@mail.com`       |
| `enum`    | One value from a list               | `production`        |

---

## 5. Schema Options

Each variable accepts these options:

| Option     | Type       | Applies to      | Description                              |
|------------|------------|-----------------|------------------------------------------|
| `type`     | string     | all             | One of the supported types (required)    |
| `required` | boolean    | all             | Fail if missing. Default: `true` when no `default` is set |
| `default`  | any        | all             | Value used when the variable is missing  |
| `choices`  | array      | `enum`          | Allowed values                           |
| `min`      | number     | `number`        | Minimum value                            |
| `max`      | number     | `number`        | Maximum value                            |
| `pattern`  | RegExp     | `string`        | Value must match this pattern            |
| `message`  | string     | all             | Custom error message                     |

**Example**

```js
validateEnv({
  API_KEY:   { type: 'string', pattern: /^[A-Za-z0-9]{32}$/, message: 'API_KEY must be 32 alphanumeric chars' },
  TIMEOUT:   { type: 'number', min: 1000, max: 60000, default: 5000 },
  LOG_LEVEL: { type: 'enum', choices: ['debug', 'info', 'warn', 'error'], default: 'info' },
});
```

---

## 6. API Reference

### `validateEnv(schema, options?)`

Validates `process.env` against the schema.

| Parameter         | Description                                         |
|-------------------|-----------------------------------------------------|
| `schema`          | Object describing each variable                     |
| `options.source`  | Custom object to validate instead of `process.env`  |
| `options.loadDotenv` | Load a `.env` file first. Default: `true`        |
| `options.path`    | Path to the `.env` file. Default: `./.env`          |
| `options.strict`  | Fail on variables not in the schema. Default: `false` |

**Returns:** an object with validated, type-converted values.
**Throws:** `EnvValidationError` listing all problems (not just the first one).

### `EnvValidationError`

```js
try {
  validateEnv(schema);
} catch (err) {
  if (err.name === 'EnvValidationError') {
    console.log(err.errors); // [{ key: 'PORT', message: '...' }]
  }
}
```

---

## 7. CLI Usage

You can also validate from the terminal, which is useful in CI pipelines.

**Create a schema file** (`env.schema.json`):

```json
{
  "PORT": { "type": "port", "default": 3000 },
  "DATABASE_URL": { "type": "url", "required": true }
}
```

**Run the check:**

```bash
npx env-validator check --schema env.schema.json --file .env
```

**CLI flags**

| Flag        | Description                          |
|-------------|--------------------------------------|
| `--schema`  | Path to the schema JSON file         |
| `--file`    | Path to the `.env` file              |
| `--strict`  | Fail on unknown variables            |
| `--help`    | Show help                            |

**Exit codes:** `0` means valid, `1` means validation failed.

---

## 8. Usage with Frameworks

**Express**

```js
const express = require('express');
const { validateEnv } = require('env-validator');

const env = validateEnv({ PORT: { type: 'port', default: 3000 } });

const app = express();
app.listen(env.PORT);
```

**TypeScript**

```ts
import { validateEnv } from 'env-validator';

const env = validateEnv({
  PORT: { type: 'port', default: 3000 },
  DEBUG: { type: 'boolean', default: false },
});
// env.PORT is number, env.DEBUG is boolean
```

> Tip: call `validateEnv` once, at the very top of your entry file, and export the result for use elsewhere.

---

## 9. Best Practices

1. Validate **once at startup**, not inside route handlers.
2. Never commit your real `.env`. Commit a `.env.example` instead.
3. Use `default` for optional settings and `required` for secrets.
4. Run the CLI check in CI before deploying.
5. Never print secret values in error messages or logs.

---

## 10. Troubleshooting

| Problem                          | Solution                                              |
|----------------------------------|-------------------------------------------------------|
| Variable shows as missing        | Check spelling and that `.env` is in the working dir  |
| Boolean is not converted         | Use `true/false`, `1/0`, or `yes/no` (case-insensitive) |
| `.env` not loading               | Set `options.path` to the correct file location       |
| Validation passes locally, fails in CI | Add the variables to your CI secrets/settings   |

---

## 11. Contributing and License

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Add tests and run `npm test`
4. Open a pull request

**License:** MIT
