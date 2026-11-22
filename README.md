# env-validator

Lightweight, zero-dependency environment variable validator and type converter for Node.js and TypeScript applications.

## Overview

- **Type Safety**: Automatically converts environment values into JavaScript types (`number`, `boolean`, `url`, etc.).
- **Fail Fast**: Catches missing or malformed configuration on startup with formatted diagnostic reports.
- **Dual Interface**: Use programmatically as a library or directly from terminal via CLI.
- **Zero Dependencies**: Lightweight and secure.

## Quick Start

```js
const { validateEnv } = require('env-validator');

const env = validateEnv({
  PORT:         { type: 'port', default: 3000 },
  NODE_ENV:     { type: 'enum', choices: ['development', 'production', 'test'] },
  DATABASE_URL: { type: 'url', required: true },
  DEBUG:        { type: 'boolean', default: false },
});

console.log(env.PORT);   // 3000 (number)
console.log(env.DEBUG);  // false (boolean)
```

## Supported Types

- `string`: Text values with optional `pattern` RegExp validation.
- `number`: Numeric values with optional `min` and `max` limits.
- `boolean`: Converts `true/false`, `1/0`, and `yes/no` (case-insensitive) to boolean values.
- `port`: Integer between 1 and 65535.
- `url`: Valid URL format.
- `email`: Valid email address.
- `enum`: Value restricted to an array of allowed `choices`.

## CLI Usage

Validate `.env` files in your terminal or continuous integration pipeline:

```bash
npx env-validator check --schema env.schema.json --file .env
```

Flags:
- `--schema, -s`: Path to the schema JSON file.
- `--file, -f`: Path to the environment file.
- `--strict`: Fail if unknown variables are detected.
- `--help, -h`: Show usage information.
