/**
 * Shell Completion Scripts for AnkrCode
 * Supports Bash, Zsh, and Fish shells
 */
/**
 * Get the bash completion script content
 */
export declare function getBashCompletion(): string;
/**
 * Get the zsh completion script content
 */
export declare function getZshCompletion(): string;
/**
 * Get the fish completion script content
 */
export declare function getFishCompletion(): string;
/**
 * Detect the current shell
 */
export declare function detectShell(): 'bash' | 'zsh' | 'fish' | 'unknown';
/**
 * Get the completion install path for the current shell
 */
export declare function getCompletionInstallPath(shell: 'bash' | 'zsh' | 'fish'): string;
/**
 * Install completion script for the specified shell
 */
export declare function installCompletion(shell?: 'bash' | 'zsh' | 'fish'): {
    success: boolean;
    shell: string;
    path: string;
    message: string;
};
export type ShellType = 'bash' | 'zsh' | 'fish';
//# sourceMappingURL=index.d.ts.map