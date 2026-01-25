/**
 * Startup Diagnostics for AnkrCode
 *
 * Displays health status of ANKR packages and services
 */
import { type AdapterConfig } from '../adapters/unified.js';
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
export declare function runDiagnostics(config?: Partial<AdapterConfig>): Promise<DiagnosticResult>;
export declare function formatDiagnostics(result: DiagnosticResult): string;
export declare function printDiagnostics(config?: Partial<AdapterConfig>): Promise<void>;
export declare function quickCheck(): Promise<{
    ready: boolean;
    mode: string;
    llmAvailable: boolean;
    memoryAvailable: boolean;
    toolsAvailable: boolean;
}>;
export declare function getDoctorCommand(): {
    command: string;
    description: string;
    action: () => Promise<void>;
};
declare const _default: {
    runDiagnostics: typeof runDiagnostics;
    formatDiagnostics: typeof formatDiagnostics;
    printDiagnostics: typeof printDiagnostics;
    quickCheck: typeof quickCheck;
    getDoctorCommand: typeof getDoctorCommand;
};
export default _default;
//# sourceMappingURL=diagnostics.d.ts.map