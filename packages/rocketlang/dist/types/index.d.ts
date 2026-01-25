/**
 * RocketLang V2 Type System
 *
 * Simple, optional typing inspired by Go's simplicity and TypeScript's gradual typing.
 * All types have Hindi/Tamil/Telugu equivalents.
 */
/**
 * All possible types in RocketLang
 */
export type RocketType = PrimitiveType | GenericType | FunctionType | ResultType | MaybeType | CustomType | AnyType;
/**
 * Primitive types with Indic aliases
 */
export interface PrimitiveType {
    kind: 'primitive';
    name: PrimitiveTypeName;
}
export type PrimitiveTypeName = 'number' | 'text' | 'bool' | 'nothing';
/**
 * Generic types (list, map)
 */
export interface GenericType {
    kind: 'generic';
    name: GenericTypeName;
    typeArgs: RocketType[];
}
export type GenericTypeName = 'list' | 'map' | 'channel';
/**
 * Function types
 */
export interface FunctionType {
    kind: 'function';
    params: Array<{
        name: string;
        type: RocketType;
    }>;
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
    fields?: Array<{
        name: string;
        type: RocketType;
    }>;
}
/**
 * Any type (dynamic, opt-out of type checking)
 */
export interface AnyType {
    kind: 'any';
}
/**
 * Map Indic type names to canonical English names
 */
export declare const TYPE_ALIASES: Record<string, PrimitiveTypeName | GenericTypeName | 'any' | 'result' | 'maybe'>;
export declare const Types: {
    number: () => PrimitiveType;
    text: () => PrimitiveType;
    bool: () => PrimitiveType;
    nothing: () => PrimitiveType;
    any: () => AnyType;
    list: (elementType: RocketType) => GenericType;
    map: (keyType: RocketType, valueType: RocketType) => GenericType;
    channel: (messageType: RocketType) => GenericType;
    func: (params: Array<{
        name: string;
        type: RocketType;
    }>, returnType: RocketType, async?: boolean) => FunctionType;
    result: (successType: RocketType, errorType?: RocketType) => ResultType;
    maybe: (innerType: RocketType) => MaybeType;
    custom: (name: string, fields?: Array<{
        name: string;
        type: RocketType;
    }>) => CustomType;
};
/**
 * Parse a type string into a RocketType
 */
export declare function parseType(typeStr: string): RocketType;
/**
 * Format a type for display
 */
export declare function formatType(type: RocketType, language?: 'en' | 'hi'): string;
/**
 * Check if two types are compatible
 */
export declare function isTypeCompatible(expected: RocketType, actual: RocketType): boolean;
/**
 * Infer type from a value
 */
export declare function inferType(value: unknown): RocketType;
/**
 * Result value (success or failure)
 */
export interface ResultValue<T = unknown, E = string> {
    __type: 'result';
    success: boolean;
    value?: T;
    error?: E;
}
export declare const Result: {
    success: <T>(value: T) => ResultValue<T>;
    failure: <E = string>(error: E) => ResultValue<never, E>;
    isSuccess: <T>(result: ResultValue<T>) => result is ResultValue<T> & {
        value: T;
    };
    isFailure: <T, E>(result: ResultValue<T, E>) => result is ResultValue<T, E> & {
        error: E;
    };
};
/**
 * Maybe value (something or nothing)
 */
export interface MaybeValue<T = unknown> {
    __type: 'maybe';
    hasValue: boolean;
    value?: T;
}
export declare const Maybe: {
    some: <T>(value: T) => MaybeValue<T>;
    none: () => MaybeValue<never>;
    isSome: <T>(maybe: MaybeValue<T>) => maybe is MaybeValue<T> & {
        value: T;
    };
    isNone: <T>(maybe: MaybeValue<T>) => boolean;
    orDefault: <T>(maybe: MaybeValue<T>, defaultValue: T) => T;
};
declare const _default: {
    Types: {
        number: () => PrimitiveType;
        text: () => PrimitiveType;
        bool: () => PrimitiveType;
        nothing: () => PrimitiveType;
        any: () => AnyType;
        list: (elementType: RocketType) => GenericType;
        map: (keyType: RocketType, valueType: RocketType) => GenericType;
        channel: (messageType: RocketType) => GenericType;
        func: (params: Array<{
            name: string;
            type: RocketType;
        }>, returnType: RocketType, async?: boolean) => FunctionType;
        result: (successType: RocketType, errorType?: RocketType) => ResultType;
        maybe: (innerType: RocketType) => MaybeType;
        custom: (name: string, fields?: Array<{
            name: string;
            type: RocketType;
        }>) => CustomType;
    };
    TYPE_ALIASES: Record<string, PrimitiveTypeName | GenericTypeName | "result" | "maybe" | "any">;
    parseType: typeof parseType;
    formatType: typeof formatType;
    isTypeCompatible: typeof isTypeCompatible;
    inferType: typeof inferType;
    Result: {
        success: <T>(value: T) => ResultValue<T>;
        failure: <E = string>(error: E) => ResultValue<never, E>;
        isSuccess: <T>(result: ResultValue<T>) => result is ResultValue<T> & {
            value: T;
        };
        isFailure: <T, E>(result: ResultValue<T, E>) => result is ResultValue<T, E> & {
            error: E;
        };
    };
    Maybe: {
        some: <T>(value: T) => MaybeValue<T>;
        none: () => MaybeValue<never>;
        isSome: <T>(maybe: MaybeValue<T>) => maybe is MaybeValue<T> & {
            value: T;
        };
        isNone: <T>(maybe: MaybeValue<T>) => boolean;
        orDefault: <T>(maybe: MaybeValue<T>, defaultValue: T) => T;
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map