'use strict';

const { validateEnv } = require('./lib/validator');
const { EnvValidationError } = require('./lib/errors');
const { parseDotenv, loadDotenv } = require('./lib/dotenv');

validateEnv.validateEnv = validateEnv;
validateEnv.EnvValidationError = EnvValidationError;
validateEnv.parseDotenv = parseDotenv;
validateEnv.loadDotenv = loadDotenv;
validateEnv.default = validateEnv;

module.exports = validateEnv;
