/**
 * RocketLang V2 Type System
 *
 * Simple, optional typing inspired by Go's simplicity and TypeScript's gradual typing.
 * All types have Hindi/Tamil/Telugu equivalents.
 */
// =============================================================================
// TYPE ALIASES (Indic → English)
// =============================================================================
/**
 * Map Indic type names to canonical English names
 */
export const TYPE_ALIASES = {
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
    number: () => ({ kind: 'primitive', name: 'number' }),
    text: () => ({ kind: 'primitive', name: 'text' }),
    bool: () => ({ kind: 'primitive', name: 'bool' }),
    nothing: () => ({ kind: 'primitive', name: 'nothing' }),
    any: () => ({ kind: 'any' }),
    list: (elementType) => ({
        kind: 'generic',
        name: 'list',
        typeArgs: [elementType],
    }),
    map: (keyType, valueType) => ({
        kind: 'generic',
        name: 'map',
        typeArgs: [keyType, valueType],
    }),
    channel: (messageType) => ({
        kind: 'generic',
        name: 'channel',
        typeArgs: [messageType],
    }),
    func: (params, returnType, async = false) => ({
        kind: 'function',
        params,
        returnType,
        async,
    }),
    result: (successType, errorType) => ({
        kind: 'result',
        successType,
        errorType,
    }),
    maybe: (innerType) => ({
        kind: 'maybe',
        innerType,
    }),
    custom: (name, fields) => ({
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
export function parseType(typeStr) {
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
                name: baseType,
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
        if (alias === 'any')
            return Types.any();
        if (alias === 'result')
            return Types.result(Types.any());
        if (alias === 'maybe')
            return Types.maybe(Types.any());
        if (['list', 'map', 'channel'].includes(alias)) {
            return { kind: 'generic', name: alias, typeArgs: [Types.any()] };
        }
        return { kind: 'primitive', name: alias };
    }
    // Unknown type - treat as custom
    return Types.custom(normalized);
}
/**
 * Parse comma-separated type arguments
 */
function parseTypeArgs(str) {
    const args = [];
    let depth = 0;
    let current = '';
    for (const char of str) {
        if (char === '<')
            depth++;
        if (char === '>')
            depth--;
        if (char === ',' && depth === 0) {
            args.push(parseType(current.trim()));
            current = '';
        }
        else {
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
function parseParams(str) {
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
export function formatType(type, language = 'en') {
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
function getHindiTypeName(name) {
    const hindiNames = {
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
export function isTypeCompatible(expected, actual) {
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
            return expected.name === actual.name;
        case 'generic':
            const actualGen = actual;
            if (expected.name !== actualGen.name)
                return false;
            if (expected.typeArgs.length !== actualGen.typeArgs.length)
                return false;
            return expected.typeArgs.every((t, i) => isTypeCompatible(t, actualGen.typeArgs[i]));
        case 'function':
            const actualFunc = actual;
            if (expected.params.length !== actualFunc.params.length)
                return false;
            if (!isTypeCompatible(expected.returnType, actualFunc.returnType))
                return false;
            return expected.params.every((p, i) => isTypeCompatible(p.type, actualFunc.params[i].type));
        case 'result':
            const actualRes = actual;
            return isTypeCompatible(expected.successType, actualRes.successType);
        case 'maybe':
            const actualMaybe = actual;
            return isTypeCompatible(expected.innerType, actualMaybe.innerType);
        case 'custom':
            return expected.name === actual.name;
        default:
            return true;
    }
}
/**
 * Infer type from a value
 */
export function inferType(value) {
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
export const Result = {
    success: (value) => ({
        __type: 'result',
        success: true,
        value,
    }),
    failure: (error) => ({
        __type: 'result',
        success: false,
        error,
    }),
    isSuccess: (result) => result.success,
    isFailure: (result) => !result.success,
};
export const Maybe = {
    some: (value) => ({
        __type: 'maybe',
        hasValue: true,
        value,
    }),
    none: () => ({
        __type: 'maybe',
        hasValue: false,
    }),
    isSome: (maybe) => maybe.hasValue,
    isNone: (maybe) => !maybe.hasValue,
    orDefault: (maybe, defaultValue) => maybe.hasValue ? maybe.value : defaultValue,
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
//# sourceMappingURL=index.js.map