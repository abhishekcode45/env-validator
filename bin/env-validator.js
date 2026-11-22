#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { validateEnv, EnvValidationError, parseDotenv } = require('../index');

function parseArgs(args) {
  const flags = {
    command: null,
    schema: 'env.schema.json',
    file: '.env',
    strict: false,
    help: false,
    version: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === 'check') {
      flags.command = 'check';
    } else if (arg === '--schema' || arg === '-s') {
      flags.schema = args[++i];
    } else if (arg === '--file' || arg === '-f') {
      flags.file = args[++i];
    } else if (arg === '--strict') {
      flags.strict = true;
    } else if (arg === '--help' || arg === '-h') {
      flags.help = true;
    } else if (arg === '--version' || arg === '-v') {
      flags.version = true;
    } else if (arg.startsWith('--schema=')) {
      flags.schema = arg.slice(9);
    } else if (arg.startsWith('--file=')) {
      flags.file = arg.slice(7);
    }
    i++;
  }

  return flags;
}

function showHelp() {
  console.log(`
env-validator - Validate environment variables at startup

Usage:
  npx env-validator [command] [options]

Commands:
  check                  Validate environment variables against a schema (default)

Options:
  -s, --schema <path>    Path to the schema JSON file (default: env.schema.json)
  -f, --file <path>      Path to the .env file (default: .env)
  --strict               Fail on unknown variables
  -h, --help             Show help
  -v, --version          Show version

Examples:
  npx env-validator check --schema env.schema.json --file .env
  npx env-validator --schema ./config/env.json --strict
`);
}

function showVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));
    console.log(pkg.version);
  } catch {
    console.log('1.0.0');
  }
}

function run() {
  const flags = parseArgs(process.argv.slice(2));

  if (flags.help) {
    showHelp();
    process.exit(0);
  }

  if (flags.version) {
    showVersion();
    process.exit(0);
  }

  const schemaPath = path.resolve(process.cwd(), flags.schema);
  if (!fs.existsSync(schemaPath)) {
    console.error(`Error: Schema file not found: ${schemaPath}`);
    process.exit(1);
  }

  let schema;
  try {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    schema = JSON.parse(schemaContent);
  } catch (err) {
    console.error(`Error: Failed to parse schema file: ${err.message}`);
    process.exit(1);
  }

  const envFilePath = path.resolve(process.cwd(), flags.file);
  if (!fs.existsSync(envFilePath)) {
    console.error(`Error: Env file not found: ${envFilePath}`);
    process.exit(1);
  }

  let envSource;
  try {
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    envSource = parseDotenv(envContent);
  } catch (err) {
    console.error(`Error: Failed to read env file: ${err.message}`);
    process.exit(1);
  }

  try {
    validateEnv(schema, {
      source: envSource,
      strict: flags.strict,
      loadDotenv: false,
    });
    console.log('✓ Environment validation passed.');
    process.exit(0);
  } catch (err) {
    if (err instanceof EnvValidationError || err.name === 'EnvValidationError') {
      console.error(err.message ? `${err.name}: ${err.message}` : err.toString());
    } else {
      console.error(`Error: ${err.message}`);
    }
    process.exit(1);
  }
}

run();
