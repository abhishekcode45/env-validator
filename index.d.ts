export type EnvType = 'string' | 'number' | 'boolean' | 'port' | 'url' | 'email' | 'enum';

export interface SchemaItem<T = any> {
  type: EnvType;
  required?: boolean;
  default?: T;
  choices?: readonly string[] | string[];
  min?: number;
  max?: number;
  pattern?: RegExp | string;
  message?: string;
}

export type Schema = Record<string, SchemaItem>;

export interface ValidateEnvOptions {
  source?: Record<string, any>;
  loadDotenv?: boolean;
  path?: string;
  strict?: boolean;
}

export interface ValidationErrorItem {
  key: string;
  message: string;
}

export class EnvValidationError extends Error {
  name: 'EnvValidationError';
  errors: ValidationErrorItem[];
  constructor(errors: ValidationErrorItem[]);
}

export type InferType<T extends SchemaItem> =
  T['type'] extends 'port' | 'number'
    ? number
    : T['type'] extends 'boolean'
      ? boolean
      : T['type'] extends 'enum'
        ? (T['choices'] extends readonly (infer C)[] ? C : string)
        : string;

export type InferValue<T extends SchemaItem> =
  T extends { default: any }
    ? InferType<T>
    : T extends { required: false }
      ? InferType<T> | undefined
      : InferType<T>;

export type ValidatedEnv<T extends Schema> = {
  [K in keyof T]: InferValue<T[K]>;
};

export function validateEnv<T extends Schema>(
  schema: T,
  options?: ValidateEnvOptions
): ValidatedEnv<T>;

export default validateEnv;

export function parseDotenv(src: string): Record<string, string>;

export function loadDotenv(options?: {
  path?: string;
  override?: boolean;
}): { parsed: Record<string, string>; path: string; loaded: boolean };
