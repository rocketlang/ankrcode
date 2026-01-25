/**
 * AnkrCode Permission System
 *
 * Manages approvals for dangerous operations:
 * - Shell commands
 * - File modifications
 * - Network requests
 * - System operations
 */
/**
 * Permission levels
 */
export type PermissionLevel = 'allow' | 'deny' | 'ask';
/**
 * Permission types
 */
export type PermissionType = 'command' | 'file_write' | 'file_delete' | 'network' | 'system';
/**
 * Permission request
 */
export interface PermissionRequest {
    type: PermissionType;
    action: string;
    target?: string;
    reason?: string;
}
/**
 * Permission response
 */
export interface PermissionResponse {
    granted: boolean;
    permanent?: boolean;
    reason?: string;
}
/**
 * Check if a command is dangerous
 */
export declare function isDangerousCommand(command: string): {
    dangerous: boolean;
    reason?: string;
};
/**
 * Check if a path is protected
 */
export declare function isProtectedPath(filePath: string): boolean;
/**
 * Check if permission is already granted for session
 */
export declare function hasSessionApproval(request: PermissionRequest): boolean;
/**
 * Grant session-level permission
 */
export declare function grantSessionPermission(request: PermissionRequest): void;
/**
 * Revoke session permission
 */
export declare function revokeSessionPermission(request: PermissionRequest): void;
/**
 * Clear all session permissions
 */
export declare function clearSessionPermissions(): void;
/**
 * Check command permission
 */
export declare function checkCommandPermission(command: string): Promise<{
    allowed: boolean;
    needsApproval: boolean;
    reason?: string;
}>;
/**
 * Check file write permission
 */
export declare function checkFileWritePermission(filePath: string): Promise<{
    allowed: boolean;
    needsApproval: boolean;
    reason?: string;
}>;
/**
 * Check file delete permission
 */
export declare function checkFileDeletePermission(filePath: string): Promise<{
    allowed: boolean;
    needsApproval: boolean;
    reason?: string;
}>;
/**
 * Format permission prompt for user
 */
export declare function formatPermissionPrompt(request: PermissionRequest): string;
/**
 * Get permission summary
 */
export declare function getPermissionSummary(): string;
declare const _default: {
    isDangerousCommand: typeof isDangerousCommand;
    isProtectedPath: typeof isProtectedPath;
    hasSessionApproval: typeof hasSessionApproval;
    grantSessionPermission: typeof grantSessionPermission;
    revokeSessionPermission: typeof revokeSessionPermission;
    clearSessionPermissions: typeof clearSessionPermissions;
    checkCommandPermission: typeof checkCommandPermission;
    checkFileWritePermission: typeof checkFileWritePermission;
    checkFileDeletePermission: typeof checkFileDeletePermission;
    formatPermissionPrompt: typeof formatPermissionPrompt;
    getPermissionSummary: typeof getPermissionSummary;
};
export default _default;
//# sourceMappingURL=permissions.d.ts.map