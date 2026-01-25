#!/usr/bin/env node
/**
 * RocketLang CLI
 *
 * Commands:
 * - rocket run <file>           Run a RocketLang file
 * - rocket build <file>         Compile to JavaScript/Go/Shell
 * - rocket repl                 Start interactive REPL
 * - rocket init                 Initialize a new project
 * - rocket fmt <file>           Format a file
 * - rocket check <file>         Type check a file
 *
 * Hindi aliases:
 * - rocket chalao <file>        = run
 * - rocket banao <file>         = build
 * - rocket sankalan <file>      = build (compile)
 */
import { type CompilationTarget } from '../compiler/index.js';
/**
 * Run a RocketLang file
 */
declare function runFile(filePath: string, options: {
    verbose?: boolean;
    typeCheck?: boolean;
}): Promise<void>;
/**
 * Build/compile a RocketLang file
 */
declare function buildFile(filePath: string, options: {
    target?: CompilationTarget;
    output?: string;
    verbose?: boolean;
}): Promise<void>;
/**
 * Initialize a new project
 */
declare function initProject(name?: string): void;
/**
 * Format a RocketLang file
 */
declare function formatFile(filePath: string): void;
/**
 * Type check a file
 */
declare function checkFile(filePath: string): void;
/**
 * Main entry point
 */
export declare function main(argv?: string[]): Promise<void>;
declare const _default: {
    main: typeof main;
    runFile: typeof runFile;
    buildFile: typeof buildFile;
    initProject: typeof initProject;
    formatFile: typeof formatFile;
    checkFile: typeof checkFile;
};
export default _default;
//# sourceMappingURL=index.d.ts.map