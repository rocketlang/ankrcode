/**
 * AnkrCode Permission System
 *
 * Manages approvals for dangerous operations:
 * - Shell commands
 * - File modifications
 * - Network requests
 * - System operations
 */
import * as path from 'path';
import { getSettings, isCommandAllowed as checkCommandConfig } from './index.js';
// Session-level approvals
const sessionApprovals = new Set();
// Dangerous command patterns
const DANGEROUS_PATTERNS = [
    { pattern: /rm\s+(-rf?|--force)/, reason: 'Recursive/force file deletion' },
    { pattern: /rm\s+-r\s+\//, reason: 'Deleting from root directory' },
    { pattern: /sudo\s+/, reason: 'Elevated privileges requested' },
    { pattern: /chmod\s+777/, reason: 'Opening file permissions to all' },
    { pattern: /curl.*\|\s*(ba)?sh/, reason: 'Piping remote script to shell' },
    { pattern: /wget.*\|\s*(ba)?sh/, reason: 'Piping remote script to shell' },
    { pattern: /mkfs\./, reason: 'Filesystem formatting' },
    { pattern: /dd\s+if=/, reason: 'Direct disk write' },
    { pattern: />\s*\/dev\//, reason: 'Writing to device file' },
    { pattern: /git\s+push.*--force/, reason: 'Force pushing to git' },
    { pattern: /git\s+reset\s+--hard/, reason: 'Hard reset (data loss risk)' },
    { pattern: /npm\s+publish/, reason: 'Publishing to npm' },
    { pattern: /docker\s+rm\s+-f/, reason: 'Force removing containers' },
    { pattern: /kubectl\s+delete/, reason: 'Deleting Kubernetes resources' },
    { pattern: /DROP\s+TABLE/i, reason: 'SQL table deletion' },
    { pattern: /DROP\s+DATABASE/i, reason: 'SQL database deletion' },
    { pattern: /TRUNCATE/i, reason: 'SQL table truncation' },
    { pattern: /DELETE\s+FROM.*WHERE\s+1/i, reason: 'Mass SQL deletion' },
];
// Safe command patterns (always allowed)
const SAFE_PATTERNS = [
    /^ls\s/, /^pwd$/, /^echo\s/, /^cat\s/, /^head\s/, /^tail\s/,
    /^grep\s/, /^rg\s/, /^find\s/, /^which\s/, /^type\s/,
    /^git\s+(status|log|diff|branch|show)/, /^npm\s+(ls|list|outdated|info)/,
    /^node\s+--version/, /^npm\s+--version/, /^pnpm\s+--version/,
    /^tsc\s+--version/, /^python\s+--version/,
];
// Protected paths
const PROTECTED_PATHS = [
    '/etc', '/usr', '/bin', '/sbin', '/var', '/boot', '/root/.ssh',
    '/root/.bashrc', '/root/.profile',
];
/**
 * Check if a command is dangerous
 */
export function isDangerousCommand(command) {
    // Check safe patterns first
    for (const pattern of SAFE_PATTERNS) {
        if (pattern.test(command)) {
            return { dangerous: false };
        }
    }
    // Check dangerous patterns
    for (const { pattern, reason } of DANGEROUS_PATTERNS) {
        if (pattern.test(command)) {
            return { dangerous: true, reason };
        }
    }
    return { dangerous: false };
}
/**
 * Check if a path is protected
 */
export function isProtectedPath(filePath) {
    const resolved = path.resolve(filePath);
    for (const protected_ of PROTECTED_PATHS) {
        if (resolved.startsWith(protected_)) {
            return true;
        }
    }
    return false;
}
/**
 * Create permission key for caching
 */
function getPermissionKey(request) {
    return `${request.type}:${request.action}:${request.target || ''}`;
}
/**
 * Check if permission is already granted for session
 */
export function hasSessionApproval(request) {
    const key = getPermissionKey(request);
    return sessionApprovals.has(key);
}
/**
 * Grant session-level permission
 */
export function grantSessionPermission(request) {
    const key = getPermissionKey(request);
    sessionApprovals.add(key);
}
/**
 * Revoke session permission
 */
export function revokeSessionPermission(request) {
    const key = getPermissionKey(request);
    sessionApprovals.delete(key);
}
/**
 * Clear all session permissions
 */
export function clearSessionPermissions() {
    sessionApprovals.clear();
}
/**
 * Check command permission
 */
export async function checkCommandPermission(command) {
    // Check session approvals
    const request = {
        type: 'command',
        action: command,
    };
    if (hasSessionApproval(request)) {
        return { allowed: true, needsApproval: false };
    }
    // Check if dangerous
    const dangerCheck = isDangerousCommand(command);
    if (dangerCheck.dangerous) {
        return {
            allowed: false,
            needsApproval: true,
            reason: dangerCheck.reason,
        };
    }
    // Check config-based permission
    const configAllowed = await checkCommandConfig(command);
    if (!configAllowed) {
        const settings = await getSettings();
        return {
            allowed: false,
            needsApproval: settings.requireApproval !== false,
            reason: 'Requires approval per settings',
        };
    }
    return { allowed: true, needsApproval: false };
}
/**
 * Check file write permission
 */
export async function checkFileWritePermission(filePath) {
    const request = {
        type: 'file_write',
        action: 'write',
        target: filePath,
    };
    if (hasSessionApproval(request)) {
        return { allowed: true, needsApproval: false };
    }
    if (isProtectedPath(filePath)) {
        return {
            allowed: false,
            needsApproval: true,
            reason: 'Protected system path',
        };
    }
    return { allowed: true, needsApproval: false };
}
/**
 * Check file delete permission
 */
export async function checkFileDeletePermission(filePath) {
    const request = {
        type: 'file_delete',
        action: 'delete',
        target: filePath,
    };
    if (hasSessionApproval(request)) {
        return { allowed: true, needsApproval: false };
    }
    // File deletion always requires approval
    return {
        allowed: false,
        needsApproval: true,
        reason: 'File deletion requires approval',
    };
}
/**
 * Format permission prompt for user
 */
export function formatPermissionPrompt(request) {
    const lines = [
        '\u26A0\uFE0F  Permission Required',
        '',
        `Type: ${request.type}`,
        `Action: ${request.action}`,
    ];
    if (request.target) {
        lines.push(`Target: ${request.target}`);
    }
    if (request.reason) {
        lines.push(`Reason: ${request.reason}`);
    }
    lines.push('', 'Allow this action? [y/n/a]');
    lines.push('  y - Yes, allow once');
    lines.push('  n - No, deny');
    lines.push('  a - Allow for session');
    return lines.join('\n');
}
/**
 * Get permission summary
 */
export function getPermissionSummary() {
    const approved = Array.from(sessionApprovals);
    if (approved.length === 0) {
        return 'No session permissions granted';
    }
    return ['Session Permissions:', ...approved.map((p) => `  - ${p}`)].join('\n');
}
export default {
    isDangerousCommand,
    isProtectedPath,
    hasSessionApproval,
    grantSessionPermission,
    revokeSessionPermission,
    clearSessionPermissions,
    checkCommandPermission,
    checkFileWritePermission,
    checkFileDeletePermission,
    formatPermissionPrompt,
    getPermissionSummary,
};
//# sourceMappingURL=permissions.js.map