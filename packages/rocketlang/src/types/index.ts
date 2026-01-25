/**
 * RocketLang V2 Type System
 *
 * Simple, optional typing inspired by Go's simplicity and TypeScript's gradual typing.
 * All types have Hindi/Tamil/Telugu equivalents.
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * All possible types in RocketLang
 */
export type RocketType =
  | PrimitiveType
  | GenericType
  | FunctionType
  | ResultType
  | MaybeType
  | CustomType
  | AnyType;

/**
 * Primitive types with Indic aliases
 */
export interface PrimitiveType {
  kind: 'primitive';
  name: PrimitiveTypeName;
}

export type PrimitiveTypeName =
  | 'number'   // संख्या (sankhya)
  | 'text'     // पाठ (paath)
  | 'bool'     // हाँ-नहीं (haan-nahi)
  | 'nothing'; // कुछ नहीं (kuch nahi)

/**
 * Generic types (list, map)
 */
export interface GenericType {
  kind: 'generic';
  name: GenericTypeName;
  typeArgs: RocketType[];
}

export type GenericTypeName =
  | 'list'     // सूची (soochi)
  | 'map'      // नक्शा (naksha)
  | 'channel'; // नाली (naali)

/**
 * Function types
 */
export interface FunctionType {
  kind: 'function';
  params: Array<{ name: string; type: RocketType }>;
  returnType: RocketType;
  async: boolean;
}

/**
 * Result type for error handling (like Rust's Result)
 */
export interface ResultType {
  kind: 'result';
  successType: RocketType;
  errorType?: RocketType;
}

/**
 * Maybe/Optional type
 */
export interface MaybeType {
  kind: 'maybe';
  innerType: RocketType;
}

/**
 * User-defined custom types
 */
export interface CustomType {
  kind: 'custom';
  name: string;
  fields?: Array<{ name: string; type: RocketType }>;
}

/**
 * Any type (dynamic, opt-out of type checking)
 */
export interface AnyType {
  kind: 'any';
}

// =============================================================================
// TYPE ALIASES (Indic → English)
// =============================================================================

/**
 * Map Indic type names to canonical English names
 */
export const TYPE_ALIASES: Record<string, PrimitiveTypeName | GenericTypeName | 'any' | 'result' | 'maybe'> = {
  // Hindi
  'संख्या': 'number',
  'sankhya': 'number',
  'पाठ': 'text',
  'paath': 'text',
  'सूची': 'list',
  'soochi': 'list',
  'नक्शा': 'map',
  'naksha': 'map',
  'नाली': 'channel',
  'naali': 'channel',
  'हाँ-नहीं': 'bool',
  'haan-nahi': 'bool',
  'कुछ नहीं': 'nothing',
  'कुछ-नहीं': 'nothing',
  'kuch-nahi': 'nothing',
  'कोई भी': 'any',
  'कोई-भी': 'any',
  'koi-bhi': 'any',
  'परिणाम': 'result',
  'parinam': 'result',
  'शायद': 'maybe',
  'shayad': 'maybe',

  // Tamil (transliterated)
  'எண்': 'number',
  'en': 'number',
  'உரை': 'text',
  'urai': 'text',
  'பட்டியல்': 'list',
  'pattiyal': 'list',

  // Telugu (transliterated)
  'సంఖ్య': 'number',
  'పాఠ్యం': 'text',
  'జాబితా': 'list',

  // English
  'number': 'number',
  'text': 'text',
  'string': 'text',
  'list': 'list',
  'array': 'list',
  'map': 'map',
  'dict': 'map',
  'dictionary': 'map',
  'bool': 'bool',
  'boolean': 'bool',
  'void': 'nothing',
  'null': 'nothing',
  'nothing': 'nothing',
  'any': 'any',
  'channel': 'channel',
  'result': 'result',
  'maybe': 'maybe',
  'optional': 'maybe',
};

// =============================================================================
// TYPE CONSTRUCTORS
// =============================================================================

export const Types = {
  number: (): PrimitiveType => ({ kind: 'primitive', name: 'number' }),
  text: (): PrimitiveType => ({ kind: 'primitive', name: 'text' }),
  bool: (): PrimitiveType => ({ kind: 'primitive', name: 'bool' }),
  nothing: (): PrimitiveType => ({ kind: 'primitive', name: 'nothing' }),
  any: (): AnyType => ({ kind: 'any' }),

  list: (elementType: RocketType): GenericType => ({
    kind: 'generic',
    name: 'list',
    typeArgs: [elementType],
  }),

  map: (keyType: RocketType, valueType: RocketType): GenericType => ({
    kind: 'generic',
    name: 'map',
    typeArgs: [keyType, valueType],
  }),

  channel: (messageType: RocketType): GenericType => ({
    kind: 'generic',
    name: 'channel',
    typeArgs: [messageType],
  }),

  func: (
    params: Array<{ name: string; type: RocketType }>,
    returnType: RocketType,
    async = false
  ): FunctionType => ({
    kind: 'function',
    params,
    returnType,
    async,
  }),

  result: (successType: RocketType, errorType?: RocketType): ResultType => ({
    kind: 'result',
    successType,
    errorType,
  }),

  maybe: (innerType: RocketType): MaybeType => ({
    kind: 'maybe',
    innerType,
  }),

  custom: (name: string, fields?: Array<{ name: string; type: RocketType }>): CustomType => ({
    kind: 'custom',
    name,
    fields,
  }),
};

// =============================================================================
// TYPE PARSING
// =============================================================================

/**
 * Parse a type string into a RocketType
 */
export function parseType(typeStr: string): RocketType {
  const normalized = typeStr.trim();

  // Check for generic type syntax: Type<Inner> or Type<K, V>
  const genericMatch = normalized.match(/^(\w+)\s*<(.+)>$/);
  if (genericMatch) {
    const [, baseName, innerStr] = genericMatch;
    const baseType = TYPE_ALIASES[baseName.toLowerCase()] || baseName.toLowerCase();
    const innerTypes = parseTypeArgs(innerStr);

    if (baseType === 'list' || baseType === 'channel') {
      return {
        kind: 'generic',
        name: baseType as GenericTypeName,
        typeArgs: innerTypes.slice(0, 1),
      };
    }
    if (baseType === 'map') {
      return {
        kind: 'generic',
        name: 'map',
        typeArgs: innerTypes.slice(0, 2),
      };
    }
    if (baseType === 'result') {
      return {
        kind: 'result',
        successType: innerTypes[0] || Types.any(),
        errorType: innerTypes[1],
      };
    }
    if (baseType === 'maybe') {
      return {
        kind: 'maybe',
        innerType: innerTypes[0] || Types.any(),
      };
    }
  }

  // Check for function type: (a: T, b: U) -> R
  const funcMatch = normalized.match(/^\((.+)?\)\s*->\s*(.+)$/);
  if (funcMatch) {
    const [, paramsStr, returnStr] = funcMatch;
    const params = paramsStr ? parseParams(paramsStr) : [];
    const returnType = parseType(returnStr);
    return Types.func(params, returnType);
  }

  // Simple type lookup
  const alias = TYPE_ALIASES[normalized.toLowerCase()];
  if (alias) {
    if (alias === 'any') return Types.any();
    if (alias === 'result') return Types.result(Types.any());
    if (alias === 'maybe') return Types.maybe(Types.any());
    if (['list', 'map', 'channel'].includes(alias)) {
      return { kind: 'generic', name: alias as GenericTypeName, typeArgs: [Types.any()] };
    }
    return { kind: 'primitive', name: alias as PrimitiveTypeName };
  }

  // Unknown type - treat as custom
  return Types.custom(normalized);
}

/**
 * Parse comma-separated type arguments
 */
function parseTypeArgs(str: string): RocketType[] {
  const args: RocketType[] = [];
  let depth = 0;
  let current = '';

  for (const char of str) {
    if (char === '<') depth++;
    if (char === '>') depth--;
    if (char === ',' && depth === 0) {
      args.push(parseType(current.trim()));
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    args.push(parseType(current.trim()));
  }

  return args;
}

/**
 * Parse function parameters
 */
function parseParams(str: string): Array<{ name: string; type: RocketType }> {
  return str.split(',').map(param => {
    const [name, typeStr] = param.split(':').map(s => s.trim());
    return {
      name,
      type: typeStr ? parseType(typeStr) : Types.any(),
    };
  });
}

// =============================================================================
// TYPE FORMATTING
// =============================================================================

/**
 * Format a type for display
 */
export function formatType(type: RocketType, language: 'en' | 'hi' = 'en'): string {
  switch (type.kind) {
    case 'primitive':
      return language === 'hi' ? getHindiTypeName(type.name) : type.name;

    case 'generic':
      const baseName = language === 'hi' ? getHindiTypeName(type.name) : type.name;
      const args = type.typeArgs.map(t => formatType(t, language)).join(', ');
      return `${baseName}<${args}>`;

    case 'function':
      const params = type.params.map(p => `${p.name}: ${formatType(p.type, language)}`).join(', ');
      const ret = formatType(type.returnType, language);
      return `(${params}) -> ${ret}`;

    case 'result':
      const success = formatType(type.successType, language);
      const error = type.errorType ? `, ${formatType(type.errorType, language)}` : '';
      return language === 'hi' ? `परिणाम<${success}${error}>` : `result<${success}${error}>`;

    case 'maybe':
      const inner = formatType(type.innerType, language);
      return language === 'hi' ? `शायद<${inner}>` : `maybe<${inner}>`;

    case 'custom':
      return type.name;

    case 'any':
      return language === 'hi' ? 'कोई भी' : 'any';
  }
}

function getHindiTypeName(name: string): string {
  const hindiNames: Record<string, string> = {
    number: 'संख्या',
    text: 'पाठ',
    bool: 'हाँ-नहीं',
    nothing: 'कुछ नहीं',
    list: 'सूची',
    map: 'नक्शा',
    channel: 'नाली',
  };
  return hindiNames[name] || name;
}

// =============================================================================
// TYPE CHECKING
// =============================================================================

/**
 * Check if two types are compatible
 */
export function isTypeCompatible(expected: RocketType, actual: RocketType): boolean {
  // Any is compatible with everything
  if (expected.kind === 'any' || actual.kind === 'any') {
    return true;
  }

  // Same kind check
  if (expected.kind !== actual.kind) {
    return false;
  }

  switch (expected.kind) {
    case 'primitive':
      return expected.name === (actual as PrimitiveType).name;

    case 'generic':
      const actualGen = actual as GenericType;
      if (expected.name !== actualGen.name) return false;
      if (expected.typeArgs.length !== actualGen.typeArgs.length) return false;
      return expected.typeArgs.every((t, i) => isTypeCompatible(t, actualGen.typeArgs[i]));

    case 'function':
      const actualFunc = actual as FunctionType;
      if (expected.params.length !== actualFunc.params.length) return false;
      if (!isTypeCompatible(expected.returnType, actualFunc.returnType)) return false;
      return expected.params.every((p, i) => isTypeCompatible(p.type, actualFunc.params[i].type));

    case 'result':
      const actualRes = actual as ResultType;
      return isTypeCompatible(expected.successType, actualRes.successType);

    case 'maybe':
      const actualMaybe = actual as MaybeType;
      return isTypeCompatible(expected.innerType, actualMaybe.innerType);

    case 'custom':
      return expected.name === (actual as CustomType).name;

    default:
      return true;
  }
}

/**
 * Infer type from a value
 */
export function inferType(value: unknown): RocketType {
  if (value === null || value === undefined) {
    return Types.nothing();
  }

  if (typeof value === 'number') {
    return Types.number();
  }

  if (typeof value === 'string') {
    return Types.text();
  }

  if (typeof value === 'boolean') {
    return Types.bool();
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return Types.list(Types.any());
    }
    const elementType = inferType(value[0]);
    return Types.list(elementType);
  }

  if (typeof value === 'object') {
    // Could be a map or custom object
    return Types.map(Types.text(), Types.any());
  }

  return Types.any();
}

// =============================================================================
// RESULT AND MAYBE VALUES
// =============================================================================

/**
 * Result value (success or failure)
 */
export interface ResultValue<T = unknown, E = string> {
  __type: 'result';
  success: boolean;
  value?: T;
  error?: E;
}

export const Result = {
  success: <T>(value: T): ResultValue<T> => ({
    __type: 'result',
    success: true,
    value,
  }),

  failure: <E = string>(error: E): ResultValue<never, E> => ({
    __type: 'result',
    success: false,
    error,
  }),

  isSuccess: <T>(result: ResultValue<T>): result is ResultValue<T> & { value: T } =>
    result.success,

  isFailure: <T, E>(result: ResultValue<T, E>): result is ResultValue<T, E> & { error: E } =>
    !result.success,
};

/**
 * Maybe value (something or nothing)
 */
export interface MaybeValue<T = unknown> {
  __type: 'maybe';
  hasValue: boolean;
  value?: T;
}

export const Maybe = {
  some: <T>(value: T): MaybeValue<T> => ({
    __type: 'maybe',
    hasValue: true,
    value,
  }),

  none: (): MaybeValue<never> => ({
    __type: 'maybe',
    hasValue: false,
  }),

  isSome: <T>(maybe: MaybeValue<T>): maybe is MaybeValue<T> & { value: T } =>
    maybe.hasValue,

  isNone: <T>(maybe: MaybeValue<T>): boolean =>
    !maybe.hasValue,

  orDefault: <T>(maybe: MaybeValue<T>, defaultValue: T): T =>
    maybe.hasValue ? maybe.value! : defaultValue,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  Types,
  TYPE_ALIASES,
  parseType,
  formatType,
  isTypeCompatible,
  inferType,
  Result,
  Maybe,
};
