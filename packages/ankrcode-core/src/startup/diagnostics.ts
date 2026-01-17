/**
 * Startup Diagnostics for AnkrCode
 *
 * Displays health status of ANKR packages and services
 */

import {
  detectANKRPackages,
  checkAllServices,
  type ServiceHealth,
  type AdapterConfig,
} from '../adapters/unified.js';

// ============================================================================
// Types
// ============================================================================

interface DiagnosticResult {
  packages: PackageInfo[];
  services: ServiceInfo[];
  mode: string;
  recommendations: string[];
}

interface PackageInfo {
  name: string;
  available: boolean;
  version?: string;
  displayName: string;
}

interface ServiceInfo {
  name: string;
  url: string;
  available: boolean;
  latency?: number;
  status: 'ok' | 'slow' | 'error';
}

// ============================================================================
// ANSI Colors
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const icons = {
  check: '✅',
  warning: '⚠️',
  error: '❌',
  arrow: '→',
  bullet: '•',
};

// ============================================================================
// Box Drawing
// ============================================================================

function drawBox(title: string, content: string[]): string {
  const maxWidth = Math.max(
    title.length + 4,
    ...content.map(line => stripAnsi(line).length + 4)
  );
  const width = Math.min(maxWidth, 50);

  const topBorder = '╭' + '─'.repeat(width - 2) + '╮';
  const bottomBorder = '╰' + '─'.repeat(width - 2) + '╯';
  const separator = '├' + '─'.repeat(width - 2) + '┤';

  const padLine = (text: string): string => {
    const visibleLength = stripAnsi(text).length;
    const padding = width - 4 - visibleLength;
    return '│ ' + text + ' '.repeat(Math.max(0, padding)) + ' │';
  };

  const lines = [
    topBorder,
    padLine(`${colors.bold}${title}${colors.reset}`),
    separator,
    ...content.map(padLine),
    bottomBorder,
  ];

  return lines.join('\n');
}

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

// ============================================================================
// Diagnostic Functions
// ============================================================================

export async function runDiagnostics(
  config: Partial<AdapterConfig> = {}
): Promise<DiagnosticResult> {
  const fullConfig: AdapterConfig = {
    aiProxyUrl: config.aiProxyUrl || process.env.AI_PROXY_URL || 'http://localhost:4444',
    eonUrl: config.eonUrl || process.env.EON_URL || 'http://localhost:4005',
    mcpUrl: config.mcpUrl || process.env.MCP_URL || 'http://localhost:4006',
    swayamUrl: config.swayamUrl || process.env.SWAYAM_URL || 'http://localhost:7777',
    anthropicKey: config.anthropicKey || process.env.ANTHROPIC_API_KEY,
    openaiKey: config.openaiKey || process.env.OPENAI_API_KEY,
    preferOffline: config.preferOffline ?? false,
    timeout: config.timeout || 3000,
  };

  // Run checks in parallel
  const [packages, services] = await Promise.all([
    detectANKRPackages(),
    checkAllServices(fullConfig),
  ]);

  // Process package info
  const packageInfo: PackageInfo[] = [
    { name: '@ankr/eon', displayName: 'EON Memory', available: packages['@ankr/eon']?.available ?? false, version: packages['@ankr/eon']?.version },
    { name: '@ankr/mcp-tools', displayName: 'MCP Tools', available: packages['@ankr/mcp-tools']?.available ?? false, version: packages['@ankr/mcp-tools']?.version },
    { name: '@ankr/ai-router', displayName: 'AI Router', available: packages['@ankr/ai-router']?.available ?? false, version: packages['@ankr/ai-router']?.version },
    { name: '@ankr/config', displayName: 'Config', available: packages['@ankr/config']?.available ?? false, version: packages['@ankr/config']?.version },
    { name: '@ankr/i18n', displayName: 'i18n', available: packages['@ankr/i18n']?.available ?? false, version: packages['@ankr/i18n']?.version },
  ];

  // Process service info
  const serviceUrls: Record<string, string> = {
    'AI Proxy': fullConfig.aiProxyUrl,
    'EON Memory': fullConfig.eonUrl,
    'MCP Server': fullConfig.mcpUrl,
    'Swayam': fullConfig.swayamUrl,
  };

  const serviceInfo: ServiceInfo[] = services.map((s: ServiceHealth) => ({
    name: s.name,
    url: serviceUrls[s.name] || '',
    available: s.available,
    latency: s.latency,
    status: (!s.available ? 'error' : (s.latency && s.latency > 500 ? 'slow' : 'ok')) as 'ok' | 'slow' | 'error',
  }));

  // Determine mode
  const hasPackages = packageInfo.some(p => p.available);
  const hasProxy = serviceInfo.find(s => s.name === 'AI Proxy')?.available;
  const hasDirectKey = !!fullConfig.anthropicKey;

  let mode: string;
  if (hasPackages && hasProxy) {
    mode = 'ANKR-Full';
  } else if (hasPackages) {
    mode = 'ANKR-Offline';
  } else if (hasProxy) {
    mode = 'Proxy-Only';
  } else if (hasDirectKey) {
    mode = 'Direct-API';
  } else {
    mode = 'Limited';
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (!packageInfo.find(p => p.name === '@ankr/eon')?.available) {
    recommendations.push('Install @ankr/eon for local memory support');
  }
  if (!packageInfo.find(p => p.name === '@ankr/mcp-tools')?.available) {
    recommendations.push('Install @ankr/mcp-tools for 255+ domain tools');
  }
  if (!hasProxy && !hasDirectKey) {
    recommendations.push('Start AI Proxy or set ANTHROPIC_API_KEY');
  }
  if (serviceInfo.some(s => s.status === 'slow')) {
    recommendations.push('Some services are responding slowly');
  }

  return { packages: packageInfo, services: serviceInfo, mode, recommendations };
}

// ============================================================================
// Display Functions
// ============================================================================

export function formatDiagnostics(result: DiagnosticResult): string {
  const lines: string[] = [];

  // Packages section
  lines.push(`${colors.cyan}ANKR Packages:${colors.reset}`);
  for (const pkg of result.packages) {
    const icon = pkg.available ? icons.check : icons.error;
    const version = pkg.version ? ` (${pkg.version})` : '';
    const status = pkg.available
      ? `${colors.green}${pkg.displayName}${version}${colors.reset}`
      : `${colors.red}${pkg.displayName} (not installed)${colors.reset}`;
    lines.push(`  ${icon} ${status}`);
  }

  lines.push('');

  // Services section
  lines.push(`${colors.cyan}Services:${colors.reset}`);
  for (const svc of result.services) {
    let icon: string;
    let status: string;

    if (svc.status === 'ok') {
      icon = icons.check;
      const latency = svc.latency ? ` ${svc.latency}ms` : '';
      status = `${colors.green}${svc.name}${colors.reset}${colors.dim}${latency}${colors.reset}`;
    } else if (svc.status === 'slow') {
      icon = icons.warning;
      status = `${colors.yellow}${svc.name} (slow: ${svc.latency}ms)${colors.reset}`;
    } else {
      icon = icons.error;
      status = `${colors.red}${svc.name} (unavailable)${colors.reset}`;
    }

    lines.push(`  ${icon} ${status}`);
  }

  lines.push('');

  // Mode
  lines.push(`${colors.cyan}Mode:${colors.reset} ${colors.bold}${result.mode}${colors.reset}`);

  // Recommendations
  if (result.recommendations.length > 0) {
    lines.push('');
    lines.push(`${colors.yellow}Recommendations:${colors.reset}`);
    for (const rec of result.recommendations) {
      lines.push(`  ${icons.bullet} ${rec}`);
    }
  }

  return drawBox('AnkrCode Health Check', lines);
}

export async function printDiagnostics(config: Partial<AdapterConfig> = {}): Promise<void> {
  console.log(`\n${colors.dim}Running diagnostics...${colors.reset}\n`);

  const result = await runDiagnostics(config);
  console.log(formatDiagnostics(result));
  console.log();
}

// ============================================================================
// Quick Check (for startup)
// ============================================================================

export async function quickCheck(): Promise<{
  ready: boolean;
  mode: string;
  llmAvailable: boolean;
  memoryAvailable: boolean;
  toolsAvailable: boolean;
}> {
  const result = await runDiagnostics();

  const llmAvailable =
    result.packages.find(p => p.name === '@ankr/ai-router')?.available ||
    result.services.find(s => s.name === 'AI Proxy')?.available ||
    !!process.env.ANTHROPIC_API_KEY;

  const memoryAvailable = !!(
    result.packages.find(p => p.name === '@ankr/eon')?.available ||
    result.services.find(s => s.name === 'EON Memory')?.available
  );

  const toolsAvailable = !!(
    result.packages.find(p => p.name === '@ankr/mcp-tools')?.available ||
    result.services.find(s => s.name === 'MCP Server')?.available
  );

  return {
    ready: llmAvailable,
    mode: result.mode,
    llmAvailable,
    memoryAvailable,
    toolsAvailable,
  };
}

// ============================================================================
// CLI Integration
// ============================================================================

export function getDoctorCommand() {
  return {
    command: 'doctor',
    description: 'Run health diagnostics',
    action: async () => {
      await printDiagnostics();
    },
  };
}

// ============================================================================
// Export
// ============================================================================

export default {
  runDiagnostics,
  formatDiagnostics,
  printDiagnostics,
  quickCheck,
  getDoctorCommand,
};
